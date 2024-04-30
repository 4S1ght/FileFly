// Imports ====================================================================

import http from 'http'
import https from 'https'
import express from 'express'
import Config from '../config/config.js'
import SSL from './ssl/ssl.js'
import logging from '../logging/logging.js'
import bodyParser from 'body-parser'
import cookieParser from 'cookie-parser'
import requestLogger from './middleware/requestLogger.js'

const out = logging.getScope(import.meta.url)

// Types ======================================================================

export type TMiddleware = (req: express.Request, res: express.Response, next: express.NextFunction) => any
export type TRequestHandler = (req: express.Request, res: express.Response) => any

// Code =======================================================================

export default class HttpServer {

    public static $: HttpServer
    private static app = express()
    private static server: http.Server | https.Server

    public static start(): EavSingleAsync {
        return new Promise(async finish => {
            try {
                
                if (Config.$.use_https) {

                    out.INFO(`Server running in HTTPS mode`)

                    await SSL.init()
                    const [certError, sslData] = await SSL.getSSLCertKeyData()
                    if (certError) throw certError

                    const options: https.ServerOptions = { ...sslData }
                    this.server = https.createServer(options, this.app)

                }
                else {

                    out.WARN(`Server running in HTTP mode`)
                    this.server = http.createServer(this.app)

                }

                this.finishAPISetup()
        
                this.server.listen(Config.$.http_port, () => {
                    out.INFO(`Listening on port ${Config.$.http_port}`)
                    finish(undefined)
                })

            } 
            catch (error) {
                finish(error as Error)    
            }
        })
    }

    private static finishAPISetup() {

        this.app.use(bodyParser.json())
        this.app.use(cookieParser())
        this.app.use(requestLogger.logger)

    }

}