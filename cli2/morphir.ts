#!/usr/bin/env node
// NPM imports
import path from 'path'
import {Command} from 'commander'

// Read the package.json of this package
const packageJson = require(path.join(__dirname, '../../package.json'))

// Set up Commander
const program = new Command()
program
    .version(packageJson.version, '-v, --version')
    .command('make', 'Translate Elm sources to Morphir IR')
    .command('develop', 'Start up a web server and expose developer tools through a web UI')
    .command('stats', 'Collect morphir features used in a model into a document')
    .command('dockerize', 'Creates a docker image containing the Morphir IR and Morphir Develop Server')
    .command('test','Start Testing all the test cases present in morphir-ir.json')
    .command('test-coverage', 'Generates report on number of branches in a Morphir IR value and TestCases covered')
    .command('generate-test-data', 'Generate test data for Models (types) in a Morphir IR')
    .command('init', 'Launches an interactive session to initialize a new morphir project.')
    // Transpile commands
    .command('scala-gen','Generate Scala code from Morphir IR')
    .command('json-schema-gen', 'Generate Json Schema from the Morphir IR')
    .command('typespec-gen', 'Generate TypeSpec(previously CADL) from the Morphir IR')
    .command('typescript-gen', 'Generate TypeSpec(previously CADL) from the Morphir IR')
    .parse(process.argv)