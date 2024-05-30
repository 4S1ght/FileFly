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
interface UserAccountData {
    username:       string
    userID:         string
    password:       string
    root:           boolean
    createdISO:     string
    lastLoginISO:   string | null
}

/** Used internally in the database. "username" is added when needed. */
type UserAccountEntry = Omit<UserAccountData, 'username'>

/** Stores all user preferences used by the UI apps and plugins. */
interface UserPreferences {
    [userID: string]: string | number | Nullish
}

// Code =======================================================================

export default class UserAccount {

    private static dirname = path.join(__dirname, '../../db/')

    private static declare db:            Level<string, never>
    private static declare slAccounts:    AbstractSublevel<typeof this.db, string | Buffer | Uint8Array, string, /* type */ UserAccountEntry>
    private static declare slPreferences: AbstractSublevel<typeof this.db, string | Buffer | Uint8Array, string, /* type */ UserPreferences>

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
            this.slAccounts    = this.db.sublevel<string, UserAccountEntry>('account', slOptions)
            this.slPreferences = this.db.sublevel<string, UserPreferences>('pref', slOptions)

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
            
            out.NOTICE(`CREATE user:${user.name}, root:${user.root}`)

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

            out.NOTICE(`CREATE call succeeded | user:${user.name}, root:${user.root}, uuid:${userID}`)

        } 
        catch (error) {
            out.ERROR(`CREATE error:`, error as Error)
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
            out.NOTICE(`DELETE ${name.toString()}`)

            // Check if user exists
            if (await this.exists(name) === false) return 'ERR_USER_NOT_FOUND'

            // Check if the username doesn't belong to the last remaining admin account.
            const [usersError, users] = await this.listAccountEntries()
            if (usersError) return usersError
            const admins = users.filter(x => x.root)
            if (admins.length === 1) return 'ERR_CANT_DEL_LAST_ADMIN'

            await this.slAccounts.del(name)
            out.NOTICE(`DELETE call successful | user:${name.toString()}`)
            
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
    public static async get(name: string): Promise<UserAccountData | undefined> {
        try {
            ZString.parse(name)
            out.DEBUG(`GET "${name.toString()}"`)
            const user = await this.slAccounts.get(name) as UserAccountData
            user.username = name
            return user
        } 
        catch { 
            return undefined 
        }
    }

    /**
     * Returns a list of all existing user accounts.
     * @returns Account entries array
     */
    public static async listAccountEntries(): EavAsync<UserAccountData[]> {
        try {
            const users: UserAccountData[] = []
            for await (const name of this.slAccounts.keys()) {
                const user = await this.slAccounts.get(name) as UserAccountData
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
            ZString.parse(name)
            await this.slAccounts.get(name)
            return true  
        } 
        catch (error) {
            return false
        }
    }

    // Preferences ============================================================

    private static TPreferenceValue = z.nullable(z.union([
        string(), number(), boolean(), z.undefined()
    ]))

    public static async setPreference(userID: string, preference: string, value: any): EavSingleAsync {
        try {

            ZString.parse(preference)
            this.TPreferenceValue.parse(value)
            
            const preferencesObject = await new Promise<UserPreferences>(finish => {
                this.slPreferences.get(userID, (err, doc) => {
                    if (err) finish({})
                    else finish(doc || {})
                })
            })

            if (value === undefined) delete preferencesObject[preference]
            else preferencesObject[preference] = value

            await this.slPreferences.put(userID, preferencesObject)
            out.DEBUG(`Preference set "${preference}" for ${userID}`)

        } 
        catch (error) {
            return error as Error
        }
    }

    // Utility methods ========================================================


    private static async _generateUserID(username: string): EavAsync<string> {
        try {
            const id = crypto.createHash('sha256').update(username).digest().toString('base64url')
            const [usersError, users] = await this.listAccountEntries()
            if (usersError) return [usersError, undefined]
            if (users.find(x => x.userID === id)) return await this._generateUserID(username)
            return [undefined, id]
        } 
        catch (error) {
            return [error as Error, undefined]
        }
    }


}