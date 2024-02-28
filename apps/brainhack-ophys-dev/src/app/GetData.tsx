import rawTraces from './vis_traces.json' ;  // resolveJsonModule: true in tsconfig todo remove

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

// const testData: ROIsData = rawTraces as ROIsData;
const testData = ROIsData.fromJSON(rawTraces);


export {testData, ROIsData}