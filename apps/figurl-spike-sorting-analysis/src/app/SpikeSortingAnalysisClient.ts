/* eslint-disable @typescript-eslint/no-explicit-any */
// import { RemoteH5File, RemoteH5Group } from "@fi-sci/remote-h5-file"
import { AutocorrelogramsViewData } from "./view-autocorrelograms"
import { AverageWaveformsViewData } from "./view-average-waveforms"
import { RemoteNH5FileClient, RemoteNH5Group } from "./nh5"
import { UnitLocationsViewData } from "./view-unit-locations"

class SpikeSortingAnalysisClient {
    constructor(private d: {
        nh5File: RemoteNH5FileClient,
        rootGroup: RemoteNH5Group,
        unitIds: (string | number)[],
        autocorrelogramsViewData?: AutocorrelogramsViewData,
        averageWaveformsViewData?: AverageWaveformsViewData,
        unitLocationsViewData?: any
    }) {
        console.log('unitIds', this.d.unitIds)
    }

    get unitIds() {
        return this.d.unitIds
    }

    get autocorrelogramsViewData() {
        return this.d.autocorrelogramsViewData
    }

    get averageWaveformsViewData() {
        return this.d.averageWaveformsViewData
    }

    get unitLocationsViewData() {
        return this.d.unitLocationsViewData
    }

    // static create
    static async create(nh5File: RemoteNH5FileClient) {
        const rootGroup = await nh5File.getGroup('/')
        if (!rootGroup) throw Error('Unable to get root group')
        const unitIds = JSON.parse(rootGroup.attrs['unit_ids'])
        const channelIds: (string | number)[] = JSON.parse(rootGroup.attrs['channel_ids'])
        const channelLocations: number[][] = JSON.parse(rootGroup.attrs['channel_locations'])
        const unitLocations: number[][] = JSON.parse(rootGroup.attrs['unit_locations'])

        let autocorrelogramsViewData: AutocorrelogramsViewData | undefined = undefined
        try {
            autocorrelogramsViewData = await getAutocorrelogramsViewData(nh5File, unitIds)
        }
        catch (err) {
            console.warn(err)
        }

        let averageWaveformsViewData: AverageWaveformsViewData | undefined = undefined
        try {
            averageWaveformsViewData = await getAverageWaveformsViewData(nh5File, unitIds)
        }
        catch (err) {
            console.warn(err)
        }

        let unitLocationsViewData: UnitLocationsViewData | undefined = undefined
        try {
            unitLocationsViewData = await getUnitLocationsViewData(nh5File, unitIds, channelIds, channelLocations, unitLocations)
        }
        catch (err) {
            console.warn(err)
        }

        return new SpikeSortingAnalysisClient({
            nh5File,
            rootGroup,
            unitIds,
            autocorrelogramsViewData,
            averageWaveformsViewData,
            unitLocationsViewData
        });
    }
}

const getAutocorrelogramsViewData = async (h5File: RemoteNH5FileClient, unitIds: (string | number)[]) => {
    const autocorrelogramsGroup = await h5File.getGroup('/autocorrelograms')
    if (!autocorrelogramsGroup) throw Error('Unable to get autocorrelograms group')
    const binEdgesSecDataset = await h5File.getDatasetData('/autocorrelograms/bin_edges_sec', {})
    if (!binEdgesSecDataset) throw Error('Unable to get bin_edges_sec dataset')
    const binCountsDataset = await h5File.getDataset('/autocorrelograms/bin_counts')
    if (!binCountsDataset) throw Error('Unable to get bin_counts dataset')
    const binCountsData = await h5File.getDatasetData('/autocorrelograms/bin_counts', {})
    if (!binCountsData) throw Error('Unable to get bin_counts dataset')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const binCountsDataReshaped = reshape2D(binCountsData as any as number[], binCountsDataset.shape)
    const autocorrelograms : {
        unitId: number | string
        binEdgesSec: number[]
        binCounts: number[]
    }[] = []

    if (unitIds.length !== binCountsDataset.shape[0]) {
        throw Error(`Mismatch between unitIds (${unitIds.length}) and binCounts shape (${binCountsDataset.shape[0]})`)
    }

    unitIds.forEach((unitId, index) => {
        autocorrelograms.push({
            unitId,
            binEdgesSec: binEdgesSecDataset as any as number[],
            binCounts: binCountsDataReshaped[index]
        })
    })

    const ret: AutocorrelogramsViewData = {
        type: 'Autocorrelograms',
        autocorrelograms
    }
    return ret
}

const getAverageWaveformsViewData = async (h5File: RemoteNH5FileClient, unitIds: (string | number)[]) => {
    const rootGroup = await h5File.getGroup('/')
    if (!rootGroup) throw Error('Unable to get root group')
    const neighborhood_channel_indices = JSON.parse(await rootGroup.attrs['neighborhood_channel_indices'])
    const average_waveforms_dataset = await h5File.getDataset('/average_waveforms')
    if (!average_waveforms_dataset) throw Error('Unable to get average_waveforms dataset')
    const average_waveforms_data = await h5File.getDatasetData('/average_waveforms', {})
    if (!average_waveforms_data) throw Error('Unable to get average_waveforms dataset data')
    const average_waveforms = reshape3D(average_waveforms_data as any as number[], average_waveforms_dataset.shape)

    const averageWaveforms: {
        unitId: number | string
        channelIds: (number | string)[]
        waveform: number[][]
        waveformStdDev?: number[][]
        waveformPercentiles?: (number[][])[]
    }[] = unitIds.map((unitId, index) => {
        const neighborhoodChannelIndices = neighborhood_channel_indices[index]
        return {
            unitId,
            channelIds: neighborhoodChannelIndices.map((i: number) => i.toString()),
            waveform: transpose2D(average_waveforms[index])
        }
    })

    const ret: AverageWaveformsViewData = {
        type: 'AverageWaveforms',
        averageWaveforms
    }
    return ret
}

const getUnitLocationsViewData = async (h5File: RemoteNH5FileClient, unitIds: (string | number)[], channelIds: (string | number)[], channelLocations: number[][], unitLocations: number[][]) => {
    const channelLocations2: { [key: string]: number[] } = {}
    for (let i = 0; i < channelIds.length; i++) {
        channelLocations2[channelIds[i].toString()] = channelLocations[i]
    }
    const ret: UnitLocationsViewData = {
        type: 'UnitLocations',
        channelLocations: channelLocations2,
        units: unitIds.map((unitId, ii) => ({
            unitId,
            x: unitLocations[ii][0],
            y: unitLocations[ii][1]
        })),
        disableAutoRotate: false
    }
    return ret
}

const reshape2D = (x: number[], shape: number[]): number[][] => {
    const ret: number[][] = []
    let k = 0
    for (let i = 0; i < shape[0]; i++) {
        const row: number[] = []
        for (let j = 0; j < shape[1]; j++) {
            row.push(x[k])
            k++
        }
        ret.push(row)
    }
    return ret
}

const reshape3D = (x: number[], shape: number[]): number[][][] => {
    const ret: number[][][] = []
    let k = 0
    for (let i = 0; i < shape[0]; i++) {
        const row: number[][] = []
        for (let j = 0; j < shape[1]; j++) {
            const col: number[] = []
            for (let l = 0; l < shape[2]; l++) {
                col.push(x[k])
                k++
            }
            row.push(col)
        }
        ret.push(row)
    }
    return ret
}

const transpose2D = (x: number[][]): number[][] => {
    const ret: number[][] = []
    for (let j = 0; j < x[0].length; j++) {
        const row: number[] = []
        for (let i = 0; i < x.length; i++) {
            row.push(x[i][j])
        }
        ret.push(row)
    }
    return ret
}

// // eslint-disable-next-line @typescript-eslint/no-explicit-any
// const formatUnitIds = (unitIds: any): (number | string)[] => {
//     const ret: (number | string)[] = []
//     for (let i = 0; i < unitIds.length; i++) {
//         ret.push(unitIds[i])
//     }
//     return ret
// }

export default SpikeSortingAnalysisClient