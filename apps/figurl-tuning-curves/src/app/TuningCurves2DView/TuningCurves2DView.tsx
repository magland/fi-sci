import { FunctionComponent, useMemo } from 'react';
import { TuningCurves2DViewData } from './TuningCurves2DViewData';
import { Splitter } from '@fi-sci/splitter';
import TuningCurves2DWidget from './TuningCurves2DWidget';
import { UnitsTableView } from '@fi-sci/units-table';

type TuningCurves2DViewProps = {
  width: number;
  height: number;
  data: TuningCurves2DViewData;
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

const TuningCurves2DView: FunctionComponent<TuningCurves2DViewProps> = ({ width, height, data }) => {
  const unitsTableViewData = useMemo(() => {
    const unitIds: (string | number)[] = data.tuning_curves_2d.map((pf) => pf.unit_id);
    const columns: UTColumn[] = [{
      key: 'numSpikes',
      label: '# spikes',
      dtype: 'number'
    }];
    const rows = unitIds.map((unitId) => ({
      unitId,
      values: {
        numSpikes: data.tuning_curves_2d.filter(pf => pf.unit_id === unitId)[0].num_spikes
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
  }, [data.tuning_curves_2d]);
  return (
    <Splitter width={width} height={height} initialPosition={250}>
      <UnitsTableView width={0} height={0} data={unitsTableViewData} />
      <TuningCurves2DWidget width={0} height={0} tuningCurves2D={data.tuning_curves_2d} xBinPositions={data.x_bin_positions} yBinPositions={data.y_bin_positions} />
    </Splitter>
  );
};

export default TuningCurves2DView;
