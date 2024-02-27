import { FunctionComponent, useState } from "react";
import './App.css'
import {PlaneSegmentationView} from "./PlaneSegmentationView";
import ExamplePlotlyComponent from "./ExamplePlotlyComponent";

type Props = {
  // name: string;
}

const App: FunctionComponent<Props> = () => {

  const [selectedROIs, setSelectedRois] = useState<any | any>(undefined)

  function onRoiSelected(idx: number) {
    console.log(idx)
    console.log('woppeee')
    let loc = selectedROIs.find((roi: number) => roi === idx)
    if (selectedROIs.includes(idx)) {
      
    }

  }

  // const onRoiSelected: FunctionComponent(idx: number) => {
  //   console.log(idx)
  //   console.log('wopppee')
  // }
    // let loc = selectedROIs.find((roi: number) => roi === idx)
    // if loc is null:


    // setSelectedRois([...selectedROIs, idx]);


  // const onRoiDeselected(idx) => {
  //   // Find the relevant idx and and pop it from the list
  //   setSelectedRois([]);
  // }
  
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
          onSelect={(idx: number) => onRoiSelected(idx)} 
          selectedRois={[0, 1]}
        />
      </div>

      {/* <div style={{position: 'relative', width: 1000, height: 400}}>
        <ExamplePlotlyComponent
          series={[
            {
              label: 'test',
              data: [{x: 0, y: 0}, {x: 1, y: 1}],
              color: 'red'
            }
          ]}
          yAxisLabel={'test'}
        />
      </div> */}
    </div>
  )
}


export default App;