import { isUndef } from "@setsunajs/shared"
import { isObservable } from "./isObservable"
import { pipe, next, error, complete, subscribe } from "./prototype"
import { ObservableContext, ObservableParam, Observable } from "./types"

export const OB_INIT_VALUE = Symbol("uninitialized observable value")

export function createObservable<E = any, V = E, O = V>(
  value?: ObservableParam<E>
) {
  const shouldSubscribe = isObservable(value)
  if (value && shouldSubscribe) {
    throw console.error(
      "[Observable error] value is not Observable like ",
      value
    )
  }

  const context: ObservableContext = {
    _subs: [],
    _pipes: [],
    closed: false,
    observable: {}
  }
  Object.assign(context.observable, {
    value: shouldSubscribe ? value.value : isUndef(value) ? OB_INIT_VALUE : value,
    pipe: pipe.bind(context),
    next: next.bind(context),
    error: error.bind(context),
    complete: complete.bind(context),
    subscribe: subscribe.bind(context)
  })

  if (shouldSubscribe) {
    value.subscribe({
      next: context.observable.next,
      error: context.observable.error,
      complete: context.observable.complete
    })
  }

  return context.observable as Observable<E, V, O>
}
