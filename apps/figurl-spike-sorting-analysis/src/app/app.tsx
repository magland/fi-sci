/* eslint-disable @typescript-eslint/no-explicit-any */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { useEffect, useReducer, useState } from 'react';

import { getFigureData } from '@fi-sci/figurl-interface';
import { useWindowDimensions } from '@fi-sci/misc';
import { isSpikeSortingAnalysisData } from './SpikeSortingAnalysisData';

import SpikeSortingAnalysisView from './SpikeSortingAnalysisView';
import { UnitSelectionContext, defaultUnitSelection, unitSelectionReducer } from '@fi-sci/context-unit-selection';

import './app.css';
import { SetupTimeSelection } from '@fi-sci/context-time-selection';

export function App() {
  const [data, setData] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { width, height } = useWindowDimensions();

  useEffect(() => {
    getFigureData()
      .then((data: any) => {
        if (!data) {
          setErrorMessage('No data in return from getFigureData()');
          return;
        }
        if (!isSpikeSortingAnalysisData(data)) {
          console.warn(data);
          setErrorMessage('Unexpected data type returned from getFigureData()');
          return;
        }
        setData(data);
      })
      .catch((err: any) => {
        setErrorMessage(`Error getting figure data`);
        console.error(`Error getting figure data`, err);
      });
  }, []);

  const [unitSelection, unitSelectionDispatch] = useReducer(unitSelectionReducer, defaultUnitSelection);

  if (!data) {
    return <div>{errorMessage ? errorMessage : 'Loading data...'}</div>;
  }

  return (
    <SetupTimeSelection>
      <UnitSelectionContext.Provider value={{ unitSelection, unitSelectionDispatch }}>
        <SpikeSortingAnalysisView width={width} height={height} data={data} />
      </UnitSelectionContext.Provider>
    </SetupTimeSelection>
  );
}

export default App;
