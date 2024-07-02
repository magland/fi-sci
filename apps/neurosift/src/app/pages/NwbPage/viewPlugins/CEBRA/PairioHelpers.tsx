import { Hyperlink, SmallIconButton } from "@fi-sci/misc"
import { CreateJobRequest, FindJobByDefinitionRequest, PairioJob, PairioJobDefinition, PairioJobRequiredResources, isCreateJobResponse, isFindJobByDefinitionResponse, GetJobsRequest, isGetJobsResponse, GetJobRequest, isGetJobResponse } from "../../../../pairio/types"
import { FunctionComponent, PropsWithChildren, useCallback, useEffect, useMemo, useState } from "react"
import { Refresh } from "@mui/icons-material"
import { timeAgoString } from "../../../../timeStrings"

type JobSubmitComponentProps = {
    jobDefinition: PairioJobDefinition
    job: PairioJob | undefined | null
    refreshJob: () => void
    selectedJobId: string | undefined
    setSelectedJobId: (selectedJobId: string | undefined) => void
    gpuMode: 'required' | 'optional' | 'none'
    cpuRequiredResources?: PairioJobRequiredResources
    gpuRequiredResources?: PairioJobRequiredResources
}

export const JobSubmitComponent: FunctionComponent<JobSubmitComponentProps> = ({ job, refreshJob, jobDefinition, selectedJobId, setSelectedJobId, gpuMode, cpuRequiredResources, gpuRequiredResources }) => {
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
    const [requireGpu, setRequireGpu] = useState<boolean>(false)
    const { pairioApiKey, setPairioApiKey } = usePairioApiKey()
    const refreshJobButton = <SmallIconButton icon={<Refresh />} onClick={refreshJob} />

    useEffect(() => {
        if (gpuMode === 'required') {
            setRequireGpu(true)
        }
    }, [gpuMode])

    const jobUrl = getJobUrl(job || undefined)

    const requiredResources: PairioJobRequiredResources = useMemo(() => (
        requireGpu ? (
            gpuRequiredResources || {
                numCpus: 4,
                numGpus: 1,
                memoryGb: 8,
                timeSec: 60 * 50
            }
        ) : (
            cpuRequiredResources || {
                numCpus: 4,
                numGpus: 0,
                memoryGb: 8,
                timeSec: 60 * 50
            }
        )
    ), [requireGpu, cpuRequiredResources, gpuRequiredResources])

    const handleSubmitJob = useCallback(async () => {
        if (!jobDefinition) return
        try {
            const req: CreateJobRequest = {
                type: 'createJobRequest',
                serviceName: 'hello_world_service',
                userId: '',
                batchId: '',
                tags: [],
                jobDefinition,
                requiredResources,
                secrets: [],
                jobDependencies: [],
                skipCache: false,
                rerunFailing: true,
                deleteFailing: true
            }
            const headers = {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + pairioApiKey
            }
            const resp = await fetch('https://pairio.vercel.app/api/createJob', {
                method: 'POST',
                headers,
                body: JSON.stringify(req)
            })
            if (!resp.ok) {
                console.error('Error submitting job:', resp)
                return
            }
            const rr = await resp.json()
            if (!isCreateJobResponse(rr)) {
                console.error('Unexpected response:', rr)
                alert('Unexpected response')
                return
            }
            console.info('Submitted job:', rr.job)
        }
        finally {
            setIsSubmitting(false)
            refreshJob()
        }
    }, [jobDefinition, requiredResources, refreshJob, pairioApiKey])

    useEffect(() => {
        setIsSubmitting(false)
    }, [jobDefinition])

    return (
        <div>
            <div>
                {
                    job && (
                        <div>
                            {jobUrl ? (
                                <a href={jobUrl} target="_blank" rel="noopener noreferrer">Job {job.status}</a>
                            ) : <span>Job {job.status}</span>}
                            &nbsp;{refreshJobButton}
                        </div>
                    )
                }
                {
                    job === undefined ? (
                        <div>Loading job...</div>
                    ) : job === null ? (
                        <div>
                            <div>
                                Job not found. {refreshJobButton}
                            </div>
                            <div>
                                {jobDefinition && <Hyperlink onClick={() => setIsSubmitting(true)}>Submit job</Hyperlink>}
                            </div>
                        </div>
                    ) : job.status === 'failed' ? (
                        <div>
                            {jobDefinition && <Hyperlink onClick={() => setIsSubmitting(true)}>Rerun job</Hyperlink>}
                        </div>
                    ) : <span />
                }
            </div>
            <div>
                {
                    isSubmitting && (
                        <div>
                            <div><SelectPairioApiKeyComponent value={pairioApiKey} setValue={setPairioApiKey} /></div>
                            {gpuMode === 'optional' && <div>
                                Require GPU: <input type="checkbox" checked={requireGpu} onChange={(e) => setRequireGpu(e.target.checked)} />
                            </div>}
                            <div>
                                <button onClick={handleSubmitJob}>SUBMIT</button>
                            </div>
                            &nbsp;
                            <div>
                                <button onClick={() => setIsSubmitting(false)}>CANCEL</button>
                            </div>
                        </div>
                    )
                }
            </div>
        </div>
    )
}

export const useAllJobs = (o: {appName?: string, processorName?: string, inputFileUrl?: string}) => {
    const {appName, processorName, inputFileUrl} = o
    const [allJobs, setAllJobs] = useState<PairioJob[] | undefined | null>(undefined)
    const [refreshCode, setRefreshCode] = useState(0)
    const refreshAllJobs = useCallback(() => {
        setRefreshCode(c => (c + 1))
    }, [])
    useEffect(() => {
        let canceled = false
        if (!appName) return undefined
        if (!processorName) return undefined
        if (!inputFileUrl) return undefined;
        (async () => {
            setAllJobs(undefined)
            const req: GetJobsRequest = {
                type: 'getJobsRequest',
                serviceName: 'hello_world_service',
                appName,
                processorName,
                inputFileUrl
            }
            const headers = {
                'Content-Type': 'application/json',
            }
            const resp = await fetch('https://pairio.vercel.app/api/getJobs', {
                method: 'POST',
                headers,
                body: JSON.stringify(req)
            })
            if (canceled) return
            if (!resp.ok) {
                console.error('Error fetching jobs:', resp)
                setAllJobs(null)
                return undefined
            }
            const rr = await resp.json()
            if (!isGetJobsResponse(rr)) {
                console.error('Unexpected response:', rr)
                setAllJobs(null)
                return undefined
            }
            setAllJobs(rr.jobs)
        })()
        return () => { canceled = true }
    }, [appName, processorName, inputFileUrl, refreshCode])
    return {allJobs, refreshAllJobs}
}

export const usePairioApiKey = () => {
    // save in local storage
    const [pairioApiKey, setPairioApiKey] = useState<string>('')
    useEffect(() => {
        const storedPairioApiKey = localStorage.getItem('pairioApiKey')
        if (storedPairioApiKey) {
            setPairioApiKey(storedPairioApiKey)
        }
    }, [])
    useEffect(() => {
        localStorage.setItem('pairioApiKey', pairioApiKey)
    }, [pairioApiKey])
    return { pairioApiKey, setPairioApiKey }
}

export const SelectPairioApiKeyComponent: FunctionComponent<{value: string, setValue: (value: string) => void}> = ({value, setValue}) => {
    return (
        <div>
            <label>
                <a href="https://pairio.vercel.app/settings"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    Pairio API key
                </a>:&nbsp;
            </label>
            <input type="password" value={value} onChange={(e) => setValue(e.target.value)} />
        </div>
    )
}

export const useJob = (jobId: string | undefined) => {
    const [job, setJob] = useState<PairioJob | undefined>(undefined)
    const [refreshCode, setRefreshCode] = useState(0)
    const refreshJob = useCallback(() => {
        setRefreshCode(c => (c + 1))
    }, [])
    useEffect(() => {
        if (!jobId) {
            setJob(undefined)
            return
        }
        let canceled = false
        ;(async () => {
            setJob(undefined)
            const req: GetJobRequest = {
                type: 'getJobRequest',
                jobId,
                includePrivateKey: false
            }
            const headers = {
                'Content-Type': 'application/json',
            }
            const resp = await fetch('https://pairio.vercel.app/api/getJob', {
                method: 'POST',
                headers,
                body: JSON.stringify(req)
            })
            if (canceled) return
            if (!resp.ok) {
                console.error('Error fetching job:', resp)
                return
            }
            const data = await resp.json()
            if (!isGetJobResponse(data)) {
                console.error('Unexpected response:', data)
                return
            }
            setJob(data.job)
        })()
        return () => { canceled = true }
    }, [jobId, refreshCode])
    return { job, refreshJob }
}

export const useFindJobByDefinition = (jobDefinition: PairioJobDefinition | undefined) => {
    const [jobId, setJobId] = useState<string | undefined | null>(undefined)
    useEffect(() => {
        let canceled = false
        ;(async () => {
            if (!jobDefinition) {
                setJobId(undefined)
                return
            }
            setJobId(undefined)
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
                setJobId(data.job?.jobId)
            }
            else {
                setJobId(null)
            }
        })()
        return () => { canceled = true }
    }, [jobDefinition])
    return jobId
}

const getJobUrl = (job: PairioJob | undefined) => {
    if (!job) return undefined
    return `https://pairio.vercel.app/job/${job.jobId}`
}

export const MultipleChoiceNumberSelector: FunctionComponent<{value: number, setValue: (value: number) => void, choices: number[]}> = ({value, setValue, choices}) => {
    return (
        <select value={value} onChange={(e) => setValue(parseInt(e.target.value))}>
            {choices.map(choice => <option key={choice} value={choice}>{choice}</option>)}
        </select>
    )
}

export const removeLeadingSlash = (path: string) => {
    if (path.startsWith('/')) {
        return path.slice(1)
    }
    return path
}

export const getJobOutputUrl = (job: PairioJob | undefined, outputName: string) => {
    if (!job) return undefined
    if (job.status !== 'completed') return undefined
    const oo = job.outputFileResults.find(r => (r.name === outputName))
    if (!oo) return undefined
    return oo.url
}

export const getJobParameterValue = (job: PairioJob | undefined, parameterName: string) => {
    if (!job) return undefined
    const pp = job.jobDefinition.parameters.find(pp => (pp.name === parameterName))
    if (!pp) return undefined
    return pp.value
}

type AllJobsViewProps = {
    expanded: boolean
    setExpanded: (expanded: boolean) => void
    allJobs: PairioJob[] | undefined
    refreshAllJobs: () => void
    parameterNames: string[]
    selectedJobId: string | undefined
    onJobClicked: (jobId: string) => void
}

export const AllJobsView: FunctionComponent<AllJobsViewProps> = ({expanded, setExpanded, allJobs, refreshAllJobs, parameterNames, onJobClicked: jobClicked, selectedJobId}) => {
    if (!allJobs) return <div></div>
    return (
        <Expandable
            title={`View all jobs (${allJobs.length})`}
            expanded={expanded}
            setExpanded={setExpanded}
        >
            <AllJobsTable
                allJobs={allJobs}
                refreshAllJobs={refreshAllJobs}
                parameterNames={parameterNames}
                selectedJobId={selectedJobId}
                onJobClicked={jobClicked}
            />
        </Expandable>
    )
}

type AllJobsTableProps = {
    allJobs: PairioJob[]
    refreshAllJobs: () => void
    parameterNames: string[]
    selectedJobId: string | undefined
    onJobClicked: (jobId: string) => void
}

const AllJobsTable: FunctionComponent<AllJobsTableProps> = ({allJobs, refreshAllJobs, parameterNames, selectedJobId, onJobClicked}) => {
    return (
        <div>
            <div>
                <SmallIconButton
                    icon={<Refresh />}
                    onClick={refreshAllJobs}
                />
            </div>
            <table className="nwb-table">
                <thead>
                    <tr>
                        <th>Job</th>
                        <th>Status</th>
                        {
                            parameterNames.map(pn => (
                                <th key={pn}>{pn}</th>
                            ))
                        }
                        <th>Created</th>
                    </tr>
                </thead>
                <tbody>
                    {
                        allJobs.map(job => (
                            <tr key={job.jobId} style={job.jobId === selectedJobId ? {background: '#afafaf'} : {}}>
                                <td>
                                    <Hyperlink onClick={() => onJobClicked(job.jobId)}>
                                        SELECT
                                    </Hyperlink>
                                </td>
                                <td>{job.status}</td>
                                {
                                    parameterNames.map(pn => (
                                        <td key={pn}>{getJobParameter(job, pn)}</td>
                                    ))
                                }
                                <td>
                                    {timeAgoString(job.timestampCreatedSec)}
                                </td>
                            </tr>
                        ))
                    }
                </tbody>
            </table>
        </div>
    )
}

const getJobParameter = (job: PairioJob, parameterName: string) => {
    const pp = job.jobDefinition.parameters.find(pp => (pp.name === parameterName))
    if (!pp) return undefined
    return pp.value
}

type ExpandableProps = {
    title: string
    expanded: boolean
    setExpanded: (expanded: boolean) => void
}

const Expandable: FunctionComponent<PropsWithChildren<ExpandableProps>> = ({title, expanded, setExpanded, children}) => {
    return (
        <div>
            <div
                style={{cursor: 'pointer', padding: 10, background: '#f8f8f8', border: 'solid 1px #ccc'}}
                onClick={() => setExpanded(!expanded)}
            >
                {expanded ? '▼' : '►'} {title}
            </div>
            {
                expanded && (
                    <div style={{padding: 10}}>
                        {children}
                    </div>
                )
            }
        </div>
    )
}