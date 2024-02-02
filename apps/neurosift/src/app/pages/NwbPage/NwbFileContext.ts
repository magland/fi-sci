import { createContext, useContext } from "react";
import { RemoteH5FileX } from "@fi-sci/remote-h5-file";

type NwbFileContextType = {
    nwbFile: RemoteH5FileX | null,
    nwbFileUrls: string[]
}

const defaultNwbFileContext: NwbFileContextType = {
    nwbFile: null,
    nwbFileUrls: []
}

export const NwbFileContext = createContext<NwbFileContextType>(defaultNwbFileContext)

export const useNwbFile = () => {
    const a = useContext(NwbFileContext)
    if (!a.nwbFile) throw Error('No NwbFile')
    return a.nwbFile
}

export const useNwbFileUrls = () => {
    const a = useContext(NwbFileContext)
    return a.nwbFileUrls
}