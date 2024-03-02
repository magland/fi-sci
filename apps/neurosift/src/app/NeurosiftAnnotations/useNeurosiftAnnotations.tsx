/* eslint-disable @typescript-eslint/no-explicit-any */
import { createContext, useContext, useEffect, useState } from "react"

export type NeurosiftAnnotation = {
    id: string
    type: string
    timestamp: number
    user: string
    data: {[key: string]: any}
}

type NeurosiftAnnotationsContextType = {
    neurosiftAnnotationsAccessToken?: string
    setNeurosiftAnnotationsAccessToken: (accessToken: string) => void
}

const defaultNeurosiftAnnotationsContext: NeurosiftAnnotationsContextType = {
    setNeurosiftAnnotationsAccessToken: () => {
        throw new Error('setNeurosiftAnnotationsAccessToken not implemented')
    }
}

export const NeurosiftAnnotationsContext = createContext<NeurosiftAnnotationsContextType>(defaultNeurosiftAnnotationsContext)

const useNeurosiftAnnotations = () => {
    const cc = useContext(NeurosiftAnnotationsContext)
    return {
        neurosiftAnnotationsAccessToken: cc.neurosiftAnnotationsAccessToken,
        setNeurosiftAnnotationsAccessToken: cc.setNeurosiftAnnotationsAccessToken
    }
}

export const SetupNeurosiftAnnotationsProvider = ({children}: {children: React.ReactNode}) => {
    const [neurosiftAnnotationsAccessToken, setNeurosiftAnnotationsAccessToken] = useState<string | undefined>(undefined)
    useEffect(() => {
        const at = localStorage.getItem('neurosift-annotations-access-token')
        if (at) {
            setNeurosiftAnnotationsAccessToken(at)
        }
    }, [])
    useEffect(() => {
        if (neurosiftAnnotationsAccessToken) {
            localStorage.setItem('neurosift-annotations-access-token', neurosiftAnnotationsAccessToken)
        }
    }, [neurosiftAnnotationsAccessToken])

    return (
        <NeurosiftAnnotationsContext.Provider value={{neurosiftAnnotationsAccessToken, setNeurosiftAnnotationsAccessToken}}>
            {children}
        </NeurosiftAnnotationsContext.Provider>
    )
}

export default useNeurosiftAnnotations