import { isObservable } from "./isObservable"
import { pipe, next, error, complete, subscribe } from "./prototype"
import { ObservableContext, ObservableParam, Observable } from "./types"

export function createObservable<E = any, V = E, O = V>(
  value?: ObservableParam<E>
) {
  const shouldSubscribe = isObservable(value)
  const context: ObservableContext = {
    _subs: [],
    _pipes: [],
    closed: false,
    observable: {}
  }
  Object.assign(context.observable, {
    value: shouldSubscribe ? value.value : value,
    pipe: pipe.bind(context),
    next: next.bind(context),
    error: error.bind(context),
    complete: complete.bind(context),
    subscribe: subscribe.bind(context)
  })
  Object.defineProperty(context.observable, "closed", {
    get: () => context.closed
  })

  if (shouldSubscribe) {
    context.observable.unSubscribe = value.subscribe({
      next: context.observable.next,
      error: context.observable.error,
      complete: context.observable.complete
    })
  }

  return context.observable as Observable<E, V, O>
}
