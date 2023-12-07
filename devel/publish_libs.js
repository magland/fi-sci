const fs = require('fs');
const { exec } = require('child_process');

const main = async () => {
    // read file with list of libraries to publish
    const forToPublishFname = 'libs/for_to_publish.txt';
    const forToPublish = await fs.promises.readFile(forToPublishFname, 'utf-8');
    const forToPublishLines = forToPublish.split('\n');
    const libraryNamesToPublish = forToPublishLines.map(line => line.trim()).filter(line => line.length > 0).filter(line => !line.startsWith('#'));

    for (const libraryName of libraryNamesToPublish) {
        // make sure the library has a vite.config.ts file
        const libDir = `libs/${libraryName}`;
        const hasViteConfig = await fileExists(`${libDir}/vite.config.ts`);
        if (!hasViteConfig) {
            console.warn(`Library ${libraryName} has no vite.config.ts file. Not publishing.`);
            continue;
        }
        // check whether the library is up to date on npm
        const distDir = `dist/libs/${libraryName}`;
        const versionOnNpm = await getVersionOnNpm('@fi-sci/' + libraryName);
        const versionLocal = await getVersionLocal(distDir + '/package.json');
        if (versionOnNpm === versionLocal) {
            console.log(`Library ${libraryName} is up to date.`);
            continue;
        }
        await publishLibrary(libraryName, distDir);
    }
}

const fileExists = async (path) => {
    return new Promise((resolve, reject) => {
        fs.access(path, fs.constants.F_OK, (err) => {
            if (err) resolve(false);
            else resolve(true);
        });
    });
};

const getVersionOnNpm = async (packageName) => {
    return new Promise((resolve, reject) => {
        exec(`npm view ${packageName} version`, (err, stdout, stderr) => {
            if (err) {
                resolve(undefined);
                return
            }
            resolve(stdout.trim());
        });
    });
};

const getVersionLocal = async (packageJsonFname) => {
    const packageJsonText = await fs.promises.readFile(packageJsonFname, 'utf-8');
    const packageJson = JSON.parse(packageJsonText);
    return packageJson.version;
}

const publishLibrary = async (libraryName, distDir) => {
    console.log(`Publishing library ${libraryName}...`);
    const txt = '//registry.npmjs.org/:_authToken=${NPM_TOKEN}';
    await fs.promises.writeFile(`${distDir}/.npmrc`, txt);
    const cwd = process.cwd();
    process.chdir(distDir);
    await execAsync(`npm publish --access public`);
    process.chdir(cwd);
}

const execAsync = async (command) => {
    return new Promise((resolve, reject) => {
        exec(command, (err, stdout, stderr) => {
            if (err) {
                console.log(`Error while executing command "${command}":`);
                console.log(stderr);
                reject(err);
                return;
            }
            resolve(stdout);
        });
    });
};


main();