import { TimeSelection } from "./TimeSelection"

export type TimeSelectionAction = {
    type: 'report_total_time_range'
    startTimeSec: number
    endTimeSec: number
} | {
    type: 'set_visible_time_range'
    visibleStartTimeSec: number
    visibleEndTimeSec: number
} | {
    type: 'set_current_time'
    currentTimeSec: number
} | {
    type: 'set_current_time_fraction'
    fraction: number
} | {
    type: 'pan_time_selection'
    deltaSec: number
} | {
    type: 'zoom_time_selection'
    anchorTimeSec?: number
    factor: number
} | {
    type: 'pan_time_selection_pct'
    pct: number
}

export const timeSelectionReducer = (state: TimeSelection, action: TimeSelectionAction): TimeSelection => {
    switch (action.type) {
        case 'report_total_time_range': {
            const newStartTimeSec = (state.startTimeSec === undefined) ? action.startTimeSec : Math.min(state.startTimeSec, action.startTimeSec)
            const newEndTimeSec = (state.endTimeSec === undefined) ? action.endTimeSec : Math.max(state.endTimeSec, action.endTimeSec)
            return {
                ...state,
                startTimeSec: newStartTimeSec,
                endTimeSec: newEndTimeSec
            }
        }
        case 'set_visible_time_range': {
            return {
                ...state,
                visibleStartTimeSec: action.visibleStartTimeSec,
                visibleEndTimeSec: action.visibleEndTimeSec
            }
        }
        case 'set_current_time': {
            return {
                ...state,
                currentTimeSec: action.currentTimeSec
            }
        }
        case 'set_current_time_fraction': {
            if ((state.visibleStartTimeSec === undefined) || (state.visibleEndTimeSec === undefined)) return state
            return {
                ...state,
                currentTimeSec: state.visibleStartTimeSec + action.fraction * (state.visibleEndTimeSec - state.visibleStartTimeSec)
            }
        }
        case 'pan_time_selection': {
            if ((state.visibleStartTimeSec === undefined) || (state.visibleEndTimeSec === undefined)) return state
            if ((state.startTimeSec === undefined) || (state.endTimeSec === undefined)) return state
            const delta = action.deltaSec
            let newVisibleStartTimeSec = state.visibleStartTimeSec + delta
            let newVisibleEndTimeSec = state.visibleEndTimeSec + delta
            if (newVisibleStartTimeSec < state.startTimeSec) {
                newVisibleStartTimeSec = state.startTimeSec
                newVisibleEndTimeSec = newVisibleStartTimeSec + state.visibleEndTimeSec - state.visibleStartTimeSec
            }
            if (newVisibleEndTimeSec > state.endTimeSec) {
                newVisibleEndTimeSec = state.endTimeSec
                newVisibleStartTimeSec = newVisibleEndTimeSec - state.visibleEndTimeSec + state.visibleStartTimeSec
            }
            return {
                ...state,
                visibleStartTimeSec: newVisibleStartTimeSec,
                visibleEndTimeSec: newVisibleEndTimeSec
            }
        }
        case 'pan_time_selection_pct': {
            if ((state.visibleStartTimeSec === undefined) || (state.visibleEndTimeSec === undefined)) return state
            if ((state.startTimeSec === undefined) || (state.endTimeSec === undefined)) return state
            const deltaPct = action.pct
            let newVisibleStartTimeSec = state.visibleStartTimeSec + deltaPct * (state.visibleEndTimeSec - state.visibleStartTimeSec)
            let newVisibleEndTimeSec = state.visibleEndTimeSec + deltaPct * (state.visibleEndTimeSec - state.visibleStartTimeSec)
            if (newVisibleStartTimeSec < state.startTimeSec) {
                newVisibleStartTimeSec = state.startTimeSec
                newVisibleEndTimeSec = newVisibleStartTimeSec + state.visibleEndTimeSec - state.visibleStartTimeSec
            }
            if (newVisibleEndTimeSec > state.endTimeSec) {
                newVisibleEndTimeSec = state.endTimeSec
                newVisibleStartTimeSec = newVisibleEndTimeSec - state.visibleEndTimeSec + state.visibleStartTimeSec
            }
            return {
                ...state,
                visibleStartTimeSec: newVisibleStartTimeSec,
                visibleEndTimeSec: newVisibleEndTimeSec
            }
        }
        case 'zoom_time_selection': {
            if ((state.visibleStartTimeSec === undefined) || (state.visibleEndTimeSec === undefined)) return state
            if ((state.startTimeSec === undefined) || (state.endTimeSec === undefined)) return state
            const anchorTimeSec = action.anchorTimeSec || (state.visibleStartTimeSec + state.visibleEndTimeSec) / 2
            const factor = action.factor
            let newVisibleStartTimeSec = anchorTimeSec + 1 / factor * (state.visibleStartTimeSec - anchorTimeSec)
            let newVisibleEndTimeSec = anchorTimeSec + 1 / factor * (state.visibleEndTimeSec - anchorTimeSec)
            if (newVisibleStartTimeSec < state.startTimeSec) {
                newVisibleStartTimeSec = state.startTimeSec
            }
            if (newVisibleEndTimeSec > state.endTimeSec) {
                newVisibleEndTimeSec = state.endTimeSec
            }
            return {
                ...state,
                visibleStartTimeSec: newVisibleStartTimeSec,
                visibleEndTimeSec: newVisibleEndTimeSec
            }
        }
        default:
            throw Error('Unexpected action type in timeSelectionReducer')
    }
}