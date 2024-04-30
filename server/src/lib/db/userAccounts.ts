// Imports ====================================================================

import { v1 as uuid } from 'uuid'
import logging from '../logging/logging.js'
import url from 'url'
import sqlite from 'sqlite3'
import path from 'path'
import fs from 'fs/promises'

const out = logging.getScope(import.meta.url)

const __filename = url.fileURLToPath(import.meta.url)
const __dirname = url.fileURLToPath(new URL('.', import.meta.url))

const sql = (s: TemplateStringsArray) => s[0]

// Types ======================================================================

// Code =======================================================================

export default new class UserAccounts {

    private declare db: sqlite.Database

    public async open(): EavSingleAsync {
        try {
            
            out.INFO('Opening database.')

            const dirname = path.join(__dirname, '../../../db/')
            const filename = path.join(__dirname, '../../../db/user.sqlite')
            await fs.mkdir(dirname, { recursive: true })

            // Wraps the database open callback in promise to catch the possible errors
            const error = await new Promise<Error|null>((resolve, reject) => {
                this.db = new sqlite.Database(filename, error => resolve(error))
            })
            if (error) throw error

            out.DEBUG('Running default SQL DB setup queries.')
            this.db.run(sql`
                CREATE TABLE IF NOT EXISTS users (
                    username        TEXT        PRIMARY KEY UNIQUE NOT NULL,
                    uuid            TEXT        NOT NULL,
                    password        TEXT        NOT NULL,
                    root            BOOLEAN     DEFAULT 0,
                    created         TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
                    lastLogin       TIMESTAMP
                );
            `)


        } 
        catch (error) {
            return error as Error
        }
    }

    public close = () => new Promise<Error|null>(finish => {
        this.db.close(error => {
            finish(error)
        })
    })

}