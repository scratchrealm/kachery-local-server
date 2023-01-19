import yargs, { boolean } from 'yargs'
import {hideBin} from 'yargs/helpers'
import fs from 'fs'
import Server from './Server'

const main = () => {
    yargs(hideBin(process.argv))
        .command('serve', 'Start the server', (yargs) => {
            return yargs
        }, (argv) => {
            serve({port: parseInt(process.env.PORT || "61442"), verbose: argv.verbose ? true : false})
        })
        .option('verbose', {
            alias: 'v',
            type: 'boolean',
            description: 'Run with verbose logging'
        })
        .strictCommands()
        .demandCommand(1)
        .parse()
}

function serve({port, verbose}: {port: number, verbose: boolean}) {
    const server = new Server({port, verbose})
    server.start()
}

main()