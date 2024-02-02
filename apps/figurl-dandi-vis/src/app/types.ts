/* eslint-disable @typescript-eslint/no-explicit-any */
import { isString, validateObject } from '@fi-sci/misc';

export type ViewData = {
  nh5: string
};

export const isViewData = (x: any): x is ViewData => {
  return validateObject(x, {
    nh5: isString
  });
};
