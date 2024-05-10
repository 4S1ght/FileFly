// Imports ====================================================================

import sqlite from 'sqlite3'

// Types ======================================================================

// Code =======================================================================

/**
 * An SQLite3 wrapper class providing a promise-based API.
 */
export default class AsyncSqlite3 {

    private declare $: sqlite.Database

    private constructor() {}

    /**
     * Creates and/or opens a new SQLite database
     * @param filename Database file name
     */
    public static open(filename: string): EavAsync<AsyncSqlite3> {
        return new Promise(resolve => {
            try {
                const self = new this()
                self.$ = new sqlite.Database(filename, error => {
                    resolve(error ? [error, undefined] : [undefined, self])
                })
            } 
            catch (error) {
                return [error, undefined]
            }
        })
    }

    /**
     * Closes the database and returns any possible errors.
     */
    public close = (): EavSingleAsync => new Promise(resolve => {
        this.$.close(error => {
            resolve(error || undefined)
        })
    })

    /**
     * Runs a general SQL query and returns possible errors.
     */
    public run = (sql: string, params: Record<string, any> = {}): EavSingleAsync => new Promise(resolve => {
        this.$.run(sql, params, function(error) {
            resolve(error || undefined)
        })
    })

    /**
     * Runs a GET SQL query for small items, returning a possible error, or the query results.
     */
    public get = <Row>(sql: string, params: Record<string, any> = {}): EavAsync<Row> => new Promise(resolve => {
        this.$.get<Row>(sql, params, function(error, row) {
            resolve(error ? [error, undefined] : [undefined, row])
        })
    })

    /**
     * Runs a getter SQL query for multiple items, storing them in memory.
     * Returns a possible error, or the query results.
     */
    public all = <Row>(sql: string, params: Record<string, any> = {}): EavAsync<Row[]> => new Promise(resolve => {
        this.$.all<Row>(sql, params, function(error, rows) {
            resolve(error ? [error, undefined] : [undefined, rows])
        })
    })

}