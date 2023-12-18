/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  validateObject,
  isArrayOf,
  isBoolean,
  isEqualTo,
  isJSONObject,
  isNumber,
  isOneOf,
  isString,
  optional,
} from '@fi-sci/misc';

// getFigureData

export type GetFigureDataRequest = {
  type: 'getFigureData';
  figurlProtocolVersion: string; // "p1"
};

export const isGetFigureDataRequest = (x: any): x is GetFigureDataRequest => {
  return validateObject(x, {
    type: isEqualTo('getFigureData'),
    figurlProtocolVersion: isString
  });
};

export type GetFigureDataResponse = {
  type: 'getFigureData';
  figureData: any;
};

export const isGetFigureDataResponse = (x: any): x is GetFigureDataResponse => {
  return validateObject(x, {
    type: isEqualTo('getFigureData'),
    figureData: () => true,
  });
};

// getFileData

export type GetFileDataRequest = {
  type: 'getFileData';
  uri: string;
  responseType?: string; // 'text', 'json', 'json-deserialized', 'binary': default is 'json-deserialized'
  startByte?: number;
  endByte?: number;
  figurlProtocolVersion: string; // "p1"
};

export const isGetFileDataRequest = (x: any): x is GetFileDataRequest => {
  return validateObject(x, {
    type: isEqualTo('getFileData'),
    uri: optional(isString),
    responseType: optional(isString),
    startByte: optional(isNumber),
    endByte: optional(isNumber),
    figurlProtocolVersion: isString
  });
};

export type GetFileDataResponse = {
  type: 'getFileData';
  fileData?: any;
  errorMessage?: string;
};

export const isGetFileDataResponse = (x: any): x is GetFileDataResponse => {
  return validateObject(x, {
    type: isEqualTo('getFileData'),
    fileData: optional(() => true),
    errorMessage: optional(isString),
  });
};

// getFileDataUrl

export type GetFileDataUrlRequest = {
  type: 'getFileDataUrl';
  uri: string;
  figurlProtocolVersion: string; // "p1"
};

export const isGetFileDataUrlRequest = (x: any): x is GetFileDataUrlRequest => {
  return validateObject(x, {
    type: isEqualTo('getFileDataUrl'),
    uri: optional(isString),
    figurlProtocolVersion: isString
  });
};

export type GetFileDataUrlResponse = {
  type: 'getFileDataUrl';
  fileDataUrl?: string;
  errorMessage?: string;
};

export const isGetFileDataUrlResponse = (x: any): x is GetFileDataUrlResponse => {
  return validateObject(x, {
    type: isEqualTo('getFileDataUrl'),
    fileDataUrl: optional(isString),
    errorMessage: optional(isString),
  });
};

// storeFile

export type StoreFileRequest = {
  type: 'storeFile';
  fileData: string;
  uri?: string;
  figurlProtocolVersion: string; // "p1"
};

export const isStoreFileRequest = (x: any): x is StoreFileRequest => {
  return validateObject(x, {
    type: isEqualTo('storeFile'),
    fileData: isString,
    uri: optional(isString),
    jotId: optional(() => true), // need to keep this in because one visualization still passes undefined for this value
    figurlProtocolVersion: isString
  });
};

export type StoreFileResponse = {
  type: 'storeFile';
  uri?: string;
  error?: string;
};

export const isStoreFileResponse = (x: any): x is StoreFileResponse => {
  return validateObject(x, {
    type: isEqualTo('storeFile'),
    uri: optional(isString),
    error: optional(isString),
  });
};

// storeGithubFile

export type StoreGithubFileRequest = {
  type: 'storeGithubFile';
  fileData: string;
  uri: string;
  figurlProtocolVersion: string; // "p1"
};

export const isStoreGithubFileRequest = (x: any): x is StoreGithubFileRequest => {
  return validateObject(x, {
    type: isEqualTo('storeGithubFile'),
    fileData: isString,
    uri: isString,
    figurlProtocolVersion: isString
  });
};

export type StoreGithubFileResponse = {
  type: 'storeGithubFile';
  success: boolean;
  error?: string;
};

export const isStoreGithubFileResponse = (x: any): x is StoreGithubFileResponse => {
  return validateObject(x, {
    type: isEqualTo('storeGithubFile'),
    success: isBoolean,
    error: optional(isString),
  });
};

// setUrlState

export type SetUrlStateRequest = {
  type: 'setUrlState';
  state: { [key: string]: any };
  figurlProtocolVersion: string; // "p1"
};

export const isSetUrlStateRequest = (x: any): x is SetUrlStateRequest => {
  return validateObject(x, {
    type: isEqualTo('setUrlState'),
    state: isJSONObject,
    figurlProtocolVersion: isString
  });
};

export type SetUrlStateResponse = {
  type: 'setUrlState';
};

export const isSetUrlStateResponse = (x: any): x is SetUrlStateResponse => {
  return validateObject(x, {
    type: isEqualTo('setUrlState'),
  });
};

// serviceQuery

export type ServiceQueryRequest = {
  type: 'serviceQuery';
  serviceName: string;
  query: any;
  includeUserId?: boolean;
  figurlProtocolVersion: string; // "p1"
};

export const isServiceQueryRequest = (x: any): x is ServiceQueryRequest => {
  return validateObject(x, {
    type: isEqualTo('serviceQuery'),
    serviceName: isString,
    query: () => true,
    includeUserId: optional(isBoolean),
    figurlProtocolVersion: isString
  });
};

export type ServiceQueryResponse = {
  type: 'serviceQuery';
  result?: any;
  binaryPayload?: any;
  errorMessage?: string;
};

export const isServiceQueryResponse = (x: any): x is ServiceQueryResponse => {
  return validateObject(x, {
    type: isEqualTo('serviceQuery'),
    result: optional(() => true),
    binaryPayload: optional(() => true),
    errorMessage: optional(isString),
  });
};

// getFileData

export type ReadDirRequest = {
  type: 'readDir';
  uri: string;
  figurlProtocolVersion: string; // "p1"
};

export const isReadDirRequest = (x: any): x is ReadDirRequest => {
  return validateObject(x, {
    type: isEqualTo('readDir'),
    uri: isString,
    figurlProtocolVersion: isString
  });
};

export type RDFile = {
  name: string;
  size: number;
  mtime: number;
};

export type RDDir = {
  name?: string;
  files: RDFile[];
  dirs: RDDir[];
};

const isRDFile = (x: any): x is RDFile => {
  return validateObject(x, {
    name: isString,
    size: isNumber,
    mtime: isNumber,
  });
};

const isRDDir = (x: any): x is RDDir => {
  return validateObject(x, {
    name: optional(isString),
    files: isArrayOf(isRDFile),
    dirs: isArrayOf(isRDDir),
  });
};

export type ReadDirResponse = {
  type: 'readDir';
  dir?: RDDir;
  errorMessage?: string;
};

export const isReadDirResponse = (x: any): x is ReadDirResponse => {
  return validateObject(x, {
    type: isEqualTo('readDir'),
    dir: optional(isRDDir),
    errorMessage: optional(isString),
  });
};

//////////////////////////////////////////////////////////////

export type FigurlRequest =
  | GetFigureDataRequest
  | GetFileDataRequest
  | GetFileDataUrlRequest
  | StoreFileRequest
  | StoreGithubFileRequest
  | SetUrlStateRequest
  | ServiceQueryRequest
  | ReadDirRequest;

export const isFigurlRequest = (x: any): x is FigurlRequest => {
  return isOneOf([
    isGetFigureDataRequest,
    isGetFileDataRequest,
    isGetFileDataUrlRequest,
    isStoreFileRequest,
    isStoreGithubFileRequest,
    isSetUrlStateRequest,
    isServiceQueryRequest,
    isReadDirRequest,
  ])(x);
};

export type FigurlResponse =
  | GetFigureDataResponse
  | GetFileDataResponse
  | GetFileDataUrlResponse
  | StoreFileResponse
  | StoreGithubFileResponse
  | SetUrlStateResponse
  | ServiceQueryResponse
  | ReadDirResponse;

export const isFigurlResponse = (x: any): x is FigurlResponse => {
  return isOneOf([
    isGetFigureDataResponse,
    isGetFileDataResponse,
    isGetFileDataUrlResponse,
    isStoreFileResponse,
    isStoreGithubFileResponse,
    isSetUrlStateResponse,
    isServiceQueryResponse,
    isReadDirResponse,
  ])(x);
};
