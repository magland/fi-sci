/* eslint-disable @typescript-eslint/no-explicit-any */
import { isEqualTo, isOneOf, isString, validateObject } from '@fi-sci/misc';

// spike_trains_nh5

export type SpikeTrainsViewData = {
  type: 'spike_trains_nh5';
  nh5_file: string;
};

export const isSpikeTrainsViewData = (x: any): x is SpikeTrainsViewData => {
  return validateObject(x, {
    type: isEqualTo('spike_trains_nh5'),
    nh5_file: isString,
  });
};

// tuning_curves_2d_nh5

export type TuningCurves2DViewData = {
  type: 'tuning_curves_2d_nh5';
  nh5_file: string;
};

export const isTuningCurves2DViewData = (x: any): x is TuningCurves2DViewData => {
  return validateObject(x, {
    type: isEqualTo('tuning_curves_2d_nh5'),
    nh5_file: isString,
  });
};

export type ViewData = SpikeTrainsViewData | TuningCurves2DViewData;

export const isViewData = (x: any): x is ViewData => {
  return isOneOf([isSpikeTrainsViewData, isTuningCurves2DViewData])(x);
};
