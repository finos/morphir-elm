#!/usr/bin/env node
"use strict";

// Guard against Node 24 EBADF double-close on GC (finos/morphir-elm#1282)
require('./ebadf-guard');

// NPM imports
const path = require("path");
const util = require("util");
const fs = require("fs");
const readFile = util.promisify(fs.readFile);
const fsExists = util.promisify(fs.exists);
const writeFile = util.promisify(fs.writeFile);
const commander = require("commander");
const fastify = require("fastify");
const fastifyStatic = require("@fastify/static");

// Set up Commander
const program = new commander.Command();
program
  .name("morphir-elm develop")
  .description(
    "Start up a web server and expose developer tools through a web UI"
  )
  .option("-p, --port <port>", "Port to bind the web server to.", "3000")
  .option("-o, --host <host>", "Host to bind the web server to.", "localhost")
  .option(
    "-i, --project-dir <path>",
    "Root directory of the project where morphir.json is located.",
    "."
  )
  .parse(process.argv);

const app = fastify({ bodyLimit: 100 * 1024 * 1024 });
const port = Number(program.opts().port);


const webDir = path.join(__dirname, "web");



app.register(fastifyStatic, { root: webDir, index: false });

app.get("/", async (request, reply) => {
  reply.type("text/html");
  return await indexHtmlWithVersion();
});

createSimpleGetJsonApi(app, "morphir.json");
createSimpleGetJsonApi(app, "morphir-ir.json");
createSimpleGetJsonApi(app, "morphir-tests.json", "[]");

app.get(
  "/server/decorations",
  async (request, reply) => {
    const configJsonContent = await getDecorationConfig();

    const decorationIDs = Object.keys(configJsonContent);
    const responseJson = {};

    for (const decorationID of decorationIDs) {
      const decorationFilePath = await getDecorationFilePath(decorationID)
      const irFilePath = path.join(
        program.opts().projectDir,
        configJsonContent[decorationID].ir
      );

      if (!(await fsExists(decorationFilePath))) {
        await writeFile(decorationFilePath, "{}");
      }
      const attrFileContent = await readFile(decorationFilePath);
      const irFileContent = await readFile(irFilePath);
      responseJson[decorationID] = {
        data: JSON.parse(attrFileContent.toString()),
        displayName: configJsonContent[decorationID].displayName,
        entryPoint: configJsonContent[decorationID].entryPoint,
        iR: JSON.parse(irFileContent.toString()),
      };
    }
    return responseJson;
  }
);

app.post(
  "/server/update-decoration/:decorationID",
  async (request, reply) => {
    const decorationID = request.params.decorationID
    await writeFile(await getDecorationFilePath(decorationID), JSON.stringify(request.body, null, 4))
    return request.body;
  }
);

app.post(
  "/server/morphir-tests.json",
  async (request, reply) => {
    const morphirTestsJsonPath = path.join(
      program.opts().projectDir,
      "morphir-tests.json"
    );
    const jsonContent = JSON.stringify(request.body, null, 4);
    await writeFile(morphirTestsJsonPath, jsonContent);
    const morphirTestsJsonContent = await readFile(morphirTestsJsonPath);
    const morphirTestsJson = JSON.parse(morphirTestsJsonContent.toString());
    return morphirTestsJson;
  }
);

app.post(
  "/server/morphir-ir.json",
  async (request, reply) => {
    const morphirIRJsonPath = path.join(
      program.opts().projectDir,
      "morphir-ir.json"
    );
    const jsonContent = JSON.stringify(request.body, null, 4);
    await writeFile(morphirIRJsonPath, jsonContent);
    const morphirIRJsonContent = await readFile(morphirIRJsonPath);
    const morphirIRJson = JSON.parse(morphirIRJsonContent.toString());
    return morphirIRJson;
  }
);

app.setNotFoundHandler(async (request, reply) => {
  if (request.method === "GET") {
    reply.type("text/html");
    return await indexHtmlWithVersion();
  }

  reply.code(404);
  return { error: "Not Found" };
});

app.listen({ port, host: program.opts().host }, (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }

  console.log(
    `Developer server listening at http://${program.opts().host}:${port}`
  );
});

// --- Utility Functions ---

function createSimpleGetJsonApi(app, filePath, defaultContent) {
  app.get(
    "/server/" + filePath,
    async (request, reply) => {
      const jsonPath = path.join(program.opts().projectDir, filePath);
      try {
        const jsonContent = await readFile(jsonPath);
        return JSON.parse(jsonContent.toString());
      } catch (err) {
        if (defaultContent && err.code === 'ENOENT') {
          return JSON.parse(defaultContent)
        } else {
          throw err
        }
      }
    }
  )
}


async function getMorphirConfig() {
  const filePath = path.join(program.opts().projectDir, "morphir.json")
  const fileContent = await readFile(filePath)
  return JSON.parse(fileContent.toString())
}

async function getDecorationConfig() {
  const morphirConfig = await getMorphirConfig()
  if (morphirConfig.decorations) {
    return morphirConfig.decorations
  } else {
    return []
  }
}

async function getDecorationFilePath(decorationID) {
  const decorationConfig = (await getDecorationConfig())[decorationID]
  let storageLocation = null
  if (decorationConfig.storageLocation) {
    storageLocation = decorationConfig.storageLocation
  } else {
    storageLocation = `${decorationID}.json`
  }
  return path.join(program.opts().projectDir, storageLocation)
}

async function indexHtmlWithVersion() {
  const packageJson = require(path.join(__dirname, '../package.json'))
  const _indexHtml = await readFile(path.join(webDir, "index.html"), 'utf8');
  return _indexHtml.replace('__VERSION_NUMBER__', packageJson.version.toString());

}
