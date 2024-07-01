function MINIFYCSS(file) {
    const fs = require('fs');
    const postcss = require('postcss');
    const cssnano = require('cssnano');
    const autoprefixer = require('autoprefixer');
    const css = fs.readFileSync(file, 'utf8');
    return postcss([cssnano, autoprefixer])
        .process(css)
        .then(result => {
            fs.writeFileSync(file, result.css);
            console.log(`CSS files minified and saved to ${file}`);
        });
}

function MINIFY(file, mainFunction?) {
    const fs = require('fs');
    const Terser = require('terser');

    const code = fs.readFileSync(file, 'utf-8');

    return Terser.minify(code, {
        compress: {
            dead_code: true,
            drop_debugger: true,
            drop_console: true,
            unused: true,
        },
        mangle: {
            toplevel: true,
            reserved: mainFunction ? [mainFunction] : [],
        },
        output: {
            comments: false,
        },
    }).then(result => {
        if (result.error) {
            console.error(`Error minifying ${file}:`, result.error);
            return;
        }
        fs.writeFileSync(file, result.code);
        console.log(`Minified ${file}`);
    });
}

function createWatcher(folder, callback, usePolling = false) {
    const chokidar = require('chokidar');
    const watcher = chokidar.watch(folder, {
        ignored: /(^|[\/\\])\../,
        persistent: true,
        ignoreInitial: true,
        usePolling: true
    });
    watcher
        .on('change', callback)
        .on('error', (error) => console.error(`Watcher error: ${error}`))
        .on('ready', () => console.log(`Watching for ${folder} changes...`));
    return watcher;
}

function copyFile(filePath, outputPath) {
    const fs = require('fs');
    const path = require('path');
    const outputDir = path.dirname(outputPath);
    const outputFile = path.join(outputDir, path.basename(filePath));
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);
    fs.copyFileSync(filePath, outputFile);
    if (path.extname(filePath) === '.svg' && !RELEASE) return;
    console.log(`Copied file to ${outputFile}`);
}

function makeRelativePath(filePath, fromFolder, toFolder) {
    const path = require('path');
    const relativePath = path.relative(fromFolder, filePath).replace(/\\/g, '/');
    return path.join(toFolder, relativePath);
}

function getFiles(dir, ext?, recursive = true) {
    const fs = require('fs');
    const path = require('path');
    function getFilesRecursive() {
        const outFiles: string[] = [];

        function readDirectory(directory) {
            const files = fs.readdirSync(directory, { withFileTypes: true });
            for (const file of files) {
                let filePath = path.join(directory, file.name).replace(/\\/g, '/');
                if (filePath.includes('/.') || filePath.includes('node_modules') || filePath.includes('package.json') || filePath.includes('package-lock.json')) {
                    continue;
                }
                if (file.isDirectory()) {
                    if (recursive) {
                        readDirectory(filePath);
                    }
                } else if (!ext || path.extname(file.name) === ext) {
                    outFiles.push(filePath);
                }
            }
        }

        readDirectory(dir);
        return outFiles;
    }
    return getFilesRecursive();
}

function topologicalSort(files) {
    const fs = require('fs');
    const graph = new Map();
    const visited = new Set();
    const sorted: string[] = [];

    // Build the dependency graph
    for (const file of files) {
        const content = fs.readFileSync(file, 'utf-8');
        const imports = content.match(/^import.*?;?/gm) || [];
        const dependencies = imports.map((imp) => {
            const match = imp.match(/from\s+['"](.+?)['"]/);
            return match ? match[1] : null;
        }).filter(Boolean);

        graph.set(file, dependencies);
    }

    // Recursive function for depth-first search
    function dfs(file) {
        if (visited.has(file)) return;
        visited.add(file);

        const dependencies = graph.get(file);
        for (const dependency of dependencies) {
            const dependencyFile = files.find((f) => f.endsWith(`/${dependency}`) || f.endsWith(`/${dependency}.js`));
            if (dependencyFile) {
                dfs(dependencyFile);
            }
        }

        sorted.unshift(file);
    }

    // Perform depth-first search for each file
    for (const file of files) {
        dfs(file);
    }

    return sorted;
}

function combineJs(folder) {
    const fs = require('fs');
    const path = require('path');
    const jsFiles = getFiles(folder, '.js');
    const sortedFiles = topologicalSort(jsFiles);
    let contents = sortedFiles
        .map((file) => {
            let js = fs.readFileSync(file, 'utf-8');
            js = js.replace(/^import.*;?/gm, '');
            js = js.replace(/^export default /gm, `const ${path.basename(file).replace('.js', '')} =`);
            js = js.replace(/^export /gm, '');
            js = js.replace(`"use strict";`, '');
            const index = js.indexOf('const onRequest');
            if (index > -1) {
                js = js.slice(0, index);
            }
            return js;
        })
        .join('\n');
    return contents;
}

function combineAndSaveJs(folder, outputFile, functionName) {
    const fs = require('fs');
    let contents = combineJs(folder);

    fs.writeFileSync(outputFile, contents);

    function createWrapper() {
        if (functionName) {
            contents = fs.readFileSync(outputFile, 'utf-8');

            contents = `export default (function() {
${contents}
    return ${functionName};
}());`;

            fs.writeFileSync(outputFile, contents);
        }
    }

    if (RELEASE) {
        MINIFY(outputFile, functionName).then(() => {
            createWrapper();
        });
    } else {
        createWrapper();
    }

    console.log(`JS files combined and saved to ${outputFile}`);
}

function combineAndSaveCss(folders, outputFile) {
    const fs = require('fs');
    const path = require('path');
    const css: string[] = [];
    for (const folder of folders) {
        const cssFiles = getFiles(folder, '.css', true);
        if (cssFiles.length === 0) continue;
        //console.log(`Found ${cssFiles.length} CSS files in ${folder}`);
        let contents = cssFiles.map((file) => fs.readFileSync(file, 'utf-8'));
        css.push(...contents);
    }
    const outputFolder = path.dirname(outputFile);
    if (!fs.existsSync(outputFolder)) fs.mkdirSync(outputFolder);
    fs.writeFileSync(outputFile, css.join('\n'));
    if (RELEASE) MINIFYCSS(outputFile);
    console.log(`CSS files combined and saved to ${outputFile}`);
}

function copyPublicFolder(folder, outputFolder) {
    const publicFiles = getFiles(folder);
    for (const file of publicFiles) {
        if (file.indexOf('/css/') > -1) continue;
        const outputPath = makeRelativePath(file, folder, outputFolder);
        copyFile(file, outputPath);
    }
    console.log(`Public files copied to ${outputFolder}`);
}

function updateImages(folder, outputJsFile, outputTsFile) {
    const fs = require('fs');
    const path = require('path');
    const imageFiles = getFiles(folder, '.svg');
    const images = imageFiles.map((file) => path.basename(file).replace('.svg', ''));
    const imagesJs = `var $Images = {
${images.map((image) => `    ${image}: createImage.bind(null, '${image}')`).join(',\n')}
};
function createImage(name) {
    const image = document.createElement('img');
    image.src = './images/' + name + '.svg';
    return image;
}`;
    fs.writeFileSync(outputJsFile, imagesJs);
    console.log(`Images updated and saved to ${outputJsFile}`);
    const imagesTs = `/// <reference path="JSX.d.ts" />
declare namespace $Images {
${images.map((image) => `    export const ${image}: JSX.SvgImage;`).join('\n')}
}
declare function createImage(name: string): HTMLImageElement;`;
    fs.writeFileSync(outputTsFile, imagesTs);
    console.log(`Images updated and saved to ${outputTsFile}`);
}

function runTypeScriptCompile(folderPath, watch = true) {
    const { spawn } = require('child_process');
    const args = ['--project', folderPath];
    if (watch) args.push('--watch');
    const tscProcess = spawn('tsc', args, {
        stdio: 'inherit',
        shell: true,
    });
    console.log(`tsc process (watch=${watch}) started for folder ${folderPath}`);
    return new Promise<boolean>((resolve, reject) => {
        tscProcess.on('close', (code) => {
            console.log(`tsc process exited with code ${code} for folder ${folderPath}`);
            resolve(code === 0);
        });
        tscProcess.on('error', (err) => {
            console.error(`tsc process error for folder ${folderPath}: ${err}`);
            reject(err);
        });
    });
}