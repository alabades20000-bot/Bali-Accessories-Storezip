import { useCallback } from "react";

type AnyFunction = (value?: any) => any;

type ServerFunction = AnyFunction & {
  inputValidator: (validator: AnyFunction) => ServerFunction;
  middleware: (...middleware: AnyFunction[]) => ServerFunction;
  handler: (handler: AnyFunction) => ServerFunction;
};

/**
 * The storefront is shipped as a client-only Vite artifact. This tiny adapter
 * keeps the imported server-function API callable in the browser build while
 * preserving the original server handlers for environments that provide them.
 */
export function createServerFn(_options?: Record<string, unknown>): ServerFunction {
  let validator: AnyFunction | undefined;
  let handler: AnyFunction | undefined;

  const fn = ((input?: any) => {
    const rawData = input?.data ?? input;
    const data = validator ? validator(rawData) : rawData;
    return handler ? handler({ data }) : Promise.resolve(undefined);
  }) as ServerFunction;

  fn.inputValidator = (nextValidator) => {
    validator = nextValidator;
    return fn;
  };
  fn.middleware = () => fn;
  fn.handler = (nextHandler) => {
    handler = nextHandler;
    return fn;
  };

  return fn;
}

export function useServerFn<T extends AnyFunction>(fn: T): T {
  return useCallback(((input?: any) => fn(input)) as T, [fn]);
}

export const createStart = () => ({});
export const createClientOnlyFn = <T extends AnyFunction>(fn: T) => fn;
export const createServerOnlyFn = <T extends AnyFunction>(fn: T) => fn;
export const createIsomorphicFn = <T extends AnyFunction>(fn: T) => fn;
export const createMiddleware = () => ({
  server: (fn: AnyFunction) => fn,
  client: (fn: AnyFunction) => fn,
});
export const createCsrfMiddleware = () => createMiddleware();
export const getRequest = () => undefined;