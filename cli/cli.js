'use strict'

// NPM imports
const path = require('path')
const util = require('util')
const fs = require('fs')
const prettier = require("prettier");
const readdir = util.promisify(fs.readdir)
const mkdir = util.promisify(fs.mkdir)
const readFile = util.promisify(fs.readFile)
const fsWriteFile = util.promisify(fs.writeFile)
const execa = require('execa')

// Elm imports
const worker = require('./Morphir.Elm.CLI').Elm.Morphir.Elm.CLI.init()


async function make(projectDir, options) {
    const morphirJsonPath = path.join(projectDir, 'morphir.json')
    const morphirJsonContent = await readFile(morphirJsonPath)
    const morphirJson = JSON.parse(morphirJsonContent.toString())
    const sourceFiles = await readElmSources(path.join(projectDir, morphirJson.sourceDirectory))
    return packageDefinitionFromSource(morphirJson, sourceFiles, options)
}

async function packageDefinitionFromSource(morphirJson, sourceFiles, options) {
    return new Promise((resolve, reject) => {
        worker.ports.jsonDecodeError.subscribe(err => {
            reject(err)
        })

        worker.ports.packageDefinitionFromSourceResult.subscribe(([err, ok]) => {
            if (err) {
                reject(err)
            } else {
                resolve(ok)
            }
        })

        const opts = {
            typesOnly: options.typesOnly
        }

        worker.ports.packageDefinitionFromSource.send([opts, morphirJson, sourceFiles])
    })
}

async function readElmSources(dir) {
    const readElmSource = async function (filePath) {
        const content = await readFile(filePath)
        return {
            path: filePath,
            content: content.toString()
        }
    }
    const readDir = async function (currentDir) {
        const entries = await readdir(currentDir, {
            withFileTypes: true
        })
        const elmSources =
            entries
                .filter(entry => entry.isFile() && entry.name.endsWith('.elm'))
                .map(entry => readElmSource(path.join(currentDir, entry.name)))
        const subDirSources =
            entries
                .filter(entry => entry.isDirectory())
                .map(entry => readDir(path.join(currentDir, entry.name)))
                .reduce(async (soFarPromise, nextPromise) => {
                    const soFar = await soFarPromise
                    const next = await nextPromise
                    return soFar.concat(next)
                }, Promise.resolve([]))
        return elmSources.concat(await subDirSources)
    }

    return Promise.all(await readDir(dir))
}

async function gen(input, outputPath, options) {
    const opts = options
    opts.limitToModules = options.modulesToInclude ? options.modulesToInclude.split(",") : null
    opts.filename = options.filename == '' ? '' : options.filename
    const commonOptions = [
        `--input=${input}`,
        `--output=${outputPath}`,
        `--limitToModules=${opts.limitToModules}`
    ]

    // invoking new cli using options 
    switch (opts.target) {
        case "Scala":
            console.log("This Command is Deprecated. Switch to `morphir scala-gen` \n Running `morphir scala-gen` command ..............");
            await execa('morphir scala-gen', [
                `--copy-deps=${opts.copyDeps}`,
                `include-codecs=${opts.includeCodecs}`,
                ...commonOptions
            ]).stdout.pipe(process.stdout);
            break;
        
        case "TypeScript": 
            console.log("This Command is Deprecated. Switch to `morphir typescript-gen` \n Running `morphir typescript-gen` command ..............");
            await execa('morphir typescript-gen', [
                `--copy-deps=${opts.copyDeps}`,
                ...commonOptions
            ]).stdout.pipe(process.stdout);
            break;
        
        case "JsonSchema": 
            console.log("This Command is Deprecated. Switch to `morphir json-schema-gen` \n Running `morphir json-schema-gen` command ..............");
            await execa(`morphir json-schema-gen`, commonOptions)
                .stdout.pipe(process.stdout);
            break;
        
        case "TypeSpec": 
            console.log("This Command is Deprecated. Switch to `morphir typespec-gen` \n Running `morphir typespec-gen` command ..............");
            await execa('morphir typespec-gen', [
                `--copy-deps=${opts.copyDeps}`,
                ...commonOptions
            ]).stdout.pipe(process.stdout);
            break;
    
        default:
            break;
    }
}

async function writeFile(filePath, content) {
    await mkdir(path.dirname(filePath), {
        recursive: true
    })
    return await fsWriteFile(filePath, content)
}
async function test(projectDir) {
    const morphirIRJsonPath = path.join(projectDir, 'morphir-ir.json')
    const morphirIRJsonContent = await readFile(morphirIRJsonPath)
    const morphirIRJson = JSON.parse(morphirIRJsonContent.toString())
    const morphirTestsJsonPath = path.join(projectDir, 'morphir-tests.json')
    const morphirTestsJsonContent = await readFile(morphirTestsJsonPath)
    const morphirTestsJson = JSON.parse(morphirTestsJsonContent.toString())
    return testResult(morphirIRJson, morphirTestsJson)
}
async function testResult(morphirIRJson, morphirTestsJson) {
    return new Promise((resolve, reject) => {
        worker.ports.jsonDecodeError.subscribe(err => {
            reject(err)
        })
        worker.ports.runTestCasesResultError.subscribe(err => {
            reject(err)
        })
        worker.ports.runTestCasesResult.subscribe(ok => {
            resolve(ok)
        })
        worker.ports.runTestCases.send([morphirIRJson, morphirTestsJson])
    });
}
exports.make = make;
exports.gen = gen;
exports.test = test;
exports.writeFile = writeFile;