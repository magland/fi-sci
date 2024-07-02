import { Hyperlink, SmallIconButton } from '@fi-sci/misc';
import { RemoteH5FileLindi, RemoteH5FileX, getRemoteH5FileLindi } from '@fi-sci/remote-h5-file';
import { Refresh } from '@mui/icons-material';
import { FunctionComponent, useCallback, useEffect, useMemo, useReducer, useState } from 'react';
import Markdown from "../../../../Markdown/Markdown";
import {
  CreateJobRequest,
  PairioJob,
  PairioJobDefinition,
  PairioJobRequiredResources,
  isCreateJobResponse,
} from '../../../../pairio/types';
import { useNwbFile } from '../../NwbFileContext';
import EmbeddingPlot3D from './EmbeddingPlot3D';
import EmbeddingTimePlot from './EmbeddingTimePlot';
import LossPlot from './LossPlot';
import {
  AllJobsView,
  MultipleChoiceNumberSelector,
  SelectPairioApiKeyComponent,
  getJobOutputUrl,
  getJobParameterValue,
  removeLeadingSlash,
  useAllJobs,
  useJob,
  usePairioApiKey,
} from './PairioHelpers';
import getIntrinsicDimensionMarkdown from './getIntrinsicDimensionMarkdown';
import getPowerSpectrumMarkdown from './getPowerSpectrumMarkdown';

type Props = {
  width: number;
  height: number;
  path: string;
  condensed?: boolean;
};

type AdjustableParameterValues = { [key: string]: any };

type AdjustableParametersAction = { type: 'set'; key: string; value: any };

const adjustableParametersReducer = (
  state: AdjustableParameterValues,
  action: AdjustableParametersAction
): AdjustableParameterValues => {
  switch (action.type) {
    case 'set': {
      return {
        ...state,
        [action.key]: action.value,
      };
    }
    default: {
      throw Error(`Unexpected action type: ${action}`);
    }
  }
};

const CEBRAView: FunctionComponent<Props> = ({ width, height, path }) => {
  const nwbFile = useNwbFile();
  if (!nwbFile) throw Error('Unexpected: nwbFile is undefined (no context provider)');

  const nwbUrl = useMemo(() => {
    return nwbFile.getUrls()[0];
  }, [nwbFile]);

  type MaxIterationsChoice = 100 | 1000 | 10000;
  const maxIterationsChoices: MaxIterationsChoice[] = [100, 1000, 10000];
  type BinSizeMsecChoice = 10 | 20 | 50 | 100 | 200 | 500 | 1000;
  const binSizeMsecChoices: BinSizeMsecChoice[] = [10, 20, 50, 100, 200, 500, 1000];
  type OutputDimensionsChoice = 1 | 2 | 3 | 4 | 5 | 10 | 20;
  const outputDimensionsChoices: OutputDimensionsChoice[] = [1, 2, 3, 4, 5, 10, 20];

  const adjustableParameters: { name: string; type: 'number'; choices: any[] }[] = [
    { name: 'max_iterations', type: 'number', choices: maxIterationsChoices },
    { name: 'bin_size_msec', type: 'number', choices: binSizeMsecChoices },
    { name: 'output_dimensions', type: 'number', choices: outputDimensionsChoices },
  ];

  const defaultAdjustableParameters: AdjustableParameterValues = {
    max_iterations: 1000,
    bin_size_msec: 20,
    output_dimensions: 10,
  };

  const serviceName = 'hello_world_service';
  const appName = 'hello_cebra';
  const processorName = 'cebra_nwb_embedding_5';

  const getJobDefinition = (
    adjustableParameterValues: AdjustableParameterValues,
    inputFileUrl: string,
    path: string
  ): PairioJobDefinition => {
    return {
      appName,
      processorName,
      inputFiles: [
        {
          name: 'input',
          fileBaseName: inputFileUrl.endsWith('.lindi.json') ? 'input.lindi.json' : 'input.nwb',
          url: inputFileUrl,
        },
      ],
      outputFiles: [
        {
          name: 'output',
          fileBaseName: 'cebra.lindi.json',
        },
      ],
      parameters: [
        {
          name: 'max_iterations',
          value: adjustableParameterValues.max_iterations,
        },
        {
          name: 'bin_size_msec',
          value: adjustableParameterValues.bin_size_msec,
        },
        {
          name: 'output_dimensions',
          value: adjustableParameterValues.output_dimensions,
        },
        {
          name: 'batch_size',
          value: 1000,
        },
        {
          name: 'units_path',
          value: removeLeadingSlash(path),
        },
      ],
    };
  };

  const getRequiredResources = (requireGpu: boolean): PairioJobRequiredResources => {
    return {
      numCpus: requireGpu ? 1 : 4,
      numGpus: requireGpu ? 1 : 0,
      memoryGb: 8,
      timeSec: 60 * 50,
    };
  };

  const gpuMode: 'optional' | 'required' | 'forbidden' = 'optional' as any;

  const title = 'CEBRA Embedding';

  return (
    <SpecialView
      width={width}
      height={height}
      nwbUrl={nwbUrl}
      path={path}
      serviceName={serviceName}
      appName={appName}
      processorName={processorName}
      title={title}
      adjustableParameters={adjustableParameters}
      defaultAdjustableParameters={defaultAdjustableParameters}
      getJobDefinition={getJobDefinition}
      getRequiredResources={getRequiredResources}
      gpuMode={gpuMode}
      OutputComponent={CEBRAJobOutputWidget}
    />
  );
};

type SpecialViewProps = {
  width: number;
  height: number;
  nwbUrl: string;
  path: string;
  serviceName: string;
  appName: string;
  processorName: string;
  title: string;
  adjustableParameters: { name: string; type: 'number'; choices: any[] }[];
  defaultAdjustableParameters: AdjustableParameterValues;
  getJobDefinition: (adjustableParameterValues: AdjustableParameterValues, inputFileUrl: string, path: string) => PairioJobDefinition;
  getRequiredResources: (requireGpu: boolean) => PairioJobRequiredResources;
  gpuMode: 'optional' | 'required' | 'forbidden';
  OutputComponent: FunctionComponent<{ job: PairioJob }>;
};

const SpecialView: FunctionComponent<SpecialViewProps> = ({ width, height, nwbUrl, path, serviceName, appName, processorName, title, adjustableParameters, defaultAdjustableParameters, getJobDefinition, getRequiredResources, gpuMode, OutputComponent }) => {
  const [selectedJobId, setSelectedJobId] = useState<string | undefined>(undefined);
  const { job: selectedJob, refreshJob: refreshSelectedJob } = useJob(selectedJobId || undefined);

  const inputFileUrl = nwbUrl;

  // new job definition parameters
  const [adjustableParameterValues, adjustableParameterValuesDispatch] = useReducer(
    adjustableParametersReducer,
    defaultAdjustableParameters
  );

  const [requireGpu, setRequireGpu] = useState(false);
  useEffect(() => {
    if (gpuMode === 'required') {
      setRequireGpu(true);
    } else if (gpuMode === 'forbidden') {
      setRequireGpu(false);
    }
  }, [gpuMode]);

  useEffect(() => {
    // if we have a new selected job, update the parameters
    if (!selectedJob) return;
    for (const p of adjustableParameters) {
      const value = getJobParameterValue(selectedJob, p.name);
      if (value !== undefined) {
        adjustableParameterValuesDispatch({ type: 'set', key: p.name, value });
      }
    }
  }, [selectedJob, adjustableParameterValuesDispatch, adjustableParameters]);

  const [allJobsExpanded, setAllJobsExpanded] = useState(false);

  const [submittingNewJob, setSubmittingNewJob] = useState(false);
  const [definingNewJob, setDefiningNewJob] = useState(false);
  const newJobDefinition: PairioJobDefinition | undefined = useMemo(
    () => (nwbUrl ? getJobDefinition(adjustableParameterValues, inputFileUrl, path) : undefined),
    [nwbUrl, inputFileUrl, adjustableParameterValues, path, getJobDefinition]
  );
  useEffect(() => {
    // if the job definition has changed, close up the submission
    setSubmittingNewJob(false);
  }, [newJobDefinition]);

  const requiredResources: PairioJobRequiredResources = useMemo(() => {
    return getRequiredResources(requireGpu);
  }, [requireGpu, getRequiredResources]);

  const { allJobs, refreshAllJobs } = useAllJobs({ appName, processorName, inputFileUrl });
  useEffect(() => {
    if (!allJobs) return;
    if (allJobs.length === 0) {
      setDefiningNewJob(true);
    }
  }, [allJobs]);

  useEffect(() => {
    if (selectedJobId) return;
    for (const ss of ['completed', 'running', 'pending', 'failed']) {
      const candidateJobs = allJobs?.filter((job) => job.status === ss);
      if (candidateJobs && candidateJobs.length > 0) {
        setSelectedJobId(candidateJobs[0].jobId);
        return;
      }
    }
  }, [allJobs, selectedJobId]);

  const { pairioApiKey, setPairioApiKey } = usePairioApiKey();

  const parameterNames = useMemo(() => ['max_iterations', 'bin_size_msec', 'output_dimensions'], []);

  const handleSubmitNewJob = useCallback(async () => {
    if (!newJobDefinition) return;
    const req: CreateJobRequest = {
      type: 'createJobRequest',
      serviceName,
      userId: '',
      batchId: '',
      tags: ['neurosift'],
      jobDefinition: newJobDefinition,
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
    setDefiningNewJob(false);
    setSelectedJobId(rr.job.jobId);
    setAllJobsExpanded(false);
    refreshAllJobs();
  }, [newJobDefinition, pairioApiKey, refreshAllJobs, requiredResources, serviceName]);

  return (
    <div style={{ position: 'absolute', width, height, overflowY: 'auto' }}>
      <h3>{title}</h3>
      {definingNewJob ? (
        <div>
          <table className="table" style={{ maxWidth: 300 }}>
            {adjustableParameters.map((p) => (
              <tr key={p.name}>
                <td>{p.name}:</td>
                <td>
                  <MultipleChoiceNumberSelector
                    value={adjustableParameterValues[p.name]}
                    setValue={(x) => adjustableParameterValuesDispatch({ type: 'set', key: p.name, value: x })}
                    choices={p.choices}
                  />
                </td>
              </tr>
            ))}
          </table>
          <div>
            <button onClick={() => setSubmittingNewJob(true)}>SUBMIT JOB</button>
          </div>
          {submittingNewJob && (
            <div>
              <SelectPairioApiKeyComponent value={pairioApiKey} setValue={setPairioApiKey} />
              <div>
                <RequireGpuSelector value={requireGpu} setValue={setRequireGpu} />
              </div>
              <div>
                <button onClick={handleSubmitNewJob} disabled={!pairioApiKey}>
                  OK
                </button>
              </div>
            </div>
          )}
          <hr />
        </div>
      ) : (
        <div>
          <Hyperlink onClick={() => setDefiningNewJob(true)}>Create new job</Hyperlink>
        </div>
      )}
      <AllJobsView
        expanded={allJobsExpanded}
        setExpanded={setAllJobsExpanded}
        allJobs={allJobs || undefined}
        refreshAllJobs={refreshAllJobs}
        selectedJobId={selectedJobId}
        onJobClicked={setSelectedJobId}
        parameterNames={parameterNames}
      />
      <hr />
      {selectedJob && (
        <div>
            <JobInfoView job={selectedJob} onRefreshJob={refreshSelectedJob} parameterNames={parameterNames} />
            <OutputComponent job={selectedJob} />
        </div>
      )}
    </div>
  );
};

const RequireGpuSelector: FunctionComponent<{ value: boolean; setValue: (value: boolean) => void }> = ({
  value,
  setValue,
}) => {
  return (
    <div>
      <input type="checkbox" checked={value} onChange={(e) => setValue(e.target.checked)} />
      <label>Require GPU</label>
    </div>
  );
};

const CEBRAJobOutputWidget: FunctionComponent<{ job: PairioJob }> = ({ job }) => {
  const cebraOutputUrl = getJobOutputUrl(job, 'output')
  const outputFile = useRemoteH5FileLindi(cebraOutputUrl)
  const loss = useLoss(outputFile)
  const embedding = useEmebdding(outputFile)

  const binSizeMsec = getJobParameterValue(job, 'bin_size_msec') as number

  return (
      <div>
          {job && cebraOutputUrl && (
              <div>
                  {embedding ? (
                      <EmbeddingPlot3D
                          embedding={embedding}
                          width={800}
                          height={400}
                      />
                  ) : (
                      <div style={{position: 'relative', width: 800, height: 400}}>Loading embedding data...</div>
                  )}
                  {embedding ? (
                      <EmbeddingTimePlot
                          embedding={embedding}
                          binSizeMsec={binSizeMsec}
                          width={1400}
                          height={300}
                      />
                  ): (
                      <div style={{position: 'relative', width: 800, height: 400}}>Loading embedding data...</div>
                  )}
                  {loss ? (
                      <LossPlot
                          loss={loss}
                          width={800}
                          height={400}
                      />
                  ) : (
                      <div style={{position: 'relative', width: 800, height: 400}}>Loading loss data...</div>
                  )}
                  <div>&nbsp;</div>
                  <hr />
                  <Markdown
                      source={getIntrinsicDimensionMarkdown(cebraOutputUrl)}
                  />
                  <div>&nbsp;</div>
                  <hr />
                  <Markdown
                      source={getPowerSpectrumMarkdown(cebraOutputUrl, binSizeMsec)}
                  />
                  <hr />
                  <div>
                      Embedding URL: {cebraOutputUrl}
                  </div>
              </div>
          )}
      </div>
  )
}

type JobInfoViewProps = {
  job: PairioJob
  onRefreshJob: () => void
  parameterNames: string[]
}

const getJobUrl = (jobId: string) => {
  return `https://pairio.vercel.app/job/${jobId}`
}

const JobInfoView: FunctionComponent<JobInfoViewProps> = ({ job, onRefreshJob, parameterNames }) => {
  const jobUrl = getJobUrl(job.jobId)
  return (
      <div>
          <Hyperlink href={jobUrl} target="_blank">
              Job {job.status}
          </Hyperlink>&nbsp;<SmallIconButton icon={<Refresh />} onClick={onRefreshJob} />
          <table className="table" style={{ maxWidth: 300 }}>
              <tbody>
                  {parameterNames.map((name, index) => (
                      <tr key={index}>
                          <td>{name}:</td>
                          <td>{getJobParameterValue(job, name)}</td>
                      </tr>
                  ))}
              </tbody>
          </table>
      </div>
  )

}

export const useRemoteH5FileLindi = (url: string | undefined) => {
  const [file, setFile] = useState<RemoteH5FileLindi | null>(null)
  useEffect(() => {
      if (!url) {
          setFile(null)
          return
      }
      let canceled = false
      ;(async () => {
          setFile(null)
          const f = await getRemoteH5FileLindi(url)
          if (canceled) return
          setFile(f)
      })()
      return () => { canceled = true }
  }, [url])

  return file
}

const useLoss = (h5: RemoteH5FileX | null) => {
  const [loss, setLoss] = useState<any | null>(null)
  useEffect(() => {
      let canceled = false
      ;(async () => {
          if (!h5) return
          const l = await h5.getDatasetData('loss', {})
          if (canceled) return
          setLoss(l)
      })()
      return () => { canceled = true }
  }, [h5])

  return loss
}

const useEmebdding = (h5: RemoteH5FileX | null) => {
  const [embedding, setEmbedding] = useState<number[][] | null>(null)
  useEffect(() => {
      let canceled = false
      ;(async () => {
          if (!h5) return
          const ds = await h5.getDataset('embedding')
          if (!ds) return
          if (canceled) return
          const shape = ds.shape
          const e = await h5.getDatasetData('embedding', {})
          const eReshaped = reshape2D(e, [shape[0], shape[1]])
          if (canceled) return
          setEmbedding(eReshaped)
      })()
      return () => { canceled = true }
  }, [h5])

  return embedding
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

export default CEBRAView;
