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
export default class Sqlite3Queue {

    private locked = false
    private queue: AcquireCallback[] = []

    public acquireLock() {
        return new Promise<Lock>(async (acquire) => {

            this.queue.push(acquire)

            if (this.locked === false) {
                this.locked = true
                for (let i = 0; i < this.queue.length; i++) {
                    const acquire = this.queue[i]
                    await new Promise<void>(resume => {
                        acquire({ release: resume })
                    })
                }
                this.locked = false
                this.queue = []
            }
            
        })
    }

}

(async function() {
    const queue = new Sqlite3Queue()
    const lock = await queue.acquireLock()
    // do something
    lock.release()
})()

