#!/usr/bin/env node
"use strict";
/**
 *TO-DO
 *Deleted files into the filchanges
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const fs = __importStar(require("fs"));
const util = __importStar(require("util"));
const path = __importStar(require("path"));
const crypto = __importStar(require("crypto"));
const fsWriteFile = util.promisify(fs.writeFile);
const readDir = util.promisify(fs.readdir);
const makeDir = util.promisify(fs.mkdir);
const readFile = util.promisify(fs.readFile);
const accessFile = util.promisify(fs.access);
const worker = require('./Morphir.Elm.CLI').Elm.Morphir.Elm.Cli.init();
function make(projectDir, options) {
    return __awaiter(this, void 0, void 0, function* () {
        const morphirJsonPath = path.join(projectDir, 'morphir.json');
        const morphirJsonContent = yield readFile(morphirJsonPath);
        const parsedMorphirJson = JSON.parse(morphirJsonContent.toString());
        // All the files in the src directory are read
        const sourcedFiles = yield readElmSourceFiles(path.join(projectDir, parsedMorphirJson.sourceDirectory));
        //To check if the morphir-ir.json already exists
        const morphirIrPath = path.join(projectDir, 'morphir-ir.json');
        try {
            yield accessFile(morphirIrPath, fs.constants.F_OK);
            console.log(`${morphirIrPath}, will be passed to the worker along side changed to update the ir`);
        }
        catch (err) {
            console.log(`${err}, not found`);
            return packageDefinitionFromSource(parsedMorphirJson, sourcedFiles, options);
        }
    });
}
//generating a hash with md5 algorithm for the content of the read file
const hashedContent = (contentOfFile) => {
    let hash = crypto.createHash('md5');
    let data = hash.update(contentOfFile, 'utf-8');
    let gen_hash = data.digest('hex');
    return gen_hash;
};
function packageDefinitionFromSource(parsedMorphirJson, sourcedFiles, options) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => {
            worker.ports.jsonDecodeError.subscribe((err) => {
                reject(err);
            });
            worker.ports.packageDefinitionFromSourceResult.subscribe(([err, ok]) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(ok);
                }
            });
            const opts = {
                typesOnly: options.typesOnly
            };
            worker.ports.packageDefinitionFromSource.send([opts, parsedMorphirJson, sourcedFiles]);
        });
    });
}
function differenceInPathAndHash(hashFilePath, filePath, fileHash, fileChangesMap, readHashFile) {
    return __awaiter(this, void 0, void 0, function* () {
        let hashJson = JSON.parse(readHashFile.toString());
        for (let key in hashJson) {
            fileHash.set(key, hashJson[key]);
        }
        const readContent = yield readFile(filePath);
        const hash = hashedContent(readContent);
        if (fileHash.has(filePath)) {
            if (fileHash.get(filePath)) {
                if (fileHash.get(filePath) !== hash) {
                    fileHash.set(filePath, hash);
                    fileChangesMap.set(filePath, ['Updated', readContent.toString()]);
                }
            }
        }
        else {
            fileHash.set(filePath, hash);
            fileChangesMap.set(filePath, ['Insert', readContent.toString()]);
        }
        let fileChangeObject = Object.fromEntries(fileChangesMap);
        let jsonObject = Object.fromEntries(fileHash);
        yield fsWriteFile(hashFilePath, JSON.stringify(jsonObject, null, 2));
        return fileChangeObject;
    });
}
function readElmSourceFiles(dir) {
    return __awaiter(this, void 0, void 0, function* () {
        let fileHash = new Map();
        let fileChangesMap = new Map();
        const hashFilePath = path.join(dir, '../morphir-hash.json');
        const readHashFile = yield readFile(hashFilePath);
        const readSourceFile = function (filePath) {
            return __awaiter(this, void 0, void 0, function* () {
                try {
                    yield accessFile(hashFilePath, fs.constants.F_OK);
                    yield differenceInPathAndHash(hashFilePath, filePath, fileHash, fileChangesMap, readHashFile);
                }
                catch (err) {
                    const readContent = yield readFile(filePath);
                    const hash = hashedContent(readContent);
                    fileHash.set(filePath, hash);
                    let jsonObject = Object.fromEntries(fileHash);
                    yield fsWriteFile(hashFilePath, JSON.stringify(jsonObject, null, 2));
                    return {
                        path: filePath,
                        content: readContent.toString()
                    };
                }
            });
        };
        const readDirectory = function (currentDir) {
            return __awaiter(this, void 0, void 0, function* () {
                const entries = yield readDir(currentDir, {
                    withFileTypes: true
                });
                const elmSources = entries
                    .filter(entry => entry.isFile() && entry.name.endsWith('.elm'))
                    .map((entry) => __awaiter(this, void 0, void 0, function* () {
                    readSourceFile(path.join(currentDir, entry.name));
                }));
                const subDirectories = entries
                    .filter(entry => entry.isDirectory())
                    .map(entry => readDirectory(path.join(currentDir, entry.name)))
                    .reduce((currentResult, nextResult) => __awaiter(this, void 0, void 0, function* () {
                    const current = yield currentResult;
                    const next = yield nextResult;
                    return current.concat(next);
                }), Promise.resolve([]));
                return elmSources.concat(yield subDirectories);
            });
        };
        return Promise.all(yield readDirectory(dir));
    });
}
function writeFile(filePath, content) {
    return __awaiter(this, void 0, void 0, function* () {
        yield makeDir(path.dirname(filePath), {
            recursive: true
        });
        return yield fsWriteFile(filePath, content);
    });
}
module.exports = { make, writeFile };
