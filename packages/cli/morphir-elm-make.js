#!/usr/bin/env node
'use strict'

// Increase stack size for complex type inference (see GitHub issue #1258).
// The Elm type solver uses deep recursion that exceeds Node.js default stack (~1MB)
// on large value definitions. Re-exec with 8MB stack if needed.
if (!process.env.__MORPHIR_STACK_EXPANDED) {
    const { execFileSync } = require('child_process')
    process.env.__MORPHIR_STACK_EXPANDED = '1'
    try {
        execFileSync(process.execPath, ['--stack-size=8192', ...process.argv.slice(1)], {
            stdio: 'inherit',
            env: process.env
        })
    } catch (e) {
        process.exit(e.status || 1)
    }
    process.exit(0)
}

// NPM imports
const commander = require('commander')


// logging
require('log-timestamp')

// Set up Commander
const program = new commander.Command()
program
    .name('morphir-elm make')
    .description('Translate Elm sources to Morphir IR')
    .option('-p, --project-dir <path>', 'Root directory of the project where morphir.json is located.', '.')
    .option('-o, --output <path>', 'Target file location where the Morphir IR will be saved.', 'morphir-ir.json')
    .option('-t, --types-only', 'Only include type information in the IR, no values.', false)
    .option('-f, --fallback-cli', 'Use old cli make function.', false)
    .option('-i, --indent-json', 'Use indentation in the generated JSON file.', false)
    .parse(process.argv)

const programOptions = program.opts()

// running function
runAppropriateCli(programOptions.projectDir, programOptions)

// runs cli1 if flag passed, else cli2
function runAppropriateCli(projectDir, opts) {
    if (opts.fallbackCli) {
        make(projectDir, opts)
    }

    else {
        const cli2 = require('../cli2/lib/cliAPI')
        cli2.make(projectDir, opts)
    }
}

function make(projectDir, opts) {
    const cli = require('./cli')

    cli.make(projectDir, opts)
        .then((packageDef) => {
            console.log(`Writing file ${opts.output}.`)
            cli.writeFile(opts.output, JSON.stringify(packageDef, null, opts.indentJson ? 4 : 0))
                .then(() => {
                    console.log('Done.')
                })
                .catch((err) => {
                    console.error(`Could not write file: ${err}`)
                })
        })
        .catch((err) => {
            if (err.code == 'ENOENT') {
                console.error(`Could not find file at '${err.path}'`)
            } else {
                if (err instanceof Error) {
                    console.error(err)
                } else {
                    console.error(`Error: ${JSON.stringify(err, null, 2)}`)
                }
            }
            process.exit(1)
        })
}