import { isFunction, isPlainObject } from "@setsunajs/shared"
import { Observable } from "."

export function isObservable<O = Observable<any, any, any>>(
  value: unknown
): value is O {
  return (
    isPlainObject(value) &&
    isFunction(value.pipe) &&
    isFunction(value.subscribe)
  )
}
