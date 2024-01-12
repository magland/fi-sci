/* eslint-disable @typescript-eslint/no-explicit-any */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { useEffect, useReducer, useState } from 'react';

import { getFigureData } from '@fi-sci/figurl-interface';
import { useWindowDimensions } from '@fi-sci/misc';
import { TuningCurvesData, isTuningCurvesData } from './TuningCurvesData';

import { UnitSelectionContext, defaultUnitSelection, unitSelectionReducer } from '@fi-sci/context-unit-selection';

import './App.css';
import TuningCurves2DView from './TuningCurves2DView/TuningCurves2DView';
import TuningCurves2DNh5View from './TuningCurves2DNh5View/TuningCurves2DNh5View';

export function App() {
  const [data, setData] = useState<TuningCurvesData>();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { width, height } = useWindowDimensions();

  useEffect(() => {
    getFigureData()
      .then((data: any) => {
        if (!data) {
          setErrorMessage('No data in return from getFigureData()');
          return;
        }
        if (!isTuningCurvesData(data)) {
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

  if ((data.type === 'tuning_curves_2d') || (data.type === 'tuning_curves_2d_nh5')) {
    return (
      <UnitSelectionContext.Provider value={{ unitSelection, unitSelectionDispatch }}>
        {
          data.type === 'tuning_curves_2d' && (
            <TuningCurves2DView width={width} height={height} data={data} />
          )
        }
        {
          data.type === 'tuning_curves_2d_nh5' && (
            <TuningCurves2DNh5View width={width} height={height} data={data} />
          )
        }
        
      </UnitSelectionContext.Provider>
    )
  }
  else {
    return <div>Unexpected data type: {data.type}</div>
  }
}

export default App;
