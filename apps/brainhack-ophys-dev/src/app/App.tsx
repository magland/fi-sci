import { FunctionComponent } from "react";
import './App.css'
import PlaneSegmentationView from "./PlaneSegmentationView";
import {DeconvolvedTraceComponent, ROIsData} from "./DeconvolvedTraceView";
import rawTraces from './vis_traces.json' ;  // resolveJsonModule: true in tsconfig todo remove
const testData: ROIsData = rawTraces as ROIsData;
type Props = {
  // name: string;
}

const App: FunctionComponent<Props> = () => {
  const a: number = 4
  return (
    <div>
      <h1>Brainhack Ophys Dev {a}</h1>
      <div>
        <PlaneSegmentationView
          width={500}
          height={500}
          data={{}}
          selectedSegmentationName={'test'}
        />
      </div>
      <div style={{position: 'relative', width: 1000, height: 1000}}>
        <DeconvolvedTraceComponent
          rois={testData}
        />
      </div>
    </div>
  )
}


export default App;