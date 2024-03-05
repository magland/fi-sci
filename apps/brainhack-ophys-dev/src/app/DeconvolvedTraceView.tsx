import { FunctionComponent, useCallback, useMemo } from "react";
import Plot from 'react-plotly.js';
import { ROIsData } from './GetData';

type Props = {
    rois: ROIsData
    height: number // height of the trace display
    selectedRois: number[]
}


const DeconvolvedTraceComponent: FunctionComponent<Props> = ({rois, height, selectedRois}) => {
    if(rois.validate() !== true) { 
        throw Error('variable series length data')
    }
    
    const getData = useCallback((selectedRois: number[]) => {
        const data: {y: number[], x: number[], mode: string, name: string, line: {color: string}}[] = []
        let i = 0;
        const heightPadding = 1
        for (const [id, arr] of rois.trace) {
            // If no rois are selected draw all lines
            // If rois are selected only draw selected lines       
            if (selectedRois.length === 0 || selectedRois.includes(id + 1)) {
                const color = rois.id2colour(id)
                const y = []
                for (let j = 0; j < arr.length; j++) {
                    y.push(arr[i] + heightPadding * i)
                }
                data.push({
                    y,
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
    }, [rois])

    // Get the data, memo it so it is only refected if selectedRois change
    const data = useMemo(() => getData(selectedRois), [getData, selectedRois])
    const padding = 1;

    const xAxisLabel = 'Time (s)'
    const yAxisLabel = 'ROI id'
    const defRange = 600  // seconds
    const totalLength = rois.time[rois.time.length - 1] - rois.time[0]
    const range = [rois.time[0], rois.time[0] + Math.min(defRange, totalLength)];
    console.log('xrange = ', range)
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
                    showticklabels: false,
                    range: [-padding, Math.max.apply(Math, data[data.length - 1].y) + padding]
                },
                margin: {
                    l: 50,
                    r: 10,
                    t: 10,
                    b: 50
                },
                showlegend: false
            }}
            useResizeHandler={true}
            style={{width: '100%'}}
        />
    )
}

export { DeconvolvedTraceComponent, ROIsData };
