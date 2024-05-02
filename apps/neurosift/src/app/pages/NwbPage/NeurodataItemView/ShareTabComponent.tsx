import { FunctionComponent, useCallback, useMemo, useRef, useState } from "react"
import { useTimeRange, useTimeseriesSelection } from "../../../package/context-timeseries-selection"
import { Hyperlink } from "@fi-sci/misc"

type Props = {
    tabName?: string
    stateString?: string
}

const ShareTabComponent: FunctionComponent<Props> = ({tabName, stateString}) => {
    const [clicked, setClicked] = useState(false)
    const [includeTimeSelection, setIncludeTimeSelection] = useState(false)
    const [includeState, setIncludeState] = useState(false)
    const {visibleStartTimeSec, visibleEndTimeSec} = useTimeRange()
    const {currentTime} = useTimeseriesSelection()

    const url = useMemo(() => {
        if (!tabName) return null
        let url = window.location.href
        // remove tab and tab-time and tab-state query parameters from url
        url = url.replace(/&tab=[^&]*/g, '')
        url = url.replace(/&tab-time=[^&]*/g, '')
        url = url.replace(/&tab-state=[^&]*/g, '')
        url += `&tab=${tabName}`
        if (includeTimeSelection) {
            url += `&tab-time=${visibleStartTimeSec},${visibleEndTimeSec},${currentTime}`
        }
        if (includeState) {
            url += `&tab-state=${stateString}`
        }
        return url
    }, [tabName, includeTimeSelection, visibleStartTimeSec, visibleEndTimeSec, currentTime, stateString, includeState])

    if (!tabName) return <div />

    if ((clicked) && (url)) {
        return (
            <div>
                <CopyableText text={url} />
                <Checkbox value={includeTimeSelection} setValue={setIncludeTimeSelection} label="Include time selection" />
                {
                    stateString && (
                        <Checkbox value={includeState} setValue={setIncludeState} label="Include state" />
                    )
                }
            </div>
        )
    }

    return (
        <div>
            <Hyperlink onClick={() => setClicked(true)}>Share this tab</Hyperlink>
        </div>
    )
}

const Checkbox: FunctionComponent<{value: boolean, setValue: (val: boolean) => void, label: string}> = ({value, setValue, label}) => {
    return (
        <div>
            <input type="checkbox" checked={value} onChange={evt => setValue(evt.target.checked)} />
            <span>{label}</span>
        </div>
    )
}

const CopyableText: FunctionComponent<{text: string}> = ({text}) => {
    const inputRef = useRef<HTMLInputElement>(null)
    const handleCopy = useCallback(() => {
        navigator.clipboard.writeText(text)
    }, [text])
    return (
        <div>
            <input
                ref={inputRef}
                type="text"
                value={text}
                readOnly={true}
                onClick={() => {inputRef.current?.select()}}
            />
            <button onClick={handleCopy}>Copy</button>
        </div>
    )
}

export default ShareTabComponent