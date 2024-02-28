import { FunctionComponent, useEffect, useState } from "react";
import './App.css'
import PlaneSegmentationView from "./PlaneSegmentationView";
import ExamplePlotlyComponent from "./ExamplePlotlyComponent";

type Props = {
  // name: string;
}

const App: FunctionComponent<Props> = () => {
  const a: number = 4

  const [visTracesData, setVisTracesData] = useState<any>(undefined)

  useEffect(() => {
    ;(async () => {
      const response = await fetch('https://neurosift.org/tmp/vis_traces.json')
      const data = await response.json()
      setVisTracesData(data)
    })()
  }, [])

  console.info('visTracesData', visTracesData)

  if (!visTracesData) {
    return <div>Loading vis_traces.json</div>
  }

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
      <div style={{position: 'relative', width: 1000, height: 400}}>
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
      </div>
    </div>
  )
}


export default App;