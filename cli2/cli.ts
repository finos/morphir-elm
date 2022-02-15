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

let map = new Map<string,string>();

const writeFile = util.promisify(fs.writeFile)
const readDir = util.promisify(fs.readdir)
const makeDir = util.promisify(fs.mkdir)
const readFile = util.promisify(fs.readFile)


const worker = require('./Morphir-Elm.CLI').Elm.Morphir.Elm.CLI.init()

async function make(projectDir: string, options: string) {
    //path to mophir.json file
    const morphirJsonPath :string = path.join(projectDir, 'morphir.json')
    //read content of the file)morphir.json)
    const morphirJsonContent  = await readFile(morphirJsonPath)
    const parsedMorphirJson = JSON.parse(morphirJsonContent.toString())
    //path to morphir-ir.json
    const morphirIrPath :string = path.join(projectDir, 'morphir-ir.json')
    // All the files in the src directory are read
    const sourcedFiles = await readElmSourceFiles(path.join(projectDir, parsedMorphirJson.sourceDirectory))

    //To check if the morphir-ir.json already exists
    fs.access(morphirIrPath, fs.constants.F_OK, (err)=>{
        // if it doesn't we get an error letting us know there isn't any ir yet,
        // so all the files are parsed to the worker
        if(err){
            return packageDefinitionFromSource(parsedMorphirJson, sourcedFiles, options)
        }else{
            //here, the morphir-ir along with the files that changed will be passed to the worker
            console.log(`${morphirIrPath} will be passed to the worker along side changed to update the ir`)
        }
        // return packageDefinitionFromSource(parsedMorphirJson, sourcedFiles, morphirIrPath, options)
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
    const readSourceFile = async function (filePath:string) {
        const hashFilePath :string = path.join(dir, 'morphir-hash.json')
        const readContent = await readFile(filePath)

        //check if the morphir-hash.json file already exists
        fs.access(hashFilePath,fs.constants.F_OK, async (err)=>{
            if(err){
                //once it doesn't any filepath passed here will have its content hashed
                // and the hash and the file path, written to the new morphir-hash.json file created
                console.log(err)
                const hash = createHashFile(readContent)
                map.set(filePath, hash)
                let jsonObject = JSON.stringify(Array.from(map.entries()));

                fs.appendFile(hashFilePath, jsonObject , (err)=>{
                    if(err)  throw err;
                    console.log(`Finished writing hashes to ${hashFilePath}`)
                })
            }

            //once that file exists the content is read, a new hash isalso created for the filePath
            const readHashFile = await readFile(hashFilePath)
            const parsedHashFile = JSON.parse(readHashFile.toString())
            const hash = createHashFile(readContent)
            map.set(filePath, hash)
            //if a file's new hash does not match the old match, it means the file has changes
            //thus, that file is returned to the worker to update the corresponding IR
            if(parsedHashFile.filePath !== map.get(filePath)){
                parsedHashFile.filePath = map.get(filePath)
                const newReadContent = await readFile(filePath)
                return{
                    path: filePath ,
                    content: newReadContent.toString()
                }
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
                .map(entry => {
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
exports.make = make;