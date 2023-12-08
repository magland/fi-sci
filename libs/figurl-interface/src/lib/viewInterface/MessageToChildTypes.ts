/* eslint-disable @typescript-eslint/no-explicit-any */
import validateObject, { isEqualTo, isNumber, isOneOf, isString, optional } from "./validateObject";
import { FigurlResponse, isFigurlResponse } from "./FigurlRequestTypes";

/// figurl Response

export type FigurlResponseMessage = {
    type: 'figurlResponse',
    requestId: string,
    response: FigurlResponse
}

export const isFigurlResponseMessage = (x: any): x is FigurlResponseMessage => {
    return validateObject(x, {
        type: isEqualTo('figurlResponse'),
        requestId: isString,
        response: isFigurlResponse
    })
}

// setCurrentUser

export type SetCurrentUserMessage = {
    type: 'setCurrentUser',
    userId?: string,
    googleIdToken?: string
}

export const isSetCurrentUserMessage = (x: any): x is SetCurrentUserMessage => {
    return validateObject(x, {
        type: isEqualTo('setCurrentUser'),
        userId: optional(isString),
        googleIdToken: optional(isString)
    })
}

// fileDownloadProgress

export type FileDownloadProgressMessage = {
    type: 'fileDownloadProgress'
    uri: string
    loaded: number
    total: number
}

export const isFileDownloadProgressMessage = (x: any): x is FileDownloadProgressMessage => {
    return validateObject(x, {
        type: isEqualTo('fileDownloadProgress'),
        uri: isString,
        loaded: isNumber,
        total: isNumber
    })
}

// messageToFrontend

export type MessageToFrontendMessage = {
    type: 'messageToFrontend',
    message: any
}

export const isMessageToFrontendMessage = (x: any): x is MessageToFrontendMessage => {
    return validateObject(x, {
        type: isEqualTo('messageToFrontend'),
        message: () => (true)
    })
}

// reportUrlStateChange

export type ReportUrlStateChangeMessage = {
    type: 'reportUrlStateChange',
    state: {[key: string]: any}
}

export const isReportUrlStateChangeMessage = (x: any): x is ReportUrlStateChangeMessage => {
    return validateObject(x, {
        type: isEqualTo('reportUrlStateChange'),
        state: () => (true)
    })
}

///////////////////////////////////////////////////////////////////////////////////

export type MessageToChild =
    FigurlResponseMessage |
    SetCurrentUserMessage |
    FileDownloadProgressMessage |
    MessageToFrontendMessage |
    ReportUrlStateChangeMessage

export const isMessageToChild = (x: any): x is MessageToChild => {
    return isOneOf([
        isFigurlResponseMessage,
        isSetCurrentUserMessage,
        isFileDownloadProgressMessage,
        isMessageToFrontendMessage,
        isReportUrlStateChangeMessage
    ])(x)
}
