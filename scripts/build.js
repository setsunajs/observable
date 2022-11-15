import chalk from "chalk"
import { build as _build } from "esbuild"
import { rm } from "node:fs/promises"
import { execa } from "execa"
import { Extractor, ExtractorConfig } from "@microsoft/api-extractor"
import { print, success, resolve } from "./helper.js"
import {
  readdirSync,
  readFileSync,
  rename,
  renameSync,
  writeFileSync
} from "node:fs"
import minimist from "minimist"

const { mod = "prod" } = minimist(process.argv.slice(2))

async function build() {
  const files = readdirSync(resolve("./src")).filter(
    f => !["__test__", "helper.ts"].includes(f)
  )

  print("pre build...")
  await Promise.all(
    files.map(file => {
      const fileName = file.match(fileReg)[1]
      return rm(resolve(fileName === "main" ? "./dist" : `./${fileName}`), {
        recursive: true,
        force: true
      })
    })
  )
  success("pre build success")

  print("start code build...")
  const formats = ["cjs", "esm", "iife"]
  await Promise.all(
    files
      .map(file => {
        return formats.map(format => _build(createConfig(file, format, false)))
      })
      .flat()
  )
  if (mod === "prod") {
    await Promise.all(
      files
        .map(file => {
          return formats.map(format => _build(createConfig(file, format, true)))
        })
        .flat()
    )
  }
  success("code build success")

  print("start type build...")
  await buildType(files)
  success("type build success")
}

const fileReg = /(.*?)(?:\.ts)?$/
function createConfig(file, format, prod) {
  const fileName = file.match(fileReg)[1]
  const outfile =
    fileName === "main"
      ? `./dist/main${resolveExt(format, prod)}`
      : `./${fileName}/${fileName}${resolveExt(format, prod)}`

  return {
    entryPoints: [resolve(`./src/${file}`)],
    outfile,
    bundle: true,
    platform: "browser",
    allowOverwrite: true,
    charset: "utf8",
    incremental: false,
    format,
    minify: prod,
    target: "es2018",
    treeShaking: true
  }
}

function resolveExt(format, prod) {
  const ext = { esm: "_.js", cjs: "_.cjs", iife: ".global_.js" }[format]
  return ext.replace("_", prod ? ".prod" : "")
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
    const fileName = file.match(fileReg)[1]
    Object.assign(mergeConfig, {
      mainEntryPointFilePath: `./dist/temp/${
        file.endsWith(".ts") ? fileName : `${file}/index`
      }.d.ts`,
      dtsRollup: {
        enabled: true,
        untrimmedFilePath:
          fileName === "main"
            ? `./dist/main.d.ts`
            : `./${fileName}/${fileName}.d.ts`
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
