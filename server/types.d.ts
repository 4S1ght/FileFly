
/**
 * Error-as-value return type.  
 * Used together with array destructuring to produce a Go-like return returns.
 * ```typescript
 * // Example:
 * const [error, value] = someMethod()
 * if (error) return handleError()
 * 
 * // "value" won't be defined unless error is checked against and handled.
 * value.doSomething() 
 * ```
 */
declare type Eav<V, E = Error> = [E, undefined] | [undefined, V]

/**
 * An async error-as-value return type.  
 * Used together with array destructuring to produce a Go-like error returns.
 * ```typescript
 * // Example:
 * const [error, value] = await someMethod()
 * if (error) return handleError()
 * 
 * // "value" won't be defined unless error is checked against and handled.
 * value.doSomething() 
 * ```
 */
declare type EavAsync<V, E = Error> = Promise<[E, undefined] | [undefined, V]>