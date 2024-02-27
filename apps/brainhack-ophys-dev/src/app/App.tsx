import { FunctionComponent } from "react";
import './App.css'

type Props = {
  // name: string;
}

const App: FunctionComponent<Props> = () => {
  const a: number = 4
  return (
    <div>
      <h1>Brainhack Ophys Dev {a}</h1>
    </div>
  )
}


export default App;