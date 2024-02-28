import { useEffect, useState } from "react";
import rawTraces from './vis_traces.json';  // resolveJsonModule: true in tsconfig todo remove

// colours
const v1 = 255
const v2 = 160
const _ = 128
const distinctColors = [
    [v1, _, _],
    [_, v1, _],
    [_, _, v1],
    [v1, v1, _],
    [v1, _, v1],
    [_, v1, v1],
    [v1, v2, _],
    [v1, _, v2],
    [_, v1, v2],
    [v2, v1, _],
    [v2, _, v1],
    [_, v2, v1]
]

type Data = {
    data: null | ROIsData
    loading: boolean
    error: null | Error
}


class ROIsData {
    readonly time: number[]
    readonly trace: Map<number, number[]>
    readonly roi_mask: number[][]
    readonly sampleRate?: number

    validate() {
        const lengths = new Set()
        this.trace.forEach(arr => lengths.add(arr.length))
        return (
          this.time.length === lengths.values().next().value
        );
    }

    id2colour(id: number) {
        if (this.trace.has(id) === false) {
            console.log('ROI ID %i not found', id);
            return [0, 0, 0]
        }
        return distinctColors[id % distinctColors.length]
    }

    static fromJSON(obj: object) {
        // convert trace object from str key to Map with int keys
        obj.trace = new Map(Object.entries(obj.trace).map(([k, v]) => [+k, v]))
        obj = Object.assign(new ROIsData(), obj) as ROIsData;
        obj.validate() // todo assert
        return obj
    }

}

function useFetchData(requestConfig: URLSearchParams) {
    const [state, setState] = useState<Data>({
        loading: true,
        data: null,
        error: null,
    });
    useEffect(() => {
      (async () => {
        console.log('loc', requestConfig)
        const method = requestConfig.get('method') || 'GET';
        console.log('method', method)
        if (!requestConfig.get('url') || method === 'TEST') {
            console.log('TEST MODE')
            const data = ROIsData.fromJSON(rawTraces)
            setState(prevState => ({...prevState, data: data, loading: false} as Data))
        } else {
            console.log('GET MODE')
            const response = await fetch(requestConfig.get('url'))
            const data = await response.json()
            setState(prevState => ({...prevState, data: ROIsData.fromJSON(data), loading: false}))
        }
      })()
    // return state
    }, [requestConfig])
  return state
  };

export {useFetchData, ROIsData}