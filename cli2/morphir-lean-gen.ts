#!/usr/bin/env node

// Guard against Node 24 EBADF double-close on GC (finos/morphir-elm#1282)
import "./ebadf-guard.js";

// NPM imports
import * as fs from "fs";
import path from 'path';
import { fileURLToPath } from "url";
import { createRequire } from "module";
import { Command } from 'commander'
import * as cli from './cli.js'
import * as util from 'util'

// ESM equivalents for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create require for loading CommonJS modules (Elm output)
const require = createRequire(import.meta.url);

const fsWriteFile = util.promisify(fs.writeFile);
const fsMakeDir = util.promisify(fs.mkdir);
const fsReadFile = util.promisify(fs.readFile);

const worker = require("./../Morphir.Elm.CLI.cjs").Elm.Morphir.Elm.CLI.init();

interface CommandOptions {
  limitToModules?: string;
  includeCodecs?: boolean;
  target?: string;
  tests?: string;
}

function copyRedistributables(outputPath: string) {
  const copyFiles = (src: string, dest: string) => {
    const sourceDirectory: string = path.join(
      path.dirname(__dirname),
      "..",
      "redistributable",
      src
    );
    if (fs.existsSync(sourceDirectory)) {
      fs.cpSync(sourceDirectory, outputPath, { recursive: true, errorOnExist: false });
    } else {
      console.warn(`WARNING: Cannot find directory ${sourceDirectory}`);
    }
  };
  copyFiles("Lean", outputPath);
}

const generate = async (
  options: CommandOptions,
  ir: string,
  testSuite: Array<object>
): Promise<string[]> => {
  return new Promise((resolve, reject) => {
    worker.ports.jsonDecodeError.subscribe((err: any) => {
      reject(err);
    });
    worker.ports.generateResult.subscribe(([err, ok]: any) => {
      if (err) {
        reject(err);
      } else {
        resolve(ok);
      }
    });

    worker.ports.generate.send([options, ir, testSuite]);
  });
};

const gen = async (
  input: string,
  outputPath: string,
  options: CommandOptions
) => {
  await fsMakeDir(outputPath, {
    recursive: true,
  });

  // Add default values for these options
  options.limitToModules = '';
  options.includeCodecs = false;
  options.target = 'Lean'

  const morphirIrJson: Buffer = await fsReadFile(path.resolve(input));

  // Test cases are turned into Lean #guard checks. By default they are read from next to the IR.
  const testsPath: string = path.resolve(
    options.tests ?? path.join(path.dirname(input), "morphir-tests.json")
  );
  let testSuite: Array<object> = [];
  if (fs.existsSync(testsPath)) {
    testSuite = JSON.parse((await fsReadFile(testsPath)).toString());
  } else if (options.tests) {
    throw new Error(`The test file does not exist: ${testsPath}`);
  }

  const generatedFiles: string[] = await generate(
    options,
    JSON.parse(morphirIrJson.toString()),
    testSuite
  );

  const writePromises = generatedFiles.map(
    async ([[dirPath, fileName], content]: any) => {
      const fileDir: string = dirPath.reduce(
        (accum: string, next: string) => path.join(accum, next),
        outputPath
      );
      const filePath: string = path.join(fileDir, fileName);

      if (await cli.fileExist(filePath)) {
        const existingContent: Buffer = await fsReadFile(filePath);

        if (existingContent.toString() !== content) {
          await fsWriteFile(filePath, content);
          console.log(`UPDATE - ${filePath}`);
        }
      } else {
        await fsMakeDir(fileDir, {
          recursive: true,
        });
        await fsWriteFile(filePath, content);
        console.log(`INSERT - ${filePath}`);
      }
    }
  );
  const filesToDelete = await cli.findFilesToDelete(outputPath, generatedFiles);
  const deletePromises = filesToDelete.map(async (fileToDelete: string) => {
    console.log(`DELETE - ${fileToDelete}`);
    return fs.unlinkSync(fileToDelete);
  });
  copyRedistributables(outputPath);
  return Promise.all(writePromises.concat(deletePromises));
};

const program = new Command()
program
  .name('morphir lean-gen')
  .description('Generate Lean 4 code from Morphir IR')
  .option('-i, --input <path>', 'Source location where the Morphir IR will be loaded from.', 'morphir-ir.json')
  .option('-o, --output <path>', 'Target location where the generated code will be saved.', './dist')
  .option('-t, --tests <path>', 'Morphir test cases to turn into Lean checks (default: morphir-tests.json next to the IR).')

  .parse(process.argv)

gen(program.opts().input, path.resolve(program.opts().output), program.opts())
  .then(() => {
    console.log('Done')
  })
  .catch((err) => {
    console.log(err)
    process.exit(1)
  })
