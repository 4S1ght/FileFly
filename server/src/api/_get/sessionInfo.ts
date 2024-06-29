// Imports ====================================================================

import url                               from 'node:url'
import logging                           from '../../logging/logging.js'
import z, { string }                     from 'zod'
import UserSession, { UserSessionEntry } from '../../db/userSession.js'
import type { TRequestHandler }          from '../httpServer.js'
import Config                            from '../../config/config.js'

const out = logging.getScope(import.meta.url)

const __filename = url.fileURLToPath(import.meta.url)
const __dirname  = url.fileURLToPath(new URL('.', import.meta.url))

// Types ======================================================================

export type TSessionInfo = Pick<
    UserSessionEntry,
    'username' | 'root' | 'type' | 'createdISO' | 'updatedISO'
>

// Code =======================================================================

const renewSession: TRequestHandler = async function(req, res) {
    try {

        // Limit SID length
        const sid = req.cookies.sid
        const session = UserSession.renew(sid)

        if (!session) return res.status(401).end()
        
        const info: TSessionInfo = {
            username:   session.username,
            root:       session.root,
            type:       session.type,
            createdISO: session.createdISO,
            updatedISO: session.updatedISO
        }

        res.json(info)

    }
    catch (error) {
        out.ERROR(error as Error)
        res.status(500).end()
    }
}

export default renewSession
