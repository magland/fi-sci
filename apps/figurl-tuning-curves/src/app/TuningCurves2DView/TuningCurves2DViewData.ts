/* eslint-disable @typescript-eslint/no-explicit-any */
import { isArrayOf, isEqualTo, isNumber, isOneOf, isString, validateObject } from "@fi-sci/misc";

export type TuningCurve2D = {
    unit_id: string | number;
    values: number[][];
    num_spikes: number;
}

export const isTuningCurve2D = (x: any): x is TuningCurve2D => {
    return validateObject(x, {
        unit_id: isOneOf([isString, isNumber]),
        values: () => (true),
        num_spikes: isNumber
    });
}

export type TuningCurves2DViewData = {
    type: 'tuning_curves_2d';
    tuning_curves_2d: TuningCurve2D[];
    x_bin_positions: number[];
    y_bin_positions: number[];
}

export const isTuningCurves2DViewData = (x: any): x is TuningCurves2DViewData => {
    return validateObject(x, {
        type: isEqualTo('tuning_curves_2d'),
        tuning_curves_2d: isArrayOf(isTuningCurve2D),
        x_bin_positions: () => (true),
        y_bin_positions: () => (true)
    });
}