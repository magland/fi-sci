import { FunctionComponent } from "react";
import { ROIsData } from './GetData'
import Plot from 'react-plotly.js';

type Props = {
    rois: ROIsData
}



const DeconvolvedTraceComponent: FunctionComponent<Props> = ({rois}) => {
    
    if(rois.validate() !== true) { 
        console.log('variable series length data')
        return
    }
    const heightPadding = 1
    const height = 1000 //rois.trace.size * heightPadding
    const data: object[] = []
    // TODO this should use entries and ROI IDs may be incomplete list
    let i = 0;
    for (const [id, arr] of rois.trace) {
        const offset = heightPadding * i
        data.push({
            y: arr.map((x: number) => x + offset),
            x: rois.time,
            mode: 'lines',
            name: 'ROI #' + id
        })
        i++
    }
    const xAxisLabel = 'Time (s)'
    const yAxisLabel = 'ROI id'
    const defRange = 10  // seconds
    const totalLength = rois.time[rois.time.length - 1] - rois.time[0]
    const range = [rois.time[0], rois.time[0] + Math.min(defRange, totalLength)];
    return (
        <Plot
            data={data}
            layout={{
                height,
                xaxis: {
                    title: xAxisLabel,
                    range: range,
                },
                yaxis: {
                    title: yAxisLabel,
                    visible: false,
                    showticklabels: false
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