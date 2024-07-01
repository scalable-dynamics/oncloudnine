async function servePublicFolder(config, buildFolder, clientFolders, serverFolders) {
    const http = require('http');
    const fs = require('fs');
    const path = require('path');
    const port = 8080;
    let api, files: [string, Buffer, string][];
    function reloadApi() {
        const activitiesJs = serverFolders.map(f => combineJs(f)).join('\n') + `
function Response(body,options){
    this.body = body;
    this.headers = options.headers || {};
}
module.exports = { ${serverFolders} };`;
        fs.writeFileSync(path.join(buildFolder, 'dev-api.js'), activitiesJs);
        api = require(path.join(buildFolder, 'dev-api.js'));
    }
    function reloadApp() {
        files = clientFolders.map(f => getFiles(f).map((file) => [makeRelativePath(file, f, '/'), fs.readFileSync(file), path.extname(file)])).flat();
    }
    reloadApi();
    reloadApp();
    const watchers = [
        createWatcher(buildFolder, (filePath) => {
            filePath = filePath.replace(/\\/g, '/');
            if (filePath.indexOf('/api/') > -1 || filePath.indexOf('/data/') > -1 || filePath.indexOf('/services/') > -1) {
                reloadApi();
                console.log(`Reloaded api files: ${filePath}`);
            } else if (filePath.indexOf('/public/') > -1) {
                reloadApp();
                console.log(`Reloaded app files: ${filePath}`);
            }
        }),
        ...clientFolders.map(f => createWatcher(f, reloadApp)),
    ];
    const index = files!.find((f) => f[0].replace(/\\/g, '/') === '/index.html')![1];
    const envParams = { get: (key) => config[key] };
    const server = http.createServer(async (req, res) => {
        const apiRequest = {
            method: req.method,
            json() {
                return new Promise((resolve, reject) => {
                    let body = '';
                    req.on('data', (chunk) => body += chunk);
                    req.on('end', () => {
                        try {
                            resolve(JSON.parse(body));
                        } catch (err) {
                            reject(err);
                        }
                    });
                });
            }
        };
        try {
            console.log('Handling Request:', req.method, req.url, req.headers['postman-token'], req.headers['user-agent'], req.headers['referer']);
            const check = req.headers['referer'] || 'desktop-localhost';

            if (req.headers['postman-token'] || (check.indexOf('localhost') === -1 && check.indexOf('desktop-') === -1)) {
                res.writeHead(400, { 'Content-Type': 'text/plain' });
                res.end('Bad Request');
            } else if (req.url.indexOf('/api/') > -1) {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                const parts = req.url.split('/');
                const endpoint = parts[2];
                const handler = api[endpoint];
                if (handler) {
                    const result = await handler(apiRequest, envParams);
                    res.end(JSON.stringify(result));
                } else {
                    res.end(JSON.stringify({ error: 'Endpoint not found' }));
                }
            } else if (req.url === '/' || req.url === '/index.html') {
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.end(index);
            } else {
                const file = files.find((f) => f[0].replace(/\\/g, '/').toLowerCase() === req.url.toLowerCase());
                if (file) {
                    const ext = file[2];
                    const contentType = {
                        '.html': 'text/html',
                        '.css': 'text/css',
                        '.js': 'text/javascript',
                        '.svg': 'image/svg+xml',
                        '.png': 'image/png'
                    }[ext] || 'text/plain';
                    res.writeHead(200, { 'Content-Type': contentType });
                    res.end(file[1]);
                } else {
                    console.log(files.map(f => f[0]));
                    console.log(`404 Not Found: ${req.url}`);
                    res.writeHead(404, { 'Content-Type': 'text/html' });
                    res.end('<h1>404 Not Found</h1>');
                }
            }
        } catch (err) {
            console.error(err);
            res.writeHead(500, { 'Content-Type': 'text/html' });
            res.end('<h1>500 Internal Server Error</h1>');
        }
    });
    server.listen(port, () => {
        console.log(`Server running at http://localhost:${port}/`);
    });
    return {
        close: () => {
            watchers.forEach(w => w.close());
            server.close();
        }
    }
}