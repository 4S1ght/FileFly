// Imports ====================================================================

import HttpServer from "./lib/api/httpServer.js"
import Config from "./lib/config/config.js"
import Logger from "./lib/logging/logging.js"

// Types ======================================================================

// Code =======================================================================

export default class Server {

    public static async start() {

        // Server configuration
        const e1 = await Config.load()
        if (e1) throw e1

        // Logging
        const e2 = await Logger.init()
        if (e2) throw e2

        // HTTP server
        const e3 = await HttpServer.start()
        if (e3) throw e3

    }

}

Server.start()