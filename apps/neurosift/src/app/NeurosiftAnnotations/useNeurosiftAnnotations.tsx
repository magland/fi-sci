/* eslint-disable @typescript-eslint/no-explicit-any */
import { createContext, useContext, useEffect, useState } from "react"

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

    return (
        <NeurosiftAnnotationsContext.Provider value={{neurosiftAnnotationsAccessToken, setNeurosiftAnnotationsAccessToken}}>
            {children}
        </NeurosiftAnnotationsContext.Provider>
    )
}

export default useNeurosiftAnnotations