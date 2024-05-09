import ClonedRepo from "../../../ClonedRepo/ClonedRepo";
import { FunctionComponent, useEffect } from "react";

type Props = {
    width: number
    height: number
}

const HomePage: FunctionComponent<Props> = ({width, height}) => {
    useEffect(() => {
        test1()
    }, [])
    return (
        <div style={{padding: 20}}>
            <h2>Welcome to SpikeForestXYZ</h2>
            <hr />
            <p>
                test
            </p>
        </div>
    )
}

const test1 = async () => {
    // Collect all the URLs from the log.web files in the git-annex branch
    const repoUrl = 'https://github.com/magland/spikeforestxyz-data.git'
    const gitAnnexBranch = await ClonedRepo.load({
        url: repoUrl,
        branch: 'git-annex',
        setStatus: (status: string) => {
            console.info(status)
        }
    })
    const gitAnnexUrls: { [key: string]: string[] } = {}
    const collectGitAnnexUrlsForDir = async (repo: ClonedRepo, d: string) => {
        const {subdirectories, files} = await repo.readDirectory(d)
        for (const f of files) {
            if (f.endsWith('.log.web')) {
                const name = f.split('.')[0] || ''
                const content = await repo.readTextFile(d + '/' + f)
                const lines = content.split('\n')
                const urls: string[] = []
                for (const line of lines) {
                    const vals = line.split(' ')
                    for (const val of vals) {
                        if (val.startsWith('http://') || val.startsWith('https://')) {
                            urls.push(val)
                        }
                    }
                }
                gitAnnexUrls[name] = urls
            }
        }
        for (const sd of subdirectories) {
            await collectGitAnnexUrlsForDir(repo, d + '/' + sd)
        }
    }
    await collectGitAnnexUrlsForDir(gitAnnexBranch, '')
    console.info('gitAnnexUrls', gitAnnexUrls)

    const mainBranch = await ClonedRepo.load({
        url: repoUrl,
        branch: 'main',
        setStatus: (status: string) => {
            console.info(status)
        }
    })
    const allFiles: {[key: string]: {content?: string, urls?: string[]}} = {}
    const collectFiles = async (repo: ClonedRepo, d: string) => {
        const {subdirectories, files, symlinks} = await repo.readDirectory(d)
        for (const f of files) {
            const content = await repo.readTextFile(d + '/' + f)
            allFiles[d + '/' + f] = {content}
        }
        for (const s of symlinks) {
            const targetPath = await repo.getSymlinkTarget(d + '/' + s)
            const lastPart = targetPath.split('/').slice(-1)[0]
            const val1 = (lastPart || '').split('.')[0]
            if (val1 in gitAnnexUrls) {
                allFiles[d + '/' + s] = {urls: gitAnnexUrls[val1]}
            }
            else {
                console.warn('No git annex urls for', val1)
            }
        }
        for (const sd of subdirectories) {
            await collectFiles(repo, d + '/' + sd)
        }
    }
    await collectFiles(mainBranch, '')
    console.info('allFiles', allFiles)
}

export default HomePage