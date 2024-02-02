import { useReducer } from 'react'
import { BrowserRouter } from 'react-router-dom'
import MainWindow from './MainWindow'
import { CustomStatusBarStringsContext, customStatusBarStringsReducer } from './StatusBar'

function App() {
  const [customStatusBarStrings, customStatusBarStringsDispatch] = useReducer(customStatusBarStringsReducer, {})
  return (
    <BrowserRouter>
        <CustomStatusBarStringsContext.Provider value={{customStatusBarStrings, customStatusBarStringsDispatch}}>
          <MainWindow />
        </CustomStatusBarStringsContext.Provider>
    </BrowserRouter>
  )
}

export default App
