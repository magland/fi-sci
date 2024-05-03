/* eslint-disable @typescript-eslint/no-explicit-any */
import { SmallIconButton } from "@fi-sci/misc";
import { Download } from "@mui/icons-material";
import { FunctionComponent, useCallback, useEffect, useMemo, useState } from "react";
import { DendroJob } from "../../../types/dendro-types";
import { useProject } from "../ProjectPageContext";


type FileViewTableProps = {
    fileName: string
    additionalRows: {
        label: string
        value: any
    }[]
}

const FileViewTable: FunctionComponent<FileViewTableProps> = ({fileName, additionalRows}) => {
    const {files} = useProject()
    const theFile = useMemo(() => {
        if (!files) return undefined
        return files.find(f => (f.fileName === fileName))
    }, [files, fileName])

    const cc = theFile?.content || ''
    const theUrl = cc.startsWith('url:') ? cc.slice('url:'.length) : cc

    return (
        <table className="table1">
            <tbody>
                <tr>
                    <td>Path:</td>
                    <td>{fileName}</td>
                </tr>
                <tr>
                    <td>URL:</td>
                    <td>
                        {theUrl}
                        {theFile && theFile.size && theFile.size < 50e6 ? (
                            <>&nbsp;&nbsp;<DownloadLink url={theUrl} baseFileName={getBaseFileName(theFile.fileName)} /></>
                        ) : ""}
                    </td>
                </tr>
                <tr>
                    <td>Size:</td>
                    <td>{theFile?.size || ''}</td>
                </tr>
                {
                    additionalRows.map(row => (
                        <tr key={row.label}>
                            <td>{row.label}</td>
                            <td>{row.value}</td>
                        </tr>
                    ))
                }
                <tr>
                </tr>
            </tbody>
        </table>
    )
}

type ElapsedTimeComponentProps = {
    job: DendroJob
}

export const ElapsedTimeComponent: FunctionComponent<ElapsedTimeComponentProps> = ({job}) => {
    // if job.status is 'running', then we want to refresh ever 30 seconds
    const [, setRefreshCode] = useState(0)
    const refreshInterval = 30000
    useEffect(() => {
        let canceled = false
        if (['running'].includes(job.status)) {
            const timer = setInterval(() => {
                if (canceled) return
                setRefreshCode(rc => rc + 1)
            }, refreshInterval)
            return () => {
                canceled = true
                clearInterval(timer)
            }
        }
    }, [job.status])

    const truncateToThreeDigits = (x: number) => {
        return Math.floor(x * 1000) / 1000
    }
    if (['completed', 'failed'].includes(job.status)) {
        const elapsed = (job.timestampFinished || 0) - (job.timestampStarted || 0)
        return <span>{truncateToThreeDigits(elapsed)}</span>
    }
    else if (['running'].includes(job.status)) {
        const elapsed = (Date.now() / 1000) - (job.timestampStarted || 0)
        return <span>{Math.floor(elapsed)}</span>
    }
    else {
        return <span></span>
    }
}

const DownloadLink: FunctionComponent<{url: string, baseFileName: string}> = ({url, baseFileName}) => {
    const [status, setStatus] = useState<'idle' | 'downloading' | 'downloaded'>('idle')
    const handleDownload = useCallback(() => {
        if (status === 'downloading') return
        setStatus('downloading')
        ;(async () => {
            const binaryBuf = await fetchBinaryData(url)
            setStatus('downloaded')
            triggerDownload(binaryBuf, baseFileName)
        })()
    }, [url, baseFileName, status])
    if (status === 'downloading') {
        return (
            <span>Downloading...</span>
        )
    }
    return (
        <SmallIconButton icon={<Download />} onClick={handleDownload} />
    )
}

const getBaseFileName = (path: string) => {
    const parts = path.split('/')
    return parts[parts.length - 1]
}

const fetchBinaryData = async (url: string) => {
    const response = await fetch(url)
    const buf = await response.arrayBuffer()
    return new Uint8Array(buf)
}

const triggerDownload = (binaryBuf: Uint8Array, baseFileName: string) => {
    const blob = new Blob([binaryBuf], {type: 'application/octet-stream'})
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = baseFileName
    a.click()
    URL.revokeObjectURL(url)
}

export default FileViewTable