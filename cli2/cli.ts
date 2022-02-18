#!/usr/bin/env node
/**
 * Morphir make command
 * This command firstly, the files in the source directory,  pointed to as it read the morphir.json file.
 * These files are read and hashed, and these has
 */

import * as fs from 'fs';
import * as util from 'util';
import * as path from 'path';
import * as crypto from 'crypto'

const fsWriteFile = util.promisify(fs.writeFile)
const readDir = util.promisify(fs.readdir)
const makeDir = util.promisify(fs.mkdir)
const readFile = util.promisify(fs.readFile)
const accessFile = util.promisify(fs.access)

// const worker = require('./Morphir.Elm.CLI').Elm.Morphir.Elm.Cli.init()
const worker = require('./../Morphir.Elm.CLI').Elm.Morphir.Elm.CLI.init()

async function make(projectDir: string, options: any) {
    const morphirJsonPath :string = path.join(projectDir, 'morphir.json')
    const morphirJsonContent  = await readFile(morphirJsonPath)
    const parsedMorphirJson = JSON.parse(morphirJsonContent.toString())
    
    // All the files in the src directory are read
    const sourcedFiles = await readElmSourceFiles(path.join(projectDir, parsedMorphirJson.sourceDirectory))

    //To check if the morphir-ir.json already exists
    const morphirIrPath :string = path.join(projectDir, 'morphir-ir.json')
    accessFile(morphirIrPath, fs.constants.F_OK)
    .then(fileExists =>{
        //here, the morphir-ir along with the files that changed will be passed to the worker
        console.log(`${morphirIrPath}, will be passed to the worker along side changed to update the ir`)
    })
    .catch(err =>{
        packageDefinitionFromSource(parsedMorphirJson, sourcedFiles, options)
        console.log(`${err}, not found`)
        // throw err
    })
    // return packageDefinitionFromSource(parsedMorphirJson, sourcedFiles, options)
}

//generating a hash with md5 algorithm for the content of the read file
const createHashFile = (contentOfFile: any) =>{
    let hash = crypto.createHash('md5');
    let data = hash.update(contentOfFile, 'utf-8')
    let gen_hash = data.digest('hex')
    return gen_hash;
}

// const updateJson = (obj: any, oldkey: string, newkey: string)=>{
//     obj[newkey] = obj[oldkey]
//     delete obj[oldkey]
// }

async function packageDefinitionFromSource(parsedMorphirJson :any, sourcedFiles :any, options:any, ) {
    return new Promise((resolve, reject) => {
        worker.ports.jsonDecodeError.subscribe((err: any) => {
            reject(err)
        })

        worker.ports.packageDefinitionFromSourceResult.subscribe(([err, ok]: any) => {
            if (err) {
                reject(err)
            } else {
                resolve(ok)
            }
        })

        const opts = {
            typesOnly: options.typesOnly
        }

        worker.ports.packageDefinitionFromSource.send([opts, parsedMorphirJson, sourcedFiles])
    })
}

async function readElmSourceFiles(dir:string) {
    let map = new Map<string,string>();
    const readSourceFile = async function (filePath:string) {
        console.log(filePath, 'this is filepath')
        const hashFilePath :string = path.join(dir, '../morphir-hash.json')
        accessFile(hashFilePath, fs.constants.F_OK)
        .then(async () =>{
            const readHashFile = await readFile(hashFilePath)
            let elorm = JSON.parse(readHashFile.toString())
            const readContent = await readFile(filePath)
            const hash = createHashFile(readContent)
            map.set(filePath, hash)
            if(elorm[filePath]){
                if(elorm[filePath]== map.get(filePath)){
                    console.log('exists and is equal')
                    elorm[filePath] = map.get(filePath)
                    return {
                        path: filePath,
                        content: elorm
                    }
                }else if(elorm[filePath] !== map.get(filePath)){
                    console.log('exists and is not equal')
                    console.log(map.get(filePath))
                    elorm[filePath] = map.get(filePath)
                    return {
                        path: filePath,
                        content: elorm
                    }
                }
            }else if(!elorm[filePath]){
                delete elorm[filePath]
                return {
                    path: filePath,
                    content: elorm
                }
            }
        })
        .catch(async () =>{
            const readContent = await readFile(filePath)
            const hash = createHashFile(readContent)
            map.set(filePath, hash)
            let jsonObject = Object.fromEntries(map)
            await fsWriteFile(hashFilePath,JSON.stringify(jsonObject, null, 3))
            const readHashFile = await readFile(hashFilePath)
            let elorm = JSON.parse(readHashFile.toString())
            return{
                path: filePath,
                content: elorm
            }
        })
    }
        const readDirectory = async function (currentDir:string) {
            const entries = await readDir(currentDir,{
                withFileTypes:true
            })
            const elmSources =
            entries
                .filter(entry => entry.isFile() && entry.name.endsWith('.elm'))
                .map(async entry => {
                    readSourceFile(path.join(currentDir,entry.name))
                })
            const subDirectories: any = 
            entries
                .filter(entry => entry.isDirectory())
                .map(entry => readDirectory(path.join(currentDir,entry.name)))
                .reduce(async (currentResult, nextResult) => {
                    const current = await currentResult
                    const next = await nextResult
                    return current.concat(next)
                }, Promise.resolve([]))
            return elmSources.concat(await subDirectories)
        }
        return Promise.all(await readDirectory(dir))
}

async function writeFile(filePath: string, content: string) {
    await makeDir(path.dirname(filePath), {
        recursive: true
    })
    return await fsWriteFile(filePath, content)
}

export = {make,writeFile}