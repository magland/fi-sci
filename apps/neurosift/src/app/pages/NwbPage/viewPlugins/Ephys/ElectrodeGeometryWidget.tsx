import { FunctionComponent, useCallback, useEffect, useMemo, useState } from "react"

type ElectrodeGeometryWidgetProps = {
    width: number
    height: number
    electrodeLocations: ElectrodeLocation[]
}

export type ElectrodeLocation = {
    x: number,
    y: number
}

const ElectrodeGeometryWidget: FunctionComponent<ElectrodeGeometryWidgetProps> = ({width, height, electrodeLocations}) => {
    const [hoveredElectrodeIndex, setHoveredElectrodeIndex] = useState<number | undefined>(undefined)

    const locations2: ElectrodeLocation[] = useMemo(() => {
        const {xmin, xmax, ymin, ymax} = getBounds(electrodeLocations)
        const xspan = xmax - xmin
        const yspan = ymax - ymin
        const doTranspose = shouldTranspose(xspan, yspan, width, height)
        if (!doTranspose) return electrodeLocations
        else return electrodeLocations.map(loc => ({x: loc.y, y: loc.x}))
    }, [electrodeLocations, width, height])

    const {xmin, xmax, ymin, ymax} = useMemo(() => {
        return getBounds(locations2)
    }, [locations2])

    const scaleBarHeight = 30
    const {isotropicScale, xPixelOffset, yPixelOffset, markerPixelRadius} = useMemo(() => {
        // we will determine the xPixelMargin and yPixelMargin after the first pass once we find the markerRadius
        let markerPixelRadius = 0
        const xspan = xmax - xmin
        const yspan = ymax - ymin
        const coordSpacing = medianDistanceToNearestNeighbor(locations2)
        for (const pass of [1, 2]) {
            const xPixelMarginLeft = markerPixelRadius + 2
            const xPixelMarginRight = markerPixelRadius + 2
            const yPixelMarginTop = markerPixelRadius + 2
            const yPixelMarginBottom = markerPixelRadius + 2 + scaleBarHeight
            const W = width - xPixelMarginLeft - xPixelMarginRight
            const H = height - yPixelMarginTop - yPixelMarginBottom
            const xratio = W / xspan
            const yratio = H / yspan
            const isotropicScale = Math.min(xratio, yratio)
            const xPixelOffset = xPixelMarginLeft + (W - xspan * isotropicScale) / 2
            const yPixelOffset = yPixelMarginTop + (H - yspan * isotropicScale) / 2
            const pixelSpacing = coordSpacing * isotropicScale
            markerPixelRadius = Math.max(1, Math.floor(pixelSpacing / 2 * 0.8))
            if (pass === 2) {
                return {isotropicScale, xPixelOffset, yPixelOffset, markerPixelRadius}
            }
        }
        throw Error('Unexpected')
    }, [locations2, width, height, xmin, xmax, ymin, ymax])

    const coordToPixel = useMemo(() => ((x: number, y: number) => {
        const xp = xPixelOffset + (x - xmin) * isotropicScale
        const yp = yPixelOffset + (y - ymin) * isotropicScale
        return {xp, yp}
    }), [xPixelOffset, yPixelOffset, xmin, ymin, isotropicScale])

    const pixelToCoord = useMemo(() => ((xp: number, yp: number) => {
        const x = xmin + (xp - xPixelOffset) / isotropicScale
        const y = ymin + (yp - yPixelOffset) / isotropicScale
        return {x, y}
    }), [xPixelOffset, yPixelOffset, xmin, ymin, isotropicScale])

    const [canvasElement, setCanvasElement] = useState<HTMLCanvasElement | undefined>(undefined)

    useEffect(() => {
        if (!canvasElement) return
        const ctx = canvasElement.getContext('2d')
        if (!ctx) return
        ctx.clearRect(0, 0, width, height)
        ctx.strokeStyle = 'black'
        ctx.lineWidth = 1
        for (let i = 0; i < locations2.length; i++) {
            const loc = locations2[i]
            const {xp, yp} = coordToPixel(loc.x, loc.y)
            ctx.beginPath()
            ctx.arc(xp, yp, markerPixelRadius, 0, 2 * Math.PI)
            ctx.stroke()
            if (i === hoveredElectrodeIndex) {
                ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
                ctx.fill()
            }
        }
        function drawScaleBar() {
            if (!ctx) return
            const {yp: yMaxP} = coordToPixel(0, ymax)
            const pixelWidth = 100 * isotropicScale
            // center horizontally
            const xOffset = (width - pixelWidth) / 2
            const x1 = xOffset
            const x2 = xOffset + pixelWidth
            // const y1 = yp - scaleBarHeight + 5
            // const y2 = yp - scaleBarHeight + 5
            const y1 = yMaxP + markerPixelRadius + 10
            const y2 = yMaxP + markerPixelRadius + 10
            ctx.beginPath()
            ctx.moveTo(x1, y1)
            ctx.lineTo(x2, y2)
            ctx.stroke()
            ctx.font = '12px sans-serif'
            ctx.textAlign = 'center'
            ctx.textBaseline = 'top'
            ctx.fillText('100 μm', (x1 + x2) / 2, y2 + 5)
        }
        drawScaleBar()
    }, [canvasElement, width, height, locations2, markerPixelRadius, hoveredElectrodeIndex, isotropicScale, coordToPixel, ymax])

    const handleMouseMove = useCallback((evt: React.MouseEvent) => {
        const {x, y} = pixelToCoord(evt.nativeEvent.offsetX, evt.nativeEvent.offsetY)
        const hoveredElectrodeIndex = getElectrodeIndexAt(locations2, x, y, markerPixelRadius / isotropicScale / 0.8)
        setHoveredElectrodeIndex(hoveredElectrodeIndex)
    }, [pixelToCoord, locations2, markerPixelRadius, isotropicScale])

    const handleMouseLeave = useCallback(() => {
        setHoveredElectrodeIndex(undefined)
    }, [])

    return (
        <div
            style={{position: 'absolute', width, height}}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
        >
            <canvas
                ref={elmt => elmt && setCanvasElement(elmt)}
                width={width}
                height={height}
            />
        </div>
    )
}

const getBounds = (locations: ElectrodeLocation[]) => {
    if (locations.length === 0) return {xmin: 0, xmax: 0, ymin: 0, ymax: 0}
    let xmin = locations[0].x
    let xmax = locations[0].x
    let ymin = locations[0].y
    let ymax = locations[0].y
    for (const loc of locations) {
        xmin = Math.min(xmin, loc.x)
        xmax = Math.max(xmax, loc.x)
        ymin = Math.min(ymin, loc.y)
        ymax = Math.max(ymax, loc.y)
    }
    return {xmin, xmax, ymin, ymax}
}

const shouldTranspose = (xspan: number, yspan: number, width: number, height: number) => {
    const scale1 = Math.min(width / xspan, height / yspan)
    const scale2 = Math.min(width / yspan, height / xspan)
    return (scale2 > scale1)
}

const medianDistanceToNearestNeighbor = (locations: ElectrodeLocation[]) => {
    const distances: number[] = []
    for (let i = 0; i < locations.length; i++) {
        const loc1 = locations[i]
        let minDist = Infinity
        for (let j = 0; j < locations.length; j++) {
            if (i === j) continue
            const loc2 = locations[j]
            const dist = Math.sqrt(Math.pow(loc1.x - loc2.x, 2) + Math.pow(loc1.y - loc2.y, 2))
            minDist = Math.min(minDist, dist)
        }
        distances.push(minDist)
    }
    distances.sort()
    return distances[Math.floor(distances.length / 2)]
}

const getElectrodeIndexAt = (locations: ElectrodeLocation[], x: number, y: number, maxDist: number) => {
    for (let i = 0; i < locations.length; i++) {
        const loc = locations[i]
        const dist = Math.sqrt(Math.pow(loc.x - x, 2) + Math.pow(loc.y - y, 2))
        if (dist <= maxDist) return i
    }
    return undefined
}


export default ElectrodeGeometryWidget