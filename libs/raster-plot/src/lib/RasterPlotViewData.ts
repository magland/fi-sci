import { isArrayOf, isOneOf, isString, isEqualTo, isNumber, optional, isBoolean, validateObject } from "@fi-sci/misc"
// import { HighlightIntervalSet, isHighlightIntervalSet } from '../../timeseries-views'

export type RPPlotData = {
    unitId: number | string
    spikeTimesSec: number[]
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const isRPPlotData = (x: any): x is RPPlotData => {
    return validateObject(x, {
        unitId: isOneOf([isNumber, isString]),
        spikeTimesSec: isArrayOf(isNumber)
    })
}

export type RasterPlotViewData = {
    type: 'RasterPlot'
    startTimeSec: number
    endTimeSec: number
    plots: RPPlotData[]
    // highlightIntervals?: HighlightIntervalSet[]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    highlightIntervals?: any[] // disable for now
    hideToolbar?: boolean
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const isRasterPlotViewData = (x: any): x is RasterPlotViewData => {
    return validateObject(x, {
        type: isEqualTo('RasterPlot'),
        startTimeSec: isNumber,
        endTimeSec: isNumber,
        plots: isArrayOf(isRPPlotData),
        // highlightIntervals: optional(isArrayOf(isHighlightIntervalSet)),
        highlightIntervals: optional(isArrayOf(() => (true))), // disable for now
        hideToolbar: optional(isBoolean)
    })
}