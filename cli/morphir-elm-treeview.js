#!/usr/bin/env node
"use strict";

// NPM imports
const path = require("path");
const util = require("util");
const fs = require("fs");
const readFile = util.promisify(fs.readFile);
const commander = require("commander");
const express = require("express");
const { file } = require("get-uri/dist/file");

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

const app = express();
const port = program.opts().port;

const webDir = path.join(__dirname, "treeview", "dist");

app.use(express.static(webDir, { index: false }));
app.use(express.json({ limit: "100mb" }));

app.get(
  "/",
  wrap(async (req, res, next) => {
    res.setHeader("Content-type", "text/html");
    res.send(await indexHtmlWithVersion());
  })
);

createSimpleGetJsonApi(app, "morphir.json");
createSimpleGetJsonApi(app, "morphir-ir.json");

app.get('/assets/2020_Morphir_Logo_Icon_WHT.svg', (req, res) => {
  var options = {
          root: path.join(__dirname)
      };
    var fileName = path.join(program.opts().projectDir, 'treeview/assets/2020_Morphir_Logo_Icon_WHT.svg');
    res.sendFile(fileName, options
      , function (err) {
        if (err) {
            console.error(err);
        }
  });
});

app.get(
  "*",
  wrap(async (req, res, next) => {
    res.setHeader("Content-type", "text/html");
    res.send(await indexHtmlWithVersion());
  })
);

app.listen(port, program.opts().host, () => {
  console.log(
    `Developer server listening at http://${program.opts().host}:${port}`
  );
});

// --- Utility Functions ---

function createSimpleGetJsonApi(app, filePath, defaultContent) {
  app.get(
    "/server/" + filePath,
    wrap(async (req, res, next) => {
      const jsonPath = path.join(program.opts().projectDir, filePath);
      try {
        const jsonContent = await readFile(jsonPath);
        res.send(JSON.parse(jsonContent.toString()));
      } catch (err) {
        if (defaultContent && err.code === "ENOENT") {
          // file does not exist, send default content
          res.send(defaultContent);
        } else {
          throw err;
        }
      }
    })
  );
}

async function indexHtmlWithVersion() {
  const packageJson = require(path.join(__dirname, "../package.json"));
  const _indexHtml = await readFile(path.join(webDir, "index.html"), "utf8");
  return _indexHtml.replace(
    "__VERSION_NUMBER__",
    packageJson.version.toString()
  );
}

function wrap(fn) {
  return (...args) => fn(...args).catch(args[2]);
}
