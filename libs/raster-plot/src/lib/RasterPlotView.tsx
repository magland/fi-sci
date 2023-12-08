import { useTimeSelection } from '@fi-sci/context-time-selection'
import { TimeScrollView, useTimeScrollView } from "@fi-sci/time-scroll-view"
import { FunctionComponent, useCallback, useEffect, useMemo, useState } from 'react'
import { getUnitColor, useSelectedUnitIds } from '@fi-sci/context-unit-selection'
import { RasterPlotViewData } from './RasterPlotViewData'
import { Opts, PlotData } from './WorkerTypes'
import workerText from './worker.text'

type Props = {
    data: RasterPlotViewData
    width: number
    height: number
}

const gridlineOpts = {
    hideX: false,
    hideY: true
}

const yAxisInfo = {
    showTicks: false,
    yMin: undefined,
    yMax: undefined
}

const RasterPlotView2: FunctionComponent<Props> = ({data, width, height}) => {
    const {startTimeSec, endTimeSec, plots, hideToolbar} = data
    const { reportTotalTimeRange, setVisibleTimeRange, visibleStartTimeSec, visibleEndTimeSec } = useTimeSelection()
    useEffect(() => {
        reportTotalTimeRange(startTimeSec, endTimeSec)
        setVisibleTimeRange(startTimeSec, endTimeSec)
    }, [startTimeSec, endTimeSec, reportTotalTimeRange, setVisibleTimeRange])

    const [canvasElement, setCanvasElement] = useState<HTMLCanvasElement | undefined>()
    const [worker, setWorker] = useState<Worker | null>(null)

    const [hoveredUnitId, setHoveredUnitId] = useState<string | number | undefined>(undefined)

    const {selectedUnitIds, unitIdSelectionDispatch} = useSelectedUnitIds()

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        
    }, [])

    useEffect(() => {
        if (!canvasElement) return
        // const worker = new Worker(new URL('./worker', import.meta.url))
        const worker = new Worker(URL.createObjectURL(new Blob([workerText], {type: 'text/javascript'})))
        const offscreenCanvas = canvasElement.transferControlToOffscreen();
        worker.postMessage({
            canvas: offscreenCanvas,
        }, [offscreenCanvas])

		setWorker(worker)

        return () => {
            worker.terminate()
        }
    }, [canvasElement])

    const plotData = useMemo(() => {
        const ret: PlotData = {
            plots: plots.map(p => ({
                ...p,
                color: getUnitColor(p.unitId)
            }))
        }
        return ret
    }, [plots])

    useEffect(() => {
        if (!worker) return
        worker.postMessage({
            plotData
        })
    }, [plotData, worker])

    const {canvasWidth, canvasHeight, margins} = useTimeScrollView({width, height})

    useEffect(() => {
        if (!worker) return
        if (visibleStartTimeSec === undefined) return
        if (visibleEndTimeSec === undefined) return
        const opts: Opts = {
            canvasWidth,
            canvasHeight,
            margins,
            visibleStartTimeSec,
            visibleEndTimeSec,
            hoveredUnitId,
            selectedUnitIds: [...selectedUnitIds]
        }
        worker.postMessage({
            opts
        })
    }, [canvasWidth, canvasHeight, margins, visibleStartTimeSec, visibleEndTimeSec, worker, hoveredUnitId, selectedUnitIds])

    const numUnits = plots.length

    const pixelToUnitId = useCallback((p: {x: number, y: number}) => {
        const frac = 1 - (p.y - margins.top) / (canvasHeight - margins.top - margins.bottom)
        const index = Math.round(frac * numUnits - 0.5)
        if ((0 <= index) && (index < numUnits)) {
            return plots[index].unitId
        }
        else return undefined
    }, [canvasHeight, plots, margins, numUnits])

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        const boundingRect = e.currentTarget.getBoundingClientRect()
        const p = {x: e.clientX - boundingRect.x, y: e.clientY - boundingRect.y}
        const unitId = pixelToUnitId(p)
        if ((e.shiftKey) || (e.ctrlKey)) {
            unitIdSelectionDispatch({type: 'TOGGLE_UNIT', targetUnit: unitId})
        }
        else {
            unitIdSelectionDispatch({type: 'UNIQUE_SELECT', targetUnit: unitId})
        }
    }, [pixelToUnitId, unitIdSelectionDispatch])

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        const boundingRect = e.currentTarget.getBoundingClientRect()
        const p = {x: e.clientX - boundingRect.x, y: e.clientY - boundingRect.y}
        const unitId = pixelToUnitId(p)
        if (unitId !== undefined) {
            setHoveredUnitId(unitId)
        }
    }, [pixelToUnitId])

    const handleMouseOut = useCallback((e: React.MouseEvent) => {
        setHoveredUnitId(undefined)
    }, [])

    if (visibleStartTimeSec === undefined) {
        return <div>Loading...</div>
    }
    return (
        <TimeScrollView
            width={width}
            height={height}
            onCanvasElement={setCanvasElement}
            gridlineOpts={gridlineOpts}
            onKeyDown={handleKeyDown}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseOut={handleMouseOut}
            hideToolbar={hideToolbar}
            yAxisInfo={yAxisInfo}
        />
    )
}

export default RasterPlotView2