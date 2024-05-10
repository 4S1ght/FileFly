// Imports ====================================================================

import HttpServer from "./api/httpServer.js"
import Config from "./config/config.js"
import Logger from "./logging/logging.js"
import userAccounts from "./db/userAccounts.js"

const out = Logger.getScope(import.meta.url)

// Types ======================================================================

// Code =======================================================================

export default class Server {

    public static async main() {
        try {
            
            // Server configuration
            const e1 = await Config.load()
            if (e1) throw e1

            // Logging
            const e2 = await Logger.init()
            if (e2) throw e2

            // User accounts database
            const e3 = await userAccounts.open()
            if (e3) throw e3

            // HTTP server
            const e4 = await HttpServer.start()
            if (e4) throw e4

        } 
        catch (error) {
            // Use setImmediate to throw the main error even if out.CRIT fails
            // due to strange config issues or other edge-cases
            setImmediate(() => { throw error })
            out.CRIT(error as Error)
        }
    }

}

Server.main()