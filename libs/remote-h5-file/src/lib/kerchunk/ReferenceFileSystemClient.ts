import { ZMetaDataZArray } from "./RemoteH5FileKerchunk";
import zarrDecodeChunkArray from "./zarrDecodeChunkArray";

/* eslint-disable @typescript-eslint/no-explicit-any */
export type ReferenceFileSystemObject = {
  version: any
  refs: {[key: string]: (
    string | [string, number, number]
  )}
}

export class ReferenceFileSystemClient {
  #fileContentCache: {[key: string]: {content: any | undefined, found: boolean}} = {};
  #inProgressReads: {[key: string]: boolean} = {};
  constructor(private obj: ReferenceFileSystemObject) {
  }
  async readJson(path: string): Promise<{[key: string]: any} | undefined> {
    const buf = await this.readBinary(path, {decodeArray: false});
    if (!buf) return undefined;
    let text = new TextDecoder().decode(buf);
    // replace NaN by "NaN" so that JSON.parse doesn't choke on it
    text = text.replace(/NaN/g, '"___NaN___"'); // This is not ideal. See: https://stackoverflow.com/a/15228712
    try {
      return JSON.parse(text, (key, value) => {
        if (value === '___NaN___') return NaN;
        return value;
      })
    }
    catch (e) {
      console.warn(text);
      throw Error('Failed to parse JSON for ' + path + ': ' + e);
    }
  }
  async readBinary(path: string, o: {decodeArray?: boolean}): Promise<any | undefined> {
    const kk = path + '|' + (o.decodeArray ? 'decode' : '');
    while (this.#inProgressReads[kk]) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    this.#inProgressReads[kk] = true;
    try {
      if (path.startsWith('/')) path = path.slice(1)
      if (this.#fileContentCache[kk]) {
        if (this.#fileContentCache[kk].found) {
          return this.#fileContentCache[kk].content;
        }
        return undefined;
      }
      const ref = this.obj.refs[path];
      if (!ref) return undefined
      let buf: ArrayBuffer | undefined;
      if (typeof ref === 'string') {
        if (ref.startsWith('base64:')) {
          buf = _base64ToArrayBuffer(ref.slice('base64:'.length));
        }
        else {
          // just a string
          buf = new TextEncoder().encode(ref).buffer;
        }
      }
      else {
        const refUrl = ref[0];
        const start = ref[1];
        const numBytes = ref[2];
        const r = await fetch(refUrl, {
          headers: {
            Range: `bytes=${start}-${start + numBytes - 1}`
          }
        });
        if (!r.ok) throw Error('Failed to fetch ' + refUrl);
        buf = await r.arrayBuffer();
      }
      if (o.decodeArray) {
        const parentPath = path.split('/').slice(0, -1).join('/');
        const zarray = (await this.readJson(parentPath + '/.zarray')) as ZMetaDataZArray | undefined;
        if (!zarray) throw Error('Failed to read .zarray for ' + path);
        try {
          buf = await zarrDecodeChunkArray(buf, zarray.dtype, zarray.compressor, zarray.filters, zarray.chunks);
        }
        catch (e) {
          throw Error(`Failed to decode chunk array for ${path}: ${e}`);
        }
      }
      if (buf) {
        this.#fileContentCache[kk] = {content: buf, found: true};
      }
      else {
        this.#fileContentCache[kk] = {content: undefined, found: false};
      }
      return buf;
    }
    catch (e) {
      this.#fileContentCache[kk] = {content: undefined, found: false}; // important to do this so we don't keep trying to read the same file
      throw e;
    }
    finally {
      this.#inProgressReads[kk] = false;
    }
  }
}

function _base64ToArrayBuffer(base64: string) {
  const binary_string = window.atob(base64);
  const bytes = new Uint8Array(binary_string.length);
  for (let i = 0; i < binary_string.length; i++) {
    bytes[i] = binary_string.charCodeAt(i);
  }
  return bytes;
}

export default ReferenceFileSystemClient;