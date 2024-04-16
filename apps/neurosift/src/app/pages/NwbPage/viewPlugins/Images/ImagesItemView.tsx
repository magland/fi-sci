import { DatasetDataType, RemoteH5Dataset, RemoteH5FileX } from "@fi-sci/remote-h5-file"
import { FunctionComponent, useEffect, useMemo, useState } from "react"
import { useNwbFile } from "../../NwbFileContext"
import { useDatasetData, useGroup } from "../../NwbMainView/NwbMainView"

type Props = {
    width: number
    height: number
    path: string
    condensed?: boolean
}

const ImagesItemView: FunctionComponent<Props> = ({ width, height, path }) => {
    const nwbFile = useNwbFile()
    if (!nwbFile) throw Error('Unexpected: nwbFile is undefined')

    const group = useGroup(nwbFile, path)
    if (!group) return <div>Loading group...</div>
    return (
        <div style={{ position: 'absolute', width, height, overflowY: 'auto' }}>
            {
                group.datasets.map(ds => (
                    <div key={ds.path}>
                        <h3>{ds.name}</h3>
                        <ImageItem
                            nwbFile={nwbFile}
                            path={ds.path}
                            neurodataType={ds.attrs['neurodata_type']}
                        />
                    </div>
                ))
            }
        </div>
    )
}

type ImageItemProps = {
    nwbFile: RemoteH5FileX
    path: string
    neurodataType: string
}

const ImageItem: FunctionComponent<ImageItemProps> = ({ nwbFile, path, neurodataType }) => {
    const {dataset, data} = useDatasetData(nwbFile, path)
    if (!dataset) return <div>Loading dataset...</div>
    if (!data) return <div>Loading data...</div>

    if (neurodataType === 'GrayscaleImage') {
        return (
            <GrayscaleImageItem
                dataset={dataset}
                data={data}
            />
        )
    }
    else if (neurodataType === 'Image') {
        return (
            <RegularImageItem
                dataset={dataset}
                data={data}
            />
        )
    }
    else {
        return (
            <div>Unexpected neurodata_type: {neurodataType}</div>
        )
    }
}

type GrayscaleImageItemProps = {
    dataset: RemoteH5Dataset
    data: DatasetDataType
}

const GrayscaleImageItem: FunctionComponent<GrayscaleImageItemProps> = ({ dataset, data }) => {
    const W = dataset.shape[0]
    const H = dataset.shape[1]

    const [canvasElement, setCanvasElement] = useState<HTMLCanvasElement | null>(null)

    const maxVal = useMemo(() => {
        let ret = 0
        for (let i = 0; i < W * H; i++) {
            const val = data[i]
            if (val > ret) ret = val
        }
        return ret
    }, [data, W, H])

    useEffect(() => {
        if (!canvasElement) return
        const ctx = canvasElement.getContext('2d')
        if (!ctx) return
        const imageData = ctx.createImageData(W, H)
        const buf = imageData.data
        for (let j = 0; j < H; j++) {
            for (let i = 0; i < W; i++) {
                const val = data[i * H + j]
                const ind = (i + j * W) * 4
                buf[ind + 0] = val / maxVal * 255
                buf[ind + 1] = val / maxVal * 255
                buf[ind + 2] = val / maxVal * 255
                buf[ind + 3] = 255
            }
        }
        ctx.putImageData(imageData, 0, 0)
    }, [canvasElement, W, H, data, maxVal])

    return (
        <canvas
            ref={elmt => setCanvasElement(elmt)}
            width={W}
            height={H}
        />
    )
}

type RegularImageItemProps = {
    dataset: RemoteH5Dataset
    data: DatasetDataType
}

const RegularImageItem: FunctionComponent<RegularImageItemProps> = ({ dataset, data }) => {
    if (dataset.shape.length === 2) {
        // I guess this is just a grayscale image
        return (
            <GrayscaleImageItem
                dataset={dataset}
                data={data}
            />
        )
    }
    else {
        return (
            <div>Image not supported with shape: {dataset.shape.join(', ')}</div>
        )
    }
}

export default ImagesItemView