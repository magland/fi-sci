import { Dispatch, createContext } from "react"
import { TimeSelection } from "./TimeSelection"
import { TimeSelectionAction } from "./timeSelectionReducer"

export type TimeSelectionContextType = {
    state: TimeSelection
    dispatch: Dispatch<TimeSelectionAction>
}

export const TimeSelectionContext = createContext<TimeSelectionContextType>({
    state: {},
    dispatch: () => {}
})