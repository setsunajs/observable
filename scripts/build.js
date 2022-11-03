import chalk from "chalk"
import { build as _build } from "esbuild"
import { rm, readdir } from "node:fs/promises"
import { execa } from "execa"
import { Extractor, ExtractorConfig } from "@microsoft/api-extractor"
import { print, success, resolve } from "./helper.js"
import { readdirSync, readFileSync, writeFileSync } from "node:fs"

async function build() {
  print("pre build...")
  await clean()
  success("pre build success")

  print("start code build...")
  const files = readdirSync(resolve("./src")).filter(
    f => !["__test__", "helper.ts"].includes(f)
  )
  const formats = ["cjs", "esm", "iife"]
  await Promise.all(
    files
      .map(file => {
        return formats.map(format => _build(createConfig(file, format)))
      })
      .flat()
  )
  success("code build success")

  print("start type build...")
  await buildType(files)
  success("type build success")
}

function clean() {
  return rm(resolve("./dist"), {
    recursive: true,
    force: true
  })
}

const fileReg = /(.*?)(?:\.ts)?$/
const ext = { esm: ".js", cjs: ".cjs", iife: ".global.js" }
function createConfig(file, format) {
  return {
    outfile: `./dist/${format}/${file.match(fileReg)[1]}${ext[format]}`,
    entryPoints: [resolve(`./src/${file}`)],
    bundle: true,
    platform: "browser",
    allowOverwrite: true,
    charset: "utf8",
    incremental: false,
    format,
    minify: false,
    target: "es2017",
    treeShaking: true
  }
}

async function buildType(files) {
  await execa("tsc", ["-p", "./tsconfig.prod.json"], {
    stdio: "inherit"
  })

  const apiExtPath = resolve("./api-extractor.json")
  const mergeConfig = JSON.parse(readFileSync(apiExtPath))
  const temp = resolve("./dist/temp")

  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    Object.assign(mergeConfig, {
      mainEntryPointFilePath: `./dist/temp/${
        file.endsWith(".ts") ? file.slice(0, -3) : `${file}/index`
      }.d.ts`,
      dtsRollup: {
        enabled: true,
        untrimmedFilePath: `./dist/dts/${file.match(fileReg)[1]}.d.ts`
      }
    })
    writeFileSync(apiExtPath, JSON.stringify(mergeConfig, null, 2), "utf-8")
    const extractorConfig = ExtractorConfig.loadFileAndPrepare(
      resolve(apiExtPath)
    )
    const extractorResult = Extractor.invoke(extractorConfig, {
      localBuild: true,
      showVerboseMessages: true
    })
    if (!extractorResult.succeeded) {
      throw "merge .d.ts failed"
    }
  }

  await rm(temp, { force: true, recursive: true })
}

build()
  .catch(err => {
    console.log()
    console.log()
    console.clear()
    console.log(chalk.red(`build failed: \n\n`), err)
    console.log()
  })
  .finally(() => process.exit(0))
