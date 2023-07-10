#!usr/bin/env node

//NPM imports
import * as fs from 'fs';
import path from 'path';
import {Command} from 'commander';
import cli = require('./cli');
import * as util from 'util';

const fsWriteFile = util.promisify(fs.writeFile);
const fsMakeDir = util.promisify(fs.mkdir);
const fsReadFile = util.promisify(fs.readFile);

const worker = require("./../Morphir.Elm.CLI").Elm.Morphir.Elm.CLI.init();

require('log-timestamp');

interface CommandOptions {
    irPath: string;
    storageLocation: string;
    limitToModules: string;
    targetVersion: string;
    includeCodecs: boolean;
  }

const gen = async (
    input: string, 
    outputPath: string,
    options: CommandOptions
) => {
    await fsMakeDir(outputPath, {recursive: true,})
    const morphirIrJson:Buffer = await fsReadFile(path.resolve(input));
    let morphirTestsJSONContent: Array<object> = [];
    try {
        const bufferContent = await fsReadFile(path.resolve('./morphir-tests.json'))
        morphirTestsJSONContent = JSON.parse(bufferContent.toString());
    } catch(_) {
        console.log("Could not read morphir-tests.json, defaulting to an empty test!");    
    }

    const generatedFiles: string[] = await generate(
        options,
        JSON.parse(morphirIrJson.toString()),
        []
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
    cli.copyRedistributables(options, outputPath);
    return Promise.all(writePromises.concat(deletePromises));
};

const generate = async (
    options: CommandOptions,
    ir: string,
    testSuite: Array<object>
): Promise<string[]> => {
    return new Promise((resolve, reject) => {
        worker.ports.jsonDecodeError.subscribe((err:any) => {
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

const program = new Command()
program
    .name('morphir decoration-setup')
    .description('Generate the decorations config from the decorations IR')
    .option('-i, --irPath <path>', 'Source location where the decorations IR will be loaded from.', 'decoration-model/morphir-ir.json')
    .option('-p, --storageLocation <path>', 'Location to store the sidecar files', '/decorations')
    .option('-o, --output <path>', 'Target location where the generated code will be saved.', './decorations/config')
    .option('-t, --target <type>', 'What to Generate.', 'DecorationConfig')
    .option('-f, --overwrite', 'Overwrite existing configuration.', false)
    .option('-g --decorationGroup <type>', 'What decoration group to set up', '')
    .parse(process.argv)

gen(program.opts().irPath, path.resolve(program.opts().output), program.opts())
    .then(() =>{
       console.log("Done")
       const decorationPath = path.join(path.resolve(program.opts().output), "decorationConfigs.json");
       const morphirJsonPath = "morphir.json";
       updateConfiguration(decorationPath, morphirJsonPath, program.opts().overwrite);
    })
    .catch((err) =>{
        console.log(err)
        process.exit(1)
    })

async function updateConfiguration(configPath: string, morphirPath: string, overwrite: boolean) {
    const configBuffer = await fsReadFile(configPath)
    const configJsonObject = JSON.parse(configBuffer.toString());
    const morphirBuffer = await fsReadFile(morphirPath)
    const morphirJsonObject = JSON.parse(morphirBuffer.toString());

    //If there is no existing decorations, insert, else merge with existing decoration
    if ((morphirJsonObject.decorations) && !(overwrite)) {
        const mergedConfigObject = {
            ...morphirJsonObject.decorations,
            ...configJsonObject
        }
        morphirJsonObject["decorations"] = mergedConfigObject
    }
    else {
        morphirJsonObject["decorations"] = configJsonObject
    }
    await fsWriteFile(morphirPath, JSON.stringify(morphirJsonObject, null, 4));
}