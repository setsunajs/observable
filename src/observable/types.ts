import { Observable } from "./Observable"

export type PipeOperatorNext<T, R> = (value: T) => R
export type PipeOperatorOption<T, R> = {
  next: PipeOperatorNext<T, R>
  error?: (error: any) => R
  complete?: () => unknown
}
export type PipeOperatorObservable<V, E, O> = Omit<Observable<V, E, O>, "pipe">
export type ObservablePipeOperator<T, R> =
  | PipeOperatorNext<T, R>
  | PipeOperatorOption<T, R>
export interface Pipe<V, E, O> {
  (fn: ObservablePipeOperator<E, V>): PipeOperatorObservable<V, E, O>
  <A>(
    fn1: ObservablePipeOperator<E, A>,
    fn2: ObservablePipeOperator<A, V>
  ): PipeOperatorObservable<V, E, O>
}

export type ObservableNext<T> = (value: T) => Promise<T>
export type ObservableError<E = any> = (error: E) => Promise<E>
export type ObservableComplete = () => Promise<void>

export type SubOperatorNext<T, O> = (value: T, oldValue: O) => unknown
export type SubOperatorOption<T, O> = {
  next: SubOperatorNext<T, O>
  error?: (error: any) => unknown
  complete?: () => unknown
}
export type SubOperator<T, O> = SubOperatorNext<T, O> | SubOperatorOption<T, O>
export type ObservableSubscribe<T, O> = (
  valueOrExp: SubOperator<T, O>
) => UnObservableSubscribe
export type UnObservableSubscribe = () => void

export type ObservableContext = Partial<Observable<any, any, any>> & {
  _closed: boolean
  _pipes: PipeOperatorOption<any, any>[]
  _subs: SubOperatorOption<any, any>[]
}
