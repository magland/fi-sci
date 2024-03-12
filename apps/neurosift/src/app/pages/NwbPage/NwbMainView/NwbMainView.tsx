/* eslint-disable @typescript-eslint/no-explicit-any */
import { RemoteH5Dataset, RemoteH5FileX, RemoteH5Group } from "@fi-sci/remote-h5-file"
import { Splitter } from "@fi-sci/splitter"
import { FunctionComponent, useEffect, useState } from "react"
import { useNwbFile } from "../NwbFileContext"
import NwbMainLeftPanel from "./NwbMainLeftPanel"
import NwbMainViewMainPanel from "./NwbMainViewMainPanel"

type Props = {
    width: number
    height: number
    usingKerchunk: boolean
}

const NwbMainView: FunctionComponent<Props> = ({width, height, usingKerchunk}) => {
    const nwbFile = useNwbFile()
    if (!nwbFile) throw Error('Unexpected: nwbFile is undefined (no context provider)')
    return (
        <Splitter
            direction="horizontal"
            initialPosition={Math.min(500, width / 3)}
            width={width}
            height={height}
        >
            <NwbMainLeftPanel
                width={0}
                height={0}
                nwbFile={nwbFile}
                usingKerchunk={usingKerchunk}
            />
            <NwbMainViewMainPanel
                width={0}
                height={0}
                nwbFile={nwbFile}
            />
        </Splitter>
    )
}

export const useGroup = (nwbFile: RemoteH5FileX, path: string): RemoteH5Group | undefined => {
    const [group, setGroup] = useState<RemoteH5Group | undefined>(undefined)
    useEffect(() => {
        let canceled = false
        const load = async () => {
            const grp = await nwbFile.getGroup(path)
            if (canceled) return
            setGroup(grp)
        }
        load()
        return () => {canceled = true}
    }, [nwbFile, path])
    return group
}

export const useDataset = (nwbFile: RemoteH5FileX, path: string) => {
    const [dataset, setDataset] = useState<RemoteH5Dataset | undefined>(undefined)
    useEffect(() => {
        let canceled = false
        const load = async () => {
            const ds = await nwbFile.getDataset(path)
            if (canceled) return
            setDataset(ds)
        }
        load()
        return () => {canceled = true}
    }, [nwbFile, path])
    return dataset
}

export const useDatasetData = (nwbFile: RemoteH5FileX, path: string | undefined) => {
    const [data, setData] = useState<any | undefined>(undefined)
    const [dataset, setDataset] = useState<RemoteH5Dataset | undefined>(undefined)
    useEffect(() => {
        if (!path) return
        let canceled = false
        const load = async () => {
            const ds = await nwbFile.getDataset(path)
            if (canceled) return
            setDataset(ds)
            const d = await nwbFile.getDatasetData(path, {})
            if (canceled) return
            setData(d)
        }
        load()
        return () => {canceled = true}
    }, [nwbFile, path])
    return {dataset, data}
}

export default NwbMainView