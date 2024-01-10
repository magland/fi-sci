import { FunctionComponent, useMemo } from 'react';
import { PlaceFieldsViewData } from './PlaceFieldsViewData';
import { Splitter } from '@fi-sci/splitter';
import { UnitsTableView } from '../view-units-table';
import PlaceFieldsWidget from './PlaceFieldsWidget';

type PlaceFieldsViewProps = {
  width: number;
  height: number;
  data: PlaceFieldsViewData;
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

const PlaceFieldsView: FunctionComponent<PlaceFieldsViewProps> = ({ width, height, data }) => {
  const unitsTableViewData = useMemo(() => {
    const unitIds: (string | number)[] = data.placeFields.map((pf) => pf.unitId);
    const columns: UTColumn[] = [];
    const rows = unitIds.map((unitId) => ({
      unitId,
      values: {},
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
  }, [data.placeFields]);
  return (
    <Splitter width={width} height={height} initialPosition={200}>
      <UnitsTableView width={0} height={0} data={unitsTableViewData} />
      <PlaceFieldsWidget width={0} height={0} placeFields={data.placeFields} />
    </Splitter>
  );
};

export default PlaceFieldsView;
