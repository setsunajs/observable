import {
  ObservableComplete,
  ObservableError,
  ObservableNext,
  ObservableSubscribe,
  Pipe
} from "./types"
import { noop } from "@setsunajs/shared"
import { createObservable } from "./createObservable"

type PickObservable<T> = T extends Observable<infer R> ? R : T

export class Observable<V, E = V, O = V> {
  value: PickObservable<V> = null as any
  constructor(value?: Observable<E>) {
    return createObservable(value) as any
  }
  closed = false
  pipe: Pipe<V, E, O> = noop as any
  next: ObservableNext<E> = noop as any
  error: ObservableError = noop as any
  complete: ObservableComplete = noop as any
  subscribe: ObservableSubscribe<V, O> = noop as any
}
