import { TimeSelectionContext } from '@fi-sci/context-time-selection';
import { FunctionComponent, useContext, useMemo } from 'react';
import ElectrodeGeometry from './WaveformWidget/sharedDrawnComponents/ElectrodeGeometry';
import { WaveformColors } from './WaveformWidget/WaveformPlot';
import WaveformWidget from './WaveformWidget/WaveformWidget';

export type AverageWaveformPlotProps = {
    allChannelIds: (number | string)[]
    channelIds: (number | string)[]
    units: {
        channelIds: (number | string)[]
        waveform: number[][]
        waveformStdDev?: number[][]
        waveformPercentiles?: number[][][]
        waveformColor: string
    }[]
    layoutMode: 'geom' | 'vertical'
    hideElectrodes: boolean,
    channelLocations?: {[key: string]: number[]}
    samplingFrequency?: number
    peakAmplitude: number
    ampScaleFactor: number
    horizontalStretchFactor: number
    showChannelIds: boolean
    useUnitColors: boolean
    width: number
    height: number
    showReferenceProbe?: boolean
    disableAutoRotate?: boolean
}

const AverageWaveformPlot: FunctionComponent<AverageWaveformPlotProps> = ({allChannelIds, channelIds, units, layoutMode, hideElectrodes, channelLocations, samplingFrequency, peakAmplitude, ampScaleFactor, horizontalStretchFactor, showChannelIds, useUnitColors, showReferenceProbe, disableAutoRotate, width, height}) => {
    const electrodes = useMemo(() => {
        const locs = channelLocations || {}
        return channelIds.map(channelId => ({
            id: channelId,
            label: `${channelId}`,
            x: locs[`${channelId}`] !== undefined ? locs[`${channelId}`][0] : idToNum(channelId),
            y: locs[`${channelId}`] !== undefined ? locs[`${channelId}`][1] : 0
        }))
    }, [channelIds, channelLocations])
    const allElectrodes = useMemo(() => {
        const locs = channelLocations || {}
        return allChannelIds.map(channelId => ({
            id: channelId,
            label: `${channelId}`,
            x: locs[`${channelId}`] !== undefined ? locs[`${channelId}`][0] : idToNum(channelId),
            y: locs[`${channelId}`] !== undefined ? locs[`${channelId}`][1] : 0
        }))
    }, [allChannelIds, channelLocations])
    const referenceProbeWidth = width / 4

    const waveforms = useMemo(() => (
        units.map(unit => {
            const waveformColors: WaveformColors = {
                base: unit.waveformColor
            }
            const electrodeIndices = []
            for (const id of unit.channelIds) {
                electrodeIndices.push(electrodes.map(e => (e.id)).indexOf(id))
            }
            return {
                electrodeIndices,
                waveform: unit.waveform,
                waveformStdDev: unit.waveformStdDev,
                waveformPercentiles: unit.waveformPercentiles,
                waveformColors
            }
        })
    ), [electrodes, units])

    const waveformWidget = (
        <WaveformWidget
            waveforms={waveforms}
            electrodes={electrodes}
            ampScaleFactor={ampScaleFactor}
            horizontalStretchFactor={horizontalStretchFactor}
            layoutMode={channelLocations ? layoutMode : 'vertical'}
            hideElectrodes={hideElectrodes}
            width={showReferenceProbe ? width - referenceProbeWidth : width}
            height={height}
            showLabels={true} // for now
            peakAmplitude={peakAmplitude}
            samplingFrequency={samplingFrequency}
            showChannelIds={showChannelIds}
            useUnitColors={useUnitColors}
            waveformWidth={2}
            disableAutoRotate={disableAutoRotate}
        />
    )

    const {state: timeSelection} = useContext(TimeSelectionContext)

    const timeSelectionProviderValue = useMemo(() => (
        {state: {...timeSelection, selectedElectrodeIds: channelIds}, dispatch: () => {}}
    ), [timeSelection, channelIds])

    return showReferenceProbe ? (
        <div style={{position: 'relative', width, height}}>
            <div style={{position: 'absolute', left: 0, top: 0, width: referenceProbeWidth, height}}>
                <TimeSelectionContext.Provider value={timeSelectionProviderValue}>
                    <ElectrodeGeometry
                        electrodes={allElectrodes}
                        disableSelection={false}
                        width={referenceProbeWidth}
                        height={height}
                    />
                </TimeSelectionContext.Provider>
            </div>
            <div style={{position: 'absolute', left: referenceProbeWidth, top: 0, width: width - referenceProbeWidth, height}}>
                {waveformWidget}
            </div>
        </div>
    ) : (
        waveformWidget
    )
}

const idToNum = (a: number | string): number => {
    if (typeof(a) === 'number') return a
    else if (typeof(a) === 'string') {
        const b = stripLeadingNonNumeric(a)
        try {
            const x = parseFloat(b)
            if (!isNaN(x)) return x
            else return 0
        }
        catch {
            return 0
        }
    }
    else return 0
}

const stripLeadingNonNumeric = (a: string) => {
    let i = 0
    while ((i < a.length) && (isNonNumeric(a[i]))) {
        i ++
    }
    return a.slice(i)
}

const isNonNumeric = (a: string) => {
    return isNaN(parseFloat(a))
}

export default AverageWaveformPlot