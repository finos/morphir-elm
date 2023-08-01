#!/usr/bin/env node
'use strict'

// NPM imports
const path = require('path')
const commander = require('commander')
const cli = require('./cli')
const execa = require('execa')

//logging
require('log-timestamp')

// Set up Commander
const program = new commander.Command()
program
    .name('morphir-elm gen')
    .description('Generate code from Morphir IR')
    .option('-i, --input <path>', 'Source location where the Morphir IR will be loaded from.', 'morphir-ir.json')
    .option('-o, --output <path>', 'Target location where the generated code will be saved.', './dist')
    .option('-t, --target <type>', 'Language to Generate (Scala | SpringBoot | cypher | triples | TypeScript).', 'Scala')
    .option('-e, --target-version <version>', 'Language version to Generate.', '2.11')
    .option('-c, --copy-deps', 'Copy the dependencies used by the generated code to the output path.', false)
    .option('-m, --modules-to-include <comma.separated,list.of,module.names>', 'Limit the set of modules that will be included.')
    .option('-s, --include-codecs', 'Generate JSON codecs', false)
    .option('-f, --filename <filename>', 'Filename of the generated JSON Schema.', '')
    .option('-ls, --include <comma.separated,list.of,strings>', 'Limit what will be included.', '')
    .parse(process.argv)

    const opts = program.opts()
    const input = opts.input
    const outputPath = opts.output
    opts.limitToModules = opts.modulesToInclude ? opts.modulesToInclude.split(",") : null
    opts.filename = opts.filename == '' ? '' : opts.filename
    const commonOptions = [
        `--input=${input}`,
        `--output=${outputPath}`,
        `--limitToModules=${opts.limitToModules}`
    ]

    // invoking new cli using options 
    switch (opts.target) {
        case "Scala":
            console.log("This Command is Deprecated. Switch to `morphir scala-gen` \n Running `morphir scala-gen` command ..............");
            execa('morphir scala-gen', [
                `--copy-deps=${opts.copyDeps}`,
                `include-codecs=${opts.includeCodecs}`,
                ...commonOptions
            ]).stdout.pipe(process.stdout);
            break;
        
        case "TypeScript": 
            console.log("This Command is Deprecated. Switching to `morphir typescript-gen`");
            execa('morphir typescript-gen', [
                ...commonOptions,
                `--copy-deps=${opts.copyDeps}`
            ]).stdout.pipe(process.stdout);
            break;
        
        case "JsonSchema": 
            console.log("This Command is Deprecated. Switch to `morphir json-schema-gen` \n Running `morphir json-schema-gen` command ..............");
            execa(`morphir json-schema-gen`, commonOptions)
                .stdout.pipe(process.stdout);
            break;
        
        case "TypeSpec": 
            console.log("This Command is Deprecated. Switch to `morphir typespec-gen` \n Running `morphir typespec-gen` command ..............");
            execa('morphir typespec-gen', [
                `--copy-deps=${opts.copyDeps}`,
                ...commonOptions
            ]).stdout.pipe(process.stdout);
            break;
    
        default:
            console.log("This Command is Deprecated. Switch to `morphir scala-gen` \n Running `morphir scala-gen` command ..............");
            execa('morphir scala-gen', [
                `--copy-deps=${opts.copyDeps}`,
                `include-codecs=${opts.includeCodecs}`,
                ...commonOptions
            ]).stdout.pipe(process.stdout);
            break;
    }


// cli.gen(program.opts().input, path.resolve(program.opts().output), program.opts())
//     .then()
//     .catch((err) => {
//         console.error(err)
//         process.exit(1)
//     })

