import React, { FunctionComponent, Suspense } from 'react';

import type { PlotParams } from 'react-plotly.js';
import ReactVisibilitySensor from 'react-visibility-sensor';
const Plot = React.lazy(() => import('react-plotly.js'));

type Props = PlotParams

export const LazyPlotlyPlotContext = React.createContext<{
	showPlotEvenWhenNotVisible?: boolean;
}>({});

const LazyPlotlyPlot: FunctionComponent<Props> = ({ data, layout }) => {
  // It's important to only show the plot when visible because otherwise, for
  // tab Widgets, the mouse mode of the plotly plot interferes with the other
  // tabs
  const { showPlotEvenWhenNotVisible } = React.useContext(LazyPlotlyPlotContext);
  return (
    <ReactVisibilitySensor partialVisibility>
      {({ isVisible }: { isVisible: boolean }) =>
        isVisible || (!showPlotEvenWhenNotVisible) ? (
          <Suspense fallback={<div>Loading plotly</div>}>
            <Plot data={data} layout={layout} />
          </Suspense>
        ) : (
          <div style={{ height: layout.height, width: layout.width }}></div>
        )
      }
    </ReactVisibilitySensor>
  );
};

export default LazyPlotlyPlot;
