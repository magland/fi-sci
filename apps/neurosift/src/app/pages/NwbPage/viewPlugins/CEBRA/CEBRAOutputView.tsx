import { RemoteH5File } from "@fi-sci/remote-h5-file"
import { FunctionComponent, useEffect, useState } from "react"
import EmbeddingPlot from "./EmbeddingPlot"
import LossPlot from "./LossPlot"
import { Hyperlink } from "@fi-sci/misc"

type CEBRAOutputViewProps = {
    cebraOutputUrl: string
}

const CEBRAOutputView: FunctionComponent<CEBRAOutputViewProps> = ({ cebraOutputUrl }) => {
    const outputFile = useRemoteH5File(cebraOutputUrl)
    const loss = useLoss(outputFile)
    const embedding = useEmebdding(outputFile)

    if (!outputFile) {
        return <div>Loading...</div>
    }
    return (
        <div>
            <ShowOutputUrl url={cebraOutputUrl} />
            <div>&nbsp;</div>
            {embedding ? (
                <EmbeddingPlot
                    embedding={embedding}
                    width={800}
                    height={400}
                />
            ) : (
                <div style={{position: 'relative', width: 800, height: 400}}>Loading embedding data...</div>
            )}
            {loss ? (
                <LossPlot
                    loss={loss}
                    width={800}
                    height={400}
                />
            ) : (
                <div style={{position: 'relative', width: 800, height: 400}}>Loading loss data...</div>
            )}
        </div>
    )
}

const useLoss = (h5: RemoteH5File | null) => {
    const [loss, setLoss] = useState<any | null>(null)
    useEffect(() => {
        let canceled = false
        ;(async () => {
            if (!h5) return
            const l = await h5.getDatasetData('loss', {})
            if (canceled) return
            setLoss(l)
        })()
        return () => { canceled = true }
    }, [h5])

    return loss
}

const useEmebdding = (h5: RemoteH5File | null) => {
    const [embedding, setEmbedding] = useState<number[][] | null>(null)
    useEffect(() => {
        let canceled = false
        ;(async () => {
            if (!h5) return
            const ds = await h5.getDataset('embedding')
            if (!ds) return
            if (canceled) return
            const shape = ds.shape
            const e = await h5.getDatasetData('embedding', {})
            const eReshaped = reshape2D(e, [shape[0], shape[1]])
            if (canceled) return
            setEmbedding(eReshaped)
        })()
        return () => { canceled = true }
    }, [h5])

    return embedding
}

const reshape2D = (data: any, shape: [number, number]) => {
    const rows = shape[0]
    const cols = shape[1]
    const ret = []
    for (let i = 0; i < rows; i++) {
        const row = []
        for (let j = 0; j < cols; j++) {
            row.push(data[i * cols + j])
        }
        ret.push(row)
    }
    return ret
}


const useRemoteH5File = (url: string) => {
    const [file, setFile] = useState<RemoteH5File | null>(null)
    useEffect(() => {
        let canceled = false
        ;(async () => {
            setFile(null)
            const f = new RemoteH5File(url, undefined)
            if (canceled) return
            setFile(f)
        })()
        return () => { canceled = true }
    }, [url])

    return file
}

type ShowOutputUrlProps = {
    url: string
}

const ShowOutputUrl: FunctionComponent<ShowOutputUrlProps> = ({ url }) => {
    const [visible, setVisible] = useState(false)
    return (
        <div>
            <Hyperlink onClick={() => setVisible(v => !v)}>
                {visible ? 'Hide' : 'Show'} embedding URL</Hyperlink>
            {visible && (
                <div>{url}</div>
            )}
        </div>
    )
}

export default CEBRAOutputView