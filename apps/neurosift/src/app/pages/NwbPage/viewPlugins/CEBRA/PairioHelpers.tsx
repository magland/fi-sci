import { Hyperlink, SmallIconButton } from "@fi-sci/misc"
import { CreateJobRequest, FindJobByDefinitionRequest, PairioJob, PairioJobDefinition, PairioJobRequiredResources, isCreateJobResponse, isFindJobByDefinitionResponse } from "../../../../pairio/types"
import { FunctionComponent, useCallback, useEffect, useMemo, useState } from "react"
import { Refresh } from "@mui/icons-material"

type JobSubmitComponentProps = {
    jobDefinition: PairioJobDefinition
    setJob: (job: PairioJob | undefined | null) => void
    gpuMode: 'required' | 'optional' | 'none'
    cpuRequiredResources?: PairioJobRequiredResources
    gpuRequiredResources?: PairioJobRequiredResources
}

export const JobSubmitComponent: FunctionComponent<JobSubmitComponentProps> = ({ jobDefinition, setJob, gpuMode, cpuRequiredResources, gpuRequiredResources }) => {
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
    const [requireGpu, setRequireGpu] = useState<boolean>(false)
    const { pairioApiKey, setPairioApiKey } = usePairioApiKey()
    const { job, refreshJob } = useJob(jobDefinition)
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

    useEffect(() => {
        if (job) {
            setJob(job)
        }
    }, [job, setJob])

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

const usePairioApiKey = () => {
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

const SelectPairioApiKeyComponent: FunctionComponent<{value: string, setValue: (value: string) => void}> = ({value, setValue}) => {
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