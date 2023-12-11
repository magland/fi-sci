import YAML from 'js-yaml'

const processMarkdown = (source: string, o: {internalFigureMode: boolean}) => {
    let lines = source.split('\n')

    const frontMatter = parseFrontMatter(lines)
    lines = removeFrontMatter(lines)

    const citationsDirective: number | string | undefined = frontMatter['citations-directive']
    if (citationsDirective === 1) {
        lines = processCitations(lines)
    }

    const title: string | undefined = frontMatter['title']
    if (title) {
        document.title = title
    }

    const lines2: string[] = []

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        if (isValidFigureLine(line)) {
            const opts = getYamlOpts(lines.slice(i + 1))
            const height = opts.height || 700
            // const src = line + '&hide=1'
            const src = line
            // const newLine = `<iframe src="${src}" width="100%" height="${height}" frameBorder="0"></iframe>`
            const newLine = `<div class="figurl-figure" src="${src}" height="${height}"></div>`
            lines2.push(newLine)
            lines2.push('')
        }
        else if ((o.internalFigureMode) && (line.startsWith("!["))) {
            const opts = getYamlOpts(lines.slice(i + 1))
            const imageFileName = opts.name
            if (!imageFileName) {
                throw Error(`No name for image on line ${i + 1} of markdown file.`)
            }
            const i1 = line.indexOf('(')
            const i2 = line.indexOf(')')
            const newLine = line.slice(0, i1 + 1) + `./images/${imageFileName}` + line.slice(i2)
            lines2.push(newLine)
        }
        else lines2.push(line)
    }

    return lines2.join('\n')
}

function isValidFigureLine(line: string) {
    if (!line.startsWith('https://figurl.org/f?')) return false
    if (line !== line.trim()) return false
    // todo: additional checks
    return true
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getYamlOpts(lines: string[]): {[key: string]: any} {
    if (lines.length === 0) return {}
    if (lines[0].trim() !== '<!--') return {}
    let j = 1
    while ((j < lines.length) && (lines[j].trim() !== '-->')) {
        j ++
    }
    if (j >= lines.length) return {}
    const lines2 = lines.slice(1, j)
    const yaml = lines2.join('\n')
    try {
        return YAML.load(yaml) || {}
    }
    catch(err) {
        return {}
    }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseFrontMatter(lines: string[]): {[key: string]: any} {
    const line0 = lines[0]
    if (line0.trim() !== '---') return {}
    const ind1 = lines.findIndex((v, i) => ((i > 0) && (v.trim() === '---')))
    if (ind1 < 0) return {}
    const yaml = lines.slice(1, ind1).join('\n')
    try {
        return YAML.load(yaml) || {}
    }
    catch(err) {
        return {}
    }
}

function removeFrontMatter(lines: string[]): string[] {
    const line0 = lines[0]
    if (line0.trim() !== '---') return lines
    const ind1 = lines.findIndex((v, i) => ((i > 0) && (v.trim() === '---')))
    if (ind1 < 0) return lines
    return lines.slice(ind1 + 1)
}

function processCitations(lines: string[]): string[] {
    const bibInd = lines.findIndex(a => (a.trim() === '<!--bibliography-->'))
    if (bibInd < 0) return lines

    const linesBody = lines.slice(0, bibInd)
    const linesBib = lines.slice(bibInd)
    const citationMap: {[key: string]: {num: number}} = {}

    const linesBib2: string[] = []
    let lastNum = 0
    for (const line of linesBib) {
        let newLine = line
        if (line.startsWith('\\[@')) {
            const i1 = line.indexOf('\\]')
            if (i1 >= 0) {
                lastNum += 1
                const key = line.slice(3, i1)
                newLine = `<a name="ref-${key}"></a>\\[${lastNum}\\]${line.slice(i1 + 2)}`
                citationMap[key] = {num: lastNum}
            }
        }
        else if (line.startsWith('[@')) {
            const i1 = line.indexOf(']')
            if (i1 >= 0) {
                lastNum += 1
                const key = line.slice(2, i1)
                newLine = `<a name="ref-${key}"></a>[${lastNum}]${line.slice(i1 + 1)}`
                citationMap[key] = {num: lastNum}
            }
        }
        linesBib2.push(newLine)
    }

    const linesBody2: string[] = []
    function processBracketedPart(str: string) {
        return handleSeparatedParts(str, [',', ';'], a => {
            if ((a.startsWith('@')) && (a.slice(1) in citationMap)) {
                const key = a.slice(1)
                const num = citationMap[key].num
                return `<a href="#ref-${key}">${num}</a>`
            }
            else return a
        })
    }
    for (const line of linesBody) {
        const newLine = handleBracketedParts(line, processBracketedPart)
        linesBody2.push(newLine)
    }
    return [...linesBody2, ...linesBib2]
}

function handleBracketedParts(a: string, handler: (x: string) => string) {
    return a.split('[').map((part1, i) => {
        if (i > 0) {
            const jj = part1.indexOf(']')
            if (jj >= 0) {
                return handler(part1.slice(0, jj)) + part1.slice(jj)
            }
            else {
                return part1
            }
        }
        else return part1
    }).join('[')
}

function handleSeparatedParts(a: string, delimiters: string[], handler: (x: string) => string): string {
    for (const d of delimiters) {
        if (a.split(d).length > 1) {
            return a.split(d).map(x => (handleSeparatedParts(x, delimiters, handler))).join(d)
        }
    }
    if (a.startsWith(' ')) {
        return ' ' + handler(a.slice(1))
    }
    else {
        return handler(a)
    }
}

export default processMarkdown