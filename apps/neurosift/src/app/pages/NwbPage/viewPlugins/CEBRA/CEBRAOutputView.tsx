import { RemoteH5FileLindi, RemoteH5FileX, getRemoteH5FileLindi } from "@fi-sci/remote-h5-file"
import { FunctionComponent, useEffect, useState } from "react"
import Markdown from "../../../../Markdown/Markdown"
import EmbeddingPlot3D from "./EmbeddingPlot3D"
import EmbeddingTimePlot from "./EmbeddingTimePlot"
import LossPlot from "./LossPlot"
import getIntrinsicDimensionMarkdown from "./getIntrinsicDimensionMarkdown"
import getPowerSpectrumMarkdown from "./getPowerSpectrumMarkdown"

type CEBRAOutputViewProps = {
    cebraOutputUrl: string
    binSizeMsec: number
}

const CEBRAOutputView: FunctionComponent<CEBRAOutputViewProps> = ({ cebraOutputUrl, binSizeMsec }) => {
    const outputFile = useRemoteH5FileLindi(cebraOutputUrl)
    const loss = useLoss(outputFile)
    const embedding = useEmebdding(outputFile)

    if (!outputFile) {
        return <div>Loading...</div>
    }
    return (
        <div>
            {embedding ? (
                <EmbeddingPlot3D
                    embedding={embedding}
                    width={800}
                    height={400}
                />
            ) : (
                <div style={{position: 'relative', width: 800, height: 400}}>Loading embedding data...</div>
            )}
            {embedding ? (
                <EmbeddingTimePlot
                    embedding={embedding}
                    binSizeMsec={binSizeMsec}
                    width={1400}
                    height={300}
                />
            ): (
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
            <div>&nbsp;</div>
            <hr />
            <Markdown
                source={getIntrinsicDimensionMarkdown(cebraOutputUrl)}
            />
            <div>&nbsp;</div>
            <hr />
            <Markdown
                source={getPowerSpectrumMarkdown(cebraOutputUrl, binSizeMsec)}
            />
            <hr />
            <div>
                Embedding URL: {cebraOutputUrl}
            </div>
        </div>
    )
}

const useLoss = (h5: RemoteH5FileX | null) => {
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

const useEmebdding = (h5: RemoteH5FileX | null) => {
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


const useRemoteH5FileLindi = (url: string) => {
    const [file, setFile] = useState<RemoteH5FileLindi | null>(null)
    useEffect(() => {
        let canceled = false
        ;(async () => {
            setFile(null)
            const f = await getRemoteH5FileLindi(url)
            if (canceled) return
            setFile(f)
        })()
        return () => { canceled = true }
    }, [url])

    return file
}

export default CEBRAOutputView