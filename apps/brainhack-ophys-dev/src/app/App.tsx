import { FunctionComponent, useCallback, useState, useMemo } from "react";
import './App.css'
import {PlaneSegmentationView, Click} from "./PlaneSegmentationView";
import {DeconvolvedTraceComponent} from "./DeconvolvedTraceView";
import { useFetchData } from "./GetData";


const App: FunctionComponent = () => {
  const urlParams = useMemo(() => (new URLSearchParams(window.location.search)),[]);
  const {data, loading, error} = useFetchData(urlParams);

  const [selectedRois, setSelectedRois] = useState<number[]>([])

  const onRoiSelected = useCallback((click: Click) => {

    setSelectedRois(v => {
      const id = click.idx
      const shift = click.shift
      if (v.includes(id)) {
          return v.filter(i => i !== id)
      } 
      else if (shift) {
        return [...v, id]
      }
      else {
          return [id]
      }
    })
  
}, [])

if (!data && loading === true) {
  return <div>Loading {urlParams.get('url')}</div>
} else if (error) {
  return <div>Failed to load {urlParams.get('url')}</div>
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
          onSelect={(click: Click) => onRoiSelected(click)} 
          selectedRois={selectedRois}
        />
      </div>
      <div id='traces'>
        <DeconvolvedTraceComponent
          rois={data}
          height={580}
          selectedRois={selectedRois}
        />
      </div> 
    </div>
  )
}


export default App;