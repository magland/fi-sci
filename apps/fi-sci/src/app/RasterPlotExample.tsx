import { SetupTimeSelection } from '@fi-sci/context-time-selection';
import { RPPlotData, RasterPlotView, RasterPlotViewData } from '@fi-sci/raster-plot';
import { FunctionComponent } from 'react';

const createRandomSpikeTimes = (numPoints: number, startTime: number, endTime: number): number[] => {
  const times = [];
  for (let i = 0; i < numPoints; i++) {
    times.push(startTime + Math.random() * (endTime - startTime));
  }
  times.sort();
  return times;
};

const createExamplePlots = (): RPPlotData[] => {
  const plots: RPPlotData[] = [];
  for (let i = 0; i < 10; i++) {
    plots.push({
      unitId: i,
      spikeTimesSec: createRandomSpikeTimes(1000, 0, 100),
    });
  }
  return plots;
};

const exampleData: RasterPlotViewData = {
  type: 'RasterPlot',
  startTimeSec: 0,
  endTimeSec: 100,
  plots: createExamplePlots(),
};

type Props = {
  width: number;
};

const RasterPlotExample: FunctionComponent<Props> = ({ width }) => {
  return (
    <SetupTimeSelection>
      <RasterPlotView data={exampleData} width={width} height={400} />
    </SetupTimeSelection>
  );
};

export default RasterPlotExample;
