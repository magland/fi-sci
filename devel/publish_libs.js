const fs = require('fs');
const { exec } = require('child_process');

const main = async () => {
    // read file with list of libraries to publish
    const forToPublishFname = 'libs/for_to_publish.txt';
    const forToPublish = await fs.promises.readFile(forToPublishFname, 'utf-8');
    const forToPublishLines = forToPublish.split('\n');
    let libraryNamesToPublish = forToPublishLines.map(line => line.trim()).filter(line => line.length > 0).filter(line => !line.startsWith('#'));
    // it's important to publish libraries in the right order, so that dependencies are published first
    // that way we are sure that the published version of the dependency is available when the dependent library is published
    libraryNamesToPublish = sortAccordingToDependencies(libraryNamesToPublish);

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
    try {
        const versionOnNpm = await execAsync(`npm view ${packageName} version`);
        return versionOnNpm.trim();
    }
    catch (err) {
        // presumably the package is not yet published on npm
        // but if this is just a network error, it's not the end of the world... the publish will just fail
        return undefined;
    }
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

const sortAccordingToDependencies = (libraryNamesToPublish) => {
    // it's important to publish libraries in the right order, so that dependencies are published first
    // that way we are sure that the published version of the dependency is available when the dependent library is published
    // we use a topological sort to determine the right order

    // first, we build a dependency graph
    const dependencyGraph = {}; // libraryName -> [dependencyLibraryName]
    for (const libraryName of libraryNamesToPublish) {
        const packageJson = JSON.parse(fs.readFileSync(`libs/${libraryName}/package.json`, 'utf-8'));
        const dependencies = Object.keys(packageJson.dependencies || {});
        const peerDependencies = Object.keys(packageJson.peerDependencies || {});
        const allDependencies = [...dependencies, ...peerDependencies];
        const dependencyLibraryNames = allDependencies.filter(d => d.startsWith('@fi-sci/')).map(d => d.split('/')[1]);
        dependencyGraph[libraryName] = dependencyLibraryNames;
    }

    // then, we do a topological sort
    // https://en.wikipedia.org/wiki/Topological_sorting#Depth-first_search
    const sortedLibraryNames = []; // this will be the result
    const visitedLibraryNames = new Set(); // these are the libraries that have been visited
    const visitingLibraryNames = new Set(); // these are the libraries that are currently being visited
    const visit = (libraryName) => {
        if (visitedLibraryNames.has(libraryName)) {
            // if we have already visited this library, we don't need to visit it again
            return;
        }
        if (visitingLibraryNames.has(libraryName)) {
            // if we are currently visiting this library, we have a circular dependency
            console.warn(`Circular dependency detected: ${[...visitingLibraryNames, libraryName].join(' -> ')}`);
            throw new Error(`Circular dependency detected: ${[...visitingLibraryNames, libraryName].join(' -> ')}`);
        }
        visitingLibraryNames.add(libraryName); // mark this library as currently being visited
        for (const dependencyLibraryName of dependencyGraph[libraryName]) {
            visit(dependencyLibraryName); // visit all dependencies
        }
        visitingLibraryNames.delete(libraryName); // mark this library as no longer being visited
        visitedLibraryNames.add(libraryName); // mark this library as visited
        sortedLibraryNames.push(libraryName); // add this library to the result, because all its dependencies have been visited
    };
    // now we start visiting all libraries that we want to publish
    for (const libraryName of libraryNamesToPublish) {
        visit(libraryName);
    }

    // and we return the result
    return sortedLibraryNames;
}

main();