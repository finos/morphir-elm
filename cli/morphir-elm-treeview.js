#!/usr/bin/env node
"use strict";

// NPM imports
const path = require("path");
const util = require("util");
const fs = require("fs");
const readFile = util.promisify(fs.readFile);
const commander = require("commander");
const fastify = require("fastify");
const fastifyStatic = require("@fastify/static");

// Set up Commander
const program = new commander.Command();
program
  .name("morphir-elm treeview")
  .description("Start up a web server and expose treeview through a web UI")
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

const webDir = path.join(__dirname, "treeview", "dist");

app.register(fastifyStatic, { root: webDir, index: false });

app.get("/", async (request, reply) => {
  reply.type("text/html");
  return await indexHtmlWithVersion();
});

createSimpleGetJsonApi(app, "morphir.json");
createSimpleGetJsonApi(app, "morphir-ir.json");

app.get("/assets/2020_Morphir_Logo_Icon_WHT.svg", async (request, reply) => {
  const projectFileName = path.join(
    program.opts().projectDir,
    "treeview/assets/2020_Morphir_Logo_Icon_WHT.svg"
  );
  const packagedFileName = path.join(
    __dirname,
    "treeview/assets/2020_Morphir_Logo_Icon_WHT.svg"
  );
  const fileContent = await readFileWithFallback(
    projectFileName,
    packagedFileName
  );
  reply.type("image/svg+xml");
  return fileContent;
});

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
        if (defaultContent && err.code === "ENOENT") {
          return JSON.parse(defaultContent);
        } else {
          throw err;
        }
      }
    }
  );
}

async function readFileWithFallback(filePath, fallbackFilePath) {
  try {
    return await readFile(filePath, "utf8");
  } catch (err) {
    if (err.code === "ENOENT") {
      return await readFile(fallbackFilePath, "utf8");
    }

    throw err;
  }
}

async function indexHtmlWithVersion() {
  const packageJson = require(path.join(__dirname, "../package.json"));
  const _indexHtml = await readFile(path.join(webDir, "index.html"), "utf8");
  return _indexHtml.replace(
    "__VERSION_NUMBER__",
    packageJson.version.toString()
  );
}
