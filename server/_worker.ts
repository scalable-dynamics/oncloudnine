import { createApplication } from "./session/createApplication";
import { getSessionToken } from "./session/getSessionToken";

interface Env {
    ASSETS: Fetcher;
    KV: KVNamespace;
}

export default {
    async fetch(request: Request, env: Env) {
        const url = new URL(request.url);
console.log('Handling:', request.url);
        const check = request.headers['referer'] || 'pages.dev';
        if (request.headers['postman-token'] || check.indexOf('pages.dev') === -1) {
            return new Response('Bad Request', { status: 400 });
        } else if (url.pathname.startsWith('/api/getSessionToken')) {
            return await getSessionToken(request, env.KV);
        } else if (url.pathname.startsWith('/api/create')) {
            return await createApplication(request, env.KV);
        } else if (url.pathname.startsWith('/function/') || url.pathname.startsWith('/functions/') || url.pathname.startsWith('/services/') || url.pathname.startsWith('/api/') || url.pathname.startsWith('/data/') || url.pathname.startsWith('.git')
        ) {
            console.log('Handling Not Found:', request.url);
            return new Response('Not Found', { status: 404 });
        } else {
            return env.ASSETS.fetch(request);
        }
    },
}
