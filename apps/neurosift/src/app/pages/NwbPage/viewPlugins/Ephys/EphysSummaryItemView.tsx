import { RemoteH5FileLindi, RemoteH5FileX, getRemoteH5FileLindi } from '@fi-sci/remote-h5-file';
import { FunctionComponent, useEffect, useMemo, useState } from 'react';
import { PairioJob, PairioJobDefinition, PairioJobRequiredResources } from '../../../../pairio/types';
import { useNwbFile } from '../../NwbFileContext';
import { getJobOutputUrl, removeLeadingSlash } from '../CEBRA/PairioHelpers';
import PairioItemView from '../CEBRA/PairioItemView';
import LazyPlotlyPlot from '../CEBRA/LazyPlotlyPlot';
import ElectrodeGeometryView from './ElectrodeGeometryView';

type Props = {
  width: number;
  height: number;
  path: string;
  condensed?: boolean;
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

const EphysSummaryItemView: FunctionComponent<Props> = ({ width, height, path }) => {
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
      OutputComponent={UnitsSummaryJobOutputWidget}
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

const UnitsSummaryJobOutputWidget: FunctionComponent<{ job: PairioJob, width: number, nwbFile: RemoteH5FileX }> = ({ job, width, nwbFile }) => {
  const unitsSummaryOutputUrl = getJobOutputUrl(job, 'output');
  const outputFile = useRemoteH5FileLindi(unitsSummaryOutputUrl);
  const estimatedFiringRates = useEstimatedChannelFiringRatesArray(outputFile);
  const channelIds = useChannelIds(outputFile);

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
      <h3>Estimated channel firing rates</h3>
      <BarGraph width={Math.min(800, width)} values={estimatedFiringRates} />
      {outputFile && nwbFile && <ElectrodeGeometryView
        width={Math.max(width - 100, 200)}
        height={250}
        nwbFile={nwbFile}
        colors={colors}
      />}
      {
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
      }
    </div>
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
    const hue = 240 * (1 - value / maxValue);
    return `hsl(${hue}, 100%, 50%)`;
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

export default EphysSummaryItemView;
