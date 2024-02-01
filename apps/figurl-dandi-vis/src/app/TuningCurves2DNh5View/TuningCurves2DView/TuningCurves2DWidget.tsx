import { FunctionComponent, useMemo } from 'react';
import { TuningCurve2D } from './TuningCurves2DViewData';
import { VerticalScrollView } from '@fi-sci/misc';
import { PGPlot, PlotGrid } from '@fi-sci/plot-grid';
import { getUnitColor, useSelectedUnitIds } from '@fi-sci/context-unit-selection';
import TuningCurve2DPlot, { TuningCurve2DPlotProps } from './TuningCurve2DPlot';

type TuningCurves2DWidgetProps = {
  width: number;
  height: number;
  tuningCurves2D: TuningCurve2D[];
  xBinPositions: number[];
  yBinPositions: number[];
};

const TuningCurves2DWidget: FunctionComponent<TuningCurves2DWidgetProps> = ({ width, height, tuningCurves2D, xBinPositions, yBinPositions }) => {
  const { selectedUnitIds, orderedUnitIds, plotClickHandlerGenerator } = useSelectedUnitIds();

  const onlyShowSelected = false;
  const plotBoxScaleFactor = 1.5;

  const plots: PGPlot[] = useMemo(
    () =>
      tuningCurves2D
        .filter((a) => (onlyShowSelected ? selectedUnitIds.has(a.unit_id) : true))
        .map((pf) => {
          const props: TuningCurve2DPlotProps = {
            width: 120 * plotBoxScaleFactor,
            height: 120 * plotBoxScaleFactor,
            tuningCurve2D: pf,
            xBinPositions,
            yBinPositions
          };
          return {
            unitId: pf.unit_id,
            key: pf.unit_id,
            label: `Unit ${pf.unit_id}`,
            labelColor: getUnitColor(pf.unit_id),
            clickHandler: !onlyShowSelected ? plotClickHandlerGenerator(pf.unit_id) : undefined,
            props,
          };
        }),
    [tuningCurves2D, onlyShowSelected, selectedUnitIds, plotClickHandlerGenerator, xBinPositions, yBinPositions]
  );

  const plots2: PGPlot[] = useMemo(() => {
    if (orderedUnitIds) {
      return orderedUnitIds.map((unitId) => plots.filter((a) => a.unitId === unitId)[0]).filter((p) => p !== undefined);
    } else return plots;
  }, [plots, orderedUnitIds]);

  return (
    <VerticalScrollView width={width} height={height}>
      <PlotGrid plots={plots2} plotComponent={TuningCurve2DPlot} selectedPlotKeys={selectedUnitIds} />
    </VerticalScrollView>
  );
};

export default TuningCurves2DWidget;
