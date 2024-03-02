import { useReducer } from 'react'
import { BrowserRouter } from 'react-router-dom'
import MainWindow from './MainWindow'
import { CustomStatusBarStringsContext, customStatusBarStringsReducer } from './StatusBar'
import { SetupNeurosiftAnnotationsProvider } from './NeurosiftAnnotations/useNeurosiftAnnotations'

function App() {
  const [customStatusBarStrings, customStatusBarStringsDispatch] = useReducer(customStatusBarStringsReducer, {})
  return (
    <BrowserRouter>
        <CustomStatusBarStringsContext.Provider value={{customStatusBarStrings, customStatusBarStringsDispatch}}>
          <SetupNeurosiftAnnotationsProvider>
            <MainWindow />
          </SetupNeurosiftAnnotationsProvider>
        </CustomStatusBarStringsContext.Provider>
    </BrowserRouter>
  )
}

export default App
