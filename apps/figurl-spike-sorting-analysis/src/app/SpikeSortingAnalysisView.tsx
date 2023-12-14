import { FunctionComponent, useEffect, useMemo, useState } from 'react';

import { getFileDataUrl } from '@fi-sci/figurl-interface';
import { SpikeSortingAnalysisData } from './SpikeSortingAnalysisData';
// import { RemoteH5File, getRemoteH5File } from '@fi-sci/remote-h5-file';
import SpikeSortingAnalysisClient from './SpikeSortingAnalysisClient';
import { UnitsTableView } from './view-units-table';
import { Splitter } from '@fi-sci/splitter';
import { AutocorrelogramsView } from './view-autocorrelograms';
import { AverageWaveformsView } from './view-average-waveforms';
import { RemoteNH5FileClient, getRemoteNH5File } from './nh5';

type SpikeSortingAnalysisViewProps = {
  width: number;
  height: number;
  data: SpikeSortingAnalysisData;
};

// const useH5File = (url: string | null) => {
//   const [h5File, setH5File] = useState<RemoteH5File>();

//   useEffect(() => {
//     setH5File(undefined);
//     if (!url) return;
//     getRemoteH5File(url, '')
//       .then((h5File: RemoteH5File) => {
//         setH5File(h5File);
//       })
//       .catch((err: unknown) => {
//         console.error(err);
//       });
//   }, [url]);

//   return h5File;
// };

const useNH5File = (url: string | null) => {
  const [nh5File, setNH5File] = useState<RemoteNH5FileClient>();
  useEffect(() => {
    setNH5File(undefined);
    if (!url) return;
    getRemoteNH5File(url)
      .then((nh5File: RemoteNH5FileClient) => {
        setNH5File(nh5File);
      })
      .catch((err: unknown) => {
        console.error(err);
      });
  }, [url]);
  return nh5File;
}

const SpikeSortingAnalysisView: FunctionComponent<
  SpikeSortingAnalysisViewProps
> = ({ width, height, data }) => {
  const [analysisFileUrl, setAnalysisFileUrl] = useState<string | null>(null);
  useEffect(() => {
    getFileDataUrl(data.analysisFile)
      .then((url: string) => {
        setAnalysisFileUrl(url);
      })
      .catch((err: unknown) => {
        console.error(err);
      });
  }, [data]);

  const nh5File = useNH5File(analysisFileUrl);

  const [client, setClient] = useState<SpikeSortingAnalysisClient | null>(null);
  useEffect(() => {
    if (!nh5File) return;
    SpikeSortingAnalysisClient.create(nh5File).then((client) => {
      setClient(client);
    });
  }, [nh5File]);

  if (!client) return <div>Loading...</div>;

  return <ViewChild width={width} height={height} client={client} />;
};

type ViewChildProps = {
  width: number;
  height: number;
  client: SpikeSortingAnalysisClient;
};

const ViewChild: FunctionComponent<ViewChildProps> = ({
  width,
  height,
  client,
}) => {
  const unitsTableViewData = useMemo(() => {
    const unitIds: (string | number)[] = client.unitIds;
    const columns: UTColumn[] = [
    ];
    const rows = unitIds.map((unitId) => ({
      unitId,
      values: {
      },
    }));
    return {
      type: 'UnitsTable',
      columns,
      rows,
    } as {
        type: 'UnitsTable';
        columns: UTColumn[];
        rows: UTRow[];
    }
  }, [client.unitIds]);
  console.log('--- c', client.averageWaveformsViewData)
  return (
    <Splitter
      width={width}
      height={height}
      initialPosition={100}
    >
      <UnitsTableView width={0} height={0} data={unitsTableViewData} />
      <Splitter
        width={0}
        height={0}
        direction='vertical'
        initialPosition={height / 2}
      >
        {
          client.autocorrelogramsViewData ? (
            <AutocorrelogramsView width={0} height={0} data={client.autocorrelogramsViewData} />
          ) : <span />
        }
        {
          client.averageWaveformsViewData ? (
            <AverageWaveformsView width={0} height={0} data={client.averageWaveformsViewData} />
          ) : <span />
        }
      </Splitter>
    </Splitter>
  );
};

type UTColumn = {
  key: string;
  label: string;
  dtype: string;
};

type UTRow = {
  unitId: number | string;
  values: { [key: string]: unknown };
};

export default SpikeSortingAnalysisView;
