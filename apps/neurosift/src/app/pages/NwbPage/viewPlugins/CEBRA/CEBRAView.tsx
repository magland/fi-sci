import { FindJobByDefinitionRequest, PairioJob, PairioJobDefinition, isFindJobByDefinitionResponse } from "../../../../pairio/types"
import { FunctionComponent, useCallback, useEffect, useMemo, useState } from "react"
import { useNwbFile } from "../../NwbFileContext"
import { useGroup } from "../../NwbMainView/NwbMainView"
import { SmallIconButton } from "@fi-sci/misc"
import { Refresh } from "@mui/icons-material"
import CEBRAOutputView from "./CEBRAOutputView"


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

const CEBRAView: FunctionComponent<Props> = ({width, height, path}) => {
    const nwbFile = useNwbFile()
    if (!nwbFile) throw Error('Unexpected: nwbFile is undefined (no context provider)')

    // Get the group of the item to be viewed
    const group = useGroup(nwbFile, path)
    console.info('Group:', group)

    const [maxIterations, setMaxIterations] = useState<MaxIterationsChoice>(1000)
    const [binSizeMsec, setBinSizeMsec] = useState<BinSizeMsecChoice>(20)
    const [outputDimensions, setOutputDimensions] = useState<OutputDimensionsChoice>(10)

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

    const { job, refreshJob } = useJob(jobDefinition)

    const pairioPlaygroundJobUrl = useMemo(() => {
        if (!jobDefinition) return undefined
        const serviceName = 'hello_world_service'
        const appName = 'hello_cebra'
        const processorName = 'cebra_nwb_embedding_5'
        const jobDefinitionEncoded = encodeURIComponent(JSON.stringify(jobDefinition))
        const title='Neurosift: CEBRA Embedding'
        const notes = window.location.href
        const queryStrings = [
            `service=${serviceName}`,
            `app=${appName}`,
            `processor=${processorName}`,
            `job_definition=${jobDefinitionEncoded}`,
            job ? `job=${job.jobId || ''}` : '',
            `title=${encodeURIComponent(title)}`,
            `notes=${encodeURIComponent(notes)}`
        ].filter(s => (s.length > 0))
        const q = queryStrings.join('&')
        return `https://pairio.vercel.app/playground?${q}`
    }, [jobDefinition, job])

    const cebraOutputUrl = useMemo(() => {
        if (!job) return undefined
        if (job.status !== 'completed') return undefined
        const oo = job.outputFileResults.find(r => (r.name === 'output'))
        if (!oo) return undefined
        return oo.url
    }, [job])

    const refreshJobButton = <SmallIconButton icon={<Refresh />} onClick={refreshJob} />

    // just display the contents
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
                            <MaxIterationsSelector value={maxIterations} setValue={setMaxIterations} choices={maxIterationsChoices} />
                        </td>
                    </tr>
                    <tr>
                        <td>
                            Bin size (msec):
                        </td>
                        <td>
                            <BinSizeMsecSelector value={binSizeMsec} setValue={setBinSizeMsec} choices={binSizeMsecChoices} />
                        </td>
                    </tr>
                    <tr>
                        <td>
                            Output dimensions:
                        </td>
                        <td>
                            <OutputDimensionsSelector value={outputDimensions} setValue={setOutputDimensions} choices={[1, 2, 3, 4, 5, 10, 20]} />
                        </td>
                    </tr>
                </tbody>
            </table>
            <hr />
            <div>
                {
                    nwbUrl && jobDefinition && (
                        job === undefined ? (
                            <div>Loading job...</div>
                        ) : job === null ? (
                            <div>
                                <div>
                                    Job not found. {refreshJobButton}
                                </div>
                                <div>
                                    {pairioPlaygroundJobUrl && <a href={pairioPlaygroundJobUrl} target="_blank" rel="noreferrer">Submit job</a>}
                                </div>
                                <div>
                                    <p>
                                        This job has not yet been submitted. Click the "Submit job" link above to be taken to the Pairio web site to submit the job.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div>
                                <a href={pairioPlaygroundJobUrl} target="_blank" rel="noreferrer">
                                    Job: {job.status}
                                </a> {refreshJobButton}
                            </div>
                        )
                    )
                }
            </div>
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

const useJob = (jobDefinition: PairioJobDefinition | undefined) => {
    const [job, setJob] = useState<PairioJob | undefined | null>(undefined)
    const [refreshCode, setRefreshCode] = useState(0)
    useEffect(() => {
        let canceled = false
        ;(async () => {
            if (!jobDefinition) {
                setJob(undefined)
                return
            }
            setJob(undefined)
            const req: FindJobByDefinitionRequest = {
                type: 'findJobByDefinitionRequest',
                serviceName: 'hello_world_service',
                jobDefinition
            }
            const resp = await fetch('https://pairio.vercel.app/api/findJobByDefinition', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(req)
            })
            if (!resp.ok) {
                console.error('Error fetching job:', resp)
                return
            }
            const data = await resp.json()
            if (!isFindJobByDefinitionResponse(data)) {
                console.error('Unexpected response:', data)
                return
            }
            if (canceled) return
            if (data.found) {
                setJob(data.job)
            }
            else {
                setJob(null)
            }
        })()
        return () => { canceled = true }
    }, [jobDefinition, refreshCode])
    const refreshJob = useCallback(() => {
        setRefreshCode(c => (c + 1))
    }, [])
    return { job, refreshJob }
}

const MaxIterationsSelector: FunctionComponent<{value: MaxIterationsChoice, setValue: (value: MaxIterationsChoice) => void, choices: MaxIterationsChoice[]}> = ({value, setValue, choices}) => {
    return (
        <select value={value} onChange={(e) => setValue(parseInt(e.target.value) as MaxIterationsChoice)}>
            {choices.map(choice => <option key={choice} value={choice}>{choice}</option>)}
        </select>
    )
}

const BinSizeMsecSelector: FunctionComponent<{value: BinSizeMsecChoice, setValue: (value: BinSizeMsecChoice) => void, choices: BinSizeMsecChoice[]}> = ({value, setValue, choices}) => {
    return (
        <select value={value} onChange={(e) => setValue(parseInt(e.target.value) as BinSizeMsecChoice)}>
            {choices.map(choice => <option key={choice} value={choice}>{choice}</option>)}
        </select>
    )
}

const OutputDimensionsSelector: FunctionComponent<{value: OutputDimensionsChoice, setValue: (value: OutputDimensionsChoice) => void, choices: OutputDimensionsChoice[]}> = ({value, setValue, choices}) => {
    return (
        <select value={value} onChange={(e) => setValue(parseInt(e.target.value) as OutputDimensionsChoice)}>
            {choices.map(choice => <option key={choice} value={choice}>{choice}</option>)}
        </select>
    )
}

const removeLeadingSlash = (path: string) => {
    if (path.startsWith('/')) {
        return path.slice(1)
    }
    return path
}

export default CEBRAView