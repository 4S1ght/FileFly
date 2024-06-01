// Imports ====================================================================

// Types ======================================================================

type ErrorMetadata = { [value: string]: any }

// Code =======================================================================

export default class FFClientError<ErrorMeta extends ErrorMetadata = ErrorMetadata> extends Error {

    public code: string
    public message: string
    public trace: (Error | FFClientError)[] = []
    public meta: ErrorMeta

    constructor(code: string, message: string, cause?: Error | null, meta?: ErrorMeta) {
        super(message)
        Error.captureStackTrace && Error.captureStackTrace(this, this.constructor)
        this.code = code
        this.message = message
        this.meta = meta || {} as Record<any, any>
        if (cause) {
            if (cause instanceof FFClientError) {
                this.trace = [cause, ...cause.trace]
                cause.trace = []
            }
            else {
                this.trace.unshift(cause)
            }
        }
    }

}