import { FunctionComponent, useCallback, useMemo, useState } from "react"
import useRoute from "../../useRoute"
import { CreateJobRequest, PairioJob, PairioJobDefinition, PairioJobRequiredResources, isCreateJobResponse } from "../../pairio/types"
import { SelectPairioApiKeyComponent, useAllJobs } from "../NwbPage/viewPlugins/CEBRA/PairioHelpers"
import { JobInfoView } from "../NwbPage/viewPlugins/CEBRA/PairioItemView"

type AviPageProps = {
    width: number
    height: number
}

const AviPage: FunctionComponent<AviPageProps> = ({ width, height }) => {
    const { route } = useRoute()
    if (route.page !== 'avi') throw Error('Unexpected: route.page is not "avi"')
    const aviUrl = route.url
    const { mp4Url, job, refreshAllJobs, submitJob } = useMp4UrlForAviUrl(aviUrl)

    const topAreaHeight = 110

    return (
        <div className="AviPage" style={{ position: 'absolute', width, height, overflow: 'hidden' }}>
            <div className="AviPageTopBar" style={{ position: 'absolute', width, height: topAreaHeight, overflow: 'hidden' }}>
                <TopArea
                    width={width}
                    height={topAreaHeight}
                    job={job}
                    onRefreshJob={refreshAllJobs}
                    submitJob={submitJob}
                />
                <hr />
            </div>
            <div className="AviPageContent" style={{ position: 'absolute', top: topAreaHeight, width, height: height - topAreaHeight, overflow: 'hidden' }}>
                {
                    mp4Url && (
                        <video controls width={width} height={height - topAreaHeight}>
                            <source src={mp4Url} type="video/mp4" />
                            Your browser does not support the video tag.
                        </video>
                    )
                }
            </div>
        </div>
    )
}

const useMp4UrlForAviUrl = (aviUrl: string): {
    mp4Url: string | undefined,
    job: PairioJob | undefined | null, // undefined means loading, null means not found
    refreshAllJobs: () => void,
    submitJob: (pairioApiKey: string, durationSec: number) => void
} => {
    const tags = useMemo(() => (['neurosift', 'avi_to_mp4']), [])
    const {allJobs, refreshAllJobs} = useAllJobs({
        tags,
        inputFileUrl: aviUrl
    })
    const job = useMemo(() => {
        if (!allJobs) return undefined
        if (allJobs.length === 0) return null
        // find the job with the largest duration_sec parameter
        const sortedJobs = allJobs.filter(a => {
            // if (a.status !== 'completed') return false
            const aa = a.jobDefinition.parameters.find(p => p.name === 'duration_sec')
            if (!aa) return false
            if (typeof aa.value !== 'number') return false
            return true
        }).slice().sort((a, b) => {
            const aa = a.jobDefinition.parameters.find(p => p.name === 'duration_sec')
            const bb = b.jobDefinition.parameters.find(p => p.name === 'duration_sec')
            if (!aa || !bb) return 0
            return (bb.value as number) - (aa.value as number)
        })
        return sortedJobs[0]
    }, [allJobs])
    const mp4Url = useMemo(() => {
        if (!job) return undefined
        if (job.status !== 'completed') return undefined
        const oo = job.outputFileResults.find(o => o.name === 'output')
        if (!oo) return undefined
        return oo.url
    }, [job])
    const submitJob = useCallback(async (pairioApiKey: string, durationSec: number) => {
        const jobDefinition: PairioJobDefinition = {
            appName: 'hello_neurosift',
            processorName: 'avi_to_mp4',
            inputFiles: [
                {
                    name: 'input',
                    fileBaseName: 'input.avi',
                    url: aviUrl
                }
            ],
            outputFiles: [
                {
                    name: 'output',
                    fileBaseName: 'output.mp4'
                }
            ],
            parameters: [
                {
                    name: 'duration_sec',
                    value: durationSec
                }
            ]
        }
        const requiredResources: PairioJobRequiredResources = {
            numCpus: 1,
            numGpus: 0,
            memoryGb: 4,
            timeSec: 60 * 30,
        }
        const serviceName = 'hello_world_service'
        const req: CreateJobRequest = {
            type: 'createJobRequest',
            serviceName,
            userId: '',
            batchId: '',
            tags,
            jobDefinition,
            requiredResources,
            secrets: [],
            jobDependencies: [],
            skipCache: false,
            rerunFailing: true,
            deleteFailing: true,
          };
          const headers = {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${pairioApiKey}`,
          };
          const resp = await fetch(`https://pairio.vercel.app/api/createJob`, {
            method: 'POST',
            headers,
            body: JSON.stringify(req),
          });
          if (!resp.ok) {
            throw Error(`Error creating job: ${resp.statusText}`);
          }
          const rr = await resp.json();
          if (!isCreateJobResponse(rr)) {
            throw Error(`Unexpected response: ${JSON.stringify(rr)}`);
          }
          refreshAllJobs()
    }, [aviUrl, refreshAllJobs, tags])
    return { mp4Url, job, refreshAllJobs, submitJob }
}

type TopAreaProps = {
    width: number
    height: number
    job: PairioJob | undefined | null // undefined means loading, null means not found
    onRefreshJob: () => void
    submitJob: (pairioApiKey: string, durationSec: number) => void
}

const durationSecForJob = (job: PairioJob) => {
    const aa = job.jobDefinition.parameters.find(p => p.name === 'duration_sec')
    if (!aa) return 0
    if (typeof aa.value !== 'number') return 0
    return aa.value
}

const TopArea: FunctionComponent<TopAreaProps> = ({ job, onRefreshJob, submitJob }) => {
    const [submittingNewJob, setSubmittingNewJob] = useState(false);
    const [pairioApiKey, setPairioApiKey] = useState('')
    const [selectedDurationSec, setSelectedDurationSec] = useState(60)
    return (
        <div>
            {job && (
                <div style={{padding: 3}}>
                    <JobInfoView job={job} onRefreshJob={onRefreshJob} parameterNames={[]} />
                </div>
            )}
            {
                !submittingNewJob && (job !== undefined) && (
                    <div style={{padding: 3}}>
                        <button onClick={() => setSubmittingNewJob(true)}>Submit new job</button>
                    </div>
                )
            }
            {job && !submittingNewJob && (
                <div style={{padding: 3}}>First {durationSecForJob(job) / 60} minutes of video</div>
            )}
            {
                submittingNewJob && (
                    <div>
                        <SelectDurationSecComponent value={selectedDurationSec} setValue={setSelectedDurationSec} />
                        <SelectPairioApiKeyComponent
                            value={pairioApiKey}
                            setValue={setPairioApiKey}
                        />
                    </div>
                )
            }
            {
                submittingNewJob && (
                    <button onClick={() => {
                        submitJob(pairioApiKey, selectedDurationSec)
                        setSubmittingNewJob(false)
                    }}>Submit</button>
                )
            }
        </div>
    )
}

type SelectDurationSecComponentProps = {
    value: number
    setValue: (value: number) => void
}

const durationMinutesChoices = [1, 3, 10, 30, 60]

const SelectDurationSecComponent: FunctionComponent<SelectDurationSecComponentProps> = ({ value, setValue }) => {
    return (
        <div>
            <label>Duration (minutes):</label>
            <select value={value / 60} onChange={e => setValue(parseInt(e.target.value) * 60)}>
                {
                    durationMinutesChoices.map(d => (
                        <option key={d} value={d}>{d}</option>
                    ))
                }
            </select>
        </div>
    )
}

export default AviPage