/* eslint-disable @typescript-eslint/no-explicit-any */
import { createContext, useCallback, useContext, useState } from "react"
import useNeurosiftAnnotations, { NeurosiftAnnotation } from "../../../NeurosiftAnnotations/useNeurosiftAnnotations"
import { useDandiAssetContext } from "../DandiAssetContext"

type NwbFileAnnotationsContextType = {
    nwbFileAnnotations: NeurosiftAnnotation[]
    refreshNwbFileAnnotations: () => void
    setNwbFileAnnotations: (annotations: NeurosiftAnnotation[]) => void
}

const defaultNwbFileAnnotationsContext: NwbFileAnnotationsContextType = {
    nwbFileAnnotations: [],
    refreshNwbFileAnnotations: () => {
        throw new Error('refreshNwbFileAnnotations not implemented')
    },
    setNwbFileAnnotations: (annotations: NeurosiftAnnotation[]) => {
        throw new Error('setNwbFileAnnotations not implemented')
    }
}

const NwbFileAnnotationsContext = createContext<NwbFileAnnotationsContextType>(defaultNwbFileAnnotationsContext)

export const useNwbFileAnnotations = () => {
    const cc = useContext(NwbFileAnnotationsContext)
    return {
        nwbFileAnnotations: cc.nwbFileAnnotations,
        refreshNwbFileAnnotations: cc.refreshNwbFileAnnotations,
        setNwbFileAnnotations: cc.setNwbFileAnnotations
    }
}

export const SetupNwbFileAnnotationsProvider = ({children}: {children: React.ReactNode}) => {
    const [nwbFileAnnotations, setNwbFileAnnotations] = useState<NeurosiftAnnotation[]>([])
    const {neurosiftAnnotationsAccessToken} = useNeurosiftAnnotations()
    const {dandisetId, assetId, assetPath} = useDandiAssetContext()
    const refreshNwbFileAnnotations = useCallback(async () => {
        if (!neurosiftAnnotationsAccessToken) return
        if (!dandisetId) return
        if (!assetPath) return
        if (!assetId) return
        const url = 'http://localhost:3000/api/getNwbFileAnnotations'
        const r = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${neurosiftAnnotationsAccessToken}`
            },
            body: JSON.stringify({
                repo: 'jer-magland/ns_annotations',
                dandisetId,
                assetPath,
                assetId,
            })
        })
        const data = await r.json()
        setNwbFileAnnotations(data)
    }, [neurosiftAnnotationsAccessToken, dandisetId, assetId, assetPath])

    const setNwbFileAnnotationsHandler = useCallback(async (annotations: NeurosiftAnnotation[]) => {
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
        const url = 'http://localhost:3000/api/setNwbFileAnnotations'
        const rr = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${neurosiftAnnotationsAccessToken}`
            },
            body: JSON.stringify({
                repo: 'jer-magland/ns_annotations',
                dandisetId,
                assetPath,
                assetId,
                annotations
            })
        })
        const data = await rr.json()
        console.log(data)
        setNwbFileAnnotations(annotations)
    }, [neurosiftAnnotationsAccessToken, dandisetId, assetId, assetPath])

    // only load when it is requested by the page
    // useEffect(() => {
    //     refreshNwbFileAnnotations()
    // }, [refreshNwbFileAnnotations])
    return (
        <NwbFileAnnotationsContext.Provider value={{nwbFileAnnotations, refreshNwbFileAnnotations, setNwbFileAnnotations: setNwbFileAnnotationsHandler}}>
            {children}
        </NwbFileAnnotationsContext.Provider>
    )
}

export default useNwbFileAnnotations