import React, { FunctionComponent, Suspense } from 'react'

import type { PlotParams } from 'react-plotly.js';
import ReactVisibilitySensor from 'react-visibility-sensor';
const Plot = React.lazy(() => import('react-plotly.js'));

const LazyPlotlyPlot: FunctionComponent<PlotParams> = ({ data, layout }) => {
	// It's important to only show the plot when visible because otherwise, for
	// tab Widgets, the mouse mode of the plotly plot interferes with the other
	// tabs
	return (
		<Suspense fallback={<div>Loading plotly</div>}>
			<ReactVisibilitySensor partialVisibility>
				{({isVisible}: {isVisible: boolean}) => (isVisible ? (
					<Plot
						data={data}
						layout={layout}
					/>) : (<div style={{height: layout.height, width: layout.width}}></div>)
				)}
			</ReactVisibilitySensor>
		</Suspense>
	)
}

export default LazyPlotlyPlot
