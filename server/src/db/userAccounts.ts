// Imports ====================================================================

import { v1 as uuid }   from 'uuid'
import bcrypt           from 'bcrypt'
import url              from 'url'
import path             from 'path'
import fs               from 'fs/promises'
import Logger           from '../logging/logging.js'
import Config           from '../config/config.js'
import AsyncSqlite3     from './sqlite3.js'
import Sqlite3TxQueue   from './sqlite3TxQueue.js'

const out = Logger.getScope(import.meta.url)

const __filename = url.fileURLToPath(import.meta.url)
const __dirname = url.fileURLToPath(new URL('.', import.meta.url))

const sql = (s: TemplateStringsArray) => s[0]

// Types ======================================================================

interface UserAccountData {
    username:   string
    uuid:       string
    password:   string
    root:       boolean
    created:    Date
    lastLogin:  Date | null
}

// Code =======================================================================

export default class UserAccounts {

    private static declare txq: Sqlite3TxQueue
    private static declare db: AsyncSqlite3

    public static async open(): EavSingleAsync {
        try {
            
            out.INFO('Opening database.')

            const dirname = path.join(__dirname, '../../db/')
            const filename = path.join(__dirname, '../../db/user.sqlite')
            await fs.mkdir(dirname, { recursive: true })

            // Open database
            const [dbError, dbInstance] = await AsyncSqlite3.open(filename)
            if (dbError) return dbError
            this.db = dbInstance
            this.txq = new Sqlite3TxQueue()

            const prepareError = await this.prepare()
            if (prepareError) return prepareError

            out.INFO('Database open.')

        } 
        catch (error) {
            return error as Error
        } 
    }

    private static async prepare() {
        try {

            out.INFO('Preparing database.')

            // Enable foreign key constrains
            out.DEBUG('Prepare > foreign keys')
            const defaultsError = await this.db.run(sql`
                PRAGMA foreign_keys = ON;
            `)
            if (defaultsError) return defaultsError

            out.DEBUG('Prepare > create users table')
            const createError = await this.db.run(sql`
                CREATE TABLE IF NOT EXISTS users (
                    username        TEXT        PRIMARY KEY UNIQUE NOT NULL,
                    uuid            TEXT        NOT NULL,
                    password        TEXT        NOT NULL,
                    root            BOOLEAN     DEFAULT 0,
                    created         TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
                    lastLogin       TIMESTAMP
                );
            `)
            if (createError) return createError

            // Check whether a root user exists.
            out.DEBUG('Prepare > count root users')
            const [rootUsersError, rootUsers] = await this.db.get<{ count: number }>(sql`
                SELECT COUNT(*) AS count FROM users WHERE root = 1;
            `) 
            if (rootUsersError) return rootUsersError
            
            // Create a root account if none exist
            if (rootUsers.count === 0) {
                
                out.WARN('No root user accounts were found. A default admin account will be created.')
                
                const $uuid = `admin.${uuid()}`
                const $pwd = await bcrypt.hash('admin', Config.$.bcrypt_password_salt_rounds)

                const createError = await this.db.run(sql`
                    INSERT INTO users (username, uuid, password, root)
                    VALUES ('admin', $uuid, $pwd, 1)
                `, { $pwd, $uuid })

                if (createError) return createError
                out.CRIT('A default administrator account was created with username/password of admin/admin. Change the password as soon as possible!')
                
            }
            else {

                const [rootError, root] = await this.db.get<{ password: string }>(sql`
                    SELECT (password) FROM users
                    WHERE username = "admin"
                `)
                if (rootError) return rootError

                const match = await bcrypt.compare('admin', root.password)
                if (match) out.CRIT('!!! The "admin" account is using the default password. Change it as soon as possible !!!')

            }

        } 
        catch (error) {
            return error as Error    
        }
    }

    /**
     * Returns the user account object of a specified `name`.
     * @returns `[error?, user?]`
     */
    public static async get(name: string): EavAsync<UserAccountData> {
        try {

            const [userError, user] = await this.db.get<UserAccountData>(sql`
                SELECT * FROM users WHERE username = $username;
            `, { $username: name})

            if (userError) return [userError, undefined]

            user.created = new Date(user.created as any as string)
            user.lastLogin = user.lastLogin === null ? null : new Date(user.lastLogin as any as string)
            return [undefined, user]            

        } 
        catch (error) {
            return [error as Error, undefined]
        } 
    }

}