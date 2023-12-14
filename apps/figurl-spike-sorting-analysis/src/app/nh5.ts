import { isArrayOf, isEqualTo, isNumber, isOneOf, isString, validateObject } from '@fi-sci/misc';

/* eslint-disable @typescript-eslint/no-explicit-any */
export type NH5HeaderGroup = {
  path: string;
  attrs: { [key: string]: any };
};

export type NH5HeaderDataset = {
  path: string;
  attrs: { [key: string]: any };
  dtype: 'int8' | 'uint8' | 'int16' | 'uint16' | 'int32' | 'uint32' | 'float32' | 'float64';
  shape: number[];
  position: number;
};

export type NH5Header = {
  groups: NH5HeaderGroup[];
  datasets: NH5HeaderDataset[];
};

const isNH5HeaderGroup = (x: any): x is NH5HeaderGroup => {
  return validateObject(x, {
    path: isString,
    attrs: () => true,
  });
};

const isNH5HeaderDataset = (x: any): x is NH5HeaderDataset => {
  return validateObject(x, {
    path: isString,
    attrs: () => true,
    dtype: isOneOf(
      ['int8', 'uint8', 'int16', 'uint16', 'int32', 'uint32', 'float32', 'float64'].map((x) => isEqualTo(x))
    ),
    shape: isArrayOf(isNumber),
    position: isNumber,
  });
};

export const isNH5Header = (x: any): x is NH5Header => {
  return validateObject(x, {
    groups: isArrayOf(isNH5HeaderGroup),
    datasets: isArrayOf(isNH5HeaderDataset),
  });
};

export type RemoteNH5Group = {
  path: string;
  subgroups: RemoteNH5Subgroup[];
  datasets: RemoteNH5Subdataset[];
  attrs: { [key: string]: any };
};

export type RemoteNH5Subgroup = {
  name: string;
  path: string;
  attrs: { [key: string]: any };
};

export type RemoteNH5Subdataset = {
  name: string;
  path: string;
  shape: number[];
  dtype: string;
  attrs: { [key: string]: any };
};

export type RemoteNH5Dataset = {
  name: string;
  path: string;
  shape: number[];
  dtype: string;
  attrs: { [key: string]: any };
};

export type Canceler = { onCancel: (() => void)[] };

export type DatasetDataType =
  | Float32Array
  | Float64Array
  | Int8Array
  | Int16Array
  | Int32Array
  | Uint8Array
  | Uint16Array
  | Uint32Array;

export class RemoteNH5FileClient {
  constructor(private url: string, private header: NH5Header, private dataPosition: number) {}
  async getGroup(path: string): Promise<RemoteNH5Group | undefined> {
    const g = this.header.groups.find((g) => g.path === path);
    if (!g) return undefined;
    const subgroups = this.header.groups
      .filter((g) => g.path.startsWith(path + '/'))
      .filter((g) => g.path.split('/').length === path.split('/').length + 1)
      .map((g) => ({
        name: g.path.split('/').slice(-1)[0],
        path: g.path,
        attrs: g.attrs,
      }));
    const datasets = this.header.datasets
      .filter((d) => d.path.startsWith(path + '/'))
      .filter((d) => d.path.split('/').length === path.split('/').length + 1)
      .map((d) => ({
        name: d.path.split('/').slice(-1)[0],
        path: d.path,
        shape: d.shape,
        dtype: d.dtype,
        attrs: d.attrs,
      }));
    return {
      path,
      subgroups,
      datasets,
      attrs: g.attrs,
    };
  }
  async getDataset(path: string): Promise<RemoteNH5Dataset | undefined> {
    const d = this.header.datasets.find((d) => d.path === path);
    if (!d) return undefined;
    return {
      name: d.path.split('/').slice(-1)[0],
      path: d.path,
      shape: d.shape,
      dtype: d.dtype,
      attrs: d.attrs,
    };
  }
  async getDatasetData(
    path: string,
    o: {
      slice?: [number, number][];
      allowBigInt?: boolean;
      canceler?: Canceler;
    }
  ): Promise<DatasetDataType | undefined> {
    const d = this.header.datasets.find((d) => d.path === path);
    if (!d) return undefined;
    const dtype = d.dtype;
    const shape = d.shape;
    const position = d.position;
    const filePosition = this.dataPosition + position;
    if (o.slice) throw Error('slice not supported yet');
    if (o.allowBigInt) throw Error('allowBigInt not supported yet');
    if (o.canceler) {
      console.warn('canceler not supported yet');
    }
    const dtypeByteCount = {
      int8: 1,
      uint8: 1,
      int16: 2,
      uint16: 2,
      int32: 4,
      uint32: 4,
      float32: 4,
      float64: 8,
    }[dtype];
    if (!dtypeByteCount) throw Error(`Unexpected dtype: ${dtype}`);
    const numBytes = shape.reduce((a, b) => a * b, 1) * dtypeByteCount;
    const response = await fetch(this.url, {
      headers: {
        Range: `bytes=${filePosition}-${filePosition + numBytes - 1}`,
      },
    });
    const buffer = await response.arrayBuffer();
    if (dtype === 'int8') return new Int8Array(buffer);
    else if (dtype === 'uint8') return new Uint8Array(buffer);
    else if (dtype === 'int16') return new Int16Array(buffer);
    else if (dtype === 'uint16') return new Uint16Array(buffer);
    else if (dtype === 'int32') return new Int32Array(buffer);
    else if (dtype === 'uint32') return new Uint32Array(buffer);
    else if (dtype === 'float32') return new Float32Array(buffer);
    else if (dtype === 'float64') return new Float64Array(buffer);
    else throw Error(`Unexpected dtype: ${dtype}`);
  }
  static async create(url: string) {
    const { header, dataPosition } = await getRemoteNH5Header(url);
    return new RemoteNH5FileClient(url, header, dataPosition);
  }
}

export const getRemoteNH5File = async (url: string) => {
  return RemoteNH5FileClient.create(url);
};

const getRemoteNH5Header = async (url: string) => {
  // the file will start with nh5|1|<headerLength>|<header-json>
  // get the first 100K bytes
  const initialQueryLength = 100000;
  const response = await fetch(url, {
    headers: {
      Range: `bytes=0-${initialQueryLength - 1}`,
    },
  });
  const text = await response.text();
  const parts = text.split('|');
  if (parts[0] !== 'nh5') throw Error('Unexpected header: does not match nh5');
  if (parts[1] !== '1') throw Error('Unexpected header: version is not 1');
  const headerLength = Number(parts[2]);
  const headerJsonStartPos = parts[0].length + parts[1].length + parts[2].length + 3;
  let headerJson = text.slice(headerJsonStartPos, headerJsonStartPos + headerLength);
  if (headerJson.length < headerLength) {
    // we need to get the rest of the header
    const response2 = await fetch(url, {
      headers: {
        Range: `bytes=${headerJsonStartPos + headerJson.length}-${headerJsonStartPos + headerLength - 1}`,
      },
    });
    const text2 = await response2.text();
    headerJson += text2;
  }
  const header = JSON.parse(headerJson);
  if (!isNH5Header(header)) {
    console.warn(header);
    throw Error('Unexpected header');
  }
  const dataPosition = headerJsonStartPos + headerLength;
  return { header, dataPosition };
};
