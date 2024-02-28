import { FunctionComponent, useCallback, useState } from "react";
import './App.css'
import {PlaneSegmentationView} from "./PlaneSegmentationView";
import {DeconvolvedTraceComponent, ROIsData} from "./DeconvolvedTraceView";
import rawTraces from './vis_traces.json' ;  // resolveJsonModule: true in tsconfig todo remove
import test from "node:test";
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


  return (
    <div id='container'>
      <h1 id='header'>Brainhack Ophys Dev</h1>
      <div id='plane'>
        <PlaneSegmentationView
          width={500}
          height={500}
          data={testData.roi_mask}
          selectedSegmentationName={'test'}
          onSelect={(idx: number) => onRoiSelected(idx)} 
          selectedRois={selectedRois}
        />
      </div>
      <div id='traces'>
        <DeconvolvedTraceComponent
          rois={testData}
        />
      </div> 
    </div>
  )
}


export default App;