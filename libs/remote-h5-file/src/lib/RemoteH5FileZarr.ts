/* eslint-disable @typescript-eslint/no-explicit-any */
import { DatasetDataType, RemoteH5Dataset, RemoteH5Group, RemoteH5Subdataset, RemoteH5Subgroup, globalRemoteH5FileStats } from './RemoteH5File';
import { HTTPStore, NestedArray, openArray } from 'zarr';
import { Canceler } from './helpers';

enum HTTPMethod {
  HEAD = 'HEAD',
  GET = 'GET',
  PUT = 'PUT',
}

type ZMetaDataZAttrs = {[key: string]: any}

type ZMetaDataZGroup = {
    zarr_format: number
}

type ZMetaDataZArray = {
    chunks?: number[]
    compressor?: any
    dtype?: string
    fill_value?: any
    filters?: any[]
    order?: 'C' | 'F'
    shape?: number[]
    zarr_format?: 2
}

type ZMetaDataItem = ZMetaDataZAttrs | ZMetaDataZGroup | ZMetaDataZArray

type ZMetaData = {
    metadata: {
        '.zattrs'?: ZMetaDataZAttrs
        '.zgroup'?: ZMetaDataZGroup
    } & {[key: string]: ZMetaDataItem}
    zarr_consolidated_format: '1'
}

class RemoteH5FileZarr {
  #store: HTTPStore;
  constructor(public url: string, private zmetadata: ZMetaData, private pathsByParentPath: {[key: string]: string[]}) {
    const fetchOptions: RequestInit = {
      redirect: 'follow',
      headers: {},
    };
    const supportedMethods: HTTPMethod[] = [HTTPMethod.GET, HTTPMethod.HEAD];

    this.#store = new HTTPStore(url, { fetchOptions, supportedMethods });
  }
  static async create(url: string) {
    // fetch zmetadata from url/.zmetadata
    const r = await fetch(url + '/.zmetadata');
    if (!r.ok) throw Error('Failed to fetch .zmetadata');
    const zmetadata = await r.json();
    console.info(`zmetadata for ${url}`, zmetadata);
    const pathsByParentPath: {[key: string]: string[]} = {};
    for (const path in zmetadata.metadata) {
      if (path === '.zattrs' || path === '.zgroup') continue;
      const parts = path.split('/');
      if (parts.length <= 1) continue;
      const lastPart = parts[parts.length - 1];
      if ((lastPart === '.zattrs') || (lastPart === '.zgroup') || (lastPart === '.zarray')) {
        const thePath = parts.slice(0, parts.length - 1).join('/');
        const theParentPath = parts.slice(0, parts.length - 2).join('/');
        if (!pathsByParentPath[theParentPath]) pathsByParentPath[theParentPath] = [];
        if (!pathsByParentPath[theParentPath].includes(thePath)) {
          pathsByParentPath[theParentPath].push(thePath);
        }
      }
    }
    console.info(`pathsByParentPath for ${url}`, pathsByParentPath);
    return new RemoteH5FileZarr(url, zmetadata, pathsByParentPath);
  }
  get dataIsRemote() {
    return !this.url.startsWith('http://localhost');
  }
  async getGroup(path: string): Promise<RemoteH5Group | undefined> {
    if (path === '') path = '/';
    let group: RemoteH5Group | undefined;
    const pathWithoutBeginningSlash = path === '/' ? '' : path.slice(1);
    let zgroup: ZMetaDataZGroup | undefined
    let zattrs: ZMetaDataZAttrs | undefined
    if (path === '/') {
      zgroup = this.zmetadata.metadata['.zgroup'] as ZMetaDataZGroup;
      zattrs = this.zmetadata.metadata['.zattrs'] as ZMetaDataZAttrs;
    }
    else {
      zgroup = this.zmetadata.metadata[pathWithoutBeginningSlash + '/.zgroup'] as ZMetaDataZGroup;
      zattrs = this.zmetadata.metadata[pathWithoutBeginningSlash + '/.zattrs'] as ZMetaDataZAttrs;
    }
    if (zgroup) {
      const subgroups: RemoteH5Subgroup[] = [];
      const subdatasets: RemoteH5Subdataset[] = [];
      const childPaths: string[] = this.pathsByParentPath[pathWithoutBeginningSlash] || [];
      for (const childPath of childPaths) {
        if (this.zmetadata.metadata[childPath + '/.zgroup']) {
          subgroups.push({
            name: getNameFromPath(childPath),
            path: '/' + childPath,
            attrs: this.zmetadata.metadata[childPath + '/.zattrs'] || {}
          });
        }
        else if (this.zmetadata.metadata[childPath + '/.zarray']) {
          const subZArray = this.zmetadata.metadata[childPath + '/.zarray'] as ZMetaDataZArray;
          const shape = subZArray.shape;
          const dtype = subZArray.dtype;
          if (shape && dtype) {
            subdatasets.push({
              name: getNameFromPath(childPath),
              path: '/' + childPath,
              shape,
              dtype,
              attrs: this.zmetadata.metadata[childPath + '/.zattrs'] || {}
            });
          }
          else {
            console.warn('Unexpected .zarray item', subZArray);
          }
        }
      }
      group = {
          path: path,
          subgroups,
          datasets: subdatasets,
          attrs: zattrs || {}
      }
    }
    globalRemoteH5FileStats.getGroupCount++;
    return group;
  }
  async getDataset(path: string): Promise<RemoteH5Dataset | undefined> {
    const pathWithoutBeginningSlash = path === '/' ? '' : path.slice(1);
    const zarray = this.zmetadata.metadata[pathWithoutBeginningSlash + '/.zarray'] as ZMetaDataZArray;
    const zattrs = (this.zmetadata.metadata[pathWithoutBeginningSlash + '/.zattrs'] || {}) as ZMetaDataZAttrs;
    let dataset: RemoteH5Dataset | undefined;
    if (zarray) {
      dataset = {
        name: getNameFromPath(path),
        path,
        shape: zarray.shape || [],
        dtype: zarray.dtype || '',
        attrs: zattrs
      }
    }
    else {
      dataset = undefined;
    }
    globalRemoteH5FileStats.getDatasetCount++;
    return dataset;
  }
  async getDatasetData(
    path: string,
    o: {
      slice?: [number, number][];
      allowBigInt?: boolean;
      canceler?: Canceler;
    }
  ): Promise<DatasetDataType | undefined> {
    if (o.slice) {
      for (const ss of o.slice) {
        if (isNaN(ss[0]) || isNaN(ss[1])) {
          console.warn('Invalid slice', path, o.slice);
          throw Error('Invalid slice');
        }
      }
      throw Error('Slice not yet implemented for zarr')
    }

    // const { slice, allowBigInt, canceler } = o;

    const dd = await openArray({ store: this.#store, path });
    if (dd.dtype as any === '|O') {
      const r = await fetch(this.url + path + '/.zarray');
      if (!r.ok) throw Error('Failed to fetch .zarray for ' + path);
      const x: ZMetaDataZArray = await r.json();
      console.warn('dtype is |O', path, x);
      return undefined;
    }
    const x = await dd.get(':');

    globalRemoteH5FileStats.getDatasetDataCount++;

    if (x === null) return undefined;
    if (x === undefined) return undefined;
    if (x instanceof NestedArray) {
        return x.data as DatasetDataType;
    }
    return undefined
  }
}

const getNameFromPath = (path: string) => {
    const parts = path.split('/');
    if (parts.length === 0) return '';
    return parts[parts.length - 1];
}

const lock1: {locked: boolean} = {locked: false};
const globalZarrRemoteH5Files: { [url: string]: RemoteH5FileZarr } = {};
export const getRemoteH5FileZarr = async (url: string, metaUrl: string | undefined) => {
  while (lock1.locked) await new Promise(resolve => setTimeout(resolve, 100));
  try {
    lock1.locked = true;
    const kk = url + '|' + metaUrl;
    if (!globalZarrRemoteH5Files[kk]) {
      globalZarrRemoteH5Files[kk] = await RemoteH5FileZarr.create(url);
    }
    return globalZarrRemoteH5Files[kk];
  }
  finally {
    lock1.locked = false;
  }
};

export default RemoteH5FileZarr;
