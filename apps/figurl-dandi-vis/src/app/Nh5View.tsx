import { FunctionComponent } from "react"
import useNh5FileClient from "./useNh5FileClient"
import SpikeTrainsView from "./SpikeTrainsView/SpikeTrainsView"
import TuningCurves2DNh5View from "./TuningCurves2DNh5View/TuningCurves2DNh5View"
import SpikeSortingSummaryView from "./SpikeSortingSummaryView/SpikeSortingSummaryView"


type Nh5ViewProps = {
    width: number
    height: number
    nh5FileUri: string
}

const Nh5View: FunctionComponent<Nh5ViewProps> = ({ width, height, nh5FileUri }) => {
    const client = useNh5FileClient(nh5FileUri)
    const type0 = client?.rootGroup?.attrs['type']
    if (!client) return <div>Loading...</div>
    if (type0 === 'spike_trains') {
        return (
            <SpikeTrainsView
                nh5FileClient={client}
                width={width}
                height={height}
            />
        )
    }
    else if (type0 === 'tuning_curves_2d') {
        return (
            <TuningCurves2DNh5View
                nh5FileClient={client}
                width={width}
                height={height}
            />
        )
    }
    else if (type0 === 'spike_sorting_summary') {
        return (
            <SpikeSortingSummaryView
                nh5FileClient={client}
                width={width}
                height={height}
            />
        )
    }
    else {
        return <div>Unsupported type: {type0}</div>
    }
}

export default Nh5View