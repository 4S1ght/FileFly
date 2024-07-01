// Imports ====================================================================

import url                      from 'node:url'
import logging                  from '../../logging/logging.js'
import z, { string }            from 'zod'
import UserSession              from '../../db/userSession.js'
import type { TRequestHandler } from '../httpServer.js'
import Config                   from '../../config/config.js'

const out = logging.getScope(import.meta.url)

const __filename = url.fileURLToPath(import.meta.url)
const __dirname  = url.fileURLToPath(new URL('.', import.meta.url))

// Types ======================================================================

// Code =======================================================================

const renewSession: TRequestHandler = async function(req, res) {
    try {

        // Limit SID length
        const sid = req.cookies.sid

        const session = UserSession.renew(sid)
        res.status(session ? 200 : 401).end()

    } 
    catch (error) {
        out.ERROR(error as Error)
        res.status(500).end()
    }
}

export default renewSession
