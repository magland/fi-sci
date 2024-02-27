/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { FunctionComponent, useEffect, useMemo, useState, useCallback } from "react"
import { MergedRemoteH5File, RemoteH5Dataset, RemoteH5File, RemoteH5Group } from "@fi-sci/remote-h5-file"


type Props = {
    width: number
    height: number
    data: any
    selectedSegmentationName: string
    selectedRois: number[]
    onSelect: (idx: number) => void
}

// important to store localized masks, otherwise we run out of RAM quick
type UnitMask = {
    x0: number
    y0: number
    w0: number
    h0: number
    data: number[][]
}

type UnitIdxs = {
    idx: number[]
}

const v1 = 255
const v2 = 160
const _ = 128
const distinctColors = [
    [v1, _, _],
    [_, v1, _],
    [_, _, v1],
    [v1, v1, _],
    [v1, _, v1],
    [_, v1, v1],
    [v1, v2, _],
    [v1, _, v2],
    [_, v1, v2],
    [v2, v1, _],
    [v2, _, v1],
    [_, v2, v1]
]

const testData = [
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
    [0, 5, 5, 0, 0, 0, 0, 0, 0, 0 ],
    [0, 5, 5, 0, 0, 0, 0, 0, 0, 0 ],
    [0, 1, 0, 0, 0, 0, 0, 0, 0, 0 ],
    [0, 0, 0, 0, 2, 2, 0, 0, 0, 0 ],
    [0, 0, 0, 0, 2, 2, 0, 0, 0, 0 ],
    [0, 0, 0, 0, 0, 0, 0, 3, 3, 0 ],
    [0, 0, 0, 0, 0, 0, 0, 3, 3, 0 ],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ]
]


const testImageMasks: UnitMask[] = [
    {
        x0: 0,
        y0: 0,
        w0: 5,
        h0: 5,
        data: [
            [1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1]
        ]
    },
    {
        x0: 10,
        y0: 10,
        w0: 5,
        h0: 5,
        data: [
            [0, 0, 0, 0, 0],
            [0, 1, 1, 1, 0],
            [0, 1, 1, 1, 0],
            [0, 1, 1, 1, 0],
            [0, 0, 0, 0, 0]
        ]
    },
    {
        x0: 20,
        y0: 20,
        w0: 5,
        h0: 5,
        data: [
            [1, 1, 1, 1, 1],
            [1, 0, 0, 0, 1],
            [1, 1, 1, 1, 1],
            [1, 0, 0, 0, 1],
            [1, 1, 1, 1, 1]
        ]
    }
]


const PlaneView: FunctionComponent<Props> = ({data, width, height, onSelect, selectedRois}) => {

    const [canvasElement, setCanvasElement] = useState<HTMLCanvasElement | undefined>(undefined)

    const statusBarHeight = 15
    const N1 = testData.length
    const N2 = testData[0].length
    const scale = Math.min(width / N1, (height - statusBarHeight) / N2)
    const offsetX = (width - N1 * scale) / 2
    const offsetY = ((height - statusBarHeight) - N2 * scale) / 2
    const blockW = width / N1
    const blockH = height / N2

    const handleMouseUp = useCallback((e: React.MouseEvent) => {

        var canvas = document.getElementById('plane_canvas');
        let boundingRect = canvas.getBoundingClientRect()
        const x = e.clientX  - boundingRect.x
        const y = e.clientY  - boundingRect.y

        var w = canvas.width;
        var h = canvas.height;
        

        const intX = Math.floor((x / w) * testData.length)
        const intY = Math.floor((y / h) * testData[0].length)        
        const a = testData[intX][intY]

        if (a != 0) {
            return onSelect(a)
        }

    }, [])


    const [loadingMessage, setLoadingMessage] = useState('')

    useEffect(() => {
        setLoadingMessage('Loading...')
        let canceled = false
        if (!canvasElement) return
        const ctx = canvasElement.getContext('2d')
        if (!ctx) return
        ctx.fillStyle = 'black'
        ctx.fillRect(0, 0, canvasElement.width, canvasElement.height)
        
        const load = async () => {
            const imageData = ctx.createImageData(N1, N2)
            for (let i = 0; i < N1; i++) {
                for (let j = 0; j < N2; j++) {
                    const a = testData[i][j]
                    if (selectedRois.includes(a)) {
                        var color = [255, 255, 255]
                    }
                    else if (a == 0) {
                        var color = [0, 0, 0]
                    }
                    else {
                        var color = distinctColors[a % distinctColors.length]
                    }
                    
                    ctx.fillStyle = "rgb(" + color[0] + ", " + color[1] + ", " + color[2] + ")";
                    ctx.fillRect(i * blockW, j * blockH, blockW, blockH)

                }
            }
        }
        load()
        return () => {canceled = true}
    }, [canvasElement, N1, N2, scale, selectedRois])

    return (
        <div style={{position: 'absolute', width, height, fontSize: 12}}>
            <div style={{position: 'absolute', width: N1 * scale, height: N2 * scale, left: offsetX, top: offsetY}}>
                <canvas
                    id='plane_canvas'
                    ref={elmt => elmt && setCanvasElement(elmt)}
                    width={N1 * scale}
                    height={N2 * scale}
                    onMouseUp={handleMouseUp}
                />
            </div>
            <div style={{position: 'absolute', width, height: statusBarHeight, top: height - statusBarHeight}}>
                {loadingMessage}
            </div>
        </div>
    )

}


const PlaneSegmentationView: FunctionComponent<Props> = ({data, width, height, onSelect, selectedRois}) => {
    const [canvasElement, setCanvasElement] = useState<HTMLCanvasElement | undefined>(undefined)

    const [selectedCoordinate, setSelectedCoordinate] = useState<any | any>(undefined)

    const statusBarHeight = 15

    const N0 = 3 // number of units
    const N1 = 200 // width ?
    const N2 = 200 // height ?
    const scale = Math.min(width / N1, (height - statusBarHeight) / N2)
    const offsetX = (width - N1 * scale) / 2
    const offsetY = ((height - statusBarHeight) - N2 * scale) / 2

    const [loadingMessage, setLoadingMessage] = useState('')

    const handleMouseUp = useCallback((e: React.MouseEvent) => {
        const x = e.clientX //- boundingRect.x
        const y = e.clientY //- boundingRect.y
        let idx = 0;
        
        // const selectedCoord = [event.x, event.]
        // console.log(selectedCoord)
        // setSelectedCoordinate(selectedCoord)
        // here we need to find the ROI and return data
        // Here we need logic to find the ROI from the mouse click
        return onSelect(idx)
    }, [])

    const getImageMask = useMemo(() => (
        (index: number) => {
            return testImageMasks[index]
        }
    ), [])

    useEffect(() => {
        setLoadingMessage('Loading...')
        let canceled = false
        if (!canvasElement) return
        const ctx = canvasElement.getContext('2d')
        if (!ctx) return
        ctx.fillStyle = 'black'
        ctx.fillRect(0, 0, canvasElement.width, canvasElement.height)
        const load = async () => {
            let timer = Date.now()
            for (let j = 0; j < N0; j++) {
                const elapsed = (Date.now() - timer) / 1000
                if (elapsed > 1) {
                    setLoadingMessage(`Loaded ${j} / ${N0}...`)
                    timer = Date.now()
                }
                console.log(selectedRois)
                if (selectedRois.includes(j)) {
                    console.log('here')
                    var color = [255, 255, 255]
                }
                else {
                    var color = distinctColors[j % distinctColors.length]
                }

                const aa = getImageMask(j)
                if (canceled) return
                const {x0, y0, w0, h0, data} = aa
                const maxval = computeMaxVal(data)
                const imageData = ctx.createImageData(w0, h0)
                for (let i = 0; i < w0; i++) {
                    for (let j = 0; j < h0; j++) {
                        const v = data[i][j] / (maxval || 1)
                        const index = (j * w0 + i) * 4
                        imageData.data[index + 0] = color[0] * v
                        imageData.data[index + 1] = color[1] * v
                        imageData.data[index + 2] = color[2] * v
                        imageData.data[index + 3] = v ? (v * 255) : 0
                    }
                }
                const offscreenCanvas = document.createElement('canvas')
                offscreenCanvas.width = w0
                offscreenCanvas.height = h0
                const c = offscreenCanvas.getContext('2d')
                if (!c) return
                c.putImageData(imageData, 0, 0)
                ctx.drawImage(offscreenCanvas, x0 * scale, y0 * scale, w0 * scale, h0 * scale)
            }
            setLoadingMessage(`Loaded ${N0} units`)
        }
        load()
        return () => {canceled = true}
    }, [canvasElement, N0, N1, N2, scale, getImageMask, selectedRois])

    return (
        <div style={{position: 'absolute', width, height, fontSize: 12}}>
            <div style={{position: 'absolute', width: N1 * scale, height: N2 * scale, left: offsetX, top: offsetY}}>
                <canvas
                    ref={elmt => elmt && setCanvasElement(elmt)}
                    width={N1 * scale}
                    height={N2 * scale}
                    onMouseUp={handleMouseUp}
                />
            </div>
            <div style={{position: 'absolute', width, height: statusBarHeight, top: height - statusBarHeight}}>
                {loadingMessage}
            </div>
        </div>
    )
}

const getBoundingRect = (data: number[][]) => {
    let x0 = undefined
    let y0 = undefined
    let x1 = undefined
    let y1 = undefined
    for (let i = 0; i < data.length; i++) {
        const row = data[i]
        for (let j = 0; j < row.length; j++) {
            const v = row[j]
            if (v) {
                if (x0 === undefined) x0 = i
                if (y0 === undefined) y0 = j
                if (x1 === undefined) x1 = i
                if (y1 === undefined) y1 = j
                x0 = Math.min(x0, i)
                y0 = Math.min(y0, j)
                x1 = Math.max(x1, i)
                y1 = Math.max(y1, j)
            }
        }
    }
    if ((x0 === undefined) || (y0 === undefined) || (x1 === undefined) || (y1 === undefined)) return {x0: 0, y0: 0, w0: 0, h0: 0}
    return {x0, y0, w0: x1 - x0 + 1, h0: y1 - y0 + 1}
}

const computeMaxVal = (data: number[][]) => {
    let maxval = 0
    for (let i = 0; i < data.length; i++) {
        const row = data[i]
        for (let j = 0; j < row.length; j++) {
            const v = row[j]
            maxval = Math.max(maxval, v)
        }
    }
    return maxval
}

//export default PlaneSegmentationView
export {PlaneSegmentationView, PlaneView};