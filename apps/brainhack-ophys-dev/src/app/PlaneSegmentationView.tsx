/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { FunctionComponent, useEffect, useMemo, useState, useCallback } from "react"
import { MergedRemoteH5File, RemoteH5Dataset, RemoteH5File, RemoteH5Group } from "@fi-sci/remote-h5-file"


type Props = {
    width: number
    height: number
    data: number[][]
    selectedSegmentationName: string
    selectedRois: number[]
    onSelect: (idx: number) => void
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


const PlaneSegmentationView: FunctionComponent<Props> = ({data, width, height, onSelect, selectedRois}) => {

    const [canvasElement, setCanvasElement] = useState<HTMLCanvasElement | undefined>(undefined)
    const statusBarHeight = 15
    const N1 = data.length
    const N2 = data[0].length
    const scale = Math.min(width / N1, (height - statusBarHeight) / N2)
    const offsetX = (width - N1 * scale) / 2
    const offsetY = ((height - statusBarHeight) - N2 * scale) / 2
    const blockW = width / N1
    const blockH = height / N2

    const handleMouseUp = useCallback((e: React.MouseEvent) => {

        const canvas = document.getElementById('plane_canvas')
        const boundingRect = canvas.getBoundingClientRect()
        const w = canvas.width
        const h = canvas.height
        const x = e.clientX  - boundingRect.x
        const y = e.clientY  - boundingRect.y
        const intX = Math.floor((x / w) * data.length)
        const intY = Math.floor((y / h) * data[0].length)        
        const a = data[intX][intY]

        if (a != 0) {
            return onSelect(a)
        }

    }, [])

    useEffect(() => {
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
                    const a = data[i][j]
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
    // style={{position: 'absolute', width: N1 * scale, height: N2 * scale, left: offsetX, top: offsetY}}
    return (
        //<div style={{position: 'absolute', width, height, fontSize: 12}}>
        <div>
            <div>
                <canvas
                    id='plane_canvas'
                    ref={elmt => elmt && setCanvasElement(elmt)}
                    width={N1 * scale}
                    height={N2 * scale}
                    onMouseUp={handleMouseUp}
                />
            </div>
        </div>
    )

}

export {PlaneSegmentationView};