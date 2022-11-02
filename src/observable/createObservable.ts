import { isObservable } from "./isObservable"
import { Observable } from "./Observable"
import { pipe, next, error, complete, subscribe } from "./prototype"
import { ObservableContext } from "./types"

export function createObservable<E = any, V = E, O = V>(
  value?: Observable<any, E, any> | E
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
    observable: {
      value: shouldSubscribe ? value.value : value
    }
  }
  context.observable.pipe = pipe.bind(context)
  context.observable.next = next.bind(context)
  context.observable.error = error.bind(context)
  context.observable.complete = complete.bind(context)
  context.observable.subscribe = subscribe.bind(context)

  if (shouldSubscribe) {
    value.subscribe({
      next: context.observable.next,
      error: context.observable.error,
      complete: context.observable.complete
    })
  }

  return context.observable as Observable<E, V, O>
}
