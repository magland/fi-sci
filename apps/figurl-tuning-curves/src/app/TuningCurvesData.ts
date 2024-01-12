/* eslint-disable @typescript-eslint/no-explicit-any */
import { isOneOf } from '@fi-sci/misc';
import { TuningCurves2DViewData, isTuningCurves2DViewData } from './TuningCurves2DView/TuningCurves2DViewData';
import { TuningCurves2DNh5ViewData, isTuningCurves2DNh5ViewData } from './TuningCurves2DNh5View/TuningCurves2DNh5ViewData';

export type TuningCurvesData = TuningCurves2DViewData | TuningCurves2DNh5ViewData;

export const isTuningCurvesData = (x: any): x is TuningCurvesData => {
  return isOneOf([
    isTuningCurves2DViewData,
    isTuningCurves2DNh5ViewData
  ])(x);
};
