// Imports ====================================================================

import Config from "./lib/config/config.js"

// Types ======================================================================

// Code =======================================================================

export default class Server {

    public static async start() {
        await Config.load()
    }

}

Server.start()