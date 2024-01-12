/* eslint-disable @typescript-eslint/no-explicit-any */
import { isOneOf } from '@fi-sci/misc';
import { SpikeSortingAnalysisViewData, isSpikeSortingAnalysisViewData } from './SpikeSortingAnalysisView/SpikeSortingAnalysisViewData';

export type SpikeSortingAnalysisData = SpikeSortingAnalysisViewData;

export const isSpikeSortingAnalysisData = (x: any): x is SpikeSortingAnalysisData => {
  return isOneOf([
    isSpikeSortingAnalysisViewData,
  ])(x);
};
