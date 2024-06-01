// Imports ====================================================================

import url                      from 'node:url'
import logging                  from '../../logging/logging.js'
import z, { string, boolean }   from 'zod'
import UserSession              from '../../db/userSession.js'
import type { TRequestHandler } from '../httpServer.js'
import Config from '../../config/config.js'

const out = logging.getScope(import.meta.url)

const __filename = url.fileURLToPath(import.meta.url)
const __dirname  = url.fileURLToPath(new URL('.', import.meta.url))

// Types ======================================================================

const ZRequestBody = z.object({
    user: string().max(256),
    pass: string().max(256),
    long: boolean()
})

export type HTTPLoginBody = z.infer<typeof ZRequestBody>

// Code =======================================================================

const POSTLogin: TRequestHandler = async function(req, res) {
    try {

        const parseStatus = ZRequestBody.safeParse(req.body)
        if (parseStatus.success === false) {
            out.DEBUG(`Bad request body:`, parseStatus)
            return res.status(400).end()
        }
        const { user, pass, long } = req.body as HTTPLoginBody

        const [createError, SID] = await UserSession.create(user, pass, long)
        if (createError) return createError === 'WRONG_PASS_OR_NAME'
            ? res.status(401).end()
            : res.status(500).end()

        res.cookie('sid', SID, { 
            maxAge: long 
                ? Config.$.session_duration_long  * 1000*60*60*24
                : Config.$.session_duration_short * 1000*60
        })
        .status(200)
        .end()
        
    } 
    catch (error) {
        
    }
}

export default POSTLogin
