/* eslint-disable @typescript-eslint/no-explicit-any */
import { FunctionComponent, useCallback, useReducer, useRef, useState } from "react"
import pako from "pako"
import jp from "jsonpath"
import { Hyperlink } from "@fi-sci/misc"
import ModalWindow, { useModalWindow } from "@fi-sci/modal-window"
import QueryHintsView from "./QueryHintsView"
import useRoute from "../../useRoute"

type JsonPathQueryComponentProps = {
    width: number
    height: number
    dandisetIdVersions: string[]
}

type QueryResultsState = {
    dandisetId: string
    dandisetVersion: string
    assetId: string
    assetPath: string
    results: string[]
}[]
type QueryResultsAction = {
    type: 'clear'
} | {
    type: 'add',
    value: {
        dandisetId: string
        dandisetVersion: string
        assetId: string
        assetPath: string
        results: string[]
    }
}

const queryResultsReducer = (state: QueryResultsState, action: QueryResultsAction): QueryResultsState => {
    switch (action.type) {
        case 'clear':
            return []
        case 'add':
            return [...state, action.value]
        default:
            return state
    }
}

const JsonPathQueryComponent: FunctionComponent<JsonPathQueryComponentProps> = ({width, height, dandisetIdVersions}) => {
    const [jsonPathQuery, setJsonPathQuery] = useState<string>('')
    const [queryResults, queryResultsDispatch] = useReducer(queryResultsReducer, [])
    const [runningQuery, setRunningQuery] = useState<boolean>(false)
    const canceled = useRef<boolean>(false)

    const handleQuery = useCallback(async () => {
        if (runningQuery) return
        setRunningQuery(true)
        canceled.current = false

        queryResultsDispatch({type: 'clear'})

        for (const dandisetIdVersion of dandisetIdVersions) {
            const dandisetId = dandisetIdVersion.split('@')[0]
            const dandisetVersion = dandisetIdVersion.split('@')[1]
            const results = await queryDandiset(dandisetId, dandisetVersion, jsonPathQuery)
            if (canceled.current) break
            for (const result of results) {
                queryResultsDispatch({type: 'add', value: result})
            }
        }

        setRunningQuery(false)
    }, [runningQuery, dandisetIdVersions, jsonPathQuery])

    const {handleOpen: openHints, handleClose: closeHints, visible: hintsVisible} = useModalWindow()

    const {setRoute} = useRoute()

    if (dandisetIdVersions.length === 0) return <div style={{padding: 20}}>Select at least one Dandiset.</div>
    if (dandisetIdVersions.length > 10) return <div style={{padding: 20}}>Filter to at most 10 dandisets to perform a further query</div>
    return (
        <div style={{position: 'absolute', left: 10, top: 10, width: width - 20, height: height - 20, overflowY: 'auto'}}>
            <div>
                <Hyperlink onClick={openHints}>View example queries</Hyperlink>
            </div>
            <div>&nbsp;</div>
            <div>
            <textarea
                value={jsonPathQuery}
                onChange={e => setJsonPathQuery(e.target.value)}
                style={{width: '100%', height: 50, fontFamily: 'monospace'}}
            />
                <button
                    disabled={runningQuery}
                    onClick={handleQuery}
                >Submit query</button>&nbsp;
                {runningQuery && <button onClick={() => {
                    canceled.current = true
                }}>Cancel</button>}
            </div>
            <div>&nbsp;</div>
            <div>
                <table className="nwb-table">
                    <thead>
                        <tr>
                            <th>Dandiset ID</th>
                            <th>Asset Path</th>
                            <th>Results</th>
                        </tr>
                    </thead>
                    <tbody>
                        {queryResults.map((result, i) => (
                            <tr key={i}>
                                <td>
                                    {result.dandisetId}
                                </td>
                                <td>
                                    <Hyperlink onClick={() => {
                                        const url = `https://api.dandiarchive.org/api/assets/${result.assetId}/download/`
                                        setRoute({page: 'nwb', dandisetId: result.dandisetId, dandisetVersion: result.dandisetVersion, url: [url], storageType: []})
                                    }}>
                                        {result.assetPath}
                                    </Hyperlink>
                                </td>
                                <td>
                                    {result.results.map((r, j) => (
                                        <div key={j}>{r.length < 10000 ? r : '<too-large>'}</div>
                                    ))}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <ModalWindow
                visible={hintsVisible}
                onClose={closeHints}
            >
                <QueryHintsView />
            </ModalWindow>
        </div>
    )
}

const queryDandiset = async (dandisetId: string, dandisetVersion: string, jsonPathQuery: string) => {
    const url = `https://lindi.neurosift.org/dandi/nwb_meta/${dandisetId}.json.gz`
    const ret: {
        dandisetId: string
        dandisetVersion: string
        assetId: string
        assetPath: string
        results: string[]
    }[] = []
    try {
        const x = await loadJsonGz(url)
        for (const f of x.files) {
            const a = queryDandisetFile(f, jsonPathQuery, true)
            if (a.length > 0) {
                ret.push({
                    dandisetId: f.dandiset_id,
                    dandisetVersion: f.dandiset_version,
                    assetId: f.asset_id,
                    assetPath: f.asset_path,
                    results: a
                })
            }
        }
    }
    catch (e) {
        console.error(e)
    }
    return ret
}

type DandisetFileNwbMeta = {
    asset_id: string
    asset_path: string
    dandiset_id: string
    dandiset_version: string
    nwb_meta: {
        generationMetadata: any
        refs: {
            [key: string]: any
        }
        version: number
    }
}

const queryDandisetFile = (f: DandisetFileNwbMeta, jsonPathQuery: string, unique: boolean): string[] => {
    const root = {}
    for (const k in f.nwb_meta.refs) {
        if (k.endsWith('.zattrs')) {
            const attrs = f.nwb_meta.refs[k]
            const a = createItem(root, parentPath(k))
            a.attrs = attrs
        }
        else if (k.endsWith('zarray')) {
            const arr = f.nwb_meta.refs[k]
            const a = createItem(root, parentPath(k))
            a._zarray = arr
        }
    }
    const results = jp.query(root, jsonPathQuery)
    let ret = results.map((r: any) => JSON.stringify(r))
    if (unique) {
        ret = [...new Set(ret)].sort()
    }
    return ret
}

const createItem = (obj: any, path: string): any => {
    const parts = path.split('/')
    let o = obj
    for (const part of parts) {
        if (part) {
            if (!o[part]) o[part] = {}
            o = o[part]
        }
    }
    return o
}

const parentPath = (path: string): string => {
    const i = path.lastIndexOf('/')
    if (i < 0) return ''
    return path.slice(0, i)
}

const loadJsonGz = async (url: string): Promise<any> => {
    const response = await fetch(url)
    if (response.status !== 200) return null
    const buffer = await response.arrayBuffer()
    const bytes = new Uint8Array(buffer)
    const inflated = pako.inflate(bytes, {to: 'string'})
    return JSON.parse(inflated)
}

export default JsonPathQueryComponent