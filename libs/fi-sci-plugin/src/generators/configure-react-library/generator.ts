import {
  generateFiles,
  Tree,
  updateJson,
} from '@nx/devkit';
import * as path from 'path';
import { ConfigureReactLibraryGeneratorSchema } from './schema';
import * as ts from 'typescript';

export async function configureReactLibraryGenerator(
  tree: Tree,
  options: ConfigureReactLibraryGeneratorSchema
) {
  const projectRoot = `libs/${options.name}`;

  // check whether vite.config.ts exists
  const viteConfigExists = tree.exists(`${projectRoot}/vite.config.ts`);
  if (!viteConfigExists) {
    console.warn(`vite.config.ts not found for project ${options.name}`);
    return
  }
  console.info(`Found vite.config.ts for project ${options.name}`);

  const rootPackageJson = JSON.parse(tree.read('package.json').toString('utf-8'));

  generateFiles(tree, path.join(__dirname, 'files'), projectRoot, options);
  updateJson(tree, `${projectRoot}/package.json`, (pkgJson) => {
    pkgJson.exports = {
      ".": {
        "types": "./index.d.ts", // important to add this! nx doesn't do it
        "import": "./index.mjs",
        "require": "./index.js"
      }
    }
    // we want to keep the peerDependencies that are already there
    const peerDependencies = pkgJson.peerDependencies || {};
    const dependencies = {};

    const dependenciesInSource: string[] = getExternalDependenciesInSourceTree(tree, projectRoot);
    for (const k in peerDependencies) {
      if (!dependenciesInSource.includes(k)) {
        // remove the peer dependency if it's not used in the source code
        delete peerDependencies[k];
      }
    }
    for (const dep of dependenciesInSource) {
      if (!peerDependencies[dep]) {
        if (dep === 'react') {
          // react should always be a peer dependency
          peerDependencies[dep] = '*';
        }
        else {
          dependencies[dep] = '*';
        }
      }
    }

    // now set the versions of all the dependencies
    const rootPackageDependencies = rootPackageJson.dependencies || {};
    const getAppropriateVersionString = (dep: string) => {
      if (dep in rootPackageDependencies) {
        return rootPackageDependencies[dep];
      }
      else if (dep.startsWith('@fi-sci/')) {
        // it's an internal dependency, let's track down the version from the appropriate library
        const libName = dep.replace('@fi-sci/', '');
        const libPackageJsonFname = `libs/${libName}/package.json`
        if (!tree.exists(libPackageJsonFname)) {
          // not found, so we'll give a warning and just use *
          console.warn(`Could not find package.json for dependency ${dep} in libs/${libName}`);
          return '*';
        }
        const libPackageJson = JSON.parse(tree.read(libPackageJsonFname).toString('utf-8'));
        return appropriateVersionPrefix(libPackageJson.version) + libPackageJson.version; // note that we add the ^ here
      }
      else {
        // not found, so we'll give a warning and just use *
        console.warn(`Could not find version for dependency ${dep} in root package.json`);
        return '*';
      }
    }
    for (const k in peerDependencies) {
      // for peer dependencies it's trick to know which version to use, so we'll use * for now
      peerDependencies[k] = '*'
    }
    for (const k in dependencies) {
      dependencies[k] = getAppropriateVersionString(k)
    }

    pkgJson.peerDependencies = peerDependencies;
    pkgJson.dependencies = dependencies;

    return pkgJson;
  });
  // await formatFiles(tree);
}

const getExternalDependenciesInSourceTree = (tree: Tree, projectRoot: string): string[] => {
  const dependencies: string[] = [];
  visitAllFiles(tree, `${projectRoot}/src`, (filePath) => {
    if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts')) {
      return;
    }
    const sourceCode = tree.read(filePath).toString('utf-8');
    const deps = getExternalDependenciesInTsCode(sourceCode);
    for (const dep of deps) {
      if (!dependencies.includes(dep)) {
        dependencies.push(dep);
      }
    }
  })
  return dependencies;
}

const getExternalDependenciesInTsCode = (sourceCode: string): string[] => {
  const sourceFile = ts.createSourceFile(
    'temp.tsx',
    sourceCode,
    ts.ScriptTarget.ES2015,
    true // setParentNodes
  );
  const dependencies: string[] = [];
  const visit = (node: ts.Node) => {
    if (ts.isImportDeclaration(node)) {
      let moduleName = node.moduleSpecifier.getText()
        .replace(/'/g, '')
        .replace(/"/g, '');
      if (!moduleName.startsWith('.')) {
        if (moduleName.startsWith('@')) {
          // it's a scoped package, so we need to get the next part
          moduleName = moduleName.split('/')[0] + '/' + moduleName.split('/')[1];
        }
        else {
          // it's a normal package, so we need to get the first part
          moduleName = moduleName.split('/')[0];
        }
        if (!dependencies.includes(moduleName)) {
          dependencies.push(moduleName);
        }
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  return dependencies;
}

function visitAllFiles(
  tree: Tree,
  path: string,
  callback: (filePath: string) => void
) {
  tree.children(path).forEach((fileName) => {
    const filePath = `${path}/${fileName}`;
    if (!tree.isFile(filePath)) {
      visitAllFiles(tree, filePath, callback);
    } else {
      callback(filePath);
    }
  });
}

const appropriateVersionPrefix = (version: string): string => {
  if (version.startsWith('0.')) {
    return '~';
  }
  else if (startsWithDigit(version)) {
    return '^';
  }
  else {
    return '';
  }
}

const startsWithDigit = (s: string): boolean => {
  return /^\d/.test(s);
}

export default configureReactLibraryGenerator;
