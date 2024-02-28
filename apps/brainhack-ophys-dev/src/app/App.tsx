import { FunctionComponent, useCallback, useState, useMemo } from "react";
import './App.css'
import {PlaneSegmentationView} from "./PlaneSegmentationView";
import {DeconvolvedTraceComponent} from "./DeconvolvedTraceView";
import { useFetchData } from "./GetData";


const App: FunctionComponent = () => {
  const req = useMemo(() => ({url: 'https://neurosift.org/tmp/vis_traces.json', method: 'TEST'}),[]);
  const {data, loading, error} = useFetchData(req);

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

if (!data && loading === true) {
  return <div>Loading {req.url}</div>
} else if (error) {
  return <div>Failed to load {req.url}</div>
}
console.info('ophysData', data)

  return (
    <div id='container'>
      <h1 id='header'>Brainhack Ophys Dev</h1>
      <div id='plane'>
        <PlaneSegmentationView
          width={500}
          height={500}
          data={data}
          onSelect={(idx: number) => onRoiSelected(idx)} 
          selectedRois={selectedRois}
        />
      </div>
      <div id='traces'>
        <DeconvolvedTraceComponent
          rois={data}
          height={500}
          selectedRois={selectedRois}
        />
      </div> 
    </div>
  )
}


export default App;