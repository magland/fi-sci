import { FunctionComponent, useCallback, useState } from "react";
import './App.css'
import {PlaneSegmentationView} from "./PlaneSegmentationView";
import {DeconvolvedTraceComponent} from "./DeconvolvedTraceView";
import { testData } from "./GetData";


const App: FunctionComponent = () => {

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
          data={testData}
          onSelect={(idx: number) => onRoiSelected(idx)} 
          selectedRois={selectedRois}
        />
      </div>
      <div id='traces'>
        <DeconvolvedTraceComponent
          rois={testData}
          height={500}
          selectedRois={selectedRois}
        />
      </div> 
    </div>
  )
}


export default App;