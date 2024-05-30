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
declare type Eav<V, E = Error> = [E, Nullish] | [Nullish, V]

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
declare type EavAsync<V, E = Error> = Promise<[E, Nullish] | [Nullish, V]>

/**
 * An error-as-value return type for functions that don't have to
 * return any information and would benefit being error-safe.
 */

declare type EavSingle<E = Error> = E | Nullish

/**
 * An async error-as-value return type for functions that don't have to
 * return any information and would benefit being error-safe.
 */
declare type EavSingleAsync<E = Error> = Promise<E | Nullish>

declare type Nullish = undefined | null