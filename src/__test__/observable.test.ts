import "@testing-library/jest-dom"
import { Observable } from "src/observable"

describe("observable.ts", () => {
  it("base use", async () => {
    return new Promise((resolve, reject) => {
      const ob = new Observable<number>()
      ob.subscribe(v => {
        expect(v).toBe(1)
      })

      ob.next(1)
      resolve("")
    })
  })
})
