#!/usr/bin/env node
"use strict";

// NPM imports
import * as util from "util";
import * as fs from "fs";

const readFile = util.promisify(fs.readFile);
const fileExists = util.promisify(fs.exists);
const fileStats = util.promisify(fs.stat)
const writeFile = util.promisify(fs.writeFile);

interface FileInfo {
    fileName: string,
    size: number,
    content: string
}

interface ReadFileErr {
    errCode: string | number, 
    errMessage: string
}


export {
    readFile,
    fileExists,
    writeFile
}