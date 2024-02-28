import { FunctionComponent } from "react";
import Plot from 'react-plotly.js';

class ROIsData {
    readonly time: number[]
    readonly trace: Map<number, number[]>
    readonly roi_mask: number[][]
    readonly sampleRate?: number

    validate() {
        const lengths = new Set()
        Object.values(this.trace).forEach(arr => lengths.add(arr.length))
        return (
          this.time.length === lengths.values().next().value
        );
    }

    static fromJSON(obj: object) {
        obj.trace = new Map(Object.entries(obj))
        obj = Object.assign(new ROIsData(), obj) as ROIsData;
        obj.validate() // todo assert
        return obj
    }

}

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