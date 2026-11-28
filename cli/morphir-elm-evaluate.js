#!/usr/bin/env node

'use strict'

// Guard against Node 24 EBADF double-close on GC (finos/morphir-elm#1282)
require('./ebadf-guard')

// NPM imports
const fs = require('fs')
const commander = require('commander')
const cli = require('./cli')

// Set up Commander
const program = new commander.Command()
program
    .name('morphir-elm evaluate')
    .description('Evaluate a function on each record of arguments. Prints a JSON array with one { "output": ... } or { "error": ... } per record.')
    .option('-p, --project-dir <path>', 'Root directory of the project where morphir.json is located.', '.')
    .requiredOption('-f, --function <name>', 'Fully-qualified name of the function, like My.Package:My.Module:myFunction.')
    .requiredOption('-i, --inputs <path>', 'JSON file with an array of records; each record is an array of the arguments, encoded as in morphir-tests.json. Use - for standard input.')
    .option('-o, --output <path>', 'Write the results to this file instead of standard output.')
    .parse(process.argv)

const opts = program.opts()
const records = JSON.parse(fs.readFileSync(opts.inputs === '-' ? 0 : opts.inputs).toString())

cli.evaluate(opts.projectDir, opts.function, records)
    .then(results => {
        const text = JSON.stringify(results)
        if (opts.output) {
            fs.writeFileSync(opts.output, text)
        } else {
            process.stdout.write(text + '\n')
        }
    })
    .catch(err => {
        console.error(err)
        process.exit(1)
    })
