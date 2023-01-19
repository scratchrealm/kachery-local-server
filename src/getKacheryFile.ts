import os from 'os'
import fs from 'fs'

export type KacheryFileInfo = {
    path: string
    size: number
}

export const getKacheryFilePath = (uri: string): string => {
    const a = uri.split('/')
    const sha1 = a[2]
    const kacheryCloudDir = process.env['KACHERY_CLOUD_DIR'] || `${os.homedir()}/.kachery-cloud`
    const s = sha1
    return `${kacheryCloudDir}/sha1/${s[0]}${s[1]}/${s[2]}${s[3]}/${s[4]}${s[5]}/${s}`
}

export const getKacheryFileInfo = async (uri: string): Promise<KacheryFileInfo | undefined> => {
    const path = getKacheryFilePath(uri)
    let stat: fs.Stats
    try {
        stat = await fs.promises.stat(path)
    }
    catch(err) {
        return await getKacheryLinkFileInfo(uri)
    }
    return {
        path,
        size: stat.size
    }
}

const getKacheryFileLinkPath = (uri: string): string => {
    const a = uri.split('/')
    const sha1 = a[2]
    const kacheryCloudDir = process.env['KACHERY_CLOUD_DIR'] || `${os.homedir()}/.kachery-cloud`
    const s = sha1
    return `${kacheryCloudDir}/linked_files/sha1/${s[0]}${s[1]}/${s[2]}${s[3]}/${s[4]}${s[5]}/${s}`
}

const getKacheryLinkFileInfo = async (uri: string): Promise<KacheryFileInfo | undefined> => {
    const linkPath = getKacheryFileLinkPath(uri)
    if (!fs.existsSync(linkPath)) {
        return undefined
    }
    const a = await fs.promises.readFile(linkPath, 'utf-8')
    const {path, size, mtime} = JSON.parse(a)
    if (!fs.existsSync(path)) {
        return undefined
    }
    let stat: fs.Stats
    try {
        stat = await fs.promises.stat(path)
    }
    catch(err) {
        return undefined
    }
    if (stat.size !== size) {
        return undefined
    }
    // We won't check the mtime here, even though perhaps we should
    return {
        path,
        size: stat.size
    }
}