/* eslint-disable @typescript-eslint/no-explicit-any */
import { DatasetDataType, RemoteH5Dataset, RemoteH5Group, RemoteH5Subdataset, RemoteH5Subgroup, globalRemoteH5FileStats } from './RemoteH5File';
import { HTTPStore, NestedArray, openArray } from 'zarr';
import { Canceler } from './helpers';

import { Blosc } from 'numcodecs';

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
    }

    // const { slice, allowBigInt, canceler } = o;

    const dd = await openArray({ store: this.#store, path });
    if (dd.dtype as any === '|O') {
      const r = await fetch(this.url + path + '/.zarray');
      if (!r.ok) throw Error('Failed to fetch .zarray for ' + path);
      const x: ZMetaDataZArray = await r.json();
      console.warn('dtype is |O', path, x);
      // fetch bytes from this.url + path + '/0' -- the chunk
      const r2 = await fetch(this.url + path + '/0');
      if (!r2.ok) throw Error('Failed to fetch chunk for ' + path);
      let chunk = await r2.arrayBuffer();
      if ((x.compressor) && (x.compressor.id === 'blosc')) {
        chunk = await (new Blosc().decode(chunk));
        // check if Uint8Array
        if (chunk instanceof Uint8Array) {
          chunk = chunk.buffer;
        }
      }
      let ret
      // if (((dd.shape.length === 1) && (dd.shape[0] === 1)) || (dd.shape.length === 0)) {
      //   ret = new TextDecoder().decode(chunk.slice(8))
      // }
      // else if (dd.shape.length === 1) {
      if ((x.filters) && (x.filters.length > 0)) {
        if (x.filters.length > 1) {
          console.warn('More than one filter', path, x.filters);
        }
        const filter0 = x.filters[0];
        if (filter0.id === 'vlen-utf8') {
          const view = new DataView(chunk);
          ret = []
          let i = 4;
          while (i < chunk.byteLength) {
            const byte1 = view.getUint32(i, true);
            const byte2 = view.getUint32(i + 1, true);
            const byte3 = view.getUint32(i + 2, true);
            const byte4 = view.getUint32(i + 3, true);
            const len = byte1 + (byte2 << 8) + (byte3 << 16) + (byte4 << 24);
            i += 4;
            ret.push(new TextDecoder().decode(chunk.slice(i, i + len)));
            i += len;
          }
        }
        else if (filter0.id === 'vlen-bytes') {
          const view = new DataView(chunk);
          ret = []
          let i = 4;
          while (i < chunk.byteLength) {
            const byte1 = view.getUint32(i, true);
            const byte2 = view.getUint32(i + 1, true);
            const byte3 = view.getUint32(i + 2, true);
            const byte4 = view.getUint32(i + 3, true);
            const len = byte1 + (byte2 << 8) + (byte3 << 16) + (byte4 << 24);
            i += 4;
            ret.push(chunk.slice(i, i + len));
            i += len;
          }
        }
        else if (filter0.id === 'json2') {
          const aa = JSON.parse(new TextDecoder().decode(chunk));
          // aa has the form [item1, item2, ..., itemN, '|O', shape]
          if (aa.length <= 2) {
            console.warn('Unexpected json2', path, aa);
            ret = new TextDecoder().decode(chunk);
          }
          else {
            ret = aa.slice(0, aa.length - 2);
          }
        }
        else {
          console.warn('Unhandled filter', path, filter0);
          ret = new TextDecoder().decode(chunk);
        }
      }
      else {
        // no filter
        ret = new TextDecoder().decode(chunk);
      }
      // else {
      //   console.warn('Unhandled dtype |O', path, dd.shape, x);
      //   ret = new TextDecoder().decode(chunk);
      // }
      return ret as any as DatasetDataType;
    }
    let x
    if (!o.slice) {
      x = await dd.get(':');
    }
    else {
      x = await dd.get(o.slice.map(ss => ({
        start: ss[0],
        stop: ss[1],
        step: 1,
        _slice: true
      })))
    }

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
