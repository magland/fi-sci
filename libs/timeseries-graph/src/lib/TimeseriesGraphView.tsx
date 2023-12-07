import React, { FunctionComponent, useCallback, useEffect, useMemo, useState } from 'react'
import { TimeseriesGraphViewData } from './TimeseriesGraphViewData'
import { useTimeSelection } from '@fi-sci/time-selection'
import { Opts } from './WorkerTypes'
import { TimeScrollView, useTimeScrollView } from "@fi-sci/time-scroll-view"

import workerText from './worker.text'

type Props = {
    data: TimeseriesGraphViewData
    width: number
    height: number
}

const TimeseriesGraphView: FunctionComponent<Props> = ({data, width, height}) => {
    const {visibleStartTimeSec, visibleEndTimeSec, reportTotalTimeRange, setVisibleTimeRange} = useTimeSelection()
    const {datasets, series, legendOpts, timeOffset, yRange, gridlineOpts, hideToolbar} = data

    const resolvedSeries = useMemo(() => (
        series.map(s => {
            const ds = datasets.filter(d => (d.name === s.dataset))[0]
            if (ds === undefined) throw Error(`Dataset not found in series: ${s.dataset}`)
            return {
                ...s,
                t: ds.data[s.encoding['t']],
                y: ds.data[s.encoding['y']]
            }
        })
    ), [series, datasets])

    const {minTime, maxTime} = useMemo(() => (
        {
            minTime: min(resolvedSeries.map(s => (min(s.t)))),
            maxTime: max(resolvedSeries.map(s => (max(s.t))))
        }
    ), [resolvedSeries])

    const {minValue, maxValue} = useMemo(() => (
        yRange ? ({minValue: yRange[0], maxValue: yRange[1]}) : {
            minValue: min(resolvedSeries.map(s => (min(s.y)))),
            maxValue: max(resolvedSeries.map(s => (max(s.y))))
        }
    ), [yRange, resolvedSeries])

    useEffect(() => {
        const t1 = minTime + (timeOffset || 0)
        const t2 = maxTime + (timeOffset || 0)
        reportTotalTimeRange(t1, t2)
        setVisibleTimeRange(t1, t2)
    }, [minTime, maxTime, timeOffset, reportTotalTimeRange, setVisibleTimeRange])

    const {canvasWidth, canvasHeight, margins} = useTimeScrollView({width, height, hideToolbar})

    const [hideLegend, setHideLegend] = useState<boolean>(false)

    const [canvasElement, setCanvasElement] = useState<HTMLCanvasElement | undefined>()
    const [worker, setWorker] = useState<Worker | null>(null)

    useEffect(() => {
        if (!canvasElement) return
        // const worker = new Worker(new URL('./worker.js', import.meta.url), {type: 'module'})
        // there's a reason we need to do it this way instead of using the above line
        const worker = new Worker(URL.createObjectURL(new Blob([workerText], {type: 'text/javascript'})), {type: 'module'})
        const offscreenCanvas = canvasElement.transferControlToOffscreen();
        worker.postMessage({
            canvas: offscreenCanvas,
        }, [offscreenCanvas])

		setWorker(worker)

        return () => {
            worker.terminate()
        }
    }, [canvasElement])

    useEffect(() => {
        if (!worker) return
        worker.postMessage({
            resolvedSeries
        })
    }, [resolvedSeries, worker])

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
            hideLegend,
            legendOpts: legendOpts || {location: 'northeast'},
            minValue,
            maxValue
        }
        worker.postMessage({
            opts
        })
    }, [canvasWidth, canvasHeight, margins, visibleStartTimeSec, visibleEndTimeSec, worker, hideLegend, legendOpts, minValue, maxValue])

    // useEffect(() => {
    //     if (!worker) return
    //     if (!data.annotation) return
    //     worker.postMessage({
    //         annotation: data.annotation
    //     })
    // }, [worker, data.annotation])

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'l') {
            setHideLegend(v => (!v))
        }
    }, [])

    const yAxisInfo = useMemo(() => ({
        showTicks: true,
        yMin: minValue,
        yMax: maxValue
    }), [minValue, maxValue])

    const content = (
        <TimeScrollView
            onCanvasElement={elmt => setCanvasElement(elmt)}
            gridlineOpts={gridlineOpts}
            onKeyDown={handleKeyDown}
            width={width}
            height={height}
            yAxisInfo={yAxisInfo}
            hideToolbar={hideToolbar}
        />
    )
    return content
}

const min = (a: number[]) => {
    return a.reduce((prev, current) => (prev < current) ? prev : current, a[0] || 0)
}

const max = (a: number[]) => {
    return a.reduce((prev, current) => (prev > current) ? prev : current, a[0] || 0)
}

export default TimeseriesGraphView