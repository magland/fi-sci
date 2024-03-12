/* eslint-disable @typescript-eslint/no-explicit-any */
import { DatasetDataType, RemoteH5Dataset, RemoteH5Group, RemoteH5Subdataset, RemoteH5Subgroup, globalRemoteH5FileStats } from '../RemoteH5File';
import { Canceler } from '../helpers';

import ReferenceFileSystemClient, { ReferenceFileSystemObject } from './ReferenceFileSystemClient';
import kerchunkDatasetDataLoader from './kerchunkDatasetDataLoader';

type ZMetaDataZAttrs = {[key: string]: any}

type ZMetaDataZGroup = {
    zarr_format: number
}

export type ZMetaDataZArray = {
    chunks?: number[]
    compressor?: any
    dtype?: string
    fill_value?: any
    filters?: any[]
    order?: 'C' | 'F'
    shape?: number[]
    zarr_format?: 2
}

class RemoteH5FileKerchunk {
  constructor(public url: string, private kerchunkFileSystemClient: ReferenceFileSystemClient, private pathsByParentPath: {[key: string]: string[]}) {
    
  }
  static async create(url: string) {
    const r = await fetch(url);
    if (!r.ok) throw Error('Failed to fetch kerchunk file' + url);
    const obj: ReferenceFileSystemObject = await r.json();
    console.info(`reference file system for ${url}`, obj);
    const pathsByParentPath: {[key: string]: string[]} = {};
    for (const path in obj.refs) {
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
    return new RemoteH5FileKerchunk(url, new ReferenceFileSystemClient(obj), pathsByParentPath);
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
      zgroup = (await this.kerchunkFileSystemClient.readJson('.zgroup')) as ZMetaDataZGroup | undefined
      zattrs = (await this.kerchunkFileSystemClient.readJson('.zattrs')) as ZMetaDataZAttrs | undefined
    }
    else {
      zgroup = (await this.kerchunkFileSystemClient.readJson(pathWithoutBeginningSlash + '/.zgroup')) as ZMetaDataZGroup | undefined
      zattrs = (await this.kerchunkFileSystemClient.readJson(pathWithoutBeginningSlash + '/.zattrs')) as ZMetaDataZAttrs | undefined
    }
    if (zgroup) {
      const subgroups: RemoteH5Subgroup[] = [];
      const subdatasets: RemoteH5Subdataset[] = [];
      const childPaths: string[] = this.pathsByParentPath[pathWithoutBeginningSlash] || [];
      for (const childPath of childPaths) {
        const childZgroup = await this.kerchunkFileSystemClient.readJson(childPath + '/.zgroup');
        const childZarray = await this.kerchunkFileSystemClient.readJson(childPath + '/.zarray');
        const childZattrs = await this.kerchunkFileSystemClient.readJson(childPath + '/.zattrs');
        if (childZgroup) {
          subgroups.push({
            name: getNameFromPath(childPath),
            path: '/' + childPath,
            attrs: childZattrs || {}
          });
        }
        else if (childZarray) {
          const shape = childZarray.shape;
          const dtype = childZarray.dtype;
          if (shape && dtype) {
            subdatasets.push({
              name: getNameFromPath(childPath),
              path: '/' + childPath,
              shape,
              dtype,
              attrs: childZattrs || {}
            });
          }
          else {
            console.warn('Unexpected .zarray item', childPath, childZarray);
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
    const zarray = await this.kerchunkFileSystemClient.readJson(pathWithoutBeginningSlash + '/.zarray') as ZMetaDataZArray;
    const zattrs = await this.kerchunkFileSystemClient.readJson(pathWithoutBeginningSlash + '/.zattrs') as ZMetaDataZAttrs;
    let dataset: RemoteH5Dataset | undefined;
    if (zarray) {
      dataset = {
        name: getNameFromPath(path),
        path,
        shape: zarray.shape || [],
        dtype: zarray.dtype || '',
        attrs: zattrs || {}
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
      scalar?: boolean;
      allowBigInt?: boolean;
      canceler?: Canceler;
    }
  ): Promise<DatasetDataType | undefined> {
    // check for invalid slice
    if (o.slice) {
      for (const ss of o.slice) {
        if (isNaN(ss[0]) || isNaN(ss[1])) {
          console.warn('Invalid slice', path, o.slice);
          throw Error('Invalid slice');
        }
      }
    }
    if ((o.slice) && (o.slice.length > 2)) {
      console.warn('Tried to slice more than two dimensions at a time', path, o.slice);
      throw Error(`For now, you can't slice more than two dimensions at a time. You tried to slice ${o.slice.length} dimensions for ${path}.`);
    }

    const pathWithoutBeginningSlash = path === '/' ? '' : path.slice(1);
    const zarray = await this.kerchunkFileSystemClient.readJson(pathWithoutBeginningSlash + '/.zarray') as ZMetaDataZArray | undefined;
    if (!zarray) {
      console.warn('No .zarray for', path);
      return undefined;
    }

    // const { slice, allowBigInt, canceler } = o;
    
    globalRemoteH5FileStats.getDatasetDataCount++;

    const ret = await kerchunkDatasetDataLoader({
      client: this.kerchunkFileSystemClient,
      path: pathWithoutBeginningSlash,
      zarray,
      slice: o.slice || []
    })
    if (o.scalar) {
      if (ret) {
        if (ret.length !== 1) {
          console.warn('Expected scalar', path, ret);
          throw Error('Expected scalar');
        }
        return ret[0];
      }
    }
    return ret
  }
}

const getNameFromPath = (path: string) => {
    const parts = path.split('/');
    if (parts.length === 0) return '';
    return parts[parts.length - 1];
}

const lock1: {locked: boolean} = {locked: false};
const globalKerchunkRemoteH5Files: { [url: string]: RemoteH5FileKerchunk } = {};
export const getRemoteH5FileKerchunk = async (url: string) => {
  while (lock1.locked) await new Promise(resolve => setTimeout(resolve, 100));
  try {
    lock1.locked = true;
    const kk = url;
    if (!globalKerchunkRemoteH5Files[kk]) {
      globalKerchunkRemoteH5Files[kk] = await RemoteH5FileKerchunk.create(url);
    }
    return globalKerchunkRemoteH5Files[kk];
  }
  finally {
    lock1.locked = false;
  }
};

export default RemoteH5FileKerchunk;
