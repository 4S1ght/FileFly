// Imports ====================================================================

import FFClientError from "./lib/FileflyClientError"

// Types ======================================================================

// Code =======================================================================

export default new class UserAPI {

    /**
     * Sends a login request to the server and returns the possible errors.
     * @param user username
     * @param pass password
     * @param long boolean - Whether to use a long session.
     * @returns Possible `Error` object or HTTP status code in case of an error response.
     */
    public async login(user: string, pass: string, long = false): EavSingleAsync<FFClientError<{ statusCode: number }, 'UA_LOGIN_AUTH_ERROR' | 'UA_LOGIN_UNKNOWN_ERR'>> {
        try {
            const res = await fetch('/api/v1/session/new', {
                method: 'post',
                headers: { 'Content-Type': "application/json" },
                body: JSON.stringify({ user, pass, long })
            })
            if (res.status !== 200) return new FFClientError(
                'UA_LOGIN_AUTH_ERROR', 'Failed to log in due to server or auth error.', 
                null, { statusCode: res.status }
            )
        } 
        catch (error) {
            return new FFClientError('UA_LOGIN_UNKNOWN_ERR', "Failed to log in.", error as Error, { statusCode: -1 })
        }
    }

}