// Imports ====================================================================

import HttpServer from "./lib/api/httpServer.js"
import Config from "./lib/config/config.js"

// Types ======================================================================

// Code =======================================================================

export default class Server {

    public static async start() {

        // Server configuration
        const e1 = await Config.load()
        if (e1) throw e1


        const e2 = await HttpServer.start()
        if (e1) throw e1

    }

}

Server.start()