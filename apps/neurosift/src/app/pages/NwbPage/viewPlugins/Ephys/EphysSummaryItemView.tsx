import { RemoteH5FileLindi, RemoteH5FileX, getRemoteH5FileLindi } from '@fi-sci/remote-h5-file';
import { FunctionComponent, PropsWithChildren, useEffect, useMemo, useState } from 'react';
import { PairioJob, PairioJobDefinition, PairioJobRequiredResources } from '../../../../pairio/types';
import { useNwbFile } from '../../NwbFileContext';
import { getJobOutputUrl, removeLeadingSlash } from '../CEBRA/PairioHelpers';
import PairioItemView from '../CEBRA/PairioItemView';
import LazyPlotlyPlot from '../CEBRA/LazyPlotlyPlot';
import ElectrodeGeometryView from './ElectrodeGeometryView';

type Props = {
  width: number;
  height?: number;
  path: string;
  condensed?: boolean;

  compact?: boolean;
};

const serviceName = 'hello_world_service';
const appName = 'hello_neurosift';
const processorName = 'ephys_summary_1';

const getJobDefinition = (
  adjustableParameterValues: { [key: string]: any },
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
        fileBaseName: 'ephys_summary.lindi.json',
      },
    ],
    parameters: [
      {
        name: 'electrical_series_path',
        value: removeLeadingSlash(path)
      },
      {
        name: 'segment_start_time_sec',
        value: adjustableParameterValues.segment_start_time_sec
      },
      {
        name: 'segment_duration_sec',
        value: adjustableParameterValues.segment_duration_sec
      },
    ],
  };
};

const getRequiredResources = (requireGpu: boolean): PairioJobRequiredResources => {
  return {
    numCpus: 2,
    numGpus: 0,
    memoryGb: 4,
    timeSec: 60 * 30,
  };
};

const gpuMode: 'optional' | 'required' | 'forbidden' = 'forbidden' as any;

const title = 'Ephys Summary';

const EphysSummaryItemView: FunctionComponent<Props> = ({ width, height, path, compact }) => {
  const nwbFile = useNwbFile();
  if (!nwbFile) throw Error('Unexpected: nwbFile is undefined (no context provider)');

  const nwbUrl = useMemo(() => {
    return nwbFile.getUrls()[0];
  }, [nwbFile]);

  // const electricalSeriesPathChoices: string[] | undefined = useElectricalSeriesPathChoices(nwbFile);

  const tags = useMemo(() => (['neurosift', 'EphysSummary']), []);

  const { adjustableParameters, defaultAdjustableParameters } = useMemo(() => {
    // if (!electricalSeriesPathChoices) return ({ adjustableParameters: undefined, defaultAdjustableParameters: undefined });
    const adjustableParameters: { name: string; type: 'number' | 'string'; choices: any[] }[] = [
      { name: 'segment_start_time_sec', type: 'number', choices: [0] },
      { name: 'segment_duration_sec', type: 'number', choices: [60] }
    ];

    const defaultAdjustableParameters = {
      segment_start_time_sec: 0,
      segment_duration_sec: 60
    };
    return { adjustableParameters, defaultAdjustableParameters };
  }, []);

  // if (!electricalSeriesPathChoices) {
  //   return <div>Loading electrical series path choices...</div>;
  // }
  if (!adjustableParameters) {
    return <div>Unexpected: adjustableParameters is undefined</div>;
  }
  if (!defaultAdjustableParameters) {
    return <div>Unexpected: defaultAdjustableParameters is undefined</div>;
  }

  return (
    <PairioItemView
      width={width}
      height={height}
      nwbUrl={nwbUrl}
      path={path}
      serviceName={serviceName}
      appName={undefined} // go by tags instead of app/processor
      processorName={processorName} // go by tags instead of app/processor
      tags={tags}
      title={title}
      adjustableParameters={adjustableParameters}
      defaultAdjustableParameters={defaultAdjustableParameters}
      getJobDefinition={getJobDefinition}
      getRequiredResources={getRequiredResources}
      gpuMode={gpuMode}
      OutputComponent={EphysSummaryJobOutputWidget}
      compact={compact}
    />
  );
};

// const useElectricalSeriesPathChoices = (nwbFile: RemoteH5FileX | null) => {
//   const [choices, setChoices] = useState<string[] | undefined>(undefined);
//   useEffect(() => {
//     let canceled = false;
//     (async () => {
//       setChoices(undefined);
//       if (!nwbFile) return;
//       const choices = await getElectricalSeriesPathChoices(nwbFile);
//       if (canceled) return;
//       setChoices(choices);
//     })();
//     return () => {
//       canceled = true;
//     };
//   }, [nwbFile]);
//   return choices;
// }

// const getElectricalSeriesPathChoices = async (nwbFile: RemoteH5FileX) => {
//   const choices: string[] = [];
//   const processGroup = async (path: string) => {
//     const g = await nwbFile.getGroup(path);
//     if (!g) return;
//     if (g.attrs['neurodata_type'] === 'ElectricalSeries') {
//       choices.push(path);
//     }
//     for (const sg of g.subgroups) {
//       await processGroup(sg.path)
//     }
//   };
//   await processGroup('/');
//   return choices;
// }

const EphysSummaryJobOutputWidget: FunctionComponent<{ job: PairioJob, width: number, nwbFile: RemoteH5FileX }> = ({ job, width, nwbFile }) => {
  const unitsSummaryOutputUrl = getJobOutputUrl(job, 'output');
  const outputFile = useRemoteH5FileLindi(unitsSummaryOutputUrl);
  const estimatedFiringRates = useEstimatedChannelFiringRatesArray(outputFile);
  const channelIds = useChannelIds(outputFile);
  const channelPowerSpectra = useChannelPowerSpectra(outputFile);
  const deadChannelIndices = useDeadChannelIndices(channelPowerSpectra);

  const maxEstimatedFiringRate = useMemo(() => {
    if (!estimatedFiringRates) return 0;
    return Math.max(...estimatedFiringRates);
  }, [estimatedFiringRates]);

  const colors = useMemo(() => {
    if (!estimatedFiringRates) return [];
    return colorsForEstimatedFiringRates(estimatedFiringRates, maxEstimatedFiringRate);
  }, [estimatedFiringRates, maxEstimatedFiringRate]);

  if (!estimatedFiringRates) {
    return <div>Loading estimated firing rates...</div>;
  }
  if (!channelIds) {
    return <div>Loading channel ids...</div>;
  }

  return (
    <div>
      <BarGraph width={Math.min(800, width)} values={estimatedFiringRates} />
      {outputFile && nwbFile && <ElectrodeGeometryView
        width={Math.max(width - 100, 200)}
        height={250}
        nwbFile={nwbFile}
        electricalSeriesPath={job.jobDefinition.parameters.find(p => (p.name === 'electrical_series_path'))?.value as string}
        deadElectrodeIndices={deadChannelIndices}
        colors={colors}
      />}
      <Expandable title="table" defaultExpanded={false}>
        <div>
          <table className='nwb-table'>
            <thead>
              <tr>
                <th>Channel</th>
                <th>Estimated firing rate (Hz)</th>
                <th>Bar</th>
              </tr>
            </thead>
            <tbody>
              {
                channelIds.map((channelId, ii) => (
                  <tr key={ii}>
                    <td>{channelId}</td>
                    <td>{estimatedFiringRates[ii].toFixed(2)}</td>
                    <td>{createBarElement(estimatedFiringRates[ii], maxEstimatedFiringRate)}</td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      </Expandable>
      {
        channelPowerSpectra ? (
          <Expandable title="Channel power spectra" defaultExpanded={false}>
            <ChannelPowerSpectraView
              freqs={channelPowerSpectra.freqs}
              powerSpectra={channelPowerSpectra.powerSpectra}
            />
          </Expandable>
        ) : <span>Power spectra not found</span>
      }
      <hr />
    </div>
  );
};

type ExpandableProps = {
  title: any;
  defaultExpanded: boolean;
};

export const Expandable: FunctionComponent<PropsWithChildren<ExpandableProps>> = ({ title, defaultExpanded, children }) => {
  const [expanded, setExpanded] = useState(defaultExpanded);
  return (
    <div>
      <div style={{ cursor: 'pointer' }} onClick={() => setExpanded(!expanded)}>{expanded ? '▼' : '▶'} {title}</div>
      {expanded && children}
    </div>
  );
}

type ChannelPowerSpectraViewProps = {
  freqs: number[];
  powerSpectra: number[][];
};

const ChannelPowerSpectraView: FunctionComponent<ChannelPowerSpectraViewProps> = ({ freqs, powerSpectra }) => {
  const numChannels = powerSpectra.length;

  const heatmap: number[][] = useMemo(() => {
    // log of power
    const logPowerSpectra = powerSpectra.map(row => row.map(v => Math.log10(v + 1)));
    return logPowerSpectra;
  }, [powerSpectra]);

  const data = useMemo(() => (
    [{
      x: freqs,
      y: [...new Array(powerSpectra.length).keys()],
      z: heatmap,
      type: 'heatmap' as any,
      colorscale: 'Viridis',
    }]
  ), [powerSpectra, freqs, heatmap]);

  const layout = useMemo(() => ({
    width: 800,
    height: Math.max(400, numChannels * 2),
    title: 'Channel log power spectra',
    yaxis: { title: 'Channel' },
    xaxis: { title: 'Frequency (Hz)' },
    margin: {
      t: 30, b: 40, r: 0
    },
    showlegend: false
  }), [numChannels]);

  return (
    <LazyPlotlyPlot
      data={data}
      layout={layout}
    />
  );
};

type BarGraphProps = {
  width: number;
  values: number[];
};

const BarGraph: FunctionComponent<BarGraphProps> = ({ values, width }) => {
  const data = useMemo(() => (
    [{
      x: [...new Array(values.length).keys()].map(i => (i + 1)),
      y: values,
      type: 'bar' as any,
    }]
  ), [values]);

  const layout = useMemo(() => ({
    width,
    height: 400,
    title: 'Estimated channel firing rates',
    yaxis: { title: 'Estimated firing rate (Hz)' },
    xaxis: { title: 'Channel' },
    margin: {
      t: 30, b: 40, r: 0
    },
    showlegend: false
  }), [width]);

  return (
    <LazyPlotlyPlot
      data={data}
      layout={layout}
    />
  );
};

const createBarElement = (value: number, maxValue: number) => {
  const maxPixels = 100;
  const pixels = Math.round(maxPixels * value / maxValue);
  return (
    <div style={{ width: pixels, height: 10, backgroundColor: 'blue' }}></div>
  );
}

const colorsForEstimatedFiringRates = (values: number[], maxValue: number) => {
  return values.map(value => {
    if (isNaN(value)) return 'rgb(0,0,0)'
    const frac = value / maxValue;
    const v = Math.min(255, Math.round(255 * frac));
    return `rgb(${255}, ${255 - v}, ${255 - v})`;
  });
}

export const useRemoteH5FileLindi = (url: string | undefined) => {
  const [file, setFile] = useState<RemoteH5FileLindi | null>(null);
  useEffect(() => {
    if (!url) {
      setFile(null);
      return;
    }
    let canceled = false;
    (async () => {
      setFile(null);
      const f = await getRemoteH5FileLindi(url);
      if (canceled) return;
      setFile(f);
    })();
    return () => {
      canceled = true;
    };
  }, [url]);

  return file;
};

const useEstimatedChannelFiringRatesArray = (h5: RemoteH5FileX | null) => {
  const [data, setData] = useState<number[] | null>(null)
  useEffect(() => {
      let canceled = false
      ;(async () => {
          if (!h5) return
          const ds = await h5.getDataset('estimated_channel_firing_rates')
          if (!ds) return
          if (canceled) return
          const e = await h5.getDatasetData('estimated_channel_firing_rates', {})
          if (canceled) return
          setData(Array.from(e as any as number[]))
      })()
      return () => { canceled = true }
  }, [h5])

  return data
}

const useChannelIds = (h5: RemoteH5FileX | null) => {
  const [data, setData] = useState<string[] | null>(null)
  useEffect(() => {
      let canceled = false
      ;(async () => {
          if (!h5) return
          const rootGroup = await h5.getGroup('/')
          if (!rootGroup) return
          const channelIds = rootGroup.attrs['channel_ids']
          if (canceled) return
          setData(channelIds as any as string[])
      })()
      return () => { canceled = true }
  }, [h5])
  return data
}

const useChannelPowerSpectra = (h5: RemoteH5FileX | null) => {
  const [data, setData] = useState<{
    freqs: number[],
    powerSpectra: number[][]
  } | null>(null)
  useEffect(() => {
      let canceled = false
      ;(async () => {
          if (!h5) return
          const freqDs = await h5.getDataset('channel_power_spectra/freq')
          if (!freqDs) return
          if (canceled) return
          const freqs = await h5.getDatasetData('channel_power_spectra/freq', {})
          if (canceled) return
          const powerSpectraDs = await h5.getDataset('channel_power_spectra/ps')
          if (!powerSpectraDs) return
          if (canceled) return
          const powerSpectra = await h5.getDatasetData('channel_power_spectra/ps', {})
          if (canceled) return
          setData({
            freqs: Array.from(freqs as any as number[]),
            powerSpectra: reshape2D(powerSpectra, [powerSpectraDs.shape[0], powerSpectraDs.shape[1]])
          })
      })()
      return () => { canceled = true }
  }, [h5])
  return data
}

const useDeadChannelIndices = (channelPowerSpectra?: { freqs: number[], powerSpectra: number[][] } | null) => {
  const maxima = useMemo(() => {
    if (!channelPowerSpectra) return undefined
    // skip the first few frequencies when computing maxima
    return channelPowerSpectra.powerSpectra.map(row => Math.max(...row.slice(6)))
  }, [channelPowerSpectra])
  const deadChannelIndices = useMemo(() => {
    // the dead channels are the outliers with the lowest maxima
    if (!maxima) return []
    const medianPeakPower = median(maxima)
    const robustStdDev = 1.4826 * median(maxima.map(v => Math.abs(v - medianPeakPower)))
    // this threshold is pretty arbitrary
    const threshold = medianPeakPower - 25 * robustStdDev
    return maxima.map((v, i) => (v < threshold) ? i : -1).filter(i => (i >= 0))
  }, [maxima])
  return deadChannelIndices
}

const median = (values: number[]) => {
  const sorted = values.slice().sort((a, b) => a - b)
  const n = sorted.length
  if (n % 2 === 0) {
    return (sorted[n / 2 - 1] + sorted[n / 2]) / 2
  }
  else {
    return sorted[(n - 1) / 2]
  }
}

const reshape2D = (data: any, shape: [number, number]) => {
  const rows = shape[0];
  const cols = shape[1];
  const ret = [];
  for (let i = 0; i < rows; i++) {
    const row = [];
    for (let j = 0; j < cols; j++) {
      row.push(data[i * cols + j]);
    }
    ret.push(row);
  }
  return ret;
};

export default EphysSummaryItemView;
