import { FunctionComponent, useEffect, useMemo, useState } from "react"
import { PairioJob, PairioJobDefinition, PairioJobRequiredResources } from "../../../../pairio/types"
import { useNwbFile } from "../../NwbFileContext"
import { JobSubmitComponent, MultipleChoiceNumberSelector, getJobOutputUrl, removeLeadingSlash } from "../CEBRA/PairioHelpers"
import AutocorrelogramsView from "../../../../package/view-autocorrelograms/AutocorrelogramsView"
import { AutocorrelogramData, AutocorrelogramsViewData } from "../../../../package/view-autocorrelograms/AutocorrelogramsViewData"
import { useRemoteH5FileLindi } from "../CEBRA/CEBRAOutputView"
import { RemoteH5FileX } from "@fi-sci/remote-h5-file"

type Props = {
    width: number
    height: number
    path: string
    condensed?: boolean
}

type CorrelogramWindowSizeMsecChoice = 100 | 500
const correlogramWindowSizeMsecChoices: CorrelogramWindowSizeMsecChoice[] = [100, 500]
type CorrelogramBinSizeMsecChoice = 0.5 | 1 | 5
const correlogramBinSizeMsecChoices: CorrelogramBinSizeMsecChoice[] = [0.5, 1, 5]

const UnitsSummaryItemView: FunctionComponent<Props> = ({width, height, path}) => {
    const nwbFile = useNwbFile()
    if (!nwbFile) throw Error('Unexpected: nwbFile is undefined (no context provider)')

    const [correlogramWindowSizeMsec, setCorrelogramWindowSizeMsec] = useState<CorrelogramWindowSizeMsecChoice>(100)
    const [correlogramBinSizeMsec, setCorrelogramBinSizeMsec] = useState<CorrelogramBinSizeMsecChoice>(1)
    const [job, setJob] = useState<PairioJob | undefined | null>(undefined)

    const nwbUrl = useMemo(() => {
        return nwbFile.getUrls()[0]
    }, [nwbFile])

    const jobDefinition: PairioJobDefinition | undefined = useMemo(() => (nwbUrl ? {
        appName: 'hello_neurosift',
        processorName: 'units_summary_1',
        inputFiles: [{
            name: 'input',
            fileBaseName: nwbUrl.endsWith('.lindi.json') ? 'input.lindi.json' : 'input.nwb',
            url: nwbUrl
        }],
        outputFiles: [{
            name: 'output',
            fileBaseName: 'units_summary.lindi.json',
        }],
        parameters: [{
            name: 'correlogram_window_size_msec',
            value: correlogramWindowSizeMsec
        }, {
            name: 'correlogram_bin_size_msec',
            value: correlogramBinSizeMsec
        }, {
            name: 'units_path',
            value: removeLeadingSlash(path)
        }]
    } : undefined), [correlogramWindowSizeMsec, correlogramBinSizeMsec, nwbUrl, path])

    const unitsSummaryOutputUrl = getJobOutputUrl(job || undefined, 'output')
    console.log('---- j', job, unitsSummaryOutputUrl)

    const requiredResources: PairioJobRequiredResources = useMemo(() => ({
        numCpus: 2,
        numGpus: 0,
        memoryGb: 4,
        timeSec: 60 * 30
    }), [])

    return (
        <div style={{position: 'absolute', width, height, overflowY: 'auto'}}>
            <h3>Units Summary</h3>
            <table className="table" style={{maxWidth: 300}}>
                <tbody>
                    <tr>
                        <td>
                            Correlogram window size (msec):
                        </td>
                        <td>
                            <MultipleChoiceNumberSelector value={correlogramWindowSizeMsec} setValue={x => setCorrelogramWindowSizeMsec(x as any)} choices={correlogramWindowSizeMsecChoices} />
                        </td>
                    </tr>
                    <tr>
                        <td>
                            Correlogram bin size (msec):
                        </td>
                        <td>
                            <MultipleChoiceNumberSelector value={correlogramBinSizeMsec} setValue={x => setCorrelogramBinSizeMsec(x as any)} choices={correlogramBinSizeMsecChoices} />
                        </td>
                    </tr>
                </tbody>
            </table>
            <hr />
            {jobDefinition && <JobSubmitComponent
                jobDefinition={jobDefinition}
                setJob={setJob}
                gpuMode="none"
                cpuRequiredResources={requiredResources}
            />}
            <hr />
            {
                unitsSummaryOutputUrl && (
                    <UnitsSummaryOutputView
                        unitsSummaryOutputUrl={unitsSummaryOutputUrl}
                        correlogramWindowSizeMsec={correlogramWindowSizeMsec}
                        correlogramBinSizeMsec={correlogramBinSizeMsec}
                        width={width}
                    />
                )
            }
        </div>
    )
}

type UnitsSummaryOutputViewProps = {
    width: number
    unitsSummaryOutputUrl: string
    correlogramWindowSizeMsec: CorrelogramWindowSizeMsecChoice
    correlogramBinSizeMsec: CorrelogramBinSizeMsecChoice
}

const UnitsSummaryOutputView: FunctionComponent<UnitsSummaryOutputViewProps> = ({width, unitsSummaryOutputUrl, correlogramWindowSizeMsec, correlogramBinSizeMsec}) => {
    const outputFile = useRemoteH5FileLindi(unitsSummaryOutputUrl)
    const dd = useAutocorrelogramsArray(outputFile)
    const unitIds = useUnitIds(outputFile)
    const data: AutocorrelogramsViewData | undefined = useMemo(() => {
        if (!dd) return undefined
        if (!unitIds) return undefined
        const autocorrelograms: AutocorrelogramData[] = []
        for (let i = 0; i < unitIds.length; i++) {
            const unitId = unitIds[i]
            autocorrelograms.push({
                unitId,
                binEdgesSec: dd.binEdgesSec,
                binCounts: dd.array[i]
            })
        }
        return {
            type: 'Autocorrelograms',
            autocorrelograms
        }

    }, [dd, unitIds])
    return (
        <div>
            <h3>Autocorrelograms</h3>
            {data && <AutocorrelogramsView
                data={data}
                width={width}
                height={800}
            />}
        </div>
    )
}

const useAutocorrelogramsArray = (h5: RemoteH5FileX | null) => {
    const [data, setData] = useState<{array: number[][], binEdgesSec: number[]} | null>(null)
    useEffect(() => {
        let canceled = false
        ;(async () => {
            if (!h5) return
            const ds = await h5.getDataset('autocorrelograms')
            if (!ds) return
            if (canceled) return
            const shape = ds.shape
            const e = await h5.getDatasetData('autocorrelograms', {})
            const eReshaped = reshape2D(e, [shape[0], shape[1]])
            if (canceled) return
            setData({array: eReshaped, binEdgesSec: ds.attrs.bin_edges_sec})
        })()
        return () => { canceled = true }
    }, [h5])

    return data
}

const useUnitIds = (h5: RemoteH5FileX | null) => {
    const [data, setData] = useState<string[] | null>(null)
    useEffect(() => {
        let canceled = false
        ;(async () => {
            if (!h5) return
            const dsData = await h5.getDatasetData('unit_ids', {})
            if (canceled) return
            if (!dsData) return
            setData(dsData as any as any[])
        })()
        return () => { canceled = true }
    }, [h5])
    return data
}

const reshape2D = (data: any, shape: [number, number]) => {
    const rows = shape[0]
    const cols = shape[1]
    const ret = []
    for (let i = 0; i < rows; i++) {
        const row = []
        for (let j = 0; j < cols; j++) {
            row.push(data[i * cols + j])
        }
        ret.push(row)
    }
    return ret
}


export default UnitsSummaryItemView