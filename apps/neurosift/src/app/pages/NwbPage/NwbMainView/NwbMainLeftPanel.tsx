/* eslint-disable @typescript-eslint/no-explicit-any */
import { Hyperlink } from "@fi-sci/misc"
import { RemoteH5FileX } from "@fi-sci/remote-h5-file"
import { FunctionComponent, useEffect, useMemo, useState } from "react"
import useRoute from "../../../useRoute"
import { serializeBigInt, valueToElement } from "../BrowseNwbView/BrowseNwbView"
import { useDandiAssetContext } from "../DandiAssetContext"
import { useNwbFile } from "../NwbFileContext"
import { useNwbOpenTabs } from "../NwbOpenTabsContext"
import ViewObjectNoteIconThing from "../ObjectNote/ViewObjectNoteIconThing"
import getAuthorizationHeaderForUrl from "../getAuthorizationHeaderForUrl"
import { useDatasetData, useGroup } from "./NwbMainView"
import SelectedNeurodataItemsWidget from "./SelectedNeurodataItemsWidget"
import ModalWindow, { useModalWindow } from "@fi-sci/modal-window"
import SupplementalDendroFilesView from "./SupplementalDendroFilesView"
import { useSupplementalDendroFiles } from "../SupplementalDendroFilesContext"

type Props = {
    width: number
    height: number
    nwbFile: RemoteH5FileX
    usingLindi: boolean
}

const labelMap: {name: string, newName: string, renderer?: (val: any) => string}[] = [
    {name: 'session_id', newName: 'Session ID'},
    {name: 'experimenter', newName: 'Experimenter', renderer: (val: any) => {
        if (!val) return ''
        if (Array.isArray(val)) {
            return val.join('; ')
        }
        else return val + ''
    }},
    {name: 'lab', newName: 'Lab'},
    {name: 'institution', newName: 'Institution'},
    {name: 'related_publications', newName: 'Related publications'},
    {name: 'experiment_description', newName: 'Experiment description'},
    {name: 'session_description', newName: 'Session description'},
    {name: 'identifier', newName: 'Identifier'},
    {name: 'session_start_time', newName: 'Session start'},
    {name: 'timestamps_reference_time', newName: 'Timestamps ref.'},
    {name: 'file_create_date', newName: 'File creation'},
]

const NwbMainLeftPanel: FunctionComponent<Props> = ({width, height, nwbFile, usingLindi}) => {
    const rootGroup = useGroup(nwbFile, '/')
    const generalGroup = useGroup(nwbFile, '/general')

    const {openTab} = useNwbOpenTabs()

    const items = useMemo(() => {
        const ret: {name: string, path: string, renderer?: (val: any) => string}[] = []
        rootGroup?.datasets.forEach(ds => {
            const mm = labelMap.find(x => (x.name === ds.name))
            const newName = mm?.newName || ds.name
            ret.push({name: newName || ds.name, path: ds.path, renderer: mm?.renderer})
        })
        generalGroup?.datasets.forEach(ds => {
            const mm = labelMap.find(x => (x.name === ds.name))
            const newName = mm?.newName || ds.name
            ret.push({name: newName || ds.name, path: ds.path, renderer: mm?.renderer})
        })
        return ret
    }, [rootGroup, generalGroup])

    const itemsSorted = useMemo(() => {
        const ret = [...items]
        ret.sort((a, b) => {
            const ind1 = labelMap.findIndex(x => (x.newName === a.name))
            const ind2 = labelMap.findIndex(x => (x.newName === b.name))
            if ((ind1 >= 0)) {
                if (ind2 < 0) return -1
                return ind1 - ind2
            }
            if ((ind2 >= 0)) {
                if (ind1 < 0) return 1
                return ind1 - ind2
            }
            return a.name.localeCompare(b.name)
        })
        return ret
    }, [items])

    const bottomBarHeight = 23
    return (
        <div className="LeftPanel" style={{position: 'absolute', width, height}}>
            <div className="MainArea" style={{position: 'absolute', width, height: height - bottomBarHeight, overflowY: 'auto'}}>
                <DandiTable />
                {
                    usingLindi && (
                        <div>
                            <div style={{color: 'darkgreen', fontSize: 10}}>
                                Using LINDI
                            </div>
                            <hr />
                        </div>
                    )
                }
                <table
                    className="nwb-table"
                >
                    <tbody>
                        {
                            itemsSorted.map(item => (
                                <tr key={item.name}>
                                    <td>{item.name}</td>
                                    <td><DatasetDataView nwbFile={nwbFile} path={item.path} renderer={item.renderer} /></td>
                                </tr>
                            ))
                        }
                        <tr>
                            <td>NWB version</td>
                            <td>{rootGroup?.attrs['nwb_version'] || 'Loading...'}</td>
                        </tr>
                    </tbody>
                </table>
                <hr />
                <SelectedNeurodataItemsWidget />
            </div>
            <div style={{position: 'absolute', width, height: bottomBarHeight, top: height - bottomBarHeight, backgroundColor: 'lightgray'}}>
                <button
                    onClick={() => {
                        openTab('timeseries-alignment')
                    }}
                >
                    View timeseries alignment
                </button>
            </div>
        </div>
    )
}

type DatasetDataViewProps = {
    nwbFile: RemoteH5FileX
    path: string
    renderer?: (val: any) => string
}

const DatasetDataView: FunctionComponent<DatasetDataViewProps> = ({nwbFile, path, renderer}) => {
    const {data: datasetData} = useDatasetData(nwbFile, path)
    if (!datasetData) return <span>Loading...</span>
    if ((typeof(datasetData) === 'string') && (datasetData.length > 500)) {
        return (
            <div style={{height: 100, overflowY: 'auto'}}>
                {datasetData}
            </div>
        )
    }
    return <span>{
        renderer ? renderer(datasetData) : abbreviate(valueToString2(datasetData), 500)
    }</span>
}

const valueToString2 = (val: any): string => {
    // same as valueToString, but don't include the brackets for arrays
    if (typeof(val) === 'string') {
        return val
    }
    else if (typeof(val) === 'number') {
        return val + ''
    }
    else if (typeof(val) === 'boolean') {
        return val ? 'true' : 'false'
    }
    else if (typeof(val) === 'object') {
        if (Array.isArray(val)) {
            return `${val.map(x => valueToElement(x)).join(', ')}`
        }
        else {
            return JSON.stringify(serializeBigInt(val))
        }
    }
    else {
        return '<>'
    }
}

const abbreviate = (str: string, maxLength: number) => {
    if (str.length <= maxLength) return str
    return str.slice(0, maxLength) + '...'
}

// type DandiAssetInfo = {
//     dandiset_id: string
//     dandiset_version_id: string
//     dandi_asset_id: string
//     dandi_asset_path: string
//     dandi_asset_size: number
//     dandi_asset_blob_id: string
// }

export type DandisetInfo = {
    id: string,
    doi: string,
    url: string,
    name: string
    // others
}

const DandiTable = () => {
    const nwbFile = useNwbFile()
    if (!nwbFile) throw Error('Unexpected: nwbFile is null')

    const {assetUrl, dandisetId, dandisetVersion, assetPath} = useDandiAssetContext()

    // const [dandiAssetInfo, setDandiAssetInfo] = useState<DandiAssetInfo | undefined>(undefined)

    // let nwbFileUrl: string
    // if (nwbFile instanceof MergedRemoteH5File) {
    //     nwbFileUrl = nwbFile.getFiles()[0].url
    // }
    // else {
    //     nwbFileUrl = nwbFile.url
    // }

    // useEffect(() => {
    //     const getDandiAssetInfo = async () => {
    //         const etag = await getEtag(nwbFileUrl)
    //         if (!etag) return
    //         const assetInfoUrl = `https://neurosift.org/computed/nwb/ETag/${etag.slice(0, 2)}/${etag.slice(2, 4)}/${etag.slice(4, 6)}/${etag}/dandi_asset_info.1.json`
    //         const resp = await fetch(assetInfoUrl)
    //         if (!resp.ok) return
    //         const obj = await resp.json() as DandiAssetInfo
    //         setDandiAssetInfo(obj)
    //         const dandiInfoUrl = `https://api.dandiarchive.org/api/dandisets/${obj.dandiset_id}/versions/${obj.dandiset_version_id}/`
    //         const resp2 = await fetch(dandiInfoUrl)
    //         if (!resp2.ok) return
    //         const obj2 = await resp2.json() as DandisetInfo
    //         setDandisetInfo(obj2)
    //     }
    //     getDandiAssetInfo()
    // }, [nwbFileUrl])

    // if (!dandiAssetInfo) return <span />

    const staging = assetUrl.startsWith('https://api-staging.dandiarchive.org')
    const dandisetInfo = useDandisetInfo(dandisetId, dandisetVersion, staging)

    const assetPathParentPath = assetPath ? assetPath.split('/').slice(0, -1).join('/') : undefined
    const assetPathFileName = assetPath ? assetPath.split('/').slice(-1)[0] : undefined

    // const handleExportToDendro = useCallback(() => {
    //     const assetPathEncoded = encodeURIComponent(assetPath || '')
    //     const url = `https://dendro.vercel.app/importDandiAsset?projectName=D-${dandisetId}&dandisetId=${dandisetId}&dandisetVersion=${dandisetVersion}&assetPath=${assetPathEncoded}&assetUrl=${assetUrl}`
    //     window.open(url, '_blank')
    // }, [dandisetId, dandisetVersion, assetPath, assetUrl])

    const {setRoute} = useRoute()

    const {supplementalFiles, selectedSupplementalFileIds} = useSupplementalDendroFiles()

    const {handleOpen: openSupplementalFiles, handleClose: closeSupplementalFiles, visible: supplementalFilesVisible} = useModalWindow()

    if (!dandisetId) return <span />


    return (
        <div>
            {dandisetId && (
                <p>
                    DANDISET:&nbsp;
                    <Hyperlink
                        onClick={() => setRoute({page: 'dandiset', dandisetId, dandisetVersion, staging})}
                        // href={`https://gui.dandiarchive.org/#/dandiset/${dandisetId}/${dandisetVersion}`}
                        // target="_blank"
                    >
                        {dandisetId} {dandisetVersion}
                    </Hyperlink>&nbsp;
                </p>
            )}
            {dandisetInfo && (
                <p>
                    {dandisetInfo.name}
                </p>
            )}
            {dandisetId && dandisetVersion && assetPath && (
                <p>
                    <Hyperlink
                        href={`https://gui.dandiarchive.org/#/dandiset/${dandisetId}/${dandisetVersion}/files?location=${assetPathParentPath}`}
                        target="_blank"
                    >
                        {assetPathParentPath}
                    </Hyperlink>/{assetPathFileName}
                </p>
            )}
            {
                supplementalFiles && supplementalFiles.length > 0 && (
                    <div>
                        <Hyperlink
                            onClick={openSupplementalFiles}
                        >
                            {supplementalFiles.length} supplemental {supplementalFiles.length === 1 ? 'file' : 'files'}
                            &nbsp;
                            (
                                {selectedSupplementalFileIds.length} selected
                            )
                        </Hyperlink>
                    </div>
                )
            }
            <ViewObjectNoteIconThing
                objectPath="/"
            />
            <hr />
            <ModalWindow
                visible={supplementalFilesVisible}
                onClose={closeSupplementalFiles}
            >
                <SupplementalDendroFilesView />
            </ModalWindow>
        </div>
    )
}

export const useDandisetInfo = (dandisetId: string, dandisetVersion: string, staging: boolean) => {
    const [dandisetInfo, setDandisetInfo] = useState<DandisetInfo | undefined>(undefined)
    useEffect(() => {
        if (!dandisetId) return
        if (!dandisetVersion) return
        const getDandisetInfo = async () => {
            const baseUrl = staging ? 'https://api-staging.dandiarchive.org' : 'https://api.dandiarchive.org'
            const url = `${baseUrl}/api/dandisets/${dandisetId}/versions/${dandisetVersion}/`
            const authorizationHeader = getAuthorizationHeaderForUrl(url)
            const headers = authorizationHeader ? {Authorization: authorizationHeader} : undefined
            const resp = await fetch(url, {headers})
            if (!resp.ok) return
            const obj = await resp.json() as DandisetInfo
            setDandisetInfo(obj)
        }
        getDandisetInfo()
    }, [dandisetId, dandisetVersion, staging])
    return dandisetInfo
}



// type AssociatedDendroProjectsComponentProps = {
//     assetUrl: string
// }

// const AssociatedDendroProjectsComponent: FunctionComponent<AssociatedDendroProjectsComponentProps> = ({assetUrl}) => {
//     const {associatedDendroProjects} = useDandiAssetContext()
//     const [expanded, setExpanded] = useState(false)
//     const initialNumProjectsToShow = 6
//     const projectsFiltered = useMemo(() => {
//         if (!associatedDendroProjects) return undefined
//         if (expanded) return associatedDendroProjects
//         else return associatedDendroProjects.slice(0, initialNumProjectsToShow)
//     }, [associatedDendroProjects, expanded])
//     if (!projectsFiltered) return <span>...</span>
//     if (projectsFiltered.length === 0) return <span />
//     return (
//         <div>
//             <span>Associated Dendro projects:&nbsp; </span>
//             {
//                 projectsFiltered.map((project, i) => (
//                     <span key={project.projectId}>
//                         <span style={{whiteSpace: 'nowrap'}}>
//                             <Hyperlink
//                                 href={`https://dendro.vercel.app/project/${project.projectId}`}
//                                 target="_blank"
//                             >
//                                 {project.name}
//                                 &nbsp;({formatUserId(project.ownerId)})
//                             </Hyperlink>
//                         </span>
//                         {
//                             i < projectsFiltered.length - 1 && <span>&nbsp;|&nbsp; </span>
//                         }
//                     </span>
//                 ))
//             }
//             {
//                 !expanded && associatedDendroProjects && associatedDendroProjects.length > initialNumProjectsToShow && (
//                     <span>
//                         &nbsp;|&nbsp;...&nbsp;
//                         <span style={{whiteSpace: 'nowrap'}}>
//                             <Hyperlink onClick={() => setExpanded(true)}>Show all</Hyperlink>
//                         </span>
//                     </span>
//                 )
//             }
//         </div>
//     )
// }

export const formatUserId = (userId: string) => {
    if (userId.startsWith('github|')) {
        return userId.slice('github|'.length)
    }
    else {
        return userId
    }
}

export default NwbMainLeftPanel