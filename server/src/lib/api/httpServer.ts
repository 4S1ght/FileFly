// Imports ====================================================================

import http from 'http'
import https from 'https'
import express from 'express'
import Config from '../config/config.js'
import SSL from './ssl/ssl.js'

// Types ======================================================================

// Code =======================================================================

export default class HttpServer {

    public static $: HttpServer
    private static server: http.Server | https.Server
    private static express = express()
    
    private constructor() {}

    public static async start(): EavSingleAsync {

        if (Config.$.use_https) {

            await SSL.init()
            const [certErr, sslData] = await SSL.getSSLCertKeyData()
            if (certErr) return certErr

            const options: https.ServerOptions = { ...sslData }
            this.server = https.createServer(options, this.express)

        }
        else {
            this.server = http.createServer(this.express)
        }

    }

}