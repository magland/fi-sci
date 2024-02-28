import { FunctionComponent, useMemo, useEffect } from "react";
import { ROIsData } from './GetData'
import Plot from 'react-plotly.js';

type Props = {
    rois: ROIsData
    height: number // height of the trace display
    selectedRois: number[]
}


const DeconvolvedTraceComponent: FunctionComponent<Props> = ({rois, height, selectedRois}) => {

    if(rois.validate() !== true) { 
        console.log('variable series length data')
        return
    }

    const getData = (selectedRois: number[]) => {

        const heightPadding = 1
        const data: object[] = []
        // TODO this should use entries and ROI IDs may be incomplete list
        let i = 0;
        for (const [id, arr] of rois.trace) {
            // If no rois are selected draw all lines
            // If rois are selected only draw selected lines       
            if (selectedRois.length == 0 || selectedRois.includes(id + 1)) {
                const color = rois.id2colour(id)
                data.push({
                    y: arr.map((x: number) => x + heightPadding * i),
                    x: rois.time,
                    mode: 'lines',
                    name: 'ROI #' + id,
                    line: {
                        color: "rgb(" + color[0] + ", " + color[1] + ", " + color[2] + ")",
                      }
                })
                i++
            }
        }
        return data
    };

    // Get the data, memo it so it is only refected if selectedRois change
    const data= useMemo(() => getData(selectedRois), [selectedRois]);

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