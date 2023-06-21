#!/usr/bin/env node

// NPM imports
import { Command } from 'commander'

// logging
require('log-timestamp')

// Set up Commander
const program = new Command()
program
    .name('morphir develop')
    .description("Start up a web server and expose developer tools through a web UI")
    .option("-p, --port <port>", "Port to bind the web server to.", "3000")
    .option("-o, --host <host>", "Host to bind the web server to.", "0.0.0.0")
    .option("-i, --project-dir <path>", "Root directory of the project where morphir.json is located.", ".")
    .parse(process.argv)

const dirAndOutput = program.opts()
