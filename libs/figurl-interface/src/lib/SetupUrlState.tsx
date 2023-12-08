import { FunctionComponent, PropsWithChildren, useCallback, useEffect, useMemo, useState } from 'react';
import sendRequestToParent from './sendRequestToParent';
import UrlStateContext, { getInitialUrlState, UrlState } from './UrlStateContext';
import { isSetUrlStateResponse, SetUrlStateRequest } from './viewInterface/FigurlRequestTypes';

type Props = {
    // nothing for now
}

class ReportUrlStateChangeManager {
    #lastReportedState = {} as UrlState
    #changeHandlers: ((state: UrlState) => void)[] = []
    reportUrlStateChange(state: UrlState) {
        if (JSONStringifyDeterministic(state) === JSONStringifyDeterministic(this.#lastReportedState)) return
        this.#lastReportedState = state
        this.#changeHandlers.forEach(handler => handler(state))
    }
    onUrlStateChange(handler: (state: UrlState) => void) {
        this.#changeHandlers.push(handler)
        const cancel = () => {
            this.#changeHandlers = this.#changeHandlers.filter(h => (h !== handler))
        }
        return cancel
    }
}
const reportUrlStateChangeManager = new ReportUrlStateChangeManager()

export const handleReportUrlStateChange = (state: UrlState) => {
    // this state is coming from the parent window (for example when the user clicks the back button)
    reportUrlStateChangeManager.reportUrlStateChange(state)
}

const SetupUrlState: FunctionComponent<PropsWithChildren<Props>> = (props) => {
    const [urlState, setUrlState] = useState<UrlState>(getInitialUrlState()) // important that this component is defined AFTER initialization
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleSetUrlState = useCallback((state: {[key: string]: any}) => {
        ;(async () => {
            const request: SetUrlStateRequest = {
                type: 'setUrlState',
                state
            }
            const response = await sendRequestToParent(request)
            if (!isSetUrlStateResponse(response)) throw Error('Invalid response to setUrlState')

            // this was the old method
            // we don't do this anymore because we wait for the parent to send us the new state (see below)
            // setUrlState(state)
        })()
    }, [])
    const value = useMemo(() => ({urlState, setUrlState: handleSetUrlState}), [urlState, handleSetUrlState])

    useEffect(() => {
        const cancel = reportUrlStateChangeManager.onUrlStateChange((state: UrlState) => {
            // this update is coming from the parent window, so we don't want to send a request to the parent
            // we just want to update it locally
            setUrlState(state)
        })
        return cancel
    }, [])

    return (
        <UrlStateContext.Provider value={value}>
            {props.children}
        </UrlStateContext.Provider>
    )
}

// Thanks: https://stackoverflow.com/questions/16167581/sort-object-properties-and-json-stringify
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const JSONStringifyDeterministic = ( obj: any, space: string | number | undefined =undefined ) => {
    const allKeys: string[] = []
    JSON.stringify( obj, function( key, value ){ allKeys.push( key ); return value; } )
    allKeys.sort()
    return JSON.stringify( obj, allKeys, space )
}

export default SetupUrlState