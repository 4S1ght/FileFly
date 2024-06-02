// Imports ====================================================================

import url          from 'node:url'
import Logger       from '../logging/logging.js'
import Config       from '../config/config.js'
import type z       from 'zod'
import UserAccount, { TUserPreferences }  from './userAccount.js'

const out = Logger.getScope(import.meta.url)

const __filename = url.fileURLToPath(import.meta.url)
const __dirname  = url.fileURLToPath(new URL('.', import.meta.url))

// Types ======================================================================

// Code =======================================================================

export default class UserPreferences {

    private constructor(public scope: string) {
        // This class will be exposed to plugin scripts so it's frozen
        // To prevent changing of the established scope.
        Object.freeze(this)
    }

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

    /**
     * Sets user preference to a specific value. Eg. `prefers_dark_theme: true`  
     * If set to `undefined` the preference entry is removed completely from the database.
     * @param userID User account ID
     * @param key Preference name
     * @param value Preference value
     */
    public async set(userID: string, key: string, value: TUserPreferences[string]): EavSingleAsync {
        const error = await UserAccount.setPreferenceEntry(userID, `${this.scope}.${key}`, value)
        if (error) return error as Error
    }

    /**
     * Gets user preference's value.
     * @param userID User account ID
     * @param key Preference name
     */
    public async get(userID: string, key: string): EavAsync<TUserPreferences[string]> {
        const [error, preferences] = await UserAccount.getPreferences(userID)
        if (error) return [error, null]
        return [null, preferences[key]]
    }

    /**
     * A utility method merging the behavior of both `get` and `set`.
     * It returns the existing entry's value if it exists, otherwise it sets 
     * it to the `defaultValue` and returns that instead.
     * @param userID User account ID
     * @param key Preference name
     * @param value Preference value
     */
    public async define(userID: string, key: string, defaultValue: TUserPreferences[string]): EavAsync<TUserPreferences[string]>  {

        const [getError, value] = await this.get(userID, key)
        if (getError) return [getError, null] // Return the error
        if (value !== undefined) return [null, value] // Return the existing value (if defined)

        const setError = await this.set(userID, key, defaultValue)
        if (setError) return [setError, null]
        return [null, defaultValue]

    }

}