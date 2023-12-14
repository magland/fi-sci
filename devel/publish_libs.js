const fs = require('fs');
const { exec } = require('child_process');

const main = async () => {
  // read file with list of libraries to publish
  const forToPublishFname = 'libs/for_to_publish.txt';
  const forToPublish = await fs.promises.readFile(forToPublishFname, 'utf-8');
  const forToPublishLines = forToPublish.split('\n');
  let libraryNamesToPublish = forToPublishLines
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .filter((line) => !line.startsWith('#'));
  // it's important to publish libraries in the right order, so that dependencies are published first
  // that way we are sure that the published version of the dependency is available when the dependent library is published
  const dependencyGraph = await getDependencyGraph(libraryNamesToPublish);
  libraryNamesToPublish = sortAccordingToDependencies(libraryNamesToPublish, dependencyGraph);

  for (const libraryName of libraryNamesToPublish) {
    // make sure the library has a vite.config.ts file
    const libSourceDir = `libs/${libraryName}`;
    const hasViteConfig = await fileExists(`${libSourceDir}/vite.config.ts`);
    if (!hasViteConfig) {
      console.warn(`Library ${libraryName} has no vite.config.ts file. Not publishing.`);
      continue;
    }
    // check whether the library is up to date on npm
    const versionOnNpm = await getVersionOnNpm('@fi-sci/' + libraryName);
    const versionLocal = await getVersionLocal(libSourceDir + '/package.json');
    if (versionOnNpm === versionLocal) {
      console.log(`Library ${libraryName} is up to date.`);
      continue;
    }
    let allDependenciesAreCompatible = true;
    for (const dependencyLibraryName of dependencyGraph[libraryName]) {
      const compatible = await checkPackageIsCompatibleWithVersionOnNpm(`dist/libs/${dependencyLibraryName}`);
      if (!compatible) {
        console.warn(`Library ${dependencyLibraryName} is not compatible with the version on npm.`);
        allDependenciesAreCompatible = false;
        break;
      }
    }
    if (!allDependenciesAreCompatible) {
      // we abort in this case to draw attention to the issue in the CI
      // that way, if CI succeeds we know that everythin has been published correctly
      throw Error(`Library ${libraryName} has a dependency that is not compatible with the version on npm. Aborting.`);
    }
    const libDistDir = `dist/libs/${libraryName}`;
    await publishLibrary(libraryName, libDistDir);
  }
};

const fileExists = async (path) => {
  return new Promise((resolve, reject) => {
    fs.access(path, fs.constants.F_OK, (err) => {
      if (err) resolve(false);
      else resolve(true);
    });
  });
};

const getVersionOnNpm = async (packageName) => {
  // Retrieves the version of a package on the npm registry. It uses the npm view command to fetch the version of the specified package.
  try {
    const versionOnNpm = await execAsync(`npm view ${packageName} version`);
    return versionOnNpm.trim();
  } catch (err) {
    // presumably the package is not yet published on npm
    // but if this is just a network error, it's not the end of the world... the publish will just fail
    return undefined;
  }
};

const getVersionLocal = async (packageJsonFname) => {
  // Reads the package.json file of a library and returns the version specified in the file.
  const packageJsonText = await fs.promises.readFile(packageJsonFname, 'utf-8');
  const packageJson = JSON.parse(packageJsonText);
  return packageJson.version;
};

const publishLibrary = async (libraryName, distDir) => {
  // handles the publishing process for a library.
  console.info(`Publishing library ${libraryName}...`);
  const txt = '//registry.npmjs.org/:_authToken=${NPM_TOKEN}';
  await fs.promises.writeFile(`${distDir}/.npmrc`, txt);
  const cwd = process.cwd();
  process.chdir(distDir);
  await execAsync(`npm publish --access public`);
  process.chdir(cwd);
};

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

const getDependencyGraph = async (libraryNames) => {
  // Builds a dependency graph for a set of libraries.
  // The result is a map from library names to lists of library names.
  // The list of library names is the list of dependencies of the library.
  const dependencyGraph = {};
  for (const libraryName of libraryNames) {
    const packageJson = JSON.parse(fs.readFileSync(`libs/${libraryName}/package.json`, 'utf-8'));
    const dependencies = Object.keys(packageJson.dependencies || {});
    const peerDependencies = Object.keys(packageJson.peerDependencies || {});
    const allDependencies = [...dependencies, ...peerDependencies];
    const dependencyLibraryNames = allDependencies.filter((d) => d.startsWith('@fi-sci/')).map((d) => d.split('/')[1]);
    dependencyGraph[libraryName] = dependencyLibraryNames;
  }
  return dependencyGraph;
};

const sortAccordingToDependencies = (libraryNamesToPublish, dependencyGraph) => {
  // it's important to publish libraries in the right order, so that dependencies are published first
  // that way we are sure that the published version of the dependency is available when the dependent library is published
  // we use a topological sort to determine the right order

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
};

const compatibilityCache = {};
const checkPackageIsCompatibleWithVersionOnNpm = async (distDir) => {
  if (distDir in compatibilityCache) {
    return compatibilityCache[distDir];
  }
  const absDistDir = `${process.cwd()}/${distDir}`; // important because we will change the current working directory below
  const packageJsonText = await fs.promises.readFile(`${absDistDir}/package.json`, 'utf-8');
  const packageJson = JSON.parse(packageJsonText);
  const packageName = packageJson.name;
  const randomString = Math.random().toString(36).substring(7);
  const temporaryDirName = `/tmp/fi-sci-check-${randomString}`;
  await fs.promises.mkdir(temporaryDirName);
  const cwd = process.cwd();
  try {
    process.chdir(temporaryDirName);
    await execAsync(`npm pack ${packageName}`);
    const tarballPath = await findTarball(temporaryDirName);
    await execAsync(`tar -xzf ${tarballPath}`);
    const compatible = await checkCompatibilityOfPackageDirs(absDistDir, temporaryDirName + '/package');
    compatibilityCache[distDir] = compatible;
    return compatible;
  } catch (err) {
    console.warn(`Error while checking compatibility of package ${packageName}: ${err}`);
    return false;
  } finally {
    // clean up the temporary directory
    process.chdir(cwd);
    await fs.promises.rm(temporaryDirName, { recursive: true });
  }
};

const findTarball = async (dir) => {
  const files = await fs.promises.readdir(dir);
  for (const file of files) {
    if (file.endsWith('.tgz')) {
      return `${dir}/${file}`;
    }
  }
  throw new Error(`No tarball found in directory ${dir}`);
};

const checkCompatibilityOfPackageDirs = async (dir1, dir2) => {
  console.info(`Checking compatibility of ${dir1} and ${dir2}...`);
  const allDTsFiles1 = await getAllDTsFiles(dir1);
  const allDTsFiles2 = await getAllDTsFiles(dir2);
  const allDTsFiles1Set = new Set(allDTsFiles1);
  const allDTsFiles2Set = new Set(allDTsFiles2);
  const missingFiles1 = allDTsFiles2.filter((f) => !allDTsFiles1Set.has(f));
  const missingFiles2 = allDTsFiles1.filter((f) => !allDTsFiles2Set.has(f));
  if (missingFiles1.length > 0) {
    console.info(`Files ${missingFiles1.map((f) => `${dir2}/${f}`).join(', ')} are missing in ${dir1}.`);
    return false;
  }
  if (missingFiles2.length > 0) {
    console.info(`Files ${missingFiles2.map((f) => `${dir1}/${f}`).join(', ')} are missing in ${dir2}.`);
    return false;
  }
  for (const file of allDTsFiles1) {
    const content1 = await fs.promises.readFile(`${dir1}/${file}`, 'utf-8');
    const content2 = await fs.promises.readFile(`${dir2}/${file}`, 'utf-8');
    if (content1 !== content2) {
      console.info(`Files ${dir1}/${file} and ${dir2}/${file} are not compatible.`);
      return false;
    }
  }
  console.info(`Compatibility check successful. Checked ${allDTsFiles1.length} files.`);
  return true;
};

const getAllDTsFiles = async (dir) => {
  const files = await fs.promises.readdir(dir);
  const result = [];
  for (const file of files) {
    if (file.endsWith('.d.ts')) {
      result.push(file);
    } else {
      const subDir = `${dir}/${file}`;
      if (await isDirectory(subDir)) {
        const subResult = await getAllDTsFiles(subDir);
        const newFiles = subResult.map((f) => `${file}/${f}`);
        result.push(...newFiles);
      }
    }
  }
  return result;
};

const isDirectory = async (path) => {
  return new Promise((resolve, reject) => {
    fs.stat(path, (err, stats) => {
      if (err) resolve(false);
      else resolve(stats.isDirectory());
    });
  });
};

main();
