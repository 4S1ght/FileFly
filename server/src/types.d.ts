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

/**
 * An error-as-value return type for functions that don't have to
 * return any information and would benefit being error-safe.
 */

declare type EavSingle<E = Error> = E | undefined

/**
 * An async error-as-value return type for functions that don't have to
 * return any information and would benefit being error-safe.
 */
declare type EavSingleAsync<E = Error> = Promise<E | undefined>