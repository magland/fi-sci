/* eslint-disable @typescript-eslint/no-explicit-any */
import { isEqualTo, isString, validateObject } from '@fi-sci/misc';

export type SpikeSortingAnalysisData = {
  type: 'spike_sorting_analysis';
  analysisFile: string;
};

export const isSpikeSortingAnalysisData = (x: any): x is SpikeSortingAnalysisData =>
  validateObject(x, {
    type: isEqualTo('spike_sorting_analysis'),
    analysisFile: isString,
  });
