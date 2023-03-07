import plainFs from 'node:fs';
import fs from 'node:fs/promises';
import Path from 'node:path';
import Util from './util';
import Stream from 'node:stream/promises';

export default class Writer {
    managed;

    constructor() {
        this.managed = new Set();
    }

    async writeJson(path: string, data: any) {
        const absPath = Path.resolve(path);
        this.managed.add(absPath);

        let oldContent;
        try {
            oldContent = await fs.readFile(absPath, 'utf8');
        } catch(e) {}
        const newContent =  Util.toJson(data);
        if (oldContent === newContent) {
            return false;
        }
        await fs.writeFile(absPath, newContent);
        return true;
    }

    async writeMarker(dir: string, name: string) {
        const absPath = Path.resolve(dir, "_ " + Util.cleanFilename(name));
        this.managed.add(absPath);

        try {
            await fs.writeFile(absPath, "");
        } catch(e) {}
    }

    async writeStream(path: string, inStream: NodeJS.ReadableStream) {
        const absPath = Path.resolve(path);
        this.managed.add(absPath);

        await Stream.pipeline(
            inStream,
            plainFs.createWriteStream(absPath)
        )
    }

    async size(path: string) {
        const absPath = Path.resolve(path);
        this.managed.add(absPath);

        try {
            const stat = await fs.stat(absPath);
            return stat.size;
        } catch(e: any) {
            if (e.code === 'ENOENT') {
                return -1;
            }
            throw e;
        }
    }

    async clean(root: string) {
        console.log("Running cleaner ...");
        const cleanDir = async (dir: string) => {
            const entries = await fs.readdir(dir, {withFileTypes: true});
            let isEmpty = true;
            for (const entry of entries) {
                const entryPath = Path.resolve(dir, entry.name);
                if (entry.isDirectory()) {
                    isEmpty = isEmpty && await cleanDir(entryPath);
                } else if (this.managed.has(entryPath)) {
                    isEmpty = false;
                } else {
                    await fs.rm(entryPath);
                    console.log("Deleting file " + entryPath);
                }
            }
            if (isEmpty) {
                await fs.rmdir(dir);
                console.log("Deleting dir  " + dir);
                return true;
            }
            return false;
        }
        await cleanDir(root);
    }
}
