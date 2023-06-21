#!/usr/bin/env node

// NPM Imports 
import { Command } from "commander";
import { dockerize } from "./cliAPI";

// logging 
require('log-timestamp')

const program = new Command()
program
    .name('morphir dockerize')
    .description('Creates a docker image containing the Morphir IR and Morphir Develop Server')
    .option('-p, --project-dir <path>', 'Root directory of the project where morphir.json is located.', '.')
    .option('-f, --force', 'Overwrite any Dockerfile in target location', false)
    .parse(process.argv)

// run 
dockerize( program.opts().projectDir, program.opts() )