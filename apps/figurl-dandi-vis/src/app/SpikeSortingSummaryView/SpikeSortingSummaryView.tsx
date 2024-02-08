/* eslint-disable @typescript-eslint/no-explicit-any */
import { Splitter } from '@fi-sci/splitter';
import { RemoteNh5FileClient, RemoteNh5Group } from 'nh5';
import { Canceler, DatasetDataType } from 'nh5/dist/RemoteNh5FileClient';
import { FunctionComponent, useEffect, useMemo, useState } from 'react';
import { AutocorrelogramsView, AutocorrelogramsViewData } from './AutocorrelogramsView';
import RasterPlotView from './RasterPlotView/RasterPlotView';
import { UnitsTableView } from '@fi-sci/units-table';

type SpikeSortingSummaryViewProps = {
  nh5FileClient: RemoteNh5FileClient;
  width: number;
  height: number;
};

const SpikeSortingSummaryView: FunctionComponent<SpikeSortingSummaryViewProps> = ({ nh5FileClient, width, height }) => {
  const client = useSpikeSortingSummaryNh5Client(nh5FileClient);
  const spikeTrainsClient = client?.spikeTrainsClient;
  const autocorrelogramsClient = client?.autocorrelogramsClient;
  const autocorrelogramsViewData: AutocorrelogramsViewData | undefined = useMemo(() => {
    if (!autocorrelogramsClient) return undefined;
    return {
      type: 'Autocorrelograms',
      autocorrelograms: autocorrelogramsClient.unitIds.map((unitId) => {
        const ac = autocorrelogramsClient.getAutocorrelogram(unitId);
        return {
          unitId,
          binEdgesSec: ac.binEdgesSec,
          binCounts: ac.binCounts,
        };
      }),
    };
  }, [autocorrelogramsClient]);
  if (!spikeTrainsClient) return <div>Loading...</div>;
  if (!autocorrelogramsClient) return <div>Loading...</div>;
  console.log('client', client);
  console.log('chunkStartTimes', spikeTrainsClient.chunkStartTimes);
  console.log('chunkEndTimes', spikeTrainsClient.chunkEndTimes);
  console.log('unitIds', spikeTrainsClient.unitIds);
  console.log('samplingFrequency', spikeTrainsClient.samplingFrequency);
  console.log('totalDurationSec', spikeTrainsClient.totalDurationSec);
  console.log('totalNumSpikes', spikeTrainsClient.totalNumSpikes);
  const W = Math.min(300, width / 4);
  return (
    <Splitter width={width} height={height} initialPosition={W}>
      {autocorrelogramsViewData ? (
        <AutocorrelogramsView data={autocorrelogramsViewData} width={0} height={0} />
      ) : (
        <div>...</div>
      )}
      <RightPanel spikeTrainsClient={spikeTrainsClient} width={0} height={0} />
    </Splitter>
  );
};

type RightPanelProps = {
  spikeTrainsClient: SpikeTrainsNh5Client;
  width: number;
  height: number;
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

const RightPanel: FunctionComponent<RightPanelProps> = ({ spikeTrainsClient, width, height }) => {
  const H1 = Math.min(height - 200, height * 3 / 4)
  const unitsTableViewData = useMemo(() => {
    const unitIds = spikeTrainsClient.unitIds;
    const numSpikes = unitIds.map((unitId, i) => {
      return spikeTrainsClient.spikeCounts ? spikeTrainsClient.spikeCounts[i] : undefined;
    }, [spikeTrainsClient.spikeCounts]);
    const columns: UTColumn[] = [{
      key: 'numSpikes',
      label: '# spikes',
      dtype: 'number'
    }];
    const rows = unitIds.map((unitId, i) => ({
      unitId,
      values: {
        numSpikes: numSpikes[i]
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
    };
  }, [spikeTrainsClient.unitIds, spikeTrainsClient.spikeCounts]);
  return (
    <Splitter
      direction='vertical'
      width={width}
      height={height}
      initialPosition={H1}
      >
        <RasterPlotView client={spikeTrainsClient} width={0} height={0} />
        <UnitsTableView
          data={unitsTableViewData}
          width={0}
          height={0}
        />
      </Splitter>
  )
};

export class SpikeSortingSummaryNh5Client {
  constructor(
    public spikeTrainsClient: SpikeTrainsNh5Client,
    public autocorrelogramsClient: AutocorrelgramsNh5Client
  ) {}
  static async create(nh5Client: RemoteNh5FileClient) {
    const spikeTrainsClient = await SpikeTrainsNh5Client.create(nh5Client);
    const autocorrelogramsClient = await AutocorrelgramsNh5Client.create(nh5Client);
    return new SpikeSortingSummaryNh5Client(spikeTrainsClient, autocorrelogramsClient);
  }
}

export class SpikeTrainsNh5Client {
  constructor(private nh5Client: RemoteNh5FileClient, private rootGroup: RemoteNh5Group) {}
  static async create(nh5Client: RemoteNh5FileClient) {
    const rootGroup = await nh5Client.getGroup('/spike_trains');
    if (!rootGroup) throw Error('Unable to get root group');
    return new SpikeTrainsNh5Client(nh5Client, rootGroup);
  }
  get chunkStartTimes() {
    return this.rootGroup.attrs.chunk_start_times;
  }
  get chunkEndTimes() {
    return this.rootGroup.attrs.chunk_end_times;
  }
  get unitIds(): (number | string)[] {
    return this.rootGroup.attrs.unit_ids;
  }
  get spikeCounts() : number[] | undefined {
    return this.rootGroup.attrs.spike_counts;
  }
  get samplingFrequency() {
    return this.rootGroup.attrs.sampling_frequency;
  }
  get totalDurationSec() {
    return this.rootGroup.attrs.total_duration_sec;
  }
  get totalNumSpikes() {
    return this.rootGroup.attrs.total_num_spikes;
  }
  async getChunkSpikeTimes(chunkIndex: number, o: { canceler?: Canceler }) {
    const k = `/spike_trains/chunk_${chunkIndex}/spike_times`;
    const ds = await this.nh5Client.getDataset(k);
    if (!ds) throw Error(`Unable to get dataset for chunk ${chunkIndex}`);
    const dd = await this.nh5Client.getDatasetData(k, { canceler: o.canceler });
    if (!dd) throw Error(`Unable to get spike_trains_nh5et dataset data for chunk ${chunkIndex}`);
    return dd as any as number[];
  }
  async getChunkSpikeTimesIndex(chunkIndex: number) {
    const k = `/spike_trains/chunk_${chunkIndex}/spike_times_index`;
    const ds = await this.nh5Client.getDataset(k);
    if (!ds) throw Error(`Unable to get dataset for chunk ${chunkIndex}`);
    const dd = await this.nh5Client.getDatasetData(k, {});
    if (!dd) throw Error(`Unable to get dataset data for chunk ${chunkIndex}`);
    return dd as any as number[];
  }
}

export class AutocorrelgramsNh5Client {
  constructor(
    private nh5Client: RemoteNh5FileClient,
    private rootGroup: RemoteNh5Group,
    private binEdgesSec: number[],
    private binCounts: number[][]
  ) {}
  static async create(nh5Client: RemoteNh5FileClient) {
    const rootGroup = await nh5Client.getGroup('/autocorrelograms');
    if (!rootGroup) throw Error('Unable to get root group');
    const binEdgesSecDataset = await nh5Client.getDataset(`/autocorrelograms/bin_edges_sec`);
    if (!binEdgesSecDataset) throw Error('Unable to get bin_edges_sec dataset');
    const binEdgesSec = await nh5Client.getDatasetData(`/autocorrelograms/bin_edges_sec`, {});
    if (!binEdgesSec) throw Error('Unable to get bin_edges_sec dataset data');
    const binCountsDataset = await nh5Client.getDataset(`/autocorrelograms/bin_counts`);
    if (!binCountsDataset) throw Error('Unable to get bin_counts dataset');
    const binCountsData = await nh5Client.getDatasetData(`/autocorrelograms/bin_counts`, {});
    if (!binCountsData) throw Error('Unable to get bin_counts dataset data');
    const binCounts: number[][] = make2DArray(binCountsData, binCountsDataset.shape);
    return new AutocorrelgramsNh5Client(nh5Client, rootGroup, binEdgesSec as any as number[], binCounts);
  }
  get unitIds(): (number | string)[] {
    return this.rootGroup.attrs.unit_ids;
  }
  getAutocorrelogram(unitId: number | string) {
    const unitIndex = this.unitIds.indexOf(unitId);
    if (unitIndex < 0) throw Error(`Unit not found: ${unitId}`);
    return {
      binEdgesSec: this.binEdgesSec,
      binCounts: this.binCounts[unitIndex],
    };
  }
}

const useSpikeSortingSummaryNh5Client = (nh5FileClient: RemoteNh5FileClient) => {
  const [client, setClient] = useState<SpikeSortingSummaryNh5Client | undefined>();
  useEffect(() => {
    if (!nh5FileClient) return;
    (async () => {
      const c = await SpikeSortingSummaryNh5Client.create(nh5FileClient);
      setClient(c);
    })();
  }, [nh5FileClient]);
  return client;
};

const make2DArray = (data: DatasetDataType, shape: number[]) => {
  const ret: number[][] = [];
  let i = 0;
  for (let r = 0; r < shape[0]; r++) {
    const row: number[] = [];
    for (let c = 0; c < shape[1]; c++) {
      row.push(data[i]);
      i++;
    }
    ret.push(row);
  }
  return ret;
};

export default SpikeSortingSummaryView;
