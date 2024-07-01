
class FileStore implements IFileStore {
    constructor(private folder: string) {
    }

    async *[Symbol.asyncIterator]() {
        const cache = await caches.open(this.folder);
        const items = await cache.keys();
        for (let item of items) {
            yield decodeURIComponent(item.url.replace(location.origin + '/', ''));
        }
    }

    has(name: string): Promise<boolean> {
        return caches.open(this.folder).then(cache => cache.match(name).then(response => response !== undefined));
    }

    async clear() {
        const cache = await caches.open(this.folder);
        await cache.keys().then(keys => Promise.all(keys.map(key => cache.delete(key))));
    }

    async fetch(name: string) {
        if (name.indexOf('/') !== 0) name = '/' + name;
        const cache = await caches.open(this.folder);
        const response = await cache.match(name);
        return response;
    }

    async storeObject(name: string, obj: any): Promise<void> {
        const json = JSON.stringify(obj);
        const file = new Blob([json], { type: 'application/json' });
        await this.storeFile(name, file);
    }

    async storeFile(name: string, file: Blob): Promise<void> {
        const cache = await caches.open(this.folder);
        await cache.put(name, new Response(file, { headers: { 'Content-Type': file.type } }));
    }

    async removeFile(name: string): Promise<void> {
        const cache = await caches.open(this.folder);
        if (!await cache.delete(name)) {
            console.log('FileStore: removeFile failed', name);
        }
    }

    static async id(text, length = 8) {
        const encoder = new TextEncoder();
        const data = encoder.encode(text);
        return crypto.subtle.digest('SHA-256', data).then(hashBuffer => {
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            const hashHex = hashArray
                .map(byte => byte.toString(16).padStart(2, '0'))
                .join('');
            return hashHex.substring(0, length);
        });
    }
}