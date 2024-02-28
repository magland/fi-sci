import rawTraces from './vis_traces.json' ;  // resolveJsonModule: true in tsconfig todo remove

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

    static fromJSON(obj: object) {
        obj.trace = new Map(Object.entries(obj.trace))
        obj = Object.assign(new ROIsData(), obj) as ROIsData;
        obj.validate() // todo assert
        return obj
    }

}

// const testData: ROIsData = rawTraces as ROIsData;
const testData = ROIsData.fromJSON(rawTraces);


export {testData, ROIsData}