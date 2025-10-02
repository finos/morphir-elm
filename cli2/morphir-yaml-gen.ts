#!/usr/bin/env node

// NPM imports
import * as fs from "fs";
import path from "path";
import { Command } from "commander";
import cli from "./cli";

const worker = require("./../Morphir.Elm.CLI").Elm.Morphir.Elm.CLI.init();

require("log-timestamp");

type YamlMap = { [moduleName: string]: string };

const yamlGenerate = async (ir: string): Promise<YamlMap> => {
    return new Promise((resolve, reject) => {
        worker.ports.decodeFailed.subscribe((err: any) => {
            reject(err);
        });

        worker.ports.yamlGenerateResult.subscribe((data: any) => {
            // Elm sends a plain object mapping module name -> YAML string
            resolve(data as YamlMap);
        });

        worker.ports.yamlGenerate.send(ir);
    });
};

const gen = async (input: string, outputPath: string) => {
    await fs.promises.mkdir(outputPath, { recursive: true });

    const morphirIrJson = await fs.promises.readFile(path.resolve(input));
    const yamlByModule: YamlMap = await yamlGenerate(
        JSON.parse(morphirIrJson.toString())
    );

    // Convert to the common [[dirPath[], fileName], content] FileMap-like structure
    const generatedFiles = Object.entries(yamlByModule).map(
        ([moduleName, yamlContent]) => {
            const parts = moduleName.split(".");
            const fileName = `${parts[parts.length - 1]}.yaml`;
            const dirPath = parts.slice(0, -1);
            return [[dirPath, fileName], yamlContent] as const;
        }
    );

    // Write or update files
    const writePromises = generatedFiles.map(async ([[dirPath, fileName], content]) => {
        const fileDir = dirPath.reduce(
            (accum: string, next: string) => path.join(accum, next),
            outputPath
        );
        const filePath = path.join(fileDir, fileName);

        if (await cli.fileExist(filePath)) {
            const existingContent = await fs.promises.readFile(filePath);
            if (existingContent.toString() !== content) {
                await fs.promises.mkdir(fileDir, { recursive: true });
                await fs.promises.writeFile(filePath, content);
                console.log(`UPDATE - ${filePath}`);
            }
        } else {
            await fs.promises.mkdir(fileDir, { recursive: true });
            await fs.promises.writeFile(filePath, content);
            console.log(`INSERT - ${filePath}`);
        }
    });

    // Delete any previous files that are no longer generated
    const filesToDelete = await cli.findFilesToDelete(outputPath, generatedFiles as any);
    const deletePromises = filesToDelete.map(async (fileToDelete: string) => {
        console.log(`DELETE - ${fileToDelete}`);
        return fs.unlinkSync(fileToDelete);
    });

    return Promise.all(writePromises.concat(deletePromises));
};

const program = new Command();
program
    .name("morphir yaml-gen")
    .description("Generate YAML representation of Morphir modules from IR")
    .option(
        "-i, --input <path>",
        "Source location where the Morphir IR will be loaded from.",
        "morphir-ir.json"
    )
    .option(
        "-o, --output <path>",
        "Target location where the generated YAML files will be saved.",
        "./dist"
    )
    .parse(process.argv);

gen(program.opts().input, path.resolve(program.opts().output))
    .then(() => {
        console.log("Done");
    })
    .catch((err) => {
        console.log(err);
        process.exit(1);
    });
