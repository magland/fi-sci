const fs = require('fs');
const { exec } = require('child_process');

const main = async () => {
    // get all libraries in libs/* folders
    const entries = await fs.promises.readdir('libs');
    const libraryNamesToPublish = [];
    for (const entry of entries) {
        // check whether it is a directory
        const isDir = (await fs.promises.lstat(`libs/${entry}`)).isDirectory();
        if (!isDir) continue;
        // check whether there is a package.json file and a vite.config.ts file
        const hasPackageJson = await fileExists(`libs/${entry}/package.json`);
        const hasViteConfig = await fileExists(`libs/${entry}/vite.config.ts`);
        if (!hasPackageJson || !hasViteConfig) continue;
        // add the library name to the list
        libraryNamesToPublish.push(entry);
    }

    for (const libraryName of libraryNamesToPublish) {
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
    const cwd = process.cwd();
    await execAsync(`npm publish ${distDir} --access public`);
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