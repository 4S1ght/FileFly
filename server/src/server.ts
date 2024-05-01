// Imports ====================================================================

import HttpServer from "./lib/api/httpServer.js"
import Config from "./lib/config/config.js"
import Logger from "./lib/logging/logging.js"
import userAccounts from "./lib/db/userAccounts.js"

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
            out.CRIT(error as Error)
            throw error
        }
    }

}

Server.main()