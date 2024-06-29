// Imports ====================================================================

import FFClientError from "./lib/FileflyClientError"
import type { TSessionInfo } from '../../../server/src/api/_get/sessionInfo'

// Types ======================================================================

/** Extracts possible error codes emitted by methods called from within other methods */
type DepCode<Method extends () => any> = Extract<Awaited<ReturnType<Method>>, FFClientError>['code']

// Code =======================================================================

const uapi = new class UserAPI {

    constructor() {
        //@ts-ignore
        window.uapi = this
    }

    public declare sessionInfo: TSessionInfo

    /**
     * Sends a login request. Returns `void` if successful and an error object if operation failed.
     * @param user username
     * @param pass password
     * @param long boolean - Whether to use a long session.
     * @returns Possible `Error` object containing the error code and HTTP response code.
     */
    public async login(user: string, pass: string, long = false): EavSingleAsync<FFClientError<{ statusCode: number }, 
        'UA_LOGIN_AUTH_ERROR' | 'UA_LOGIN_UNKNOWN_ERROR' | 'UA_BAD_REQUEST' | 'UA_SERVER_ERROR' | DepCode<typeof this.getSessionInfo>
    >> {
        try {
            const res = await fetch('/api/v1/session/new', {
                method: 'post',
                headers: { 'Content-Type': "application/json" },
                body: JSON.stringify({ user, pass, long })
            })
            if (res.status === 400) return new FFClientError('UA_BAD_REQUEST',      'An error ocurred forming the request.',         null, { statusCode: res.status }) 
            if (res.status === 401) return new FFClientError('UA_LOGIN_AUTH_ERROR', 'Failed to log in due to server or auth error.', null, { statusCode: res.status }) 
            if (res.status === 500) return new FFClientError('UA_SERVER_ERROR',     'Server error.',                                 null, { statusCode: res.status })
            return await this.getSessionInfo()
            
        } 
        catch (error) {
            return new FFClientError('UA_LOGIN_UNKNOWN_ERROR', "Failed to log in.", error as Error, { statusCode: -1 })
        }
    }

    /**
     * Sends a session renewal request. Returns `void` if successful and an error object if operation failed.
     * @returns Possible `Error` object containing the error code and HTTP response code.
     */
    public async renewSession(): EavSingleAsync<FFClientError<{ statusCode: number },
        'UA_RENEW_SESSION_ERROR' | 'UA_SERVER_ERROR' | 'UA_RENEW_UNKNOWN_ERROR' | DepCode<typeof this.getSessionInfo>
    >> {
        try {
            const res = await fetch('/api/v1/session/renew', { method: 'get' })
            if (res.status === 401) return new FFClientError('UA_RENEW_SESSION_ERROR', 'Session expired.', null, { statusCode: res.status }) 
            if (res.status === 500) return new FFClientError('UA_SERVER_ERROR',        'Server error.',    null, { statusCode: res.status }) 
                return await this.getSessionInfo()
        } 
        catch (error) {
            return new FFClientError('UA_RENEW_UNKNOWN_ERROR', "Failed to log in.", error as Error, { statusCode: -1 })
        }
    }

    /**
     * Sends a session renew request and returns the possible error.
     * If an error is returned, the session could not be renewed and a new one needs to be established
     */
    private async getSessionInfo(): EavSingleAsync<FFClientError<{ statusCode: number },
        'US_AUTH_ERROR' | 'US_SERVER_ERROR' | 'US_UNKNOWN_ERROR'
    >> {
        try {
            const res = await fetch('/api/v1/session/info', { method: 'get' })
            if (res.status === 401) return new FFClientError('US_AUTH_ERROR',   'Session expired.', null, { statusCode: res.status }) 
            if (res.status === 500) return new FFClientError('US_SERVER_ERROR', 'Server error.',    null, { statusCode: res.status })
            this.sessionInfo = await res.json()
        } 
        catch (error) {
            return new FFClientError('US_UNKNOWN_ERROR', 'Server error.', null, { statusCode: -1 }) 
        }
    }

}

export default uapi