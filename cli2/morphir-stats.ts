#!/usr/bin/env node

// Guard against Node 24 EBADF double-close on GC (finos/morphir-elm#1282)
import "./ebadf-guard.js";

// NPM imports
import { Command } from 'commander'
import * as cli from './cli.js'
import 'log-timestamp'

// Set up Commander
const program = new Command()

program
  .name('morphir stats')
  .description('Collect morphir features used in a model into a document')
  .option('-i, --input <path>', 'Source location where the Morphir IR will be loaded from.', 'morphir-ir.json')
  .option('-o, --output <path>', 'Target location where the generated code will be saved.', './stats')
  .parse(process.argv)

const { input: inputPath, output: outputPath } = program.opts()

cli.stats(inputPath, outputPath, program.opts())
  .then(() => {
  	console.log('Done')
  })
  .catch(err => {
  	console.log(err)
  	process.exit(1)
  })
