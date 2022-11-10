import "@testing-library/jest-dom"
import { createObservable, OB_FLAG } from "src/observable"

describe("createObservable", () => {
  it("only-next pipe & subscribe", async () => {
    return new Promise((resolve, reject) => {
      const ary: number[] = []

      const o1 = createObservable().pipe(v => 1)
      expect(o1.value).toBeUndefined()
      o1.subscribe((v, o) => {
        ary.push(1)
        expect(v).toBe(1)
        expect(o).toBeUndefined()
      })
      o1.next(1)

      const o2 = createObservable(false).pipe(
        v => 1,
        v => true
      )
      expect(o2.value).toBe(false)
      o2.subscribe((v, o) => {
        ary.push(1)
        expect(v).toBe(true)
        expect(o).toBe(false)
      })
      o2.next(false)

      setTimeout(() => {
        expect(ary.length).toBe(2)
        resolve("")
      }, 0)
    })
  })

  it("option-next pipe & subscribe", () => {
    return new Promise<void>((resolve, reject) => {
      const ary: number[] = []

      const o1 = createObservable().pipe({ next: v => 1 })
      o1.subscribe({
        next: (v, o) => {
          ary.push(1)
          expect(v).toBe(1)
          expect(o).toBeUndefined()
        }
      })
      o1.next(1)

      const o2 = createObservable(false).pipe(
        { next: v => 1 },
        { next: v => true }
      )
      o2.subscribe({
        next: (v, o) => {
          ary.push(1)
          expect(v).toBe(true)
          expect(o).toBe(false)
        }
      })
      o2.next(false)

      setTimeout(() => {
        expect(ary.length).toBe(2)
        resolve()
      }, 0)
    })
  })

  it("emit next/error value", () => {
    return new Promise<void>(resolve => {
      const ob = createObservable(1).pipe(v => v + 1, {
        next: v => v + 1
      })
      ob.subscribe(v => {
        expect(v).toBe(12)
      })
      ob.subscribe({
        next: v => expect(v).toBe(12),
        error: e => expect(e).toBe(10)
      })

      expect(ob.value).toBe(1)

      ob.next(10)
      ob.error(10)

      expect(ob.value).toBe(12)

      setTimeout(() => resolve())
    })
  })

  it("emit next/error/complete resolve Promise", () => {
    vi.spyOn(console, "error").mockImplementation(() => null)
    const ob = createObservable(1).pipe(v => ++v)
    expect(ob.next(10)).resolves.toBe(11)
    expect(ob.error(10)).resolves.toBeUndefined()
    expect(ob.complete()).resolves.toBe(11)
  })

  it("complete", async () => {
    const errorLog = vi.spyOn(console, "error").mockImplementation(() => null)
    const ob = createObservable(1).pipe(v => v + 1)
    ob.subscribe(v => expect(v).toBe(11))

    await ob.next(10)
    await ob.complete()
    await ob.next(20)
    await ob.error()
    await ob.complete()

    expect(ob.value).toBe(11)
    expect(errorLog).toHaveBeenCalledTimes(3)
  })

  it("unsubscribe", async () => {
    const fn = vi.fn()
    const ob = createObservable().pipe(v => 10)
    const unsubscribe = ob.subscribe(fn)

    await ob.next(1)
    expect(fn).toHaveBeenCalledTimes(1)

    unsubscribe()
    await ob.next(1)
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it("pipe penetration", async () => {
    const sub = vi.fn(v => expect(v).toBe(11))
    const ob = createObservable().pipe({
      error: e => e + 1
    })
    ob.subscribe(sub)

    await ob.error(10)
    expect(ob.value).toBe(11)
    expect(sub).toBeCalledTimes(1)
  })

  it("pipe skip", async () => {
    const sub = vi.fn()
    const ob = createObservable().pipe(() => OB_FLAG.SKIP)
    ob.subscribe({
      next: sub,
      error: sub,
      complete: sub
    })

    await ob.next(1)
    await ob.error()
    await ob.complete()
    expect(sub).toHaveBeenCalledTimes(2)

    const sub2 = vi.fn()
    const ob2 = createObservable().pipe({
      next: () => OB_FLAG.SKIP,
      error: () => OB_FLAG.SKIP,
      complete: () => OB_FLAG.SKIP
    })
    ob2.subscribe({
      next: sub2,
      error: sub2,
      complete: sub2
    })

    await ob2.next(1)
    await ob2.error()
    await ob2.complete()
    expect(sub2).toHaveBeenCalledTimes(1)
  })

  it("pipe loop", async () => {
    const fn = vi.fn()

    let retry = 0
    const ob = createObservable().pipe(() => {
      if (retry < 3) {
        retry++
        return OB_FLAG.LOOP
      }

      return true
    })
    ob.subscribe(fn)
    await ob.next(1)

    expect(retry).toBe(3)
    expect(fn).toHaveBeenCalledTimes(1)
  })
})
