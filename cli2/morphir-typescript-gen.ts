#!/usr/bin/env node

//NPM imports
import * as fs from "fs";
import path from 'path';
import { Command } from 'commander'
import cli = require('./cli')
import * as util from 'util'

const prettier = require("prettier");

const fsAccess = util.promisify(fs.access);
const fsWriteFile = util.promisify(fs.writeFile);
const fsMakeDir = util.promisify(fs.mkdir);
const fsReadFile = util.promisify(fs.readFile);
const fsUnlink = util.promisify(fs.unlink);
const worker = require("./../Morphir.Elm.CLI").Elm.Morphir.Elm.CLI.init();

require('log-timestamp')

const program = new Command()
program
   .name('morphir typescript-gen')
   .description('Generate typescript code from Morphir IR')
   .option('-i, --input <path>', 'Source location where the Morphir IR will be loaded from.', 'morphir-ir.json')
   .option('-o, --output <path>', 'Target location where the generated code will be saved.', './dist')
   .option('-c, --copy-deps', 'Copy the dependencies used by the generated code to the output path.', false)
   .parse(process.argv)

interface CommandOptions {
   input: string,
   output: string,
   copyDeps: boolean,
   target: string
}

const mapCommandOptions = (programOpts: any): CommandOptions => {
   return {
      target: "TypeScript",
      input: programOpts.input,
      output: programOpts.output,
      copyDeps: programOpts.copyDeps,
   }
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

   await fsMakeDir(outputPath, {recursive: true});
   
   const morphirIrJson: Buffer = await fsReadFile(path.resolve(input));

   let morphirTestsJSONContent: Array<object> = [];

   try {
      const bufferContent = await fsReadFile(path.resolve('./morphir-tests.json'))
      morphirTestsJSONContent = JSON.parse(bufferContent.toString())
   } catch (_) {
      console.log("could not read morphir-tests.json, defaulting to an empty test!")
   }

   const generatedFiles: string[] = await generate(
      options,
      JSON.parse(morphirIrJson.toString()),
      morphirTestsJSONContent
   )

   const writePromises = generatedFiles.map(
      async ([[dirPath, fileName], content]: any) => {
         const fileDir: string = dirPath.reduce(
            (accum: string, next: string) => path.join(accum, next),
            outputPath
         )

         await fsMakeDir(fileDir, { recursive: true })

         const filePath: string = path.join(fileDir, fileName)
         const incomingContent = prettier.format(content, { parser: "typescript" })

         try {
            await fsAccess(filePath, fs.constants.F_OK);
            const existingContent: Buffer = await fsReadFile(filePath)
            if (existingContent.toString() == incomingContent) {
               //console.log(`No Changes Detected - ${filePath}`);
            }
            else {
               console.log(`UPDATE - ${filePath}`)
            }
         }
         catch (_) {
            console.log(`INSERT - ${filePath}`);
         }

         await fsWriteFile(filePath, incomingContent)
      }
   );

   const filesToDelete = await cli.findFilesToDelete(outputPath, generatedFiles);
   
   const deletePromises = filesToDelete.map(async (fileToDelete: string) => {
      console.log(`DELETE - ${fileToDelete}`);
      return fsUnlink(fileToDelete);
   });

   // Always copy redistributables for TypeScript (matching old CLI behavior)
   const copyFiles = (src: string, dest: string) => {
      const sourceDirectory: string = path.join(
        path.dirname(__dirname),
        "..",
        "redistributable",
        src
      );
      cli.copyRecursiveSync(sourceDirectory, outputPath);
   };

   copyFiles("TypeScript/", outputPath);
   
   return Promise.all(writePromises.concat(deletePromises));
};



gen(program.opts().input, path.resolve(program.opts().output), mapCommandOptions(program.opts()))
   .then(() => {
      console.log("Done")
   })
   .catch((err) => {
      console.log(err)
      process.exit(1)
   })
