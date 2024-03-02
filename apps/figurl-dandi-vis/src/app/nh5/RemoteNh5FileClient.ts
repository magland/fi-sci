import validateObject, { isArrayOf, isEqualTo, isNumber, isOneOf, isString } from "./validateObject";

/* eslint-disable @typescript-eslint/no-explicit-any */
export type Nh5HeaderGroup = {
  path: string;
  attrs: { [key: string]: any };
};

export type Nh5HeaderDataset = {
  path: string;
  attrs: { [key: string]: any };
  dtype: 'int8' | 'uint8' | 'int16' | 'uint16' | 'int32' | 'uint32' | 'float32' | 'float64';
  shape: number[];
  position: number;
};

export type Nh5Header = {
  groups: Nh5HeaderGroup[];
  datasets: Nh5HeaderDataset[];
};

const isNh5HeaderGroup = (x: any): x is Nh5HeaderGroup => {
  return validateObject(x, {
    path: isString,
    attrs: () => true,
  });
};

const isNh5HeaderDataset = (x: any): x is Nh5HeaderDataset => {
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

export const isNh5Header = (x: any): x is Nh5Header => {
  return validateObject(x, {
    groups: isArrayOf(isNh5HeaderGroup),
    datasets: isArrayOf(isNh5HeaderDataset),
  });
};

export type RemoteNh5Group = {
  path: string;
  subgroups: RemoteNh5Subgroup[];
  datasets: RemoteNh5Subdataset[];
  attrs: { [key: string]: any };
};

export type RemoteNh5Subgroup = {
  name: string;
  path: string;
  attrs: { [key: string]: any };
};

export type RemoteNh5Subdataset = {
  name: string;
  path: string;
  shape: number[];
  dtype: string;
  attrs: { [key: string]: any };
};

export type RemoteNh5Dataset = {
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

export class RemoteNh5FileClient {
  #fetchCache: FetchCache;
  constructor(private url: string, private header: Nh5Header, private dataPosition: number) {
    this.#fetchCache = new FetchCache();
  }
  async getGroup(path: string): Promise<RemoteNh5Group | undefined> {
    console.warn('client.getGroup(path) is deprecated. Use the synchronous client.group(path) instead.')
    return this.group(path);
  }
  group(path: string): RemoteNh5Group | undefined {
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
  get rootGroup(): RemoteNh5Group | undefined {
    return this.group('/');
  }
  async getDataset(path: string): Promise<RemoteNh5Dataset | undefined> {
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

    const k = `${path}|${o.slice ? JSON.stringify(o.slice) : ''}`;
    if (this.#fetchCache.has(k)) {
      return this.#fetchCache.get(k);
    }
    if (this.#fetchCache.retrieving(k)) {
      await this.#fetchCache.wait(k);
      const ret = this.#fetchCache.get(k);
      if (ret) return ret;
      throw Error('No data after waiting. Probably the other fetch was aborted or failed.')
    }
    this.#fetchCache.setRetrieving(k);

    try {
      const dtype = d.dtype;
      const shape = d.shape;
      const position = d.position;
      const filePosition = this.dataPosition + position;
      if (o.allowBigInt) throw Error('allowBigInt not supported yet');
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

      const controller = new AbortController();
      const signal = controller.signal;

      let aborted = false;
      if (o.canceler) {
        o.canceler.onCancel.push(() => {
          aborted = true;
          controller.abort();
        })
      }

      let filePosition2 = filePosition;
      let numBytes2 = numBytes;
      // let shape2 = shape;
      if ((o.slice) && (o.slice.length >= 1)) {
        if (o.slice.length > 1) throw Error(`Slicing more than one dimension not supported yet`);
        const sliceStart = o.slice[0][0];
        const sliceEnd = o.slice[0][1];
        if (sliceStart < 0) throw Error(`Unexpected: sliceStart < 0`);
        if (sliceEnd > shape[0]) throw Error(`Unexpected: sliceEnd > shape[0]`);
        const prodOfShapeAfterFirst = shape.slice(1).reduce((a, b) => a * b, 1);
        filePosition2 = filePosition + sliceStart * prodOfShapeAfterFirst * dtypeByteCount;
        numBytes2 = (sliceEnd - sliceStart) * prodOfShapeAfterFirst * dtypeByteCount;
      }

      const response = await fetch(this.url, {
        signal,
        headers: {
          Range: `bytes=${filePosition2}-${filePosition2 + numBytes2 - 1}`,
        },
      });
      const buffer = await response.arrayBuffer();
      if (aborted) {
        throw Error(`Aborted: ${path}`)
      }
      if (!buffer) {throw Error('Unexpected: no buffer')};
      let ret: DatasetDataType;
      if (dtype === 'int8') ret = new Int8Array(buffer);
      else if (dtype === 'uint8') ret = new Uint8Array(buffer);
      else if (dtype === 'int16') ret = new Int16Array(buffer);
      else if (dtype === 'uint16') ret = new Uint16Array(buffer);
      else if (dtype === 'int32') ret = new Int32Array(buffer);
      else if (dtype === 'uint32') ret = new Uint32Array(buffer);
      else if (dtype === 'float32') ret = new Float32Array(buffer);
      else if (dtype === 'float64') ret = new Float64Array(buffer);
      else throw Error(`Unexpected dtype: ${dtype}`);
      this.#fetchCache.set(k, ret);
      return ret;
    }
    finally {
      if (this.#fetchCache.retrieving(k)) {
        this.#fetchCache.setAborted(k);
      }
    }
  }
  static async create(url: string) {
    const { header, dataPosition } = await getRemoteNh5Header(url);
    return new RemoteNh5FileClient(url, header, dataPosition);
  }
}

export const getRemoteNh5File = async (url: string) => {
  return RemoteNh5FileClient.create(url);
};

const getRemoteNh5Header = async (url: string) => {
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
  if (!isNh5Header(header)) {
    console.warn(header);
    throw Error('Unexpected header');
  }
  const dataPosition = headerJsonStartPos + headerLength;
  return { header, dataPosition };
};

class FetchCache {
  #cache: { [key: string]: any } = {};
  #retrieving: { [key: string]: boolean } = {};
  #waiters: { [key: string]: (() => void)[] } = {};
  has(key: string) {
    return key in this.#cache;
  }
  get(key: string) {
    return this.#cache[key];
  }
  set(key: string, value: any) {
    this.#cache[key] = value;
    if (key in this.#waiters) {
      for (const w of this.#waiters[key]) {
        w();
      }
      delete this.#waiters[key];
    }
    if (key in this.#retrieving) {
      delete this.#retrieving[key];
    }
  }
  retrieving(key: string) {
    return !!this.#retrieving[key];
  }
  setRetrieving(key: string) {
    this.#retrieving[key] = true;
  }
  setAborted(key: string) {
    if (key in this.#retrieving) {
      delete this.#retrieving[key];
    }
    if (key in this.#waiters) {
      for (const w of this.#waiters[key]) {
        w();
      }
      delete this.#waiters[key];
    }
  }
  setFailed(key: string) {
    if (key in this.#retrieving) {
      delete this.#retrieving[key];
    }
    if (key in this.#waiters) {
      for (const w of this.#waiters[key]) {
        w();
      }
      delete this.#waiters[key];
    }
  }

  async wait(key: string) {
    return new Promise<void>((resolve, reject) => {
      if (!(key in this.#waiters)) {
        this.#waiters[key] = [];
      }
      this.#waiters[key].push(resolve);
    });
  }
}
