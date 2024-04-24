import { useReducer } from 'react'
import { BrowserRouter } from 'react-router-dom'
import MainWindow from './MainWindow'
import { CustomStatusBarElementsContext, customStatusBarElementsReducer } from './StatusBar'
import GithubAuthSetup from './GithubAuth/GithubAuthSetup'

function App() {
  const [customStatusBarStrings, customStatusBarStringsDispatch] = useReducer(customStatusBarElementsReducer, {})
  return (
    <GithubAuthSetup>
      <BrowserRouter>
          <CustomStatusBarElementsContext.Provider value={{customStatusBarElements: customStatusBarStrings, customStatusBarElementsDispatch: customStatusBarStringsDispatch}}>
            <MainWindow />
          </CustomStatusBarElementsContext.Provider>
      </BrowserRouter>
    </GithubAuthSetup>
  )
}

export default App
