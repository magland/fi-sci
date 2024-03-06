import { isArrayOf, isNumber, isString, optional, validateObject } from "@fi-sci/misc";

/* eslint-disable @typescript-eslint/no-explicit-any */
export type NwbFileAnnotation = {
  dandiInstanceName: string;
  dandisetId: string;
  assetPath: string;
  assetId: string;
  repo: string;
  repoPath: string;
  annotationItems?: any[]; // undefined means that the file was not found in this repo - but we still want to create a record of this so we don't keep trying to fetch it
};

export const isNwbFileAnnotation = (obj: any): obj is NwbFileAnnotation => {
  return validateObject(obj, {
    dandiInstanceName: isString,
    dandisetId: isString,
    assetPath: isString,
    assetId: isString,
    repo: isString,
    repoPath: isString,
    annotationItems: optional(isArrayOf(() => true)),
  });
};

export type CachedNwbFileAnnotation = {
    dandiInstanceName: string;
    dandisetId: string;
    assetPath: string;
    assetId: string;
    repo: string;
    repoPath: string;
    annotationItems?: any[]; // undefined means that the file was not found in this repo - but we still want to create a record of this so we don't keep trying to fetch it
    timestampCached: number;
    accessToken: string;
}

export const isCachedNwbFileAnnotation = (obj: any): obj is CachedNwbFileAnnotation => {
  return validateObject(obj, {
    dandiInstanceName: isString,
    dandisetId: isString,
    assetPath: isString,
    assetId: isString,
    repo: isString,
    repoPath: isString,
    annotationItems: optional(isArrayOf(() => true)),
    timestampCached: isNumber,
    accessToken: isString,
  });
};

export const toNwbFileAnnotation = (a: CachedNwbFileAnnotation): NwbFileAnnotation => {
  return {
    dandiInstanceName: a.dandiInstanceName,
    dandisetId: a.dandisetId,
    assetPath: a.assetPath,
    assetId: a.assetId,
    repo: a.repo,
    repoPath: a.repoPath,
    annotationItems: a.annotationItems,
  };
}

export type GetRepoAnnotationForNwbFile = {
  dandiInstanceName: string;
  dandisetId: string;
  assetPath: string;
  assetId: string;
  repo: string;
};

export const isGetRepoAnnotationForNwbFile = (req: any): req is GetRepoAnnotationForNwbFile => {
  return validateObject(req, {
    dandiInstanceName: isString,
    dandisetId: isString,
    assetPath: isString,
    assetId: isString,
    repo: isString,
  });
};

export type GetAllAnnotationsForNwbFileRequest = {
  dandiInstanceName: string;
  dandisetId: string;
  assetPath: string;
  assetId: string;
};

export const isGetAllAnnotationsForNwbFileRequest = (req: any): req is GetAllAnnotationsForNwbFileRequest => {
  return validateObject(req, {
    dandiInstanceName: isString,
    dandisetId: isString,
    assetPath: isString,
    assetId: isString,
  });
};

export type SetAnnotationForNwbFileRequest = {
  dandiInstanceName: string;
  dandisetId: string;
  assetPath: string;
  assetId: string;
  repo: string;
  annotationItems: any[];
};

export const isSetAnnotationForNwbFileRequest = (req: any): req is SetAnnotationForNwbFileRequest => {
  return validateObject(req, {
    dandiInstanceName: isString,
    dandisetId: isString,
    assetPath: isString,
    assetId: isString,
    repo: isString,
    annotationItems: isArrayOf(() => true),
  });
};