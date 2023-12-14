import { FunctionComponent, useEffect, useMemo, useState } from 'react';
import SpikeAmplitudesClient from './SpikeAmplitudesClient';
import { useSelectedUnitIds } from '@fi-sci/context-unit-selection';
import SpikeAmplitudesWidget, { SpikeAmplitudesData } from './SpikeAmplitudesWidget/SpikeAmplitudesWidget';

type SpikeAmplitudesViewProps = {
  width: number;
  height: number;
  client: SpikeAmplitudesClient;
};

const SpikeAmplitudesView: FunctionComponent<SpikeAmplitudesViewProps> = ({ width, height, client }) => {
  const { selectedUnitIds, orderedUnitIds } = useSelectedUnitIds();

  const [spikeAmplitudesData, setSpikeAmplitudesData] = useState<SpikeAmplitudesData>();

  const unitIds = useMemo(() => {
    return orderedUnitIds.filter((uid) => selectedUnitIds.has(uid));
  }, [selectedUnitIds, orderedUnitIds]);

  useEffect(() => {
    let canceled = false;
    (async () => {
      const x: SpikeAmplitudesData = {
        units: [],
      };
      for (const unitId of unitIds) {
        const { times, amplitudes } = await client.getUnitSpikeAmplitudes(unitId);
        if (canceled) return;
        x.units.push({
          unitId,
          times,
          amplitudes,
        });
        setSpikeAmplitudesData({
          units: [...x.units], // important to make a copy
        });
      }
    })();
    return () => {
      canceled = true;
    };
  }, [client, unitIds]);
  return <SpikeAmplitudesWidget width={width} height={height} data={spikeAmplitudesData} />;
};

export default SpikeAmplitudesView;
