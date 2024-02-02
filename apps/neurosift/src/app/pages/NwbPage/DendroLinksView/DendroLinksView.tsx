import { FunctionComponent, useEffect, useMemo, useState } from 'react';
import { DendroFile, DendroJob } from '../../../dendro/dendro-types';
import { useNwbFile, useNwbFileUrls } from '../NwbFileContext';
import { Hyperlink } from '@fi-sci/misc';

type DendroLinksViewProps = {
  // none
};

const useDendroProject = (projectId: string) => {
  const filesUrl = `https://dendro.vercel.app/api/gui/projects/${projectId}/files`;
  const jobsUrl = `https://dendro.vercel.app/api/gui/projects/${projectId}/jobs`;
  const [files, setFiles] = useState<DendroFile[] | undefined>(undefined);
  const [jobs, setJobs] = useState<DendroJob[] | undefined>(undefined);

  useEffect(() => {
    fetch(filesUrl)
      .then((response) => response.json())
      .then((data) => setFiles(data.files));
  }, [filesUrl]);

  useEffect(() => {
    fetch(jobsUrl)
      .then((response) => response.json())
      .then((data) => setJobs(data.jobs));
  }, [jobsUrl]);

  return { files, jobs };
};

const useDendroFigurl = (
  files: DendroFile[] | undefined,
  jobs: DendroJob[] | undefined,
  nwbFileUrl: string | undefined,
  processorName: string,
  type: string
) => {
  if (!files) return undefined;
  if (!jobs) return undefined;
  const inputFileName = files.find((a) => a.content === `url:${nwbFileUrl}`)?.fileName;
  if (!inputFileName) return undefined;
  const job = jobs.filter(
    (job) =>
      job.processorName === processorName &&
      job.inputFiles.find((a) => a.name === 'input' && a.fileName === inputFileName)
  )[0];
  if (!job) return undefined;
  const output = job.outputFiles.find((a) => a.name === 'output');
  if (!output) return undefined;
  const outputFile = files.find((a) => a.fileName === output.fileName);
  if (!outputFile) return undefined;
  if (!outputFile.content.startsWith('url:')) return undefined;
  const outputFileUrl = outputFile.content.slice('url:'.length);
  const d = {
    type,
    nh5_file: outputFileUrl,
  };
  const dJson = JSON.stringify(d);
  const dJsonEncoded = encodeURI(dJson);
  const labelEncoded = encodeURI(outputFile.fileName);
  return `https://figurl.org/f?v=https://figurl-dandi-vis.surge.sh&d=${dJsonEncoded}&label=${labelEncoded}`;
};

const DendroLinksView: FunctionComponent<DendroLinksViewProps> = () => {
  const dendroProjectId = 'a7852166';
  const nwbFileUrls = useNwbFileUrls();
  const nwbFileUrl = nwbFileUrls[0] || undefined;
  const { files, jobs } = useDendroProject(dendroProjectId);
  const tuningCurves2DFigurl = useDendroFigurl(
    files,
    jobs,
    nwbFileUrl,
    'dandi-vis-1.tuning_curves_2d',
    'tuning_curves_2d_nh5'
  );
  const spikeTrainsFigurl = useDendroFigurl(
    files,
    jobs,
    nwbFileUrl,
    'dandi-vis-1.spike_trains',
    'spike_trains_nh5'
  );
  const hasSomething = tuningCurves2DFigurl || spikeTrainsFigurl;
  if (!hasSomething) return <div />;
  return (
    <div style={{ marginTop: 10 }}>
      From Dendro:&nbsp;
      {tuningCurves2DFigurl && (
        <Hyperlink href={tuningCurves2DFigurl} target="_blank">
          2d tuning curves
        </Hyperlink>
      )}
      &nbsp;
      {spikeTrainsFigurl && (
        <Hyperlink href={spikeTrainsFigurl} target="_blank">
          spike trains
        </Hyperlink>
      )}
    </div>
  );
};

export default DendroLinksView;
