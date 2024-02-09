/* eslint-disable @typescript-eslint/no-explicit-any */
import { FunctionComponent, useCallback, useEffect, useMemo, useReducer, useState } from "react"
import { AssetsResponse, AssetsResponseItem, DandisetSearchResultItem, DandisetVersionInfo } from "./types";
import getAuthorizationHeaderForUrl from "../../NwbPage/getAuthorizationHeaderForUrl";
import formatByteCount from "./formatByteCount";

const applicationBarColorDarkened = '#546' // from dendro

type DandisetViewProps = {
    dandisetId: string
    dandisetVersion?: string
    width: number
    height: number
    useStaging?: boolean
    onOpenAssets?: (assetUrls: string[]) => void
}

const DandisetView: FunctionComponent<DandisetViewProps> = ({dandisetId, dandisetVersion, width, height, useStaging, onOpenAssets}) => {
    const [dandisetResponse, setDandisetResponse] = useState<DandisetSearchResultItem | null>(null)
    const [dandisetVersionInfo, setDandisetVersionInfo] = useState<DandisetVersionInfo | null>(null)
    const [assetsResponses, setAssetsResponses] = useState<AssetsResponse[]>([])
    const [incomplete, setIncomplete] = useState(false)

    const stagingStr = useStaging ? '-staging' : ''
    const stagingStr2 = useStaging ? 'gui-staging.' : ''

    useEffect(() => {
        let canceled = false
        setDandisetResponse(null)
        ; (async () => {
            const url = `https://api${stagingStr}.dandiarchive.org/api/dandisets/${dandisetId}`
            const authorizationHeader = getAuthorizationHeaderForUrl(url)
            const headers = authorizationHeader ? {Authorization: authorizationHeader} : undefined
            const response = await fetch(
                url,
                {
                    headers
                }
            )
            if (canceled) return
            if (response.status === 200) {
                const json = await response.json()
                const dandisetResponse = json as DandisetSearchResultItem
                setDandisetResponse(dandisetResponse)
            }
        })()
        return () => {canceled = true}
    }, [dandisetId, stagingStr, useStaging])

    const {most_recent_published_version, draft_version} = dandisetResponse || {}
    const V = most_recent_published_version || draft_version
    const dsVersion = dandisetVersion || (V ? V.version : 'draft')

    useEffect(() => {
        let canceled = false
        setDandisetVersionInfo(null)
        if (!dandisetResponse) return
        ; (async () => {
            const url = `https://api${stagingStr}.dandiarchive.org/api/dandisets/${dandisetId}/versions/${dsVersion}/info/`
            const authorizationHeader = getAuthorizationHeaderForUrl(url)
            const headers = authorizationHeader ? {Authorization: authorizationHeader} : undefined
            const response = await fetch(
                url,
                {headers}
            )
            if (canceled) return
            if (response.status === 200) {
                const json = await response.json()
                const dandisetVersionInfo = json as DandisetVersionInfo
                setDandisetVersionInfo(dandisetVersionInfo)
            }
        })()
        return () => {canceled = true}
    }, [dandisetId, dandisetResponse, dsVersion, stagingStr, useStaging])

    useEffect(() => {
        const maxNumPages = 10

        let canceled = false
        setAssetsResponses([])
        setIncomplete(false)
        if (!dandisetId) return
        if (!dandisetResponse) return
        if (!V) return
        ; (async () => {
            let rr: AssetsResponse[] = []
            let uu: string | null = `https://api${stagingStr}.dandiarchive.org/api/dandisets/${dandisetId}/versions/${V.version}/assets/?page_size=1000`
            const authorizationHeader = uu ? getAuthorizationHeaderForUrl(uu) : ''
            const headers = authorizationHeader ? {Authorization: authorizationHeader} : undefined
            let count = 0
            while (uu) {
                if (count >= maxNumPages) {
                    setIncomplete(true)
                    break
                }
                const rrr: any = await fetch( // don't know why typescript is telling me I need any type here
                    uu,
                    {headers}
                )
                if (canceled) return
                if (rrr.status === 200) {
                    const json = await rrr.json()
                    rr = [...rr, json] // important to make a copy of rr
                    uu = json.next
                }
                else uu = null
                count += 1
                setAssetsResponses(rr)
            }
        })()
        return () => {canceled = true}
    }, [dandisetId, dandisetResponse, V, stagingStr, useStaging])

    const allAssets = useMemo(() => {
        const rr: AssetsResponseItem[] = []
        assetsResponses.forEach(assetsResponse => {
            rr.push(...assetsResponse.results)
        })
        return rr
    }, [assetsResponses])

    const [selectedAssets, selectedAssetsDispatch] = useReducer(selectedAssetsReducer, {assetPaths: []})

    const assetUrlForPath = useMemo(() => (
        (path: string) => {
            // https://api.dandiarchive.org/api/assets/8931af87-ceb8-455c-b082-9feb520cd12e/download/
            // or https://api-staging.dandiarchive.org/api/assets/8931af87-ceb8-455c-b082-9feb520cd12e/download/
            const assetId = allAssets.find(asset => asset.path === path)?.asset_id
            if (!assetId) throw Error('Unexpected missing assetId for path: ' + path)
            return `https://api${stagingStr}.dandiarchive.org/api/assets/${assetId}/download/`
        }
    ), [allAssets, stagingStr])

    if (!dandisetResponse) return <div>Loading dandiset...</div>
    if (!dandisetVersionInfo) return <div>Loading dandiset info...</div>
    
    const X = dandisetVersionInfo

    const externalLink = `https://${stagingStr2}dandiarchive.org/dandiset/${dandisetId}/${X.version}`

    const topBarHeight = onOpenAssets ? 30 : 0
    return (
        <div style={{position: 'absolute', width, height, overflowY: 'hidden'}}>
            <div style={{position: 'absolute', top: 0, width, height: topBarHeight, borderBottom: 'solid 1px #ccc'}}>
                {onOpenAssets && (
                    <button disabled={selectedAssets.assetPaths.length === 0} onClick={() => {onOpenAssets(selectedAssets.assetPaths.map(p => assetUrlForPath(p)))}}>Open selected assets</button>
                )}
            </div>
            <div style={{position: 'absolute', top: topBarHeight, width, height: height - topBarHeight, overflowY: 'auto'}}>
                <div style={{fontSize: 20, fontWeight: 'bold', padding: 5}}>
                    <a href={externalLink} target="_blank" rel="noreferrer" style={{color: applicationBarColorDarkened}}>{X.dandiset.identifier} ({X.version}): {X.name}</a>
                </div>
                <div style={{fontSize: 14, padding: 5}}>
                    {
                        X.metadata.contributor.map((c, i) => (
                            <span key={i}>{c.name}; </span>
                        ))
                    }
                </div>
                <div style={{fontSize: 14, padding: 5}}>
                    {X.metadata.description}
                </div>
                {
                    <div style={{fontSize: 14, padding: 5}}>
                        <span style={{color: 'gray'}}>Loaded {allAssets.length} assets</span>
                    </div>
                }
                {
                    incomplete && (
                        <div style={{fontSize: 14, padding: 5}}>
                            <span style={{color: 'red'}}>Warning: only showing first {assetsResponses.length} pages of assets</span>
                        </div>
                    )
                }
                <AssetsBrowser assetItems={allAssets} selectedAssets={selectedAssets} selectedAssetsDispatch={selectedAssetsDispatch} canSelect={true} />
            </div>
        </div>
    )
}

type ExpandedFoldersState = {
    [folder: string]: boolean
}

type ExpandedFoldersAction = {
    type: 'toggle'
    folder: string
}

const expandedFoldersReducer = (state: ExpandedFoldersState, action: ExpandedFoldersAction) => {
    switch (action.type) {
        case 'toggle': {
            const folder = action.folder
            const newState = {...state}
            newState[folder] = !newState[folder]
            return newState
        }
        default: {
            throw Error('Unexpected action type')
        }
    }
}

type SelectedAssetsState = {
    assetPaths: string[]
}

type SelectedAssetsAction = {
    type: 'toggle'
    assetPath: string
} | {
    type: 'set-multiple'
    assetPaths: string[]
    selected: boolean
}

const selectedAssetsReducer = (state: SelectedAssetsState, action: SelectedAssetsAction) => {
    switch (action.type) {
        case 'toggle': {
            const assetPath = action.assetPath
            const newState = {...state}
            const index = newState.assetPaths.indexOf(assetPath)
            if (index === -1) newState.assetPaths.push(assetPath)
            else newState.assetPaths.splice(index, 1)
            return newState
        }
        case 'set-multiple': {
            const {assetPaths, selected} = action
            const newState = {...state}
            if (selected) {
                newState.assetPaths = [...new Set([...newState.assetPaths, ...assetPaths])]
            }
            else {
                newState.assetPaths = newState.assetPaths.filter(assetPath => !assetPaths.includes(assetPath))
            }
            return newState
        }
        default: {
            throw Error('Unexpected action type')
        }
    }
}

type AssetsBrowserProps = {
    assetItems: AssetsResponseItem[]
    selectedAssets: SelectedAssetsState
    selectedAssetsDispatch: (action: SelectedAssetsAction) => void
    canSelect?: boolean
}

const AssetsBrowser: FunctionComponent<AssetsBrowserProps> = ({assetItems, selectedAssets, selectedAssetsDispatch, canSelect}) => {
    const folders: string[] = useMemo(() => {
        const folders = assetItems.filter(a => (a.path.includes('/'))).map(assetItem => assetItem.path.split('/')[0])
        const uniqueFolders = [...new Set(folders)].sort()
        return uniqueFolders
    }, [assetItems])

    const [expandedFolders, expandedFoldersDispatch] = useReducer(expandedFoldersReducer, {})

    if (!assetItems) return <span />
    return (
        <div>
            {folders.map(folder => (
                <div key={folder}>
                    <div
                        style={{fontSize: 18, fontWeight: 'bold', padding: 5, cursor: 'pointer'}}
                        onClick={() => expandedFoldersDispatch({type: 'toggle', folder})}
                    >
                        {expandedFolders[folder] ? '▼' : '▶'}
                        &nbsp;&nbsp;
                        {folder}
                    </div>
                    <div style={{padding: 5}}>
                        {expandedFolders[folder] && (
                            <AssetItemsTable
                                assetItems={assetItems.filter(assetItem => assetItem.path.startsWith(folder + '/'))}
                                selectedAssets={selectedAssets}
                                selectedAssetsDispatch={selectedAssetsDispatch}
                                canSelect={canSelect}
                            />
                        )}
                        {/* {
                            expandedFolders[folder] && (
                                assetItems.filter(assetItem => assetItem.path.startsWith(folder + '/')).map(assetItem => (
                                    <AssetItemView key={assetItem.asset_id} assetItem={assetItem} onClick={() => onClick(assetItem)} />
                                ))
                            )
                        } */}
                    </div>
                </div>
            ))}  
        </div>
    )
}

type AssetItemsTableProps = {
    assetItems: AssetsResponseItem[]
    selectedAssets: SelectedAssetsState
    selectedAssetsDispatch: (action: SelectedAssetsAction) => void
    canSelect?: boolean
}

const AssetItemsTable: FunctionComponent<AssetItemsTableProps> = ({assetItems, selectedAssets, selectedAssetsDispatch, canSelect}) => {
    const selectAllCheckedState = useMemo(() => {
        const numSelected = assetItems.filter(assetItem => selectedAssets.assetPaths.includes(assetItem.path)).length
        if (numSelected === 0) return false
        if (numSelected === assetItems.length) return true
        return null // null means indeterminate
    }, [assetItems, selectedAssets])
    const handleClickSelectAll = useCallback(() => {
        if (selectAllCheckedState === true) {
            selectedAssetsDispatch({type: 'set-multiple', assetPaths: assetItems.map(assetItem => assetItem.path), selected: false})
        }
        else {
            selectedAssetsDispatch({type: 'set-multiple', assetPaths: assetItems.map(assetItem => assetItem.path), selected: true})
        }
    }, [assetItems, selectAllCheckedState, selectedAssetsDispatch])

    return (
        <table className="table1">
            <thead>
            </thead>
            <tbody>
                {
                    canSelect && (
                        <tr>
                            <td style={{width: 20}}>
                                <Checkbox checked={selectAllCheckedState} onClick={handleClickSelectAll} />
                            </td>
                        </tr>
                    )
                }
                {
                    assetItems.map(assetItem => (
                        <AssetItemRow
                            key={assetItem.path}
                            assetItem={assetItem}
                            selected={selectedAssets.assetPaths.includes(assetItem.path)}
                            onToggleSelection={() => selectedAssetsDispatch({type: 'toggle', assetPath: assetItem.path})}
                            canSelect={canSelect}
                        />
                    ))
                }
            </tbody>
        </table>
    )
}

type AssetItemRowProps = {
    assetItem: AssetsResponseItem
    selected: boolean
    onToggleSelection: () => void
    canSelect?: boolean
}

const AssetItemRow: FunctionComponent<AssetItemRowProps> = ({assetItem, selected, onToggleSelection, canSelect}) => {
    const {modified, path, size} = assetItem

    return (
        <tr>
            {
                canSelect && (
                    <td style={{width: 20}}>
                        <Checkbox checked={selected} onClick={onToggleSelection} />
                    </td>
                )
            }
            <td>
                {path.split('/').slice(1).join('/')}
            </td>
            <td>
                {formatTime2(modified)}
            </td>
            <td>
                {formatByteCount(size)}
            </td>
        </tr>
    )
}

const Checkbox: FunctionComponent<{checked: boolean | null, onClick: () => void}> = ({checked, onClick}) => {
    // null means indeterminate
    return (
        <input
            ref={input => {
                if (!input) return
                input.indeterminate = checked === null
            }}
            type="checkbox"
            checked={checked === true}
            onChange={onClick}
        />
    )
}


const formatTime2 = (time: string) => {
    const date = new Date(time)
    // include date only
    return date.toLocaleDateString()
}

export default DandisetView