import {
  isFunction,
  isPlainObject,
  isPromise,
  noop,
  noopError
} from "@setsunajs/shared"
import { OB_FLAG } from "./constants"
import {
  Pipe,
  ObservableComplete,
  ObservableNext,
  ObservableSubscribe,
  ObservableError,
  ObservableContext,
  SubOperatorOption
} from "./types"

export const pipe: Pipe<any, any, any> = function (
  this: ObservableContext,
  ...pipes: any[]
) {
  const ctx = this
  if (!validateClosed(ctx)) {
    return
  }

  for (let i = 0; i < pipes.length; i++) {
    const pipeOperator = pipes[i]
    if (isFunction(pipeOperator)) {
      ctx._pipes.push({
        next: pipeOperator,
        error: noopError,
        complete: noop as any
      })
      continue
    }

    if (!isPlainObject(pipeOperator)) {
      console.error("[Observable error]: pipeOperator is invalid", pipeOperator)
      continue
    }

    ctx._pipes.push({
      next: pipeOperator.next || noop,
      error: pipeOperator.error || noopError,
      complete: pipeOperator.complete || noop
    })
  }

  return ctx.observable as any
}

export const next: ObservableNext<any> = function (
  this: ObservableContext,
  value
) {
  const ctx = this
  if (!validateClosed(ctx)) {
    return Promise.resolve(ctx.observable.value)
  }

  return callEffectEmit(ctx, "next", value)
}

export const error: ObservableError<any> = function (
  this: ObservableContext,
  error
) {
  const ctx = this
  if (!validateClosed(ctx)) {
    return Promise.resolve()
  }

  return callEffectEmit(ctx, "error", error)
}

export const complete: ObservableComplete = function (this: ObservableContext) {
  const ctx = this
  if (!validateClosed(ctx)) {
    return Promise.resolve(ctx.observable.value)
  }
  ctx.closed = true
  return callEffectEmit(ctx, "complete")
}

export const subscribe: ObservableSubscribe<any, any> = function (
  this: ObservableContext,
  subOperator
) {
  const ctx = this
  let _subItem: SubOperatorOption<any, any> | undefined

  if (!validateClosed(ctx)) {
  } else if (isFunction(subOperator)) {
    ctx._subs.push((_subItem = { next: subOperator }))
  } else if (!isPlainObject(subOperator)) {
    console.error("[Observable error]: SubOperator is invalid", subOperator)
  } else {
    const { next, error, complete } = subOperator as SubOperatorOption<any, any>
    ctx._subs.push(
      (_subItem = {
        next,
        error,
        complete
      })
    )
  }

  return _subItem
    ? () => {
        const index = ctx._subs.indexOf(_subItem!)
        index > -1 && ctx._subs.splice(index, 1)
      }
    : () => {}
}

function validateClosed(ctx: ObservableContext) {
  if (ctx.closed) {
    console.error("[Observable error]: `Observable 'has been closed.")
    return false
  }

  return true
}

async function callEffectEmit(
  ctx: ObservableContext,
  type: "next" | "error" | "complete",
  value?: any
): Promise<any> {
  const { _pipes, _subs } = ctx
  let curType = type
  let curValue = value

  if (_pipes.length !== 0) {
    for (const pipeOperator of _pipes) {
      try {
        let _value = pipeOperator[curType](curValue)

        if (isPromise(_value)) {
          _value = await _value
        }

        if (type !== "complete" && _value === OB_FLAG.SKIP) {
          return ctx.observable.value
        }

        if (_value === OB_FLAG.LOOP) {
          return callEffectEmit(ctx, type, value)
        }

        if (type !== "complete") {
          curType = "next"
          curValue = _value
        }
      } catch (err) {
        if (curType === "complete") {
          console.error(
            "[Observable error]: `pipe complete` has Uncaptured exception"
          )
        } else {
          curType = "error"
          curValue = err
        }
      }
    }
  }

  const oldValue = ctx.observable.value
  let hasError = curType === "error"
  if (curType === "next") ctx.observable.value = curValue

  for (let i = 0; i < _subs.length; i++) {
    try {
      const sub = _subs[i]
      if (curType === "next") {
        sub.next && sub.next(curValue, oldValue)
      } else if (curType === "error") {
        if (sub.error) {
          sub.error(curValue)
          hasError = false
        }
      } else {
        sub.complete && sub.complete()
      }
    } catch (err) {
      console.error(
        "[Observable error]: subscribe has unhandled exception",
        err
      )
    }
  }

  if (hasError) {
    console.error(
      "[Observable error]: subscribe has unhandled exception",
      curValue
    )
    return Promise.resolve()
  }

  return Promise.resolve(ctx.observable.value)
}
