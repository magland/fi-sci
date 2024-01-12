/* eslint-disable @typescript-eslint/no-explicit-any */
import { isEqualTo, isString, validateObject } from "@fi-sci/misc";

export type TuningCurves2DNh5ViewData = {
    type: 'tuning_curves_2d_nh5';
    nh5_file: string;
}

export const isTuningCurves2DNh5ViewData = (x: any): x is TuningCurves2DNh5ViewData => {
    return validateObject(x, {
        type: isEqualTo('tuning_curves_2d_nh5'),
        nh5_file: isString
    });
}