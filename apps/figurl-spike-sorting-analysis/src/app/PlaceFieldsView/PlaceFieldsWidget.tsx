import { FunctionComponent, useMemo } from 'react';
import { PlaceField } from './PlaceFieldsViewData';
import { VerticalScrollView } from '../component-vertical-scroll-view';
import { PGPlot, PlotGrid } from '../component-plot-grid';
import { getUnitColor, useSelectedUnitIds } from '@fi-sci/context-unit-selection';
import PlaceFieldPlot, { PlaceFieldPlotProps } from './PlaceFieldPlot';

type PlaceFieldsWidgetProps = {
  width: number;
  height: number;
  placeFields: PlaceField[];
};

const PlaceFieldsWidget: FunctionComponent<PlaceFieldsWidgetProps> = ({ width, height, placeFields }) => {
  const { selectedUnitIds, orderedUnitIds, plotClickHandlerGenerator } = useSelectedUnitIds();

  const onlyShowSelected = false;
  const plotBoxScaleFactor = 3;

  const bounds: { xmin: number; xmax: number; ymin: number; ymax: number } = useMemo(() => {
    const allXs: number[] = [];
    const allYs: number[] = [];
    for (const pf of placeFields) {
      for (const x of pf.x) allXs.push(x);
      for (const y of pf.y) allYs.push(y);
    }
    const xmin = min(allXs);
    const xmax = max(allXs);
    const ymin = min(allYs);
    const ymax = max(allYs);
    return { xmin, xmax, ymin, ymax };
  }, [placeFields]);

  const plots: PGPlot[] = useMemo(
    () =>
      placeFields
        .filter((a) => (onlyShowSelected ? selectedUnitIds.has(a.unitId) : true))
        .map((pf) => {
          const props: PlaceFieldPlotProps = {
            color: getUnitColor(pf.unitId),
            width: 120 * plotBoxScaleFactor,
            height: 120 * plotBoxScaleFactor,
            placeField: pf,
            bounds,
          };
          return {
            unitId: pf.unitId,
            key: pf.unitId,
            label: `Unit ${pf.unitId}`,
            labelColor: getUnitColor(pf.unitId),
            clickHandler: !onlyShowSelected ? plotClickHandlerGenerator(pf.unitId) : undefined,
            props,
          };
        }),
    [placeFields, plotClickHandlerGenerator, onlyShowSelected, selectedUnitIds, plotBoxScaleFactor, bounds]
  );

  const plots2: PGPlot[] = useMemo(() => {
    if (orderedUnitIds) {
      return orderedUnitIds.map((unitId) => plots.filter((a) => a.unitId === unitId)[0]).filter((p) => p !== undefined);
    } else return plots;
  }, [plots, orderedUnitIds]);

  return (
    <VerticalScrollView width={width} height={height}>
      <PlotGrid plots={plots2} plotComponent={PlaceFieldPlot} selectedPlotKeys={selectedUnitIds} />
    </VerticalScrollView>
  );
};

const min = (x: number[]) => {
  if (x.length === 0) return 0;
  let val = x[0];
  for (let i = 1; i < x.length; i++) {
    if (x[i] < val) val = x[i];
  }
  return val;
};

const max = (x: number[]) => {
  if (x.length === 0) return 0;
  let val = x[0];
  for (let i = 1; i < x.length; i++) {
    if (x[i] > val) val = x[i];
  }
  return val;
};

export default PlaceFieldsWidget;
