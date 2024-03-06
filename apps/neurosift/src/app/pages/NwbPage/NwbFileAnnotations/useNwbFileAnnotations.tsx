/* eslint-disable @typescript-eslint/no-explicit-any */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import useNeurosiftAnnotations, { NeurosiftAnnotation } from "../../../NeurosiftAnnotations/useNeurosiftAnnotations"
import { useDandiAssetContext } from "../DandiAssetContext"

type NwbFileAnnotationsContextType = {
    nwbFileAnnotations?: NeurosiftAnnotation[]
    refreshNwbFileAnnotations: () => void
    annotationsRepo: string
    setAnnotationsRepo: (repo: string) => void
    addNwbFileAnnotation: (annotation: NeurosiftAnnotation, options: {replace?: string}) => Promise<void>
    removeNwbFileAnnotation: (id: string) => Promise<void>
}

const defaultNwbFileAnnotationsContext: NwbFileAnnotationsContextType = {
    nwbFileAnnotations: undefined,
    refreshNwbFileAnnotations: () => {
        throw new Error('refreshNwbFileAnnotations not implemented')
    },
    annotationsRepo: '',
    setAnnotationsRepo: (repo: string) => {
        throw new Error('setAnnotationsRepo not implemented')
    },
    addNwbFileAnnotation: (annotation: NeurosiftAnnotation, options: {replace?: string}) => {
        throw new Error('addNwbFileAnnotation not implemented')
    },
    removeNwbFileAnnotation: (id: string) => {
        throw new Error('removeNwbFileAnnotation not implemented')
    }
}

const NwbFileAnnotationsContext = createContext<NwbFileAnnotationsContextType>(defaultNwbFileAnnotationsContext)

export const useNwbFileAnnotations = () => {
    const cc = useContext(NwbFileAnnotationsContext)
    return {
        nwbFileAnnotations: cc.nwbFileAnnotations,
        refreshNwbFileAnnotations: cc.refreshNwbFileAnnotations,
        annotationsRepo: cc.annotationsRepo,
        setAnnotationsRepo: cc.setAnnotationsRepo,
        addNwbFileAnnotation: cc.addNwbFileAnnotation,
        removeNwbFileAnnotation: cc.removeNwbFileAnnotation
    }
}

const neurosiftAnnotationsApiUrl = 'https://neurosift-annotations.vercel.app'
// const neurosiftAnnotationsApiUrl = 'http://localhost:3000'

export const SetupNwbFileAnnotationsProvider = ({children}: {children: React.ReactNode}) => {
    const [nwbFileAnnotations, setNwbFileAnnotations] = useState<NeurosiftAnnotation[] | undefined>(undefined)
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

    const fetchNwbFileAnnotations = useMemo(() => (async () => {
        if (!neurosiftAnnotationsAccessToken) return
        if (!dandisetId) return
        if (!assetPath) return
        if (!assetId) return
        if (!annotationsRepo) return
        const url = `${neurosiftAnnotationsApiUrl}/api/getNwbFileAnnotations`
        const r = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${neurosiftAnnotationsAccessToken}`
            },
            body: JSON.stringify({
                repo: annotationsRepo,
                dandisetId,
                assetPath,
                assetId,
            })
        })
        if (r.status === 404) return []
        if (r.status !== 200) {
            console.error('Error fetching annotations', r)
            return
        }
        const data = await r.json()
        return data as NeurosiftAnnotation[]
    }), [neurosiftAnnotationsAccessToken, dandisetId, assetId, assetPath, annotationsRepo])

    const refreshNwbFileAnnotations = useCallback(async () => {
        setNwbFileAnnotations(undefined)
        if (!neurosiftAnnotationsAccessToken) return
        const a = await fetchNwbFileAnnotations()
        setNwbFileAnnotations(a)
    }, [neurosiftAnnotationsAccessToken, fetchNwbFileAnnotations])

    const putNwbFileAnnotations = useMemo(() => (async (annotations: NeurosiftAnnotation[]) => {
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
        const url = `${neurosiftAnnotationsApiUrl}/api/setNwbFileAnnotations`
        const rr = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${neurosiftAnnotationsAccessToken}`
            },
            body: JSON.stringify({
                repo: annotationsRepo,
                dandisetId,
                assetPath,
                assetId,
                annotations
            })
        })
        if (rr.status !== 200) {
            console.warn('Error setting annotations', rr)
            throw Error('Error setting annotations')
        }
        const data = await rr.json()
        console.log(data)
    }), [neurosiftAnnotationsAccessToken, dandisetId, assetId, assetPath, annotationsRepo])

    const addNwbFileAnnotation = useCallback(async (annotation: NeurosiftAnnotation, options: {replace?: string}) => {
        // important to get the most recent because we don't want to overwrite changes
        const mostRecentAnnotations = await fetchNwbFileAnnotations()
        if (!mostRecentAnnotations) return
        let newAnnotations = mostRecentAnnotations.filter(a => a.id !== annotation.id)
        if ((options.replace) && (newAnnotations.find(a => a.id === options.replace))) {
            newAnnotations = newAnnotations.map(a => a.id === options.replace ? annotation : a)
        }
        else {
            newAnnotations.push(annotation)
        }
        await putNwbFileAnnotations(newAnnotations)
        refreshNwbFileAnnotations()
    }, [fetchNwbFileAnnotations, putNwbFileAnnotations, refreshNwbFileAnnotations])

    const removeNwbFileAnnotation = useCallback(async (id: string) => {
        const mostRecentAnnotations = await fetchNwbFileAnnotations()
        if (!mostRecentAnnotations) return
        if (!mostRecentAnnotations.find(a => a.id === id)) return
        const newAnnotations = mostRecentAnnotations.filter(a => a.id !== id)
        await putNwbFileAnnotations(newAnnotations)
        refreshNwbFileAnnotations()
    }, [fetchNwbFileAnnotations, putNwbFileAnnotations, refreshNwbFileAnnotations])

    useEffect(() => {
        refreshNwbFileAnnotations()
    }, [refreshNwbFileAnnotations])
    return (
        <NwbFileAnnotationsContext.Provider value={{nwbFileAnnotations, refreshNwbFileAnnotations, annotationsRepo, setAnnotationsRepo: setAnnotationsRepoHandler, addNwbFileAnnotation, removeNwbFileAnnotation}}>
            {children}
        </NwbFileAnnotationsContext.Provider>
    )
}

export default useNwbFileAnnotations