/* eslint-disable @typescript-eslint/no-explicit-any */
import { RemoteNh5Group } from "nh5";
import { FunctionComponent, useEffect, useState } from "react";
import RasterPlotView from "./RasterPlotView/RasterPlotView";
import { Canceler } from "nh5/dist/RemoteNh5FileClient";
import { RemoteNh5FileClient } from "../nh5";

// https://figurl.org/f?v=http://localhost:3000&d=%7B%22type%22:%22spike_trains_nh5%22,%22nh5_file%22:%22https://neurosift.org/dendro-outputs/a7852166.e49b352a/output%22%7D&label=sub-10884/sub-10884_ses-03080402_behavior+ecephys.nwb/spike_trains.nh5

type SpikeTrainsViewProps = {
  nh5FileClient: RemoteNh5FileClient
  width: number;
  height: number;
};

const SpikeTrainsView: FunctionComponent<SpikeTrainsViewProps> = ({
  nh5FileClient,
  width,
  height,
}) => {
  const client = useSpikeTrainsNh5Client(nh5FileClient);
  if (!client) return <div>Loading...</div>;
  console.log('client', client);
  console.log('chunkStartTimes', client.chunkStartTimes);
  console.log('chunkEndTimes', client.chunkEndTimes);
  console.log('unitIds', client.unitIds);
  console.log('samplingFrequency', client.samplingFrequency);
  console.log('totalDurationSec', client.totalDurationSec);
  console.log('totalNumSpikes', client.totalNumSpikes);
  return (
    <RasterPlotView
      client={client}
      width={width}
      height={height}
    />
  )
};

export class SpikeTrainsNh5Client {
  constructor(private nh5Client: RemoteNh5FileClient, private rootGroup: RemoteNh5Group) {
  }
  static async create(nh5Client: RemoteNh5FileClient) {
    const rootGroup = await nh5Client.getGroup("/");
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
  get samplingFrequency() {
    return this.rootGroup.attrs.sampling_frequency;
  }
  get totalDurationSec() {
    return this.rootGroup.attrs.total_duration_sec;
  }
  get totalNumSpikes() {
    return this.rootGroup.attrs.total_num_spikes;
  }
  async getChunkSpikeTimes(chunkIndex: number, o: {canceler?: Canceler}) {
    const k = `/chunk_${chunkIndex}/spike_times`;
    const ds = await this.nh5Client.getDataset(k);
    if (!ds) throw Error(`Unable to get dataset for chunk ${chunkIndex}`);
    const dd = await this.nh5Client.getDatasetData(k, {canceler: o.canceler});
    if (!dd) throw Error(`Unable to gspike_trains_nh5et dataset data for chunk ${chunkIndex}`);
    return dd as any as number[]
  }
  async getChunkSpikeTimesIndex(chunkIndex: number) {
    const k = `/chunk_${chunkIndex}/spike_times_index`;
    const ds = await this.nh5Client.getDataset(k);
    if (!ds) throw Error(`Unable to get dataset for chunk ${chunkIndex}`);
    const dd = await this.nh5Client.getDatasetData(k, {});
    if (!dd) throw Error(`Unable to get dataset data for chunk ${chunkIndex}`);
    return dd as any as number[]
  }
}

const useSpikeTrainsNh5Client = (nh5FileClient: RemoteNh5FileClient) => {
  const [client, setClient] = useState<SpikeTrainsNh5Client | undefined>()
  useEffect(() => {
    if (!nh5FileClient) return;
    (async () => {
      const c = await SpikeTrainsNh5Client.create(nh5FileClient);
      setClient(c);
    })();
  }, [nh5FileClient]);
  return client;
}



export default SpikeTrainsView;