/* eslint-disable @typescript-eslint/no-explicit-any */
import { isOneOf } from '@fi-sci/misc';
import { SpikeSortingAnalysisViewData, isSpikeSortingAnalysisViewData } from './SpikeSortingAnalysisView/SpikeSortingAnalysisViewData';
import { PlaceFieldsViewData, isPlaceFieldsViewData } from './PlaceFieldsView/PlaceFieldsViewData';

export type SpikeSortingAnalysisData = SpikeSortingAnalysisViewData | PlaceFieldsViewData;

export const isSpikeSortingAnalysisData = (x: any): x is SpikeSortingAnalysisData => {
  return isOneOf([
    isSpikeSortingAnalysisViewData,
    isPlaceFieldsViewData
  ])(x);
};
