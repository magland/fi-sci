/* eslint-disable @typescript-eslint/no-explicit-any */
import { FunctionComponent, useEffect, useState } from 'react';
import EcephysSummaryView, { BinnedArrayClient, EcephysSummaryData } from './EcephysSummaryView/EcephysSummaryView';
import { RemoteNh5FileClient } from '../nh5';

type EcephysSummaryNh5ViewProps = {
  width: number;
  height: number;
  nh5FileClient: RemoteNh5FileClient
};

const EcephysSummaryNh5View: FunctionComponent<EcephysSummaryNh5ViewProps> = ({ width, height, nh5FileClient: client }) => {
  const [ecephysSummaryData, setEcphysSummaryData] = useState<EcephysSummaryData>()
  useEffect(() => {
    let canceled = false
    setEcphysSummaryData(undefined)
    if (!client) return
    ; (async () => {
      const rootGroup = await client.getGroup('/')
      if (!rootGroup) throw new Error('Unable to get root group')
      const type = rootGroup.attrs['type']
      if (type !== 'ecephys_summary') throw new Error(`Unexpected type: ${type}`)
      const formatVersion = rootGroup.attrs['format_version']
      if (formatVersion !== 1) throw new Error(`Unexpected format version: ${formatVersion}`)
      const numFrames = rootGroup.attrs['num_frames']
      const samplingFrequency = rootGroup.attrs['sampling_frequency']
      const numChannels = rootGroup.attrs['num_channels']
      const channelIds = rootGroup.attrs['channel_ids']
      const channelLocationsDs = await client.getDataset('/channel_locations')
      if (!channelLocationsDs) throw new Error('Unable to get channel_locations')
      const channelLocationsData = await client.getDatasetData('/channel_locations', {})
      if (!channelLocationsData) throw new Error('Unable to get channel_locations data')
      const channelLocations = create2DArray(channelLocationsData, channelLocationsDs.shape)
      const minDs = await client.getDataset('/binned_arrays/min')
      if (!minDs) throw new Error('Unable to get /binned_arrays/min')
      const minData = await client.getDatasetData('/binned_arrays/min', {})
      if (!minData) throw new Error('Unable to get /binned_arrays/min data')
      const min = {
        binSizeSec: minDs.attrs['bin_size_sec'],
        binSizeFrames: minDs.attrs['bin_size_frames'],
        numBins: minDs.attrs['num_bins'],
        data: create2DArray(minData, minDs.shape)
      }
      const array = new BinnedArrayClient(
        client,
        '/binned_arrays/min',
        '/binned_arrays/max',
        min.numBins,
        min.binSizeSec,
        min.binSizeFrames,
        numChannels
      )
      const arrayDs5 = new BinnedArrayClient(
        client,
        '/binned_arrays/min_ds5',
        '/binned_arrays/max_ds5',
        min.numBins / 5,
        min.binSizeSec * 5,
        min.binSizeFrames * 5,
        numChannels
      )
      const arrayDs25 = new BinnedArrayClient(
        client,
        '/binned_arrays/min_ds25',
        '/binned_arrays/max_ds25',
        min.numBins / 25,
        min.binSizeSec * 25,
        min.binSizeFrames * 25,
        numChannels
      )
      if (canceled) return
      setEcphysSummaryData({
        numFrames,
        samplingFrequency,
        numChannels,
        channelIds,
        channelLocations,
        array,
        arrayDs5,
        arrayDs25
      })
    })()
    return () => {canceled = true}
  }, [client, setEcphysSummaryData])

  if (!client) {
    return <div>Loading NH5 file...</div>
  }

  if (!ecephysSummaryData) {
    return <div>Loading view data...</div>
  }

  return (
    <EcephysSummaryView
      width={width}
      height={height}
      data={ecephysSummaryData}
    />
  )
};

const create2DArray = (data: any, shape: number[]) => {
  const result: number[][] = []
  let offset = 0
  for (let i = 0; i < shape[0]; i++) {
    const row: number[] = []
    for (let j = 0; j < shape[1]; j++) {
      row.push(data[offset])
      offset++
    }
    result.push(row)
  }
  return result
}

export default EcephysSummaryNh5View;
