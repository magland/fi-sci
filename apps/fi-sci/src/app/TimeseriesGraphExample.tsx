import { SetupTimeSelection } from "@fi-sci/context-time-selection";
import { TimeseriesGraphView, TimeseriesGraphViewData } from "@fi-sci/timeseries-graph";
import { FunctionComponent } from "react";

const createExampleDataSeries = (numPoints: number, period: number, amp: number): { t: number[], y: number[] } => {
    const t = []
    const y = []
    for (let i = 0; i < numPoints; i++) {
        const aa = i * 2 * Math.PI / period
        t.push(i)
        y.push(Math.sin(aa) * amp)
    }
    return { t, y }
}

const {t: t1, y: y1} = createExampleDataSeries(1000, 50, 2)
const {t: t2, y: y2} = createExampleDataSeries(1000, 90, 1.5)

const {t: t3, y: y3} = createExampleDataSeries(1000, 30, 3)
const {t: t4, y: y4} = createExampleDataSeries(1000, 120, 4)

const exampleData1: TimeseriesGraphViewData = {
    type: 'TimeseriesGraph',
    datasets: [
        {name: 'dataset1',data: {t: t1, y: y1}},
        {name: 'dataset2',data: {t: t2, y: y2}}
    ],
    series: [
        {type: 'line', dataset: 'dataset1', encoding: {t: 't', y: 'y'}, attributes: {color: 'red'}},
        {type: 'line', dataset: 'dataset2', encoding: {t: 't', y: 'y'}, attributes: {color: 'blue'}},
    ]
}

const exampleData2: TimeseriesGraphViewData = {
    type: 'TimeseriesGraph',
    datasets: [
        {name: 'dataset1',data: {t: t3, y: y3}},
        {name: 'dataset2',data: {t: t4, y: y4}}
    ],
    series: [
        {type: 'line', dataset: 'dataset1', encoding: {t: 't', y: 'y'}, attributes: {color: 'red'}},
        {type: 'line', dataset: 'dataset2', encoding: {t: 't', y: 'y'}, attributes: {color: 'blue'}},
    ]
}

type Props = {
    width: number
}

const TimeseriesGraphExample: FunctionComponent<Props> = ({ width }) => {
    return (
        <SetupTimeSelection>
            <p>The following two timeseries graphs are synchronized. Click and the use the mouse wheel to zoom. Hold mouse button and drag to pan.</p>
            <TimeseriesGraphView
                data={exampleData1}
                width={width}
                height={400}
            />
            <TimeseriesGraphView
                data={exampleData2}
                width={width}
                height={400}
            />
        </SetupTimeSelection>
    )
}

export default TimeseriesGraphExample