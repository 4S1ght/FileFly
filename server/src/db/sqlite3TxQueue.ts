// Imports ====================================================================

import logging from "../logging/logging.js"
const out = logging.getScope(import.meta.url)

// Types ======================================================================

interface Lock {
    release(): void
}

type AcquireCallback = (lock: Lock) => void

// Code =======================================================================

/**
 * A locking mechanism for the sqlite3 database allowing sequential
 * reuse of a single database connection.
 */
export default class Sqlite3TxQueue {

    private locked = false
    private queue: [AcquireCallback, number][] = []
    private locks = 0n
    private reqs = 0n

    public acquireLock(time = 5000) {
        return new Promise<Lock>(async (acquire) => {

            this.reqs++
            out.DEBUG(`[0x${(this.reqs).toString(16)}] acquire`)
            this.queue.push([acquire, time])

            if (this.locked === false) {

                this.locks++
                out.DEBUG(`[0x${(this.locks).toString(16)}] lock`)
                this.locked = true

                for (let i = 0; i < this.queue.length; i++) {
                    const [acquire, time] = this.queue[i]
                    let tm: NodeJS.Timeout
                    await Promise.any([
                        // Manual resolver
                        new Promise<void>(resume => {
                            clearTimeout(tm)
                            acquire({ release: resume })
                        }),
                        // Default or specified timeout to prevent deadlocks.
                        new Promise<void>(resume => {
                            tm = setTimeout(resume, time)
                        })
                    ])
                    out.DEBUG(`[0x${(this.reqs).toString(16)}] release`)
                }

                this.locked = false
                this.queue = []
                out.DEBUG(`[0x${(this.locks).toString(16)}] unlock`)

            }
            
        })
    }

}