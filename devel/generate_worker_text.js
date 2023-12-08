const fs = require('fs');
const { exec } = require('child_process');

/*
The purpose of this script is to generate a .text.ts files for web workers defined in .ts files throughout.
This allows them to be imported as text and used to create web workers without having to use the import.meta.url technique.
The import.meta.url technique is problematic in the following situation:
    (a) The web worker is defined in a library
    (b) The library is imported by a web app that uses vite
    (c) The app is being run in development mode with live reload
In general, a web worker defined by text in a library is much more robust than one defined in a separate file and using import.meta.url.
*/

////////////////////////////////////////////////////////////////
// recursively find all files with .text.ts extension
const findFiles = (dir) => {
    if (dir.includes('node_modules')) {
        return [];
    }
    const ret = [];
    const items = fs.readdirSync(dir);
    for (const item of items) {
        const path = `${dir}/${item}`;
        const stat = fs.statSync(path);
        if (stat.isDirectory()) {
            const a = findFiles(path);
            ret.push(...a);
        } else if (item.endsWith('.text.ts')) {
            ret.push(path);
        }
    }
    return ret;
}
const files = findFiles('libs');
////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////
/* For each file of the form /some/worker.text.ts, we do the following:
    * 1. Compile /some/worker.ts to /some/worker.js
    * 2. Read /some/worker.js and remove the line that defines exports
    * 3. Escape the text and write to /some/worker.text.ts such that it exports the text
    * 4. Delete /some/worker.js
    */
for (const file of files) {
    console.info(file);
    const sourcePath = file.replace('.text.ts', '.ts');
    const sourcePathJs = file.replace('.text.ts', '.js');
    if (!fs.existsSync(sourcePath)) {
        console.error(`File ${sourcePath} does not exist`);
        continue;
    }
    if (fs.existsSync(sourcePathJs)) {
        fs.unlinkSync(sourcePathJs);
    }
    const cmd = `npx tsc ${sourcePath} --esModuleInterop false --target es2020 --module commonjs`
    exec(cmd, (error, stdout, stderr) => {
        console.info(`stdout: ${stdout}`);
        if (error) {
            console.error(`error: ${error.message}`);
            return;
        }
        if (stderr) {
            console.error(`stderr: ${stderr}`);
            return;
        }
        const text = fs.readFileSync(sourcePathJs, 'utf-8');
        const lines = text.split('\n').filter((line) => (
            !line.includes('defineProperty(exports') // a hack to remove reference to exports
        ));
        const text2 = lines.join('\n');
        const textEscaped = text2.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$/g, '\\$');
        const content = `export default \`${textEscaped}\`;`;
        const existingContent = fs.readFileSync(file, 'utf-8');
        if (content === existingContent) {
            console.info(`No change to ${file}`);
        }
        else {
            console.info(`Writing ${file}`)
            fs.writeFileSync(file, content, 'utf-8');
        }
        fs.unlinkSync(sourcePathJs);
    });
}