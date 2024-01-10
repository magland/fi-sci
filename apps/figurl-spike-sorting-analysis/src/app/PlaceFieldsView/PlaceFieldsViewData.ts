/* eslint-disable @typescript-eslint/no-explicit-any */
import { isArrayOf, isEqualTo, isNumber, isOneOf, isString, validateObject } from "@fi-sci/misc";

export type PlaceField = {
    unitId: string | number;
    x: number[];
    y: number[];
}

export const isPlaceField = (x: any): x is PlaceField => {
    return validateObject(x, {
        unitId: isOneOf([isString, isNumber]),
        x: () => (true),
        y: () => (true)
    });
}

export type PlaceFieldsViewData = {
    type: 'place_fields';
    placeFields: PlaceField[];
}

export const isPlaceFieldsViewData = (x: any): x is PlaceFieldsViewData => {
    return validateObject(x, {
        type: isEqualTo('place_fields'),
        placeFields: isArrayOf(isPlaceField)
    });
}