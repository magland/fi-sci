import { useTimeSelection } from '@fi-sci/context-time-selection';
import { getUnitColor, useSelectedUnitIds } from '@fi-sci/context-unit-selection';
import { TimeScrollView, useTimeScrollView } from '@fi-sci/time-scroll-view';
import { FunctionComponent, useCallback, useEffect, useMemo, useState } from 'react';
import { SpikeTrainsNh5Client } from '../SpikeTrainsView';
import { Opts, PlotData } from './WorkerTypes';
import workerText from './worker.text';
import { Canceler } from 'nh5/dist/RemoteNh5FileClient';

type Props = {
  client: SpikeTrainsNh5Client;
  hideToolbar?: boolean;
  width: number;
  height: number;
};

const gridlineOpts = {
  hideX: false,
  hideY: true,
};

const yAxisInfo = {
  showTicks: false,
  yMin: undefined,
  yMax: undefined,
};

const RasterPlotView: FunctionComponent<Props> = ({ client, hideToolbar, width, height }) => {
  const unitIds = client.unitIds;
  const numUnits = unitIds.length;
  const startTimeSec = 0;
  const endTimeSec = client.totalDurationSec;
  const { reportTotalTimeRange, setVisibleTimeRange, visibleStartTimeSec, visibleEndTimeSec } = useTimeSelection();

  useEffect(() => {
    reportTotalTimeRange(startTimeSec, endTimeSec);
    setVisibleTimeRange(startTimeSec, endTimeSec);
  }, [startTimeSec, endTimeSec, reportTotalTimeRange, setVisibleTimeRange]);

  const [canvasElement, setCanvasElement] = useState<HTMLCanvasElement | undefined>();
  const [worker, setWorker] = useState<Worker | null>(null);

  const [hoveredUnitId, setHoveredUnitId] = useState<string | number | undefined>(undefined);

  const { selectedUnitIds, unitIdSelectionDispatch } = useSelectedUnitIds();

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {}, []);

  useEffect(() => {
    if (!canvasElement) return;
    // const worker = new Worker(new URL('./worker', import.meta.url))
    const worker = new Worker(URL.createObjectURL(new Blob([workerText], { type: 'text/javascript' })));
    const offscreenCanvas = canvasElement.transferControlToOffscreen();
    worker.postMessage(
      {
        canvas: offscreenCanvas,
      },
      [offscreenCanvas]
    );

    setWorker(worker);

    return () => {
      worker.terminate();
    };
  }, [canvasElement]);

  const [plotData, setPlotData] = useState<PlotData | undefined>(undefined);

  // store this as a string so that we can use it as a dependency in the useEffect below
  // and it doesn't trigger the useEffect every time visible range changes
  const visibleChunkIndicesJson: string | undefined = useMemo(() => {
    if (visibleStartTimeSec === undefined) return undefined;
    if (visibleEndTimeSec === undefined) return undefined;
    const chunkStartTimes = client.chunkStartTimes;
    const chunkEndTimes = client.chunkEndTimes;
    const visibleChunkIndices: number[] = [];
    for (let i = 0; i < chunkStartTimes.length; i++) {
      const start = chunkStartTimes[i];
      const end = chunkEndTimes[i];
      if (end < visibleStartTimeSec) continue;
      if (start > visibleEndTimeSec) break;
      visibleChunkIndices.push(i);
    }
    return JSON.stringify(visibleChunkIndices);
  }, [client, visibleStartTimeSec, visibleEndTimeSec]);

  useEffect(() => {
    let canceled = false;
    const canceler: Canceler = {onCancel: []};
    const visibleChunkIndices = visibleChunkIndicesJson ? JSON.parse(visibleChunkIndicesJson) : undefined;
    if (visibleChunkIndices === undefined) return;
    const chunkStartTimes = client.chunkStartTimes;
    ;(async () => {
      const pd: PlotData = {
        plots: unitIds.map((unitId, i) => {
          const plot: PlotData['plots'][0] = {
            unitId,
            spikeTimesSec: [],
            color: getUnitColor(unitId),
          };
          return plot;
        })
      }
      // const totalTimer = Date.now();
      let timer = Date.now();
      let numSpikesLoaded = 0;
      // const visibleChunkIndicesSorted = sortToDoTheMiddleOnesFirst(visibleChunkIndices)
      for (const i of visibleChunkIndices) {
        const start = chunkStartTimes[i];
        const spikeTimes = await client.getChunkSpikeTimes(i, {canceler});
        if (canceled) return;
        const spikeTimeIndex = await client.getChunkSpikeTimesIndex(i);
        if (canceled) return;
        for (let j = 0; j < spikeTimeIndex.length; j++) {
          const i1 = j === 0 ? 0 : spikeTimeIndex[j - 1];
          const i2 = spikeTimeIndex[j];
          for (let ii = i1; ii < i2; ii++) {
            pd.plots[j].spikeTimesSec.push(spikeTimes[ii] + start);
          }
        }
        numSpikesLoaded += spikeTimes.length;
        const elapsed = Date.now() - timer;
        if (elapsed > 300) {
          timer = Date.now();
          setPlotData({...pd});
        }
        // const totalElapsed = Date.now() - totalTimer;
        // if (totalElapsed > 2000) {
        //   break;
        // }
        if (numSpikesLoaded > 1e6) {
          break;
        }
      }
      if (canceled) return;
      setPlotData(pd);
    })();
    return () => {
      canceler.onCancel.forEach((c) => c());
      canceled = true;
    }
  }, [client, visibleChunkIndicesJson, unitIds]);

  // const plotData = useMemo(() => {
  //   const ret: PlotData = {
  //     plots: plots.map((p) => ({
  //       ...p,
  //       color: getUnitColor(p.unitId),
  //     })),
  //   };
  //   return ret;
  // }, [plots]);

  useEffect(() => {
    if (!worker) return;
    worker.postMessage({
      plotData,
    });
  }, [plotData, worker]);

  const { canvasWidth, canvasHeight, margins } = useTimeScrollView({
    width,
    height,
  });

  useEffect(() => {
    if (!worker) return;
    if (visibleStartTimeSec === undefined) return;
    if (visibleEndTimeSec === undefined) return;
    const opts: Opts = {
      canvasWidth,
      canvasHeight,
      margins,
      visibleStartTimeSec,
      visibleEndTimeSec,
      hoveredUnitId,
      selectedUnitIds: [...selectedUnitIds],
    };
    worker.postMessage({
      opts,
    });
  }, [
    canvasWidth,
    canvasHeight,
    margins,
    visibleStartTimeSec,
    visibleEndTimeSec,
    worker,
    hoveredUnitId,
    selectedUnitIds,
  ]);

  const pixelToUnitId = useCallback(
    (p: { x: number; y: number }) => {
      const vSpacing = Math.min((canvasHeight - margins.top - margins.bottom) / (numUnits + 1), 20);
      const yToUnitIndex = (y: number) => {
        const unitIndex = Math.floor((margins.top + vSpacing * (numUnits + 1) - y) / vSpacing - 0.5);
        return unitIndex;
      }
      const index = yToUnitIndex(p.y);
      if (0 <= index && index < numUnits) {
        return unitIds[index];
      } else return undefined;
    },
    [canvasHeight, margins.bottom, margins.top, numUnits, unitIds]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      const boundingRect = e.currentTarget.getBoundingClientRect();
      const p = {
        x: e.clientX - boundingRect.x,
        y: e.clientY - boundingRect.y,
      };
      const unitId = pixelToUnitId(p);
      if (e.shiftKey || e.ctrlKey) {
        unitIdSelectionDispatch({ type: 'TOGGLE_UNIT', targetUnit: unitId });
      } else {
        unitIdSelectionDispatch({ type: 'UNIQUE_SELECT', targetUnit: unitId });
      }
    },
    [pixelToUnitId, unitIdSelectionDispatch]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const boundingRect = e.currentTarget.getBoundingClientRect();
      const p = {
        x: e.clientX - boundingRect.x,
        y: e.clientY - boundingRect.y,
      };
      const unitId = pixelToUnitId(p);
      if (unitId !== undefined) {
        setHoveredUnitId(unitId);
      }
    },
    [pixelToUnitId]
  );

  const handleMouseOut = useCallback((e: React.MouseEvent) => {
    setHoveredUnitId(undefined);
  }, []);

  if (visibleStartTimeSec === undefined) {
    return <div>Loading...</div>;
  }
  return (
    <div style={{position: 'absolute', top: 0, left: 0, width, height}}>
      <TimeScrollView
        width={width}
        height={height}
        onCanvasElement={setCanvasElement}
        gridlineOpts={gridlineOpts}
        onKeyDown={handleKeyDown}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseOut={handleMouseOut}
        hideToolbar={hideToolbar}
        yAxisInfo={yAxisInfo}
      />
    </div>
  );
};

// const sortToDoTheMiddleOnesFirst = (x: number[]) => {
//   const ret: number[] = [];
//   const middle = Math.floor(x.length / 2);
//   ret.push(x[middle]);
//   let delta = 1;
//   while ((middle + delta < x.length) || (middle - delta >= 0)) {
//     if (middle + delta < x.length) {
//       ret.push(x[middle + delta]);
//     }
//     if (middle - delta >= 0) {
//       ret.push(x[middle - delta]);
//     }
//     delta++;
//   }
//   return ret
// }

export default RasterPlotView;
