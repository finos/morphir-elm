// Guard against Node 24 EBADF double-close on GC (finos/morphir-elm#1282)
import "./ebadf-guard.js";

import * as cli from './cli.js'


export function make(dir: string, opts: any) {
    cli.make(dir, opts)
    .then((ir: string | undefined) => {
        if (ir) {
            console.log(`Writing file ${opts.output}.`)
            cli.writeFile(opts.output, ir)
                .then(() => {
                    console.log('Done.')
                })
                .catch((err: any) => {
                    console.error(`Could not write file: ${err}`)
                })
        }
    })
    .catch((err: { code: string; path: any }) => {
        if (opts.report === 'json' && Array.isArray(err)) {
            process.stderr.write(JSON.stringify(err) + '\n')
        } else if (err.code == 'ENOENT') {
            console.error(`Could not find file at '${err.path}'`)
        } else {
            if (err instanceof Error) {
                console.error(err)
            } else if (Array.isArray(err) && err.some(isStructuredError)) {
                err.forEach((e: unknown) => console.error(describeError(e)))
            } else {
                console.error(`Error: ${JSON.stringify(err, null, 2)}`)
            }
        }
        process.exit(1)
    })
}

function isStructuredError(error: any): boolean {
    return typeof error === 'object' && error !== null && typeof error.kind === 'string'
}

function describeError(error: any): string {
    if (!isStructuredError(error)) {
        return `Error: ${JSON.stringify(error, null, 2)}`
    }
    const location = error.range ? ` (line ${error.range.start.row}, column ${error.range.start.column})` : ''
    switch (error.kind) {
        case 'NonExhaustivePatternMatch':
            return `Non-exhaustive pattern match in ${error.module.join('.')}.${error.definition}${location}: ` +
                `missing ${error.missing.join(', ')}` + (error.type ? ` of type ${error.type.join('.')}` : '')
        case 'UnknownExport':
            return `Unknown export in ${error.module.join('.')}${location}: ${error.exposes} '${error.name}' is exposed but not defined`
        default:
            return `Error: ${JSON.stringify(error, null, 2)}`
    }
}

export function dockerize(dir: string, opts: any) {
    cli.writeDockerfile(dir, opts)
    .then(() => {
        console.log("Dockerfile Created Successfully");
    })
    .catch((err: { code: string; path: any }) => {
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