import { FunctionComponent, useCallback, useState } from "react";
import './App.css'
import {PlaneSegmentationView, PlaneView} from "./PlaneSegmentationView";
import {DeconvolvedTraceComponent, ROIsData} from "./DeconvolvedTraceView";
import rawTraces from './vis_traces.json' ;  // resolveJsonModule: true in tsconfig todo remove
const testData: ROIsData = rawTraces as ROIsData;

type Props = {
  // name: string;
}

const App: FunctionComponent<Props> = () => {

  const [selectedRois, setSelectedRois] = useState<number[]>([])

  const onRoiSelected = useCallback((id: number) => {

    setSelectedRois(v => {
        if (v.includes(id)) {
            return v.filter(i => i !== id)
        }
        else {
            return [...v, id]
        }
    })
}, [])

  
  const a: number = 4
  return (
    <div>
      <h1>Brainhack Ophys Dev {a}</h1>
      <div>
        <PlaneView
          width={500}
          height={500}
          data={{}}
          selectedSegmentationName={'test'}
          onSelect={(idx: number) => onRoiSelected(idx)} 
          selectedRois={selectedRois}
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