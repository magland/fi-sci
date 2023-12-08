/* eslint-disable @typescript-eslint/no-explicit-any */
import { FigurlRequest, isFigurlRequest } from "./FigurlRequestTypes";
import validateObject, { isEqualTo, isOneOf, isString } from "./validateObject";

export type FigurlRequestMessage = {
    type: 'figurlRequest',
    figureId: string,
    requestId: string,
    request: FigurlRequest
}

export const isFigurlRequestMessage = (x: any): x is FigurlRequestMessage => {
    return validateObject(x, {
        type: isEqualTo('figurlRequest'),
        figureId: isString,
        requestId: isString,
        request: isFigurlRequest
    })
}

export type MessageToBackendMessage = {
    type: 'messageToBackend',
    figureId: string
    message: any
}

export const isMessageToBackendMessage = (x: any): x is MessageToBackendMessage => {
    return validateObject(x, {
        type: isEqualTo('messageToBackend'),
        figureId: isString,
        message: () => (true)
    })
}

export type MessageToParent =
    FigurlRequestMessage | MessageToBackendMessage

export const isMessageToParent = (x: any): x is MessageToParent => {
    return isOneOf([
        isFigurlRequestMessage,
        isMessageToBackendMessage
    ])(x)
}