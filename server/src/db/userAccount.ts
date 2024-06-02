// Imports ====================================================================

import bcrypt                                        from 'bcrypt'
import url                                           from 'node:url'
import path                                          from 'node:path'
import crypto                                        from 'node:crypto'
import z, { object, string, boolean, number }        from 'zod'
import { Level, DatabaseOptions }                    from 'level'
import { AbstractSublevel, AbstractSublevelOptions } from 'level/node_modules/abstract-level'
import Logger                                        from '../logging/logging.js'
import Config                                        from '../config/config.js'

const out = Logger.getScope(import.meta.url)

const __filename = url.fileURLToPath(import.meta.url)
const __dirname  = url.fileURLToPath(new URL('.', import.meta.url))

// Types ======================================================================

const ZString = string()

/**
 * Stores all the account-specific data, including the username.
 * (Does not store user preferences, which live under a sublevel)
 */
interface TUserAccountData {
    username:       string
    userID:         string
    password:       string
    root:           boolean
    createdISO:     string
    lastLoginISO:   string | null
}

/** Used internally in the database. "username" is added when needed. */
type TUserAccountEntry = Omit<TUserAccountData, 'username'>

/** Stores all user preferences used by the UI apps and plugins. */
export interface TUserPreferences {
    [preference: string]: string | number | boolean | Nullish
}

// Code =======================================================================

export default class UserAccount {

    private static dirname = path.join(__dirname, '../../db/')

    private static declare db:            Level<string, never>
    private static declare slAccounts:    AbstractSublevel<typeof this.db, string | Buffer | Uint8Array, string, /* type */ TUserAccountEntry>
    private static declare slPreferences: AbstractSublevel<typeof this.db, string | Buffer | Uint8Array, string, /* type */ TUserPreferences>

    public static async open(): EavSingleAsync {
        try {

            out.INFO('DB Opening.')

            const dbOptions: DatabaseOptions<string, never> = {
                keyEncoding: 'utf-8',
                valueEncoding: 'json'
            }
            const slOptions: AbstractSublevelOptions<string, any> = {
                keyEncoding: 'utf-8',
                valueEncoding: 'json'
            }
            
            // Instantiate the database models
            this.db            = new Level(this.dirname, dbOptions)
            this.slAccounts    = this.db.sublevel<string, TUserAccountEntry>('account', slOptions)
            this.slPreferences = this.db.sublevel<string, TUserPreferences>('pref', slOptions)

            // Wait till the DB is open and prevent server startup if it's misbehaving.
            await new Promise<void>((rs, rj) => this.db.defer(() => {
                if (this.db.status === 'closed') rj(new Error('User database got closed mid-initialization.'))
                else rs()
            }))

            out.INFO('DB Opened.')

            // Create the default administrator account
            const [usersError, users] = await this.listAccountEntries()
            if (usersError) return usersError
        
            if (users.filter(x => x.root).length === 0) {
                const err = await this.create({
                    name: 'admin',
                    pass: 'admin',
                    root: true
                }, true)
                if (err) return err as Error
                out.CRIT('!! IMPORTANT !! A default administrator account was created with username "admin" and password "admin". Update the credentials immediately!')
            }

        } 
        catch (error) {
            return error as Error 
        }
    }

    /**
     * Closes the database.
     */
    public static async close() {
        await this.db.close()
    }

    private static TCreateParams = object({
        name: string(),
        pass: string(),
        root: boolean()
    })
    /**
     * Creates a new user account with a given name password and root privileges.
     * @param user User information - username, password, root
     * @param skipChecks Whether to skip password strength checks (used for default admin account creation only)
     */
    public static async create(user: z.infer<typeof this.TCreateParams>, skipChecks = false) {
        try {
            
            out.NOTICE(`UserAccount.create user:${user.name}, root:${user.root}`)

            // Check if name is taken
            if (await this.exists(user.name)) return 'ERR_NAME_TAKEN'

            // Check against username and password security requirements
            if (!skipChecks) {
                if (!this.TCreateParams.safeParse(user).success)                          return 'ERR_BAD_ENTRY'
                if (Config.$.username_min_length             > user.name.length)          return 'ERR_NAME_TOO_SHORT'
                if (Config.$.username_max_length             < user.name.length)          return 'ERR_NAME_TOO_LONG'
                if (Config.$.password_min_length             > user.pass.length)          return 'ERR_PASS_TOO_SHORT'
                if (Config.$.password_use_numbers            && !/[0-9]/.test(user.pass)) return 'ERR_PASS_NO_NUMS'
                if (Config.$.password_use_big_little_symbols && !/[A-Z]/.test(user.pass)) return 'ERR_PASS_NO_BIG_CHARS'
                if (Config.$.password_use_big_little_symbols && !/[a-z]/.test(user.pass)) return 'ERR_PASS_NO_SMALL_CHARS'
                if (Config.$.password_use_special_chars      && !/\W/   .test(user.pass)) return 'ERR_PASS_NO_SPECIAL_CHARS'
            }
            
            const pwdHash = await bcrypt.hash(user.pass, Config.$.bcrypt_password_salt_rounds)
            const created = new Date().toISOString()
            const [idError, userID] = await this._generateUserID(user.name)
            if (idError) return idError

            await this.slAccounts.put(user.name, {
                password: pwdHash,
                userID: userID,
                root: user.root,
                createdISO: created,
                lastLoginISO: null
            })

            out.NOTICE(`UserAccount.create successful | user:${user.name}, root:${user.root}, uuid:${userID}`)

        } 
        catch (error) {
            out.ERROR(`UserAccount.create error:`, error as Error)
            return error as Error
        }
    }

    /**
     * Deletes the user account specified by tne "name".  
     * Returns an error if any execution errors appear, if the user isn't found
     * or if it's the last existing root account.
     * @param name Username of the account to delete.
     * @returns An error, if any happened.
     */
    public static async delete(name: string) {
        try {

            ZString.parse(name)
            out.NOTICE(`UserAccount.delete > "${name.toString()}"`)

            // Check if user exists
            if (await this.exists(name) === false) return 'ERR_USER_NOT_FOUND'

            // Check if the username doesn't belong to the last remaining admin account.
            const [usersError, users] = await this.listAccountEntries()
            if (usersError) return usersError
            const admins = users.filter(x => x.root)
            if (admins.length === 1) return 'ERR_CANT_DEL_LAST_ADMIN'

            await this.slAccounts.del(name)
            out.NOTICE(`UserAccount.delete > successful | user:"${name.toString()}"`)
            
        }
        catch (error) {
            out.ERROR(`Account.delete() error:`, error as Error)
            return error as Error
        }
    }

    /**
     * Returns user account information, like the password hash, root privileges and a static user ID.
     * @param name Account username
     * @returns Account data
     */
    public static async get(name: string): Promise<TUserAccountData | undefined> {
        try {
            out.DEBUG(`UserAccount.get > "${name.toString()}"`)
            const user = await this.slAccounts.get(name) as TUserAccountData
            user.username = name
            return user
        } 
        catch { 
            return undefined 
        }
    }

    /**
     * Returns user account information, selected by user's static ID.
     * @param userID User account ID.
     * @returns Account data
     */
    public static async getByID(userID: string): Promise<TUserAccountData | undefined> {
        try {
            out.DEBUG(`UserAccount.getByID > "${userID.toString()}"`)
            const [error, users] = await this.listAccountEntries()
            if (error) return undefined
            return users.find(user => user.userID === userID)
        } 
        catch (error) {
            return undefined
        }
    }

    /**
     * Returns a list of all existing user accounts.
     * @returns Account entries array
     */
    public static async listAccountEntries(): EavAsync<TUserAccountData[]> {
        try {
            const users: TUserAccountData[] = []
            for await (const name of this.slAccounts.keys()) {
                const user = await this.slAccounts.get(name) as TUserAccountData
                user.username = name
                users.push(user)
            }
            return [undefined, users]
        } 
        catch (error) {
            return [error as Error, undefined]
        }
    }
    
    /**
     * Returns a list of user account names.
     * @returns Account names
     */
    public static async listUsernames(): Promise<string[]> {
        return this.slAccounts.keys().all()
    }

    /**
     * Returns a `boolean` indicating whether the user of a given name exists.
     */
    public static async exists(name: string) {
        try {
            await this.slAccounts.get(name)
            return true  
        } 
        catch (error) {
            return (error as any as LevelGetError).code !== 'LEVEL_NOT_FOUND'
        }
    }

    // Preferences ============================================================

    /** Caches user preferences documents until they're written to. */
    private static prefCache = new Map<string, TUserPreferences>()

    /** Type safety guard for the preference properties. */
    public static TPreferenceValue = z.nullable(z.union([
        string(), number(), boolean(), z.undefined()
    ]))

    /**
     * Sets a preference entry in the user preferences object, saves it to the database and caches it in memory
     * to speed up further reads. 
     * @param userID Static user account ID
     * @param key The name of the preference. Eg. "prefer_dark_theme"
     * @param value The value of the preference. Eg. "true"
     */
    public static async setPreferenceEntry(userID: string, key: string, value: TUserPreferences[string]): EavSingleAsync<Error | LevelGetError | z.ZodError> {
        try {

            this.TPreferenceValue.parse(value)
            out.DEBUG(`UserAccount.setPreferenceEntry > "${key}" for ${userID}`);
            
            const [prefError, preferences] = await this.getPreferences(userID)
            if (prefError) return prefError

            if (value === undefined) delete preferences[key]
            else preferences[key] = value

            this.prefCache.set(userID, preferences)
            await this.slPreferences.put(userID, preferences)
            out.DEBUG(`UserAccount.setPreferenceEntry > success | set "${key}" for ${userID}`)

        } 
        catch (error) { 
            return error as Error | LevelGetError
        }
    }

    /**
     * Retrieves the preferences object for a given user and caches it into memory.
     * An empty object is returned if user has no set preferences.
     * @param userID Static user account ID
     * @param key user preferences setting (or "key")
     */
    public static async getPreferences(userID: string): EavAsync<TUserPreferences> {
        return new Promise(async (resolve) => {

            out.DEBUG(`UserAccount.getPreferences > userID:${userID}`)

            // Check cached data first
            const preferences = this.prefCache.get(userID)
            if (preferences) return resolve([null, preferences])

            // Validate if the user actually exists to prevent stale entries
            if (await this.getByID(userID) === undefined)
                return resolve([new Error(`Can't read preferences of unknown user.`), null])

            this.slPreferences.get(userID, (error, doc) => {
                if (error) {
                    if ((error as any as LevelGetError).notFound) {
                        out.DEBUG(`UserAccount.getPreferences > success | userID:${userID} (defaulted due to "LEVEL_NOT_FOUND")`)
                        this.prefCache.set(userID, {})
                        resolve([null, {}])
                    }
                    else resolve([error, null])
                }
                else {
                    out.DEBUG(`UserAccount.getPreferences > success | userID:${userID}`)
                    this.prefCache.set(userID, doc!)
                    resolve([null, doc!])
                }
            })
            
        })
    }

    // Utility methods ========================================================
    
    private static async _generateUserID(username: string): EavAsync<string> {
        try {
            // Use name sha-256 hash with a timestamp to prevent collisions
            const id = crypto.createHash('sha256').update(username).digest().toString('base64url') + '.' + Date.now()
            const [usersError, users] = await this.listAccountEntries()
            if (usersError) return [usersError, null]
            if (users.find(x => x.userID === id)) return await this._generateUserID(username)
            return [null, id]
        } 
        catch (error) {
            return [error as Error, null]
        }
    }


}