import { Observable } from "./Observable"
import {
  Pipe,
  ObservableComplete,
  ObservableNext,
  ObservableSubscribe,
  ObservableError
} from "./types"

export const pipe: Pipe<any, any, any> = function (
  this: Observable<any>,
  ...pipes: any[]
) {
  return 1 as any
}

export const next: ObservableNext<any> = function (
  this: Observable<any>,
  value
) {
  return Promise.resolve(value)
}

export const error: ObservableError<any> = function (
  this: Observable<any>,
  value
) {
  return Promise.resolve(value)
}

export const complete: ObservableComplete = function (this: Observable<any>) {
  return Promise.resolve()
}

export const subscribe: ObservableSubscribe<any, any> = function (
  this: Observable<any>,
  value
) {
  return () => {}
}
