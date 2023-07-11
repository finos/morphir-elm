#!/usr/bin/env node
"use strict";

// NPM imports
import * as path from "path";
import * as commander from "commander";
import express, { Request, Response, Express } from "express";
import { readFile, writeFile } from "./FileHandler";

// Set up Commander
const program = new commander.Command();
program
    .name("morphir-elm develop")
    .description("Start up a web server and expose developer tools through a web UI")
    .option("-p, --port <port>", "Port to bind the web server to.", "3000")
    .option("-o, --host <host>", "Host to bind the web server to.", "0.0.0.0")
    .option("-i, --project-dir <path>","Root directory of the project where morphir.json is located.",".")
    .parse(process.argv)

const app = express()
const port = program.opts().port
const webDir = path.join(__dirname, "../web")
const projectDir = program.opts().projectDir
const morphirJsonFilePath = path.join(program.opts().projectDir, "morphir.json")

app.use(express.static(webDir, { index: false }));
app.use(express.json());

createSimpleGetJsonApi(app, "morphir.json", "");
createSimpleGetJsonApi(app, "morphir-ir.json", "");
createSimpleGetJsonApi(app, "morphir-tests.json", "[]");

// App routes
app.get(
    "/",
    wrap(async (req: Request, res: Response, next: any) => {
        res.setHeader("Content-type", "text/html");
        res.send(await indexHtmlWithVersion());
    })
);

app.get(
    "/server/decorations",
    wrap(async (req: Request, res: Response, next: String) => {
        const responseJson = await getDecorations();
        res.send(responseJson);
    })
);

app.get(
    "*",
    wrap(async (req: Request, res: Response, next: any) => {
        res.setHeader("Content-type", "text/html");
        res.send(await indexHtmlWithVersion());
    })
);

app.post(
    "/server/morphir-tests.json",
    wrap(async (req: Request, res: Response, next: any) => {
        const morphirTestsJson = await getMorphirTests(req)
        res.send(morphirTestsJson);
    })
);

app.listen(port, program.opts().host, () => {
    console.log(
        `Developer server listening at http://${program.opts().host}:${port}`
    );
});

app.post(
    "/server/update-decoration/:decorationID",
    wrap(async (req: Request, res: Response, next: any) => {
        const decorationID = req.params.decorationID
        const decorationIDFilePath = await getDecorationFilePath(decorationID)
        if (decorationIDFilePath == null || decorationIDFilePath == undefined) {
            res.send("Error Locating Decoration File Path")
        }
        else {
            await writeFile(decorationIDFilePath, JSON.stringify(req.body, null, 4))
            res.send(req.body)
        }
    })
);

// data structure
type DecorationID = string;

interface DecorationConfigDetails {
    displayName: string,
    entryPoint: string,
    ir: string,
    storageLocation: string
}

type DecorationConfigs = Map<DecorationID,DecorationConfigDetails>

interface MorphirConfigFile {
    name: string,
    sourceDirectory: string,
    decorations: DecorationConfigs
}

// --- Utility Functions ---
function createSimpleGetJsonApi(
    app: Express,
    filePath: string,
    defaultContent: string
) {
    app.get(
        "/server/" + filePath,
        wrap(async (req: Request, res: Response, next: any) => {
            const jsonPath = path.join(program.opts().projectDir, filePath)
            const jsonContent = await readFile(jsonPath)
            res.send(JSON.parse(jsonContent.toString()))
        })
    );
}

async function getDecorations() {
    let responseObject = new Map()
    const decorationCfgs = await allDecorationsConfig()
    Object.entries(decorationCfgs).forEach(
        async ([decorationID, decorationCfg]) => {
            const iRFile = await readFile(path.join(projectDir, decorationCfg.ir));
            const attributeFileContent = await readFile(decorationCfg.storageLocation);
            if(attributeFileContent.toString() == "")
                await writeFile(decorationCfg.storageLocation, "{}")

            responseObject.set(decorationID, {
                data: JSON.parse(attributeFileContent.toString()),
                displayName: decorationCfg.displayName,
                entryPoint: decorationCfg.entryPoint,
                iR: JSON.parse(iRFile.toString()),
            })
    })

    return responseObject
}

async function allDecorationsConfig(): Promise<DecorationConfigs> {
    const readFileResponse = await readFile(morphirJsonFilePath)
    const morphirConfig = JSON.parse(readFileResponse.toString()) as MorphirConfigFile
    return morphirConfig.decorations 
}

async function getDecorationFilePath(decorationId: DecorationID): Promise<string> {
    const decorationConfig = await allDecorationsConfig()  
    const decorationDetail = decorationConfig.get(decorationId)
    return (typeof decorationDetail === 'undefined') ? "" : path.join(projectDir, decorationDetail.storageLocation)
}

async function getMorphirTests(req: Request) {
    const morphirTestsJsonPath = path.join(projectDir,"morphir-tests.json")
    var jsonContent = JSON.stringify(req.body, null, 4)
    await writeFile(morphirTestsJsonPath, jsonContent)
    const morphirTestsJsonContent = await readFile(morphirTestsJsonPath)
    return JSON.parse(morphirTestsJsonContent.toString())
}

async function indexHtmlWithVersion() {
    const packageJson = require(path.join(__dirname, "../../package.json"))
    const _indexHtml = await readFile(path.join(webDir, "index.html"))
    return _indexHtml.toString().replace("__VERSION_NUMBER__",  packageJson.version.toString())
}

function wrap(fn: any) {
    return (...args: any[]) => fn(...args).catch(args[2])
}
