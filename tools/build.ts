const WATCH = process.argv.includes('--watch');
const RELEASE = process.argv.includes('--release');
let MAIN = 'undefined';
if (process.argv.includes('--main')) {
    const index = process.argv.indexOf('--main');
    MAIN = process.argv[index + 1];
}
let APPS: string[] = [];
if (process.argv.includes('--apps')) {
    const index = process.argv.indexOf('--apps');
    APPS = process.argv[index + 1].split(',').map(app => app.trim());
}
let SERVICES: string[] = [];
if (process.argv.includes('--services')) {
    const index = process.argv.indexOf('--services');
    SERVICES = process.argv[index + 1].split(',').map(service => service.trim());
}
let CONFIG = {};
if (process.argv.includes('--config')) {
    const index = process.argv.indexOf('--config');
    CONFIG = require(process.argv[index + 1]);
}

function buildSharedFolders(tsSharedFolder, sharedBuildFolder, publicFolder, publicBuildFolder, imagesFolder, imagesJsFile, imagesTsFile, typesFolder, ...targetFolders: string[]) {
    const fs = require('fs');
    const path = require('path');
    return runTypeScriptCompile(tsSharedFolder, false).then(success => {
        if (!success) {
            console.error('TypeScript compilation failed for shared project.');
            return;
        }
        console.log('Shared project compiled.');
        const jsxPath = path.join(sharedBuildFolder, 'JSX.js');
        const interfacesPath = path.join(sharedBuildFolder, 'interfaces.js');
        if (fs.existsSync(jsxPath)) fs.unlinkSync(jsxPath);
        if (fs.existsSync(interfacesPath)) fs.unlinkSync(interfacesPath);
        copyPublicFolder(publicFolder, publicBuildFolder);
        updateImages(imagesFolder, imagesJsFile, imagesTsFile);
        const types = getFiles(typesFolder, '.ts', true);
        console.log(`Found ${types.length} type files in ${typesFolder}`);
        console.log(types);
        for (const folder of targetFolders) {
            const contents = types
                .filter((file) => !file.replace('build/types/', '').startsWith(folder.replace(/\\/g, '/')))
                .map((file) => fs.readFileSync(file, 'utf-8'))
                .join('\n')
                .split('\n')
                .filter((line) => !line.startsWith('import ') && !line.includes('<reference path='))
                .map((line) => line
                    .replace(/^export /, '')
                    .replace(/^declare /, '')
                )
                .join('\n');
            const targetFile = path.join(folder, 'types.d.ts');
            fs.writeFileSync(targetFile, contents);
        }
        return true;
    });
}

function watchSharedFolders(tsSharedFolder, sharedBuildFolder, publicFolder, publicBuildFolder, imagesFolder, imagesJsFile, imagesTsFile, typesFolder, ...targetFolders: string[]) {
    return createWatcher(tsSharedFolder, () =>
        buildSharedFolders(tsSharedFolder, sharedBuildFolder, publicFolder, publicBuildFolder, imagesFolder, imagesJsFile, imagesTsFile, typesFolder, ...targetFolders)
    );
}

function execute() {
    const fs = require('fs');
    const path = require('path');
    const publicFolder = path.join(__dirname, 'public');
    const tsSharedFolder = path.join(__dirname, 'shared');
    const buildFolder = path.join(__dirname, 'build');
    const typesFolder = path.join(buildFolder, 'types');
    const imagesTsFile = path.join(typesFolder, 'Images.d.ts');
    const sharedBuildFolder = path.join(buildFolder, 'shared');
    const publicBuildFolder = path.join(buildFolder, 'public');
    const jsBuildFolder = path.join(buildFolder, 'js');
    const jsOutputFolder = path.join(publicBuildFolder, 'js');
    const cssBuildFolder = path.join(publicBuildFolder, 'css');
    const imagesFolder = path.join(publicBuildFolder, 'images');
    const imagesJsFile = path.join(jsOutputFolder, 'images.js');
    const jsFolder = path.join(__dirname, 'build/js');
    const sharedJsFile = path.join(jsFolder, 'shared.js');
    const jsOutputFile = path.join(jsOutputFolder, 'app.js');
    const cssOutputFile = path.join(cssBuildFolder, 'styles.css');

    if (RELEASE && fs.existsSync(buildFolder)) fs.rmdirSync(buildFolder, { recursive: true });

    if (!fs.existsSync(buildFolder)) fs.mkdirSync(buildFolder);
    if (!fs.existsSync(jsBuildFolder)) fs.mkdirSync(jsBuildFolder);
    if (!fs.existsSync(publicBuildFolder)) fs.mkdirSync(publicBuildFolder);
    if (!fs.existsSync(jsOutputFolder)) fs.mkdirSync(jsOutputFolder);
    if (!fs.existsSync(cssBuildFolder)) fs.mkdirSync(cssBuildFolder);
    if (!fs.existsSync(imagesFolder)) fs.mkdirSync(imagesFolder);

    const tsAppFolders = APPS.map(app => path.join(__dirname, app));
    const tsServiceFolders = SERVICES.map(service => path.join(__dirname, service));
    const jsServiceFolders = SERVICES.map(service => path.join(buildFolder, service));

    const tsBuildFolders = [
        tsSharedFolder,
        ...tsAppFolders,
        ...tsServiceFolders,
    ];
    const jsBuildFolders = Object.entries({
        [sharedBuildFolder]: sharedJsFile,
        ...APPS.reduce((acc, app) => {
            acc[path.join(buildFolder, app)] = path.join(jsFolder, app + '.js');
            return acc;
        }, {}),
        [jsFolder]: jsOutputFile,
    });

    const tsBuildTasks = [
        buildSharedFolders(tsSharedFolder, sharedBuildFolder, publicFolder, publicBuildFolder, imagesFolder, imagesJsFile, imagesTsFile, typesFolder, ...tsAppFolders),
        ...tsBuildFolders.map(folder => runTypeScriptCompile(folder, WATCH))
    ];

    if (WATCH) return [];

    let watchers: { close() }[] = [];

    Promise.all(tsBuildTasks).then(async (results) => {
        if (results.some(result => !result)) {
            console.error('TypeScript compilation failed.');
            return;
        }
        console.log('TypeScript compiled.');
        combineAndSaveCss(tsBuildFolders, cssOutputFile);
        for (const [folder, outputFile] of jsBuildFolders) {
            if (!fs.existsSync(folder)) continue;
            combineAndSaveJs(folder, outputFile, outputFile === jsOutputFile ? MAIN : undefined);
        }
        [
            await servePublicFolder(CONFIG, buildFolder, [publicBuildFolder], jsServiceFolders),
            watchSharedFolders(tsSharedFolder, sharedBuildFolder, publicFolder, publicBuildFolder, imagesFolder, imagesJsFile, imagesTsFile, typesFolder, ...tsAppFolders),
            ...jsBuildFolders.map(([folder, outputFile]) => createWatcher(folder, () => combineAndSaveJs(folder, outputFile, outputFile === jsOutputFile ? MAIN : undefined))),
            ...tsBuildFolders.map(folder => createWatcher(folder, (file) => {
                if (file.endsWith('.ts') || file.endsWith('.tsx')) {
                    runTypeScriptCompile(folder, false);
                } else if (file.endsWith('.css')) {
                    combineAndSaveCss(tsBuildFolders, cssOutputFile);
                }
            })),
            createWatcher(publicFolder, (filePath) => {
                copyFile(filePath, makeRelativePath(filePath, publicFolder, publicBuildFolder));
                console.log(`Public file updated: ${filePath}`);
                if (filePath.endsWith('.svg')) {
                    updateImages(imagesFolder, imagesJsFile, imagesTsFile);
                }
            }, true)
        ].forEach(watcher => watchers.push(watcher));
    });
    return watchers;
}

const watchers = execute();

process.on('SIGINT', () => {
    if (watchers.length === 0) process.exit();
    console.log('Stopping watchers...');
    for (const watcher of watchers) watcher.close();
    process.exit();
});