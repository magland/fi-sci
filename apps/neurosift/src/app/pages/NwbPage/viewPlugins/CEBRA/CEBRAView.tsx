import { FunctionComponent, useMemo, useState } from "react"
import { PairioJob, PairioJobDefinition } from "../../../../pairio/types"
import { useNwbFile } from "../../NwbFileContext"
import CEBRAOutputView from "./CEBRAOutputView"
import { JobSubmitComponent, MultipleChoiceNumberSelector, getJobOutputUrl, removeLeadingSlash } from "./PairioHelpers"

type Props = {
    width: number
    height: number
    path: string
    condensed?: boolean
}

type MaxIterationsChoice = 100 | 1000 | 10000
const maxIterationsChoices: MaxIterationsChoice[] = [100, 1000, 10000]
type BinSizeMsecChoice = 10 | 20 | 50 | 100 | 200 | 500 | 1000
const binSizeMsecChoices: BinSizeMsecChoice[] = [10, 20, 50, 100, 200, 500, 1000]
type OutputDimensionsChoice = 1 | 2 | 3 | 4 | 5 | 10 | 20
const outputDimensionsChoices: OutputDimensionsChoice[] = [1, 2, 3, 4, 5, 10, 20]

const CEBRAView: FunctionComponent<Props> = ({width, height, path}) => {
    const nwbFile = useNwbFile()
    if (!nwbFile) throw Error('Unexpected: nwbFile is undefined (no context provider)')

    const [maxIterations, setMaxIterations] = useState<MaxIterationsChoice>(1000)
    const [binSizeMsec, setBinSizeMsec] = useState<BinSizeMsecChoice>(20)
    const [outputDimensions, setOutputDimensions] = useState<OutputDimensionsChoice>(10)
    const [job, setJob] = useState<PairioJob | undefined | null>(undefined)

    const nwbUrl = useMemo(() => {
        return nwbFile.getUrls()[0]
    }, [nwbFile])

    const jobDefinition: PairioJobDefinition | undefined = useMemo(() => (nwbUrl ? {
        appName: 'hello_cebra',
        processorName: 'cebra_nwb_embedding_5',
        inputFiles: [{
            name: 'input',
            fileBaseName: nwbUrl.endsWith('.lindi.json') ? 'input.lindi.json' : 'input.nwb',
            url: nwbUrl
        }],
        outputFiles: [{
            name: 'output',
            fileBaseName: 'cebra.lindi.json',
        }],
        parameters: [{
            name: 'max_iterations',
            value: maxIterations
        }, {
            name: 'bin_size_msec',
            value: binSizeMsec
        }, {
            name: 'output_dimensions',
            value: outputDimensions
        }, {
            name: 'batch_size',
            value: 1000
        }, {
            name: 'units_path',
            value: removeLeadingSlash(path)
        }]
    } : undefined), [maxIterations, binSizeMsec, outputDimensions, nwbUrl, path])

    const cebraOutputUrl = getJobOutputUrl(job || undefined, 'output')

    return (
        <div style={{position: 'absolute', width, height, overflowY: 'auto'}}>
            <h3>CEBRA Embedding</h3>
            <table className="table" style={{maxWidth: 300}}>
                <tbody>
                    <tr>
                        <td>
                            Max. iterations:
                        </td>
                        <td>
                            <MultipleChoiceNumberSelector value={maxIterations} setValue={x => setMaxIterations(x as any)} choices={maxIterationsChoices} />
                        </td>
                    </tr>
                    <tr>
                        <td>
                            Bin size (msec):
                        </td>
                        <td>
                            <MultipleChoiceNumberSelector value={binSizeMsec} setValue={x => setBinSizeMsec(x as any)} choices={binSizeMsecChoices} />
                        </td>
                    </tr>
                    <tr>
                        <td>
                            Output dimensions:
                        </td>
                        <td>
                            <MultipleChoiceNumberSelector value={outputDimensions} setValue={x => setOutputDimensions(x as any)} choices={outputDimensionsChoices} />
                        </td>
                    </tr>
                </tbody>
            </table>
            <hr />
            {jobDefinition && <JobSubmitComponent
                jobDefinition={jobDefinition}
                setJob={setJob}
                gpuMode="optional"
            />}
            <hr />
            {
                cebraOutputUrl && (
                    <CEBRAOutputView
                        cebraOutputUrl={cebraOutputUrl}
                        binSizeMsec={binSizeMsec}
                    />
                )
            }
        </div>
    )
}


export default CEBRAView