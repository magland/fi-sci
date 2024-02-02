/* eslint-disable @typescript-eslint/no-explicit-any */
import { FunctionComponent, useEffect, useState } from 'react';
import TuningCurves2DView from './TuningCurves2DView/TuningCurves2DView';
import { TuningCurve2D, TuningCurves2DViewData } from './TuningCurves2DView/TuningCurves2DViewData';
import { RemoteNh5FileClient } from 'nh5';

type TuningCurves2DNh5ViewProps = {
  width: number;
  height: number;
  nh5FileClient: RemoteNh5FileClient
};

const TuningCurves2DNh5View: FunctionComponent<TuningCurves2DNh5ViewProps> = ({ width, height, nh5FileClient: client }) => {
  const [viewData, setViewData] = useState<TuningCurves2DViewData | undefined>(undefined)
  useEffect(() => {
    let canceled = false
    setViewData(undefined)
    if (!client) return
    ; (async () => {
      const rootGroup = await client.getGroup('/')
      ;(window as any).rootGroup = rootGroup
      if (!rootGroup) throw Error('Unable to load root group')
      const unit_ids = rootGroup.attrs['unit_ids']
      if (!unit_ids) throw Error('Unable to load unit_ids')
      const x_bin_positions = await client.getDatasetData('/x_bin_positions', {})
      const y_bin_positions = await client.getDatasetData('/y_bin_positions', {})
      const rate_maps_ds = await client.getDataset('/rate_maps')
      const rate_maps = await client.getDatasetData('/rate_maps', {})

      if (!x_bin_positions) throw Error('Unable to load x_bin_positions')
      if (!y_bin_positions) throw Error('Unable to load y_bin_positions')
      if (!rate_maps_ds) throw Error('Unable to load rate_maps_ds')
      if (!rate_maps) throw Error('Unable to load rate_maps')

      const tuning_curves_2d: TuningCurve2D[] = []
      for (let i = 0; i < rate_maps_ds.shape[0]; i++) {
        const N1 = rate_maps_ds.shape[1]
        const N2 = rate_maps_ds.shape[2]
        const values: number[][] = [] // N1 x N2
        for (let j = 0; j < N1; j++) {
          const row: number[] = []
          for (let k = 0; k < N2; k++) {
            row.push(rate_maps[i * N1 * N2 + j * N2 + k])
          }
          values.push(row)
        }
        tuning_curves_2d.push({
          unit_id: unit_ids[i],
          values,
          num_spikes: 0
        })
      }
      if (canceled) return
      setViewData({
        type: 'tuning_curves_2d',
        tuning_curves_2d,
        x_bin_positions: x_bin_positions as any as number[],
        y_bin_positions: y_bin_positions as any as number[]
      })
    })()
    return () => {canceled = true}
  }, [client, setViewData])

  if (!client) {
    return <div>Loading NH5 file...</div>
  }

  if (!viewData) {
    return <div>Loading view data...</div>
  }

  return (
    <TuningCurves2DView width={width} height={height} data={viewData!} />
  )
};

export default TuningCurves2DNh5View;
