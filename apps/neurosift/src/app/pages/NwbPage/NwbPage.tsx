/* eslint-disable @typescript-eslint/no-explicit-any */
import { MergedRemoteH5File, RemoteH5File, RemoteH5FileX, RemoteH5FileZarr, getMergedRemoteH5File, getRemoteH5File, getRemoteH5FileZarr, globalRemoteH5FileStats } from "@fi-sci/remote-h5-file"
import { FunctionComponent, useEffect, useReducer, useState } from "react"
import { useCustomStatusBarElements } from "../../StatusBar"
import useRoute from "../../useRoute"
import { AssociatedDendroProject, DandiAssetContext, DandiAssetContextType, defaultDandiAssetContext } from "./DandiAssetContext"
import { SetupNwbFileAnnotationsProvider } from "./NwbFileAnnotations/useNwbFileAnnotations"
import { NwbFileContext } from "./NwbFileContext"
import { SetupNwbOpenTabs } from "./NwbOpenTabsContext"
import NwbTabWidget from "./NwbTabWidget"
import { SelectedItemViewsContext, selectedItemViewsReducer } from "./SelectedItemViewsContext"
import getAuthorizationHeaderForUrl from "./getAuthorizationHeaderForUrl"

type Props = {
    width: number
    height: number
}

// const url = 'https://api.dandiarchive.org/api/assets/29ba1aaf-9091-469a-b331-6b8ab818b5a6/download/'

const NwbPage: FunctionComponent<Props> = ({width, height}) => {
    const {route} = useRoute()

    // useEffect(() => {
    //     let canceled = false
    //     ; (async () => {
    //         if ((route.page === 'nwb') && (!route.url) && (route.dandiAssetUrl)) {
    //             const info = await fetchJson(route.dandiAssetUrl)
    //             if (canceled) return
    //             const blobUrl = info['contentUrl'].find((x: any) => (x.startsWith('https://dandiarchive.s3.amazonaws.com/blobs')))
    //             setRoute({
    //                 ...route,
    //                 url: blobUrl
    //             })
    //         }
    //     })()
    //     return () => {canceled = true}
    // }, [route.page, route, setRoute])

    if ((route.page === 'nwb') && (!route.url)) {
        // if (route.dandiAssetUrl) {
        //     return <div style={{paddingLeft: 20}}>Obtaining asset blob URL from {route.dandiAssetUrl}</div>
        // }
        return <div style={{paddingLeft: 20}}>No url query parameter</div>
    }
    return (
        <NwbPageChild
            width={width}
            height={height}
        />
    )
}

const NwbPageChild: FunctionComponent<Props> = ({width, height}) => {
    const {route} = useRoute()
    if (route.page !== 'nwb') throw Error('Unexpected: route.page is not nwb')
    const urlList = route.url
    const [nwbFile, setNwbFile] = useState<RemoteH5FileX | undefined>(undefined)
    const [selectedItemViewsState, selectedItemViewsDispatch] = useReducer(selectedItemViewsReducer, {selectedItemViews: []})

    // status bar text
    const {setCustomStatusBarElement} = useCustomStatusBarElements()
    useEffect(() => {
        let lastStatsString = ''
        const timer = setInterval(() => {
            if (!nwbFile) return
            const x = globalRemoteH5FileStats

            // important to do this check so the context state is not constantly changing
            if (JSONStringifyDeterministic(x) === lastStatsString) return
            lastStatsString = JSONStringifyDeterministic(x)

            const s = <span style={{}}>
                {
                    x.numPendingRequests > 0 && (
                        <span style={{color: 'darkblue'}}>Loading...</span>
                    )
                }&nbsp;
                <span title="Number of groups fetched">{x.getGroupCount}</span>&nbsp;|&nbsp;
                <span title="Number of datasets fetched">{x.getDatasetCount}</span>&nbsp;|&nbsp;
                <span title="Number of datasets data fetched">{x.getDatasetDataCount}</span>&nbsp;|&nbsp;
                <span title="Number of pending requests">{x.numPendingRequests}</span>
            </span>
            setCustomStatusBarElement && setCustomStatusBarElement('custom1', s)
        }, 250)
        return () => {clearInterval(timer)}
    }, [nwbFile, setCustomStatusBarElement])

    useEffect(() => {
        let canceled = false
        const load = async () => {
            const urlListResolved = !route.isZarr ? await getResolvedUrls(urlList) : urlList
            const metaUrls = !route.isZarr ? await getMetaUrls(urlListResolved) : []
            if (canceled) return
            let f: MergedRemoteH5File | RemoteH5File | RemoteH5FileZarr
            if (urlListResolved.length === 1) {
                if (route.isZarr) {
                    f = await getRemoteH5FileZarr(urlListResolved[0], metaUrls[0])
                }
                else {
                    f = await getRemoteH5File(urlListResolved[0], metaUrls[0])
                }
            }
            else {
                if (route.isZarr) {
                    throw Error('Merging zarr files not yet implemented yet')
                }
                f = await getMergedRemoteH5File(urlListResolved, metaUrls)
            }
            if (canceled) return
            setNwbFile(f)
        }
        load()
        return () => {canceled = true}
    }, [urlList, route.isZarr])

    const [dandiAssetContextValue, setDandiAssetContextValue] = useState<DandiAssetContextType>(defaultDandiAssetContext)
    useEffect(() => {
        let canceled = false;
        (async () => {
            const query = new URLSearchParams(window.location.search)
            const assetUrl = query.get('url')
            const dandisetId = query.get('dandisetId')
            const dandisetVersion = query.get('dandisetVersion')
            if (!assetUrl) return
            if (!dandisetId) return
            if (!dandisetVersion) return
            // todo: get the asset ID and the asset path
            let assetId: string | undefined = undefined
            // https://api.dandiarchive.org/api/assets/26e85f09-39b7-480f-b337-278a8f034007/download/
            if (isDandiAssetUrl(assetUrl)) {
                const aa = assetUrl.split('/')
                assetId = aa[5]
            }
            setDandiAssetContextValue({
                assetUrl,
                dandisetId,
                dandisetVersion,
                assetId
            })
            const staging = assetUrl.startsWith('https://api-staging.dandiarchive.org/')
            const assetPath = assetId ? await getAssetPathForAssetId(dandisetId, dandisetVersion, assetId, staging) : undefined
            if (canceled) return
            setDandiAssetContextValue({
                assetUrl,
                dandisetId,
                dandisetVersion,
                assetId,
                assetPath
            })
            const url = 'https://dendro.vercel.app/api/gui/find_projects'
            const data = {
                'fileUrl': assetUrl
            }
            const resp = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data),
            })
            if (!resp.ok) return
            const obj = await resp.json()
            if (canceled) return
            const associatedDendroProjects: AssociatedDendroProject[] = obj.projects.map((p: any) => ({
                projectId: p.projectId,
                name: p.name,
                ownerId: p.ownerId
            }))
            setDandiAssetContextValue({
                assetUrl,
                dandisetId,
                dandisetVersion,
                assetId,
                assetPath,
                associatedDendroProjects
            })
        })()
        return () => {canceled = true}
    }, [])

    if (!nwbFile) return <div>Loading {urlList}</div>
    return (
        <DandiAssetContext.Provider value={dandiAssetContextValue}>
            <NwbFileContext.Provider value={{nwbFile, nwbFileUrls: urlList}}>
                <SelectedItemViewsContext.Provider value={{selectedItemViewsState, selectedItemViewsDispatch}}>
                    <SetupNwbOpenTabs>
                        <SetupNwbFileAnnotationsProvider>
                            <NwbTabWidget
                                width={width}
                                height={height}
                            />
                        </SetupNwbFileAnnotationsProvider>
                    </SetupNwbOpenTabs>
                </SelectedItemViewsContext.Provider>
            </NwbFileContext.Provider>
        </DandiAssetContext.Provider>
    )
}

export const headRequest = async (url: string, headers?: any) => {
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

const etagCache: {[key: string]: string | undefined} = {}

export const getEtag = async (url: string) => {
    if (etagCache[url]) return etagCache[url]
    const headResponse = await headRequest(url)
    if (!headResponse) return undefined
    const etag = headResponse.headers.get('ETag')
    if (!etag) {
        return undefined
    }
    // remove quotes
    const ret = etag.slice(1, etag.length - 1)
    etagCache[url] = ret
    return ret
}

const urlQueryString = window.location.search
const urlQueryParams = new URLSearchParams(urlQueryString)

const getMetaUrl = async (url: string): Promise<string | undefined> => {
    if (urlQueryParams.get('no-meta') === '1') return undefined

    const etag = await getEtag(url)
    if (!etag) return undefined
    const computedAssetBaseUrl = `https://neurosift.org/computed/nwb/ETag/${etag.slice(0, 2)}/${etag.slice(2, 4)}/${etag.slice(4, 6)}/${etag}`
    const metaNwbUrl = `${computedAssetBaseUrl}/meta.1.nwb`
    let headResponse2
    try {
        headResponse2 = await fetch(metaNwbUrl, {method: 'HEAD'})
        if (headResponse2.status === 200) {
            return metaNwbUrl
        }
    }
    catch(err: any) {
        console.warn(`Unable to HEAD ${metaNwbUrl}: ${err.message}`)
    }
    return undefined

    // const aa = 'https://dandiarchive.s3.amazonaws.com/'
    // if (!url.startsWith(aa)) {
    //     return undefined
    // }
    // const pp = url.slice(aa.length)
    // const candidateMetaUrl = `https://neurosift.org/nwb-meta/dandiarchive/${pp}`
    // try {
    //     const resp = await fetch(candidateMetaUrl, {method: 'HEAD'})
    //     if (resp.status === 200) return candidateMetaUrl
    //     // status of 404 means it wasn't found
    // }
    // catch(err: any) {
    //     console.warn(`Unable to HEAD ${candidateMetaUrl}: ${err.message}`)
    // }
    // return undefined
}

const getMetaUrls = async (urlList: string[]) => {
    const metaUrls = await Promise.all(urlList.map(url => getMetaUrl(url)))
    return metaUrls
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

const getResolvedUrls = async (urlList: string[]) => {
    const urlListResolved = await Promise.all(urlList.map(url => getResolvedUrl(url)))
    return urlListResolved
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
    if (url.startsWith('https://api-staging.dandiarchive.org/')) {
      return true
    }
    if (url.startsWith('https://api.dandiarchive.org/')) {
      return true
    }
}

const getAssetPathForAssetId = async (dandisetId: string, dandisetVersion: string, assetId: string | undefined, staging: boolean) => {
    if (!assetId) return undefined
    const baseUrl = staging ? 'https://api-staging.dandiarchive.org' : 'https://api.dandiarchive.org'
    const url = `${baseUrl}/api/dandisets/${dandisetId}/versions/${dandisetVersion}/assets/${assetId}/`
    const authorizationHeader = getAuthorizationHeaderForUrl(url)
    const headers = authorizationHeader ? {Authorization: authorizationHeader} : undefined
    const resp = await fetch(url, {headers})
    if (!resp.ok) return undefined
    const obj = await resp.json()
    return obj['path']
}

// Thanks: https://stackoverflow.com/questions/16167581/sort-object-properties-and-json-stringify
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const JSONStringifyDeterministic = (obj: any, space: string | number | undefined = undefined) => {
    const allKeys: string[] = [];
    JSON.stringify(obj, function (key, value) {
      allKeys.push(key);
      return value;
    });
    allKeys.sort();
    return JSON.stringify(obj, allKeys, space);
};

export default NwbPage