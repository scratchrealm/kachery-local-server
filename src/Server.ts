import express, { Express, NextFunction, Request, Response } from 'express';
import * as http from 'http'
import * as crypto from 'crypto'
import fs from 'fs'
import path from 'path'
import { getKacheryFileInfo, getKacheryFilePath } from './getKacheryFile';

class Server {
    #expressApp: Express
    #expressServer: http.Server
    constructor(private a: {port: number, verbose: boolean}) {
        this.#expressApp = express()
        this.#expressServer = http.createServer(this.#expressApp)
        const allowedOrigins = ['https://figurl.org', 'http://localhost:3000', 'http://localhost:3001']
        this.#expressApp.use((req: Request, resp: Response, next: NextFunction) => {
            const origin = req.get('origin')
            let allowedOrigin = allowedOrigins.includes(origin) ? origin : undefined
            if (allowedOrigin) {
                resp.header('Access-Control-Allow-Origin', allowedOrigin)
                resp.header('Access-Control-Allow-Headers', "Origin, X-Requested-With, Content-Type, Accept")
            }
            next()
        })
        this.#expressApp.get('/probe', (req: Request, resp: Response) => {
            resp.status(200).send('Okay')
        })
        this.#expressApp.get('/sha1/:sha1', (req: Request, resp: Response) => {
            const sha1: string = req.params.sha1
            if (this.a.verbose) {
                console.info(`GET sha1://${sha1}`, req.method)
            }
            // note: express also handles head (and it works with sendFile)
            ;(async () => {
                const info = await getKacheryFileInfo(`sha1://${sha1}`)
                if (info) {
                    resp.set(
                        'Content-Type', 'application/octet-stream',
                    )
                    resp.sendFile(info.path)
                }
                else {
                    resp.status(404).send('File not found')
                }
            })()
        })
        this.#expressApp.post('/upload/sha1/:sha1', (req: Request, resp: Response) => {
            const sha1: string = req.params.sha1
            if (this.a.verbose) {
                console.info(`POST sha1://${sha1}`)
            }
            const filePath = getKacheryFilePath(`sha1://${sha1}`)
            const temporaryFilePath = `${filePath}.kachery-local-server.${randomAlphaString(8)}`
            const parentFilePath = path.dirname(temporaryFilePath)
            const shasum = crypto.createHash('sha1')
            fs.mkdirSync(parentFilePath, {recursive: true})
            const writeStream = fs.createWriteStream(temporaryFilePath)
            function cleanup() {
                if (fs.existsSync(temporaryFilePath)) {
                    fs.unlinkSync(temporaryFilePath)
                }
            }
            req.on('data', chunk => {
                const test = crypto.createHash('sha1')
                test.update(chunk)
                shasum.update(chunk)
                writeStream.write(chunk)
            })
            req.on('end', () => {
                writeStream.end()
                const computedSha1 = shasum.digest('hex')
                if (computedSha1 !== sha1) {
                    console.warn(`Unexpected sha1: ${computedSha1} <> ${sha1}`)
                    cleanup()
                    resp.status(500).send('Incorrect sha1')
                    return
                }
                if (!fs.existsSync(filePath)) {
                    fs.renameSync(temporaryFilePath, filePath)
                    console.info(`STORED sha1://${sha1}`)
                }
                else {
                    console.warn(`File already exists: ${filePath}`)
                    cleanup()
                }
                resp.status(200).send('File stored')
            })
            req.on('close', () => {
                cleanup()
            })
        })
    }
    start() {
        this.#expressServer.listen(this.a.port, () => {
            return console.info(`Server is running on port ${this.a.port}`)
        })
    }
}

export const randomAlphaString = (num_chars: number) => {
    if (!num_chars) {
        /* istanbul ignore next */
        throw Error('randomAlphaString: num_chars needs to be a positive integer.')
    }
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
    for (var i = 0; i < num_chars; i++)
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    return text;
}

export default Server