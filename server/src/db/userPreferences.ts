// Imports ====================================================================

import url          from 'node:url'
import Logger       from '../logging/logging.js'
import Config       from '../config/config.js'
import UserAccount  from './userAccount.js'

const out = Logger.getScope(import.meta.url)

const __filename = url.fileURLToPath(import.meta.url)
const __dirname  = url.fileURLToPath(new URL('.', import.meta.url))

// Types ======================================================================

// Code =======================================================================

export default class UserPreferences {

    private constructor(public scope: string) {}

    /** Stores a list of all registered scopes. */
    private static scopes: string[] = []

    /**
     * Creates a scope for user preferences that is appended at the start of
     * each preferences key to prevent conflicts with UI extensions.
     */
    public static getScope(scope: string): Eav<UserPreferences> {

        if (this.scopes.includes(scope)) {
            out.ERROR(`Duplicate preferences scope: ${scope}`)
            return [new Error(`Duplicate preferences scope: ${scope}`), null]
        }

        this.scopes.push(scope)
        out.DEBUG(`Scope registered: ${scope} (x${this.scopes.length})`)
        return [null, new this(scope)]

    }

    public async set(key: string, value: string | number | boolean | Nullish) {
    }

    public async get(key: string) {

    }

}