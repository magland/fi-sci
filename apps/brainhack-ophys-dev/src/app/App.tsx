import { FunctionComponent } from "react";
import './App.css'
import PlaneSegmentationView from "./PlaneSegmentationView";

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
    </div>
  )
}


export default App;