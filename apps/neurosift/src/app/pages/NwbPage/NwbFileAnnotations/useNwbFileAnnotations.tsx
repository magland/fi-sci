/* eslint-disable @typescript-eslint/no-explicit-any */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import useNeurosiftAnnotations from "../../../NeurosiftAnnotations/useNeurosiftAnnotations"
import { useDandiAssetContext } from "../DandiAssetContext"
import { GetAllAnnotationsForNwbFileRequest, GetRepoAnnotationForNwbFile, NwbFileAnnotation, SetAnnotationForNwbFileRequest } from "./types"

export type NeurosiftAnnotationItem = {
    repo: string
    id: string
    type: string
    timestamp: number
    user: string
    data: {[key: string]: any}
}

type NwbFileAnnotationsContextType = {
    nwbFileAnnotationItems?: NeurosiftAnnotationItem[]
    refreshNwbFileAnnotationItems: () => void
    annotationsRepo: string
    setAnnotationsRepo: (repo: string) => void
    addNwbFileAnnotationItem: (annotationItem: NeurosiftAnnotationItem, options: {replace?: string}) => Promise<void>
    removeNwbFileAnnotationItem: (id: string) => Promise<void>
}

const defaultNwbFileAnnotationsContext: NwbFileAnnotationsContextType = {
    nwbFileAnnotationItems: undefined,
    refreshNwbFileAnnotationItems: () => {
        throw new Error('refreshNwbFileAnnotationItems not implemented')
    },
    annotationsRepo: '',
    setAnnotationsRepo: (repo: string) => {
        throw new Error('setAnnotationsRepo not implemented')
    },
    addNwbFileAnnotationItem: (annotationItem: NeurosiftAnnotationItem, options: {replace?: string}) => {
        throw new Error('addNwbFileAnnotationItem not implemented')
    },
    removeNwbFileAnnotationItem: (id: string) => {
        throw new Error('removeNwbFileAnnotationItem not implemented')
    }
}

const NwbFileAnnotationsContext = createContext<NwbFileAnnotationsContextType>(defaultNwbFileAnnotationsContext)

export const useNwbFileAnnotations = () => {
    const cc = useContext(NwbFileAnnotationsContext)
    return {
        nwbFileAnnotationItems: cc.nwbFileAnnotationItems,
        refreshNwbFileAnnotationItems: cc.refreshNwbFileAnnotationItems,
        annotationsRepo: cc.annotationsRepo,
        setAnnotationsRepo: cc.setAnnotationsRepo,
        addNwbFileAnnotationItem: cc.addNwbFileAnnotationItem,
        removeNwbFileAnnotationItem: cc.removeNwbFileAnnotationItem
    }
}

const neurosiftAnnotationsApiUrl = 'https://neurosift-annotations.vercel.app'
// const neurosiftAnnotationsApiUrl = 'http://localhost:3000'

export const SetupNwbFileAnnotationsProvider = ({children}: {children: React.ReactNode}) => {
    const [nwbFileAnnotationItems, setNwbFileAnnotationItems] = useState<NeurosiftAnnotationItem[] | undefined>(undefined)
    const {neurosiftAnnotationsAccessToken} = useNeurosiftAnnotations()
    const {dandisetId, assetId, assetPath} = useDandiAssetContext()

    const [annotationsRepo, setAnnotationsRepo] = useState('')
    const setAnnotationsRepoHandler = useCallback((repo: string) => {
        setAnnotationsRepo(repo)
        localStorage.setItem('neurosift-annotations-repo', repo)
    }, [])
    useEffect(() => {
        const ar = localStorage.getItem('neurosift-annotations-repo')
        if (ar) {
            setAnnotationsRepo(ar)
        }
    }, [])

    const fetchNwbFileAnnotationForRepo = useMemo(() => (async (): Promise<NwbFileAnnotation | undefined> => {
        if (!neurosiftAnnotationsAccessToken) return undefined
        if (!dandisetId) return undefined
        if (!assetPath) return undefined
        if (!assetId) return undefined
        if (!annotationsRepo) return undefined
        const url = `${neurosiftAnnotationsApiUrl}/api/getRepoAnnotationForNwbFile`
        const req: GetRepoAnnotationForNwbFile = {
            dandiInstanceName: 'dandi',
            dandisetId,
            assetPath,
            assetId,
            repo: annotationsRepo
        }
        const r = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${neurosiftAnnotationsAccessToken}`
            },
            body: JSON.stringify(req)
        })
        if (r.status === 404) {
            // not found
            return undefined
        }
        if (r.status !== 200) {
            console.error('Error fetching annotation for repo', r)
            return undefined
        }
        const data = await r.json()
        return data.annotation
    }), [neurosiftAnnotationsAccessToken, dandisetId, assetId, assetPath, annotationsRepo])

    const fetchNwbFileAnnotations = useMemo(() => (async (): Promise<NwbFileAnnotation[]> => {
        if (!neurosiftAnnotationsAccessToken) return []
        if (!dandisetId) return []
        if (!assetPath) return []
        if (!assetId) return []
        const url = `${neurosiftAnnotationsApiUrl}/api/getAllAnnotationsForNwbFile`
        const req: GetAllAnnotationsForNwbFileRequest = {
            dandiInstanceName: 'dandi',
            dandisetId,
            assetPath,
            assetId
        }
        const r = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${neurosiftAnnotationsAccessToken}`
            },
            body: JSON.stringify(req)
        })
        if (r.status !== 200) {
            console.error('Error fetching annotations', r)
            return []
        }
        const data = await r.json()
        return data.annotations
    }), [neurosiftAnnotationsAccessToken, dandisetId, assetId, assetPath])

    const refreshNwbFileAnnotationItems = useCallback(async () => {
        setNwbFileAnnotationItems(undefined)
        if (!neurosiftAnnotationsAccessToken) return
        const a = await fetchNwbFileAnnotations()
        const allItems: NeurosiftAnnotationItem[] = []
        for (const annotation of a) {
            for (const item of (annotation.annotationItems || [])) {
                allItems.push({
                    ...item,
                    repo: annotation.repo
                })
            }
        }
        setNwbFileAnnotationItems(allItems)
    }, [neurosiftAnnotationsAccessToken, fetchNwbFileAnnotations])

    const putNwbFileAnnotationItems = useMemo(() => (async (annotationItems: NeurosiftAnnotationItem[]) => {
        if (!neurosiftAnnotationsAccessToken) {
            console.warn('Cannot setNwbFileAnnotations because neurosiftAnnotationsAccessToken is not set')
            return
        }
        if (!dandisetId) {
            console.warn('Cannot setNwbFileAnnotations because dandisetId is not set')
            return
        }
        if (!assetPath) {
            console.warn('Cannot setNwbFileAnnotations because assetPath is not set')
            return
        }
        if (!assetId) {
            console.warn('Cannot setNwbFileAnnotations because assetId is not set')
            return
        }
        const url = `${neurosiftAnnotationsApiUrl}/api/setAnnotationForNwbFile`
        const req: SetAnnotationForNwbFileRequest = {
            dandiInstanceName: 'dandi',
            dandisetId,
            assetPath,
            assetId,
            repo: annotationsRepo,
            annotationItems
        }
        const rr = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${neurosiftAnnotationsAccessToken}`
            },
            body: JSON.stringify(req)
        })
        if (rr.status !== 200) {
            console.warn('Error setting annotation items', rr)
            throw Error('Error setting annotation items')
        }
        const data = await rr.json()
        console.log(data)
    }), [neurosiftAnnotationsAccessToken, dandisetId, assetId, assetPath, annotationsRepo])

    const addNwbFileAnnotationItem = useCallback(async (annotationItem: NeurosiftAnnotationItem, options: {replace?: string}) => {
        // important to get the most recent because we don't want to overwrite changes
        const mostRecentAnnotations: NwbFileAnnotation | undefined = await fetchNwbFileAnnotationForRepo()
        const mostRecentAnnotationItems = mostRecentAnnotations?.annotationItems || []
        let newAnnotationItems = mostRecentAnnotationItems.filter(a => a.id !== annotationItem.id)
        if ((options.replace) && (newAnnotationItems.find(a => a.id === options.replace))) {
            newAnnotationItems = newAnnotationItems.map(a => a.id === options.replace ? annotationItem : a)
        }
        else {
            newAnnotationItems.push(annotationItem)
        }
        await putNwbFileAnnotationItems(newAnnotationItems)
        refreshNwbFileAnnotationItems()
    }, [putNwbFileAnnotationItems, refreshNwbFileAnnotationItems, fetchNwbFileAnnotationForRepo])

    const removeNwbFileAnnotationItem = useCallback(async (id: string) => {
        const mostRecentAnnotation: NwbFileAnnotation | undefined = await fetchNwbFileAnnotationForRepo()
        if (!mostRecentAnnotation) return
        const mostRecentAnnotationItems = mostRecentAnnotation.annotationItems
        if (!(mostRecentAnnotationItems || []).find(a => a.id === id)) return
        const newAnnotationItems = (mostRecentAnnotationItems || []).filter(a => a.id !== id)
        await putNwbFileAnnotationItems(newAnnotationItems)
        refreshNwbFileAnnotationItems()
    }, [putNwbFileAnnotationItems, refreshNwbFileAnnotationItems, fetchNwbFileAnnotationForRepo])

    useEffect(() => {
        refreshNwbFileAnnotationItems()
    }, [refreshNwbFileAnnotationItems])
    return (
        <NwbFileAnnotationsContext.Provider value={{nwbFileAnnotationItems, refreshNwbFileAnnotationItems, annotationsRepo, setAnnotationsRepo: setAnnotationsRepoHandler, addNwbFileAnnotationItem, removeNwbFileAnnotationItem}}>
            {children}
        </NwbFileAnnotationsContext.Provider>
    )
}

export default useNwbFileAnnotations