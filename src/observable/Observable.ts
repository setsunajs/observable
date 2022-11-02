import {
  PickObservable,
  ObservableComplete,
  ObservableError,
  ObservableNext,
  ObservableSubscribe,
  Pipe
} from "./types"
import { noop } from "@setsunajs/shared"
import { createObservable } from "./createObservable"

export class Observable<E = any, V = E, O = V> {
  value: PickObservable<V> = null as any
  constructor(value?: Observable<E> | E) {
    return createObservable(value) as any
  }
  closed = false
  pipe: Pipe<E, V, O> = noop as any
  next: ObservableNext<E> = noop as any
  error: ObservableError = noop as any
  complete: ObservableComplete = noop as any
  subscribe: ObservableSubscribe<V, O> = noop as any
}
