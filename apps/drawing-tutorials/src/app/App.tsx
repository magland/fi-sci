import Example1 from "./Example1/Example1";

/* eslint-disable @typescript-eslint/no-explicit-any */
function App() {
  return (
    <div style={{padding: 20}}>
      <h1>Drawing Tutorials</h1>
      <div>
        <Example1 width={500} height={500} />
      </div>
    </div>
  )
}

export default App;