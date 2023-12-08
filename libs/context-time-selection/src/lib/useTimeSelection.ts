import { useCallback, useContext } from "react"
import { TimeSelectionContext } from "./TimeSelectionContext"

export const useTimeSelection = () => {
    const context = useContext(TimeSelectionContext)
    if (!context) throw Error('useTimeSelection() must be used within a TimeSelectionContextProvider')
    const dispatch = context.dispatch
    const reportTotalTimeRange = useCallback((startTimeSec: number, endTimeSec: number) => {
        dispatch({
            type: 'report_total_time_range',
            startTimeSec,
            endTimeSec
        })
    }, [dispatch])
    const setVisibleTimeRange = useCallback((visibleStartTimeSec: number, visibleEndTimeSec: number) => {
        dispatch({
            type: 'set_visible_time_range',
            visibleStartTimeSec,
            visibleEndTimeSec
        })
    }, [dispatch])
    const setCurrentTime = useCallback((currentTimeSec: number) => {
        dispatch({
            type: 'set_current_time',
            currentTimeSec
        })
    }, [dispatch])
    const setCurrentTimeFraction = useCallback((fraction: number) => {
        dispatch({
            type: 'set_current_time_fraction',
            fraction
        })
    }, [dispatch])
    const panTimeSelection = useCallback((deltaSec: number) => {
        dispatch({
            type: 'pan_time_selection',
            deltaSec
        })
    }, [dispatch])
    const zoomTimeSelection = useCallback((factor: number, anchorTimeSec?: number) => {
        dispatch({
            type: 'zoom_time_selection',
            anchorTimeSec,
            factor
        })
    }, [dispatch])
    const panTimeSelectionPct = useCallback((pct: number) => {
        dispatch({
            type: 'pan_time_selection_pct',
            pct
        })
    }, [dispatch])
    return {
        startTimeSec: context.state.startTimeSec,
        endTimeSec: context.state.endTimeSec,
        visibleStartTimeSec: context.state.visibleStartTimeSec,
        visibleEndTimeSec: context.state.visibleEndTimeSec,
        currentTimeSec: context.state.currentTimeSec,
        reportTotalTimeRange,
        setVisibleTimeRange,
        setCurrentTime,
        setCurrentTimeFraction,
        zoomTimeSelection,
        panTimeSelection,
        panTimeSelectionPct
    }
}
