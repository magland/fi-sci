import { createContext, useContext } from "react";
import { RemoteH5FileX } from "@fi-sci/remote-h5-file";

type NwbFileContextType = {
    nwbFile: RemoteH5FileX | null,
}

const defaultNwbFileContext: NwbFileContextType = {
    nwbFile: null,
}

export const NwbFileContext = createContext<NwbFileContextType>(defaultNwbFileContext)

export const useNwbFile = () => {
    const a = useContext(NwbFileContext)
    if (!a.nwbFile) throw Error('No NwbFile')
    return a.nwbFile
}
