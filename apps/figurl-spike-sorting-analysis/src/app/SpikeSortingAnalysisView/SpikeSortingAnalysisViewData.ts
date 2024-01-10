/* eslint-disable @typescript-eslint/no-explicit-any */
import { isEqualTo, isString, validateObject } from '@fi-sci/misc';

export type SpikeSortingAnalysisViewData = {
    type: 'spike_sorting_analysis';
    analysisFile: string;
  }

export const isSpikeSortingAnalysisViewData = (x: any): x is SpikeSortingAnalysisViewData => {
  return validateObject(x, {
    type: isEqualTo('spike_sorting_analysis'),
    analysisFile: isString,
  });
};
