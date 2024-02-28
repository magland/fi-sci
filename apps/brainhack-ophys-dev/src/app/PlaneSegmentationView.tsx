/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { FunctionComponent, useEffect, useState, useCallback } from "react"
import { ROIsData } from "./GetData"


type Props = {
    width: number // width of the plane view
    height: number // height of the plane view
    data: ROIsData 
    selectedRois: number[]
    onSelect: (idx: number) => void
}

const PlaneSegmentationView: FunctionComponent<Props> = ({data, width, height, onSelect, selectedRois}) => {

    const [canvasElement, setCanvasElement] = useState<HTMLCanvasElement | undefined>(undefined)
    const N1 = data.roi_mask.length
    const N2 = data.roi_mask[0].length

    const blockW = width / N1
    const blockH = height / N2

    
    const handleMouseUp = useCallback((e: React.MouseEvent) => {

        const canvas = document.getElementById('plane_canvas')
        // Transform mouse click position to index in the data
        const boundingRect = canvas.getBoundingClientRect()
        const x = e.clientX  - boundingRect.x
        const y = e.clientY  - boundingRect.y
        const intX = Math.floor((x / canvas.width) * data.roi_mask.length)
        const intY = Math.floor((y / canvas.height) * data.roi_mask[0].length)        
        const d = data.roi_mask[intX][intY]

        if (d !== 0) {
            return onSelect(d)
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
            // Iterate through the data and assign colors to the correct pixels
            const imageData = ctx.createImageData(N1, N2)
            for (let i = 0; i < N1; i++) {
                for (let j = 0; j < N2; j++) {
                    const d = data.roi_mask[i][j]
                    let color
                    // If a pixel is selected display it as white
                    if (selectedRois.includes(d)) {
                        color = [255, 255, 255]
                    }
                    // If no roi in the pixel display as black
                    else if (d === 0) {
                        color = [0, 0, 0]
                    }
                    // Otherwise display the assigned cell colour
                    else {
                        color = data.id2colour(d - 1)
                    }
                    
                    ctx.fillStyle = "rgb(" + color[0] + ", " + color[1] + ", " + color[2] + ")";
                    ctx.fillRect(i * blockW, j * blockH, blockW, blockH)

                }
            }
        }
        load()
        // return () => {canceled = true}
    }, [canvasElement, N1, N2, selectedRois])

    return (
        <div>
            <div>
                <canvas
                    id='plane_canvas'
                    ref={elmt => elmt && setCanvasElement(elmt)}
                    width={width}
                    height={height}
                    onMouseUp={handleMouseUp}
                />
            </div>
        </div>
    )

}

export {PlaneSegmentationView};