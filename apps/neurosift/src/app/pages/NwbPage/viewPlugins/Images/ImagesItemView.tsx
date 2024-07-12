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

    const [brightness, setBrightness] = useState<number>(50) // brightness between -0 and 100
    const [contrast, setContrast] = useState<number>(50) // contrast between 0 and 100

    const maxVal = useMemo(() => {
        let ret = 0
        for (let i = 0; i < W * H; i++) {
            const val = data[i]
            if (val > ret) ret = val
        }
        return ret
    }, [data, W, H])

    const {windowMin, windowMax} = useMemo(() => {
        // brightness 50 and contrast 50 corresponds to windowMin 0 and windowMax maxVal
        const contrastScale = Math.exp((contrast - 50) / 50 * Math.log(10))
        let windowMin = (maxVal / 2) - (maxVal / 2) / contrastScale
        let windowMax = (maxVal / 2) + (maxVal / 2) / contrastScale
        windowMin = windowMin - (brightness - 50) / 50 * maxVal
        windowMax = windowMax - (brightness - 50) / 50 * maxVal
        return {windowMin, windowMax}
    }, [maxVal, brightness, contrast])

    useEffect(() => {
        if (!canvasElement) return
        const ctx = canvasElement.getContext('2d')
        if (!ctx) return
        const imageData = ctx.createImageData(W, H)
        const buf = imageData.data
        for (let j = 0; j < H; j++) {
            for (let i = 0; i < W; i++) {
                const val = data[i * H + (H - 1 - j)]
                const ind = (i + j * W) * 4
                const v = Math.min(Math.max(0, (val - windowMin) / (windowMax - windowMin) * 255), 255)
                buf[ind + 0] = v
                buf[ind + 1] = v
                buf[ind + 2] = v
                buf[ind + 3] = 255
            }
        }
        ctx.putImageData(imageData, 0, 0)
    }, [canvasElement, W, H, data, maxVal, windowMin, windowMax])

    return (
        <div>
            <canvas
                ref={elmt => setCanvasElement(elmt)}
                width={W}
                height={H}
            />
            <div>
                <BrightnessSelector value={brightness} onChange={setBrightness} />&nbsp;
                <ContrastSelector value={contrast} onChange={setContrast} />
            </div>
        </div>
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

type BrightnessSelectorProps = {
    value: number
    onChange: (value: number) => void
}

const BrightnessSelector: FunctionComponent<BrightnessSelectorProps> = ({ value, onChange }) => {
    // slider
    return (
        <input
            type="range"
            title="Brightness"
            min={0}
            max={100}
            value={value}
            onChange={e => onChange(Number(e.target.value))}
        />
    )
}

type ContrastSelectorProps = {
    value: number
    onChange: (value: number) => void
}

const ContrastSelector: FunctionComponent<ContrastSelectorProps> = ({ value, onChange }) => {
    // slider
    return (
        <input
            type="range"
            title="Contrast"
            min={0}
            max={100}
            value={value}
            onChange={e => onChange(Number(e.target.value))}
        />
    )
}

export default ImagesItemView