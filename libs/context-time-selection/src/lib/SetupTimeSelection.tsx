import { FunctionComponent, PropsWithChildren, useReducer } from "react"
import { TimeSelectionContext } from "./TimeSelectionContext"
import { timeSelectionReducer } from "./timeSelectionReducer"

export const SetupTimeSelection: FunctionComponent<PropsWithChildren> = ({children}) => {
    const [state, dispatch] = useReducer(timeSelectionReducer, {})
    return (
        <TimeSelectionContext.Provider value={{state, dispatch}}>
            {children}
        </TimeSelectionContext.Provider>
    )
}