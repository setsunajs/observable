import { OB_CLOSED_SET } from "./constants"
import { isObservable } from "./isObservable"
import { Observable } from "./Observable"
import { pipe, next, error, complete, subscribe } from "./prototype"
import { ObservableContext } from "./types"

export function createObservable<T = any, O = T>(
  value?: Observable<T, any, any> | T
) {
  const shouldSubscribe = isObservable(value)
  if (value && shouldSubscribe) {
    throw console.error(
      "[Observable error] value is not Observable like ",
      value
    )
  }

  const context: ObservableContext = {
    _closed: false,
    _subs: [],
    _pipes: [],
    value: shouldSubscribe ? value.value : value
  }
  context.pipe = pipe.bind(context)
  context.error = error.bind(context)
  context.next = next.bind(context)
  context.complete = complete.bind(context)
  context.subscribe = subscribe.bind(context)
  Object.defineProperty(context, "closed", {
    get: () => context._closed,
    set: value =>
      value === OB_CLOSED_SET
        ? (context._closed = value)
        : console.error("[Observable error] Observable.closed cannot set"),
    configurable: false,
    enumerable: true
  })

  if (shouldSubscribe) {
    value.subscribe({
      next: context.next,
      error: context.error,
      complete: context.complete
    })
  }

  return context as Observable<T, O>
}
