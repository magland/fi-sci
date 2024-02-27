/* eslint-disable @typescript-eslint/no-explicit-any */
import { FunctionComponent, useEffect } from "react";

import { HTTPStore, openArray, openGroup } from 'zarr';


enum HTTPMethod {
    HEAD = 'HEAD',
    GET = 'GET',
    PUT = 'PUT',
}

const fetchOptions: RequestInit = {
    redirect: 'follow',
    headers: {}
};
const supportedMethods: HTTPMethod[] = [HTTPMethod.GET, HTTPMethod.HEAD];

type TestPageProps = {
    width: number
    height: number
}

const TestPage: FunctionComponent<TestPageProps> = ({width, height}) => {
    useEffect(() => {
        test()
    }, [])
    return (
        <div>Test page</div>
    )
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

type ZMetaDataItem = {
    '.zattrs'?: ZMetaDataZAttrs
    '.zgroup'?: ZMetaDataZGroup
    '.zarray'?: ZMetaDataZArray
}

type ZMetaData = {
    metadata: {
        '.zattrs'?: ZMetaDataZAttrs
        '.zgroup'?: ZMetaDataZGroup
    } & {[key: string]: ZMetaDataItem}
    zarr_consolidated_format: '1'
}

async function test() {
    console.log('test')
    const store = new HTTPStore('http://localhost:8081/test.zarr', { fetchOptions, supportedMethods });
    const z = await openGroup(store, 'units');
    const aa = await z.attrs.asObject()
    console.log(z);
    console.log(aa);
    const xx = await openArray({store, path: 'units/id'});
    console.log(xx);
    const data = await xx.get(':')
    console.log('data', data)

    const spike_times = await openArray({store, path: 'units/spike_times'});
    console.log(spike_times);
    const spike_times_data = await spike_times.get(':')
    console.log('spike_times_data', spike_times_data)

    const url = 'http://localhost:8081/test.zarr/.zmetadata'
    const r = await fetch(url);
    if (!r.ok) throw Error('Failed to fetch .zmetadata');
    const zmetadata: ZMetaData = await r.json();
    console.log(zmetadata);
}

export default TestPage
