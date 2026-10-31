#!/usr/bin/env node

// Guard against Node 24 EBADF double-close on GC (finos/morphir-elm#1282)
import "./ebadf-guard.js";

import path from "path";
import fs from "fs/promises";
import { fileURLToPath } from "url";
import { Command } from "commander";
import express from "express";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const program = new Command();
program
  .name("morphir visualize")
  .description("Start up a web server with a business-user oriented view of the logic in a Morphir project")
  .option("-p, --port <port>", "Port to bind the web server to.", "3000")
  .option("-o, --host <host>", "Host to bind the web server to.", "localhost")
  .option("-i, --project-dir <path>", "Root directory of the project where morphir-ir.json is located.", ".")
  .parse(process.argv);

const { port, host, projectDir } = program.opts<{ port: string; host: string; projectDir: string }>();
const webDir = path.join(__dirname, "../../morphir-visualize/dist");

const app = express();
app.use(express.static(webDir));
app.use(express.json({ limit: "100mb" }));

const sendProjectJson = (fileName: string, defaultContent?: string): express.RequestHandler =>
  async (_req, res, next) => {
    try {
      const content = await fs.readFile(path.join(projectDir, fileName), "utf8");
      res.type("application/json").send(content);
    } catch (err) {
      if (defaultContent !== undefined && (err as NodeJS.ErrnoException).code === "ENOENT") {
        res.type("application/json").send(defaultContent);
      } else if ((err as NodeJS.ErrnoException).code === "ENOENT") {
        res.status(404).send(`${fileName} not found in ${path.resolve(projectDir)}. Run "morphir-elm make" first.`);
      } else {
        next(err);
      }
    }
  };

app.get("/server/morphir-ir.json", sendProjectJson("morphir-ir.json"));
app.get("/server/morphir-tests.json", sendProjectJson("morphir-tests.json", "[]"));

app.post("/server/morphir-tests.json", async (req, res, next) => {
  try {
    if (!Array.isArray(req.body)) {
      res.status(400).send("Expected a JSON array of test suites.");
      return;
    }
    await fs.writeFile(path.join(projectDir, "morphir-tests.json"), JSON.stringify(req.body, null, 4));
    res.json(req.body);
  } catch (err) {
    next(err);
  }
});

app.listen(Number(port), host, () => {
  console.log(`Visualization server listening at http://${host}:${port}`);
});
