#!usr/bin/env node

//NPM imports
import * as fs from 'fs';
import path from 'path';
import {Command} from 'commander';
import cli = require('./cli');
import * as util from 'util';

const fsWriteFile = util.promisify(fs.writeFile);
const fsReadFile = util.promisify(fs.readFile);

require('log-timestamp');

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

cli.gen(program.opts().irPath, path.resolve(program.opts().output), program.opts())
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