#!/usr/bin/env node

// Guard against Node 24 EBADF double-close on GC (finos/morphir-elm#1282)
import "./ebadf-guard.js";

// NPM Imports
import { Command } from "commander";
import { dockerize } from "./cliAPI.js";
import 'log-timestamp'

const program = new Command()
program
    .name('morphir dockerize')
    .description('Creates a Docker image of a Morphir IR with Morphir Develop')
    .option('-p, --project-dir <path>', 'Root directory of the project where morphir.json is located.', '.')
    .option('-f, --force', 'Overwrite any Dockerfile in target location', false)
    .parse(process.argv)

// run 
dockerize( program.opts().projectDir, program.opts() )