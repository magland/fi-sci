import { FunctionComponent } from "react";
import Plot from 'react-plotly.js';

type ROIsData = {
    time: number[]
    trace: Map<number, number[]>
    roi_mask: Map<number, number[][]>
    sampleRate?: number
}

type Props = {
    rois: ROIsData
}


function isROITraces(rois: ROIsData): rois is ROIsData {
    const lengths = new Set()
    Object.values(rois.trace).forEach(arr => lengths.add(arr.length))
    return (
      typeof rois === "object" &&
      rois !== null &&
      lengths.size === 1 &&
      rois.time.length === lengths.values().next().value
    );
  }


const DeconvolvedTraceComponent: FunctionComponent<Props> = ({rois}) => {
    
    if(isROITraces(rois) !== true) { 
        console.log('variable series length data')
        return
    }
    const heightPadding = 1
    const height = 1000 //rois.trace.size * heightPadding
    const data: object[] = []
    // TODO this should use entries and ROI IDs may be incomplete list
    let i = 0;
    for (let arr of Object.values(rois.trace)) {
        const offset = heightPadding * i
        data.push({
            y: arr.map((x: number) => x + offset),
            x: rois.time,
            mode: 'lines',
            name: 'foo'
            // line: {color: [255, 255, 255]}
        })
        i++
    }
    console.log(data)
    // const data = rois.trace.map(s => ({
    //     x: s.data.map(d => d.x)
    //     y: s.data.map(d => d.y)
    //     name: s.label
    //     mode: 'lines'
    //     line: {
    //         color: s.color
    //     }
    // }))
    const xAxisLabel = 'Time (s)'
    const yAxisLabel = 'ROI id'
    return (
        <Plot
            data={data}
            layout={{
                height,
                xaxis: {
                    title: xAxisLabel
                },
                yaxis: {
                    title: yAxisLabel
                },
                margin: {
                    l: 50,
                    r: 10,
                    t: 10,
                    b: 50
                },
                showlegend: true
            }}
            useResizeHandler={true}
            style={{width: '100%'}}
        />
    )
}

export {DeconvolvedTraceComponent, ROIsData}