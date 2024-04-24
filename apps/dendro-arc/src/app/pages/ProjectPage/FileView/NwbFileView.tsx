/* eslint-disable @typescript-eslint/no-explicit-any */
import { Hyperlink } from "@fi-sci/misc";
import ModalWindow, { useModalWindow } from "@fi-sci/modal-window";
import { RemoteH5File, getRemoteH5File } from '@fi-sci/remote-h5-file';
import { FunctionComponent, useCallback, useEffect, useMemo, useState } from "react";
import LoadNwbInPythonWindow from "../LoadNwbInPythonWindow/LoadNwbInPythonWindow";
import { useProject } from "../ProjectPageContext";


type Props = {
    fileName: string
    width: number
    height: number
}

export const useNwbFile = (nwbUrl?: string) => {
    const [nwbFile, setNwbFile] = useState<RemoteH5File | undefined>(undefined)
    useEffect(() => {
        let canceled = false
        if (!nwbUrl) return
        ; (async () => {
            const resolvedNwbUrl = await getResolvedUrl(nwbUrl)
            const f = await getRemoteH5File(resolvedNwbUrl, undefined)
            if (canceled) return
            setNwbFile(f)
        })()
        return () => {canceled = true}
    }, [nwbUrl])
    return nwbFile
}

export const useElectricalSeriesPaths = (nwbFile: RemoteH5File | undefined) => {
    const [electricalSeriesPaths, setElectricalSeriesPaths] = useState<string[] | undefined>(undefined)
    useEffect(() => {
        let canceled = false
        setElectricalSeriesPaths(undefined)
        ; (async () => {
            if (!nwbFile) return
            const grp = await nwbFile.getGroup('acquisition')
            if (canceled) return
            if (!grp) return
            const pp: string[] = []
            for (const sg of grp.subgroups) {
                if (sg.attrs['neurodata_type'] === 'ElectricalSeries') {
                    pp.push(sg.path)
                }
            }
            setElectricalSeriesPaths(pp)
        })()
        return () => {canceled = true}
    }, [nwbFile])
    return electricalSeriesPaths
}

export const useUnitsPaths = (nwbFile: RemoteH5File | undefined) => {
    const [unitsPaths, setUnitsPaths] = useState<string[] | undefined>(undefined)
    useEffect(() => {
        let canceled = false
        setUnitsPaths(undefined)
        ; (async () => {
            const foundPaths: string[] = []
            if (!nwbFile) return
            const grp = await tryGetGroup(nwbFile, '/units')
            if (canceled) return
            if (grp) {
                foundPaths.push('/units')
            }
            const processingEcephysGroup = await tryGetGroup(nwbFile, '/processing/ecephys')
            if (canceled) return
            if (processingEcephysGroup) {
                for (const sg of processingEcephysGroup.subgroups) {
                    if (sg.attrs['neurodata_type'] === 'Units') {
                        foundPaths.push(sg.path)
                    }
                }
            }
            setUnitsPaths(foundPaths)
        })()
        return () => {canceled = true}
    }, [nwbFile])
    return unitsPaths
}

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
    const theUri = theFile ? `dendro:?file_id=${theFile.fileId}&project=${theFile.projectId}&label=${theFile.fileName}` : ''

    return (
        <table className="table1">
            <tbody>
                <tr>
                    <td>Path:</td>
                    <td>{fileName}</td>
                </tr>
                <tr>
                    <td>URL:</td>
                    <td>{theUrl}</td>
                </tr>
                <tr>
                    <td>URI:</td>
                    <td>{theUri}</td>
                </tr>
                <tr>
                    <td>Metadata:</td>
                    <td>{theFile ? JSON.stringify(theFile.metadata || {}) : ''}</td>
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

const NwbFileView: FunctionComponent<Props> = ({fileName, width, height}) => {
    const {project, files} = useProject()

    const nbFile = useMemo(() => {
        if (!files) return undefined
        return files.find(f => (f.fileName === fileName))
    }, [files, fileName])

    const cc = nbFile?.content || ''
    const nwbUrl = cc.startsWith('url:') ? cc.slice('url:'.length) : cc
    // const nwbFile = useNwbFile(nwbUrl)
    // const electricalSeriesPaths = useElectricalSeriesPaths(nwbFile)

    const handleOpenInNeurosift = useCallback(() => {
        const additionalQueryParams = ''
        let u = `https://flatironinstitute.github.io/neurosift/?p=/nwb&url=${nwbUrl}${additionalQueryParams}`
        if (fileName.endsWith('.json')) {
            u += '&st=lindi'
        }
        window.open(u, '_blank')
    }, [nwbUrl, fileName])

    const {visible: loadNwbInPythonWindowVisible, handleOpen: openLoadNwbInPythonWindow, handleClose: closeLoadNwbInPythonWindow} = useModalWindow()

    return (
        <div style={{position: 'absolute', width, height, background: 'white'}}>
            <hr />
            <FileViewTable
                fileName={fileName}
                additionalRows={[]}
            />
            <div>&nbsp;</div>
            <ul>
            {
                nwbUrl && (
                    <li>
                        <Hyperlink onClick={handleOpenInNeurosift}>Open NWB file in Neurosift</Hyperlink>
                    </li>
                )
            }
            {
                nwbUrl && (
                    <li>
                        <Hyperlink onClick={openLoadNwbInPythonWindow}>Load NWB file in Python</Hyperlink>
                    </li>
                )
            }
            </ul>
            <div>&nbsp;</div>
            <hr />
            <ModalWindow
                visible={loadNwbInPythonWindowVisible}
                onClose={closeLoadNwbInPythonWindow}
            >
                {project && <LoadNwbInPythonWindow
                    onClose={closeLoadNwbInPythonWindow}
                    project={project}
                    fileName={fileName}
                />}
            </ModalWindow>
        </div>
    )
}

export const getAuthorizationHeaderForUrl = (url?: string) => {
    if (!url) return ''
    let key = ''
    if (url.startsWith('https://api-staging.dandiarchive.org/')) {
      key = localStorage.getItem('dandiStagingApiKey') || ''
    }
    else if (url.startsWith('https://api.dandiarchive.org/')) {
      key = localStorage.getItem('dandiApiKey') || ''
    }
    if (key) return 'token ' + key
    else return ''
}

const getResolvedUrl = async (url: string) => {
    if (isDandiAssetUrl(url)) {
        const authorizationHeader = getAuthorizationHeaderForUrl(url)
        const headers = authorizationHeader ? {Authorization: authorizationHeader} : undefined
        const redirectUrl = await getRedirectUrl(url, headers)
        if (redirectUrl) {
            return redirectUrl
        }
    }
    return url
}

const headRequest = async (url: string, headers?: any) => {
    // Cannot use HEAD, because it is not allowed by CORS on DANDI AWS bucket
    // let headResponse
    // try {
    //     headResponse = await fetch(url, {method: 'HEAD'})
    //     if (headResponse.status !== 200) {
    //         return undefined
    //     }
    // }
    // catch(err: any) {
    //     console.warn(`Unable to HEAD ${url}: ${err.message}`)
    //     return undefined
    // }
    // return headResponse

    // Instead, use aborted GET.
    const controller = new AbortController();
    const signal = controller.signal;
    const response = await fetch(url, {
        signal,
        headers
    })
    controller.abort();
    return response
}

const getRedirectUrl = async (url: string, headers: any) => {
    // This is tricky. Normally we would do a HEAD request with a redirect: 'manual' option.
    // and then look at the Location response header.
    // However, we run into mysterious cors problems
    // So instead, we do a HEAD request with no redirect option, and then look at the response.url
    const response = await headRequest(url, headers)
    if (response.url) return response.url

    // if (response.type === 'opaqueredirect' || (response.status >= 300 && response.status < 400)) {
    //     return response.headers.get('Location')
    // }

    return null // No redirect
  }

const isDandiAssetUrl = (url: string) => {
    if (url.startsWith('https://api-staging.dandiarchive.org/api/')) {
      return true
    }
    if (url.startsWith('https://api.dandiarchive.org/api/')) {
      return true
    }
}

const tryGetGroup = async (nwbFile: RemoteH5File | undefined, path: string) => {
    if (!nwbFile) return undefined
    if (!path) return
    try {
        return await nwbFile.getGroup(path)
    }
    catch(err: any) {
        return undefined
    }
}

export default NwbFileView