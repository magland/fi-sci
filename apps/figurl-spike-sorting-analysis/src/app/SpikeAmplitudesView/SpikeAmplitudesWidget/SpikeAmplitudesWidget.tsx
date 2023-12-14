import { useTimeSelection } from '@fi-sci/context-time-selection';
import { TimeScrollView, useTimeScrollView } from '@fi-sci/time-scroll-view';
import { FunctionComponent, useEffect, useMemo, useState } from 'react';
import { Opts, SpikeAmplitudesWorkerData } from './WorkerTypes';

import { GridlineOpts } from '@fi-sci/timeseries-graph';
import workerText from './worker.text';
import { getUnitColor } from '@fi-sci/context-unit-selection';

export type SpikeAmplitudesData = {
  units: {
    unitId: number | string;
    times: number[];
    amplitudes: number[];
  }[];
};

type Props = {
  data?: SpikeAmplitudesData;
  width: number;
  height: number;
};

const gridlineOpts: GridlineOpts = {
  hideX: false,
  hideY: false,
};

const SpikeAmplitudesWidget: FunctionComponent<Props> = ({ data, width, height }) => {
  const { visibleStartTimeSec, visibleEndTimeSec, reportTotalTimeRange, setVisibleTimeRange } = useTimeSelection();

  const units = useMemo(() => {
    if (!data) return [];
    return data.units;
  }, [data]);

  const { minTime, maxTime } = useMemo(() => {
    if (units.length === 0) {
      return { minTime: undefined, maxTime: undefined };
    }
    let min = units[0].times[0];
    let max = units[0].times[0];
    for (const u of units) {
      for (const t of u.times) {
        if (t < min) min = t;
        if (t > max) max = t;
      }
    }
    return { minTime: min, maxTime: max };
  }, [units]);

  const { minAmp, maxAmp } = useMemo(() => {
    if (units.length === 0) {
      return { minValue: undefined, maxValue: undefined };
    }
    let min = units[0].amplitudes[0];
    let max = units[0].amplitudes[0];
    for (const u of units) {
      for (const a of u.amplitudes) {
        if (a < min) min = a;
        if (a > max) max = a;
      }
    }
    return { minAmp: min, maxAmp: max };
  }, [units]);

  useEffect(() => {
    if (minTime === undefined) return;
    if (maxTime === undefined) return;
    reportTotalTimeRange(minTime, maxTime);
  }, [minTime, maxTime, reportTotalTimeRange, setVisibleTimeRange]);

  useEffect(() => {
    if (minTime === undefined) return;
    if (maxTime === undefined) return;
    if (visibleStartTimeSec !== undefined) return;
    if (visibleEndTimeSec !== undefined) return;
    setVisibleTimeRange(minTime, maxTime);
  }, [minTime, maxTime, visibleStartTimeSec, visibleEndTimeSec, setVisibleTimeRange]);

  const { canvasWidth, canvasHeight, margins } = useTimeScrollView({
    width,
    height,
  });

  const [canvasElement, setCanvasElement] = useState<HTMLCanvasElement | undefined>();
  const [worker, setWorker] = useState<Worker | null>(null);

  useEffect(() => {
    if (!canvasElement) return;
    // const worker = new Worker(new URL('./worker.js', import.meta.url), {type: 'module'})
    // there's a reason we need to do it this way instead of using the above line
    const worker = new Worker(URL.createObjectURL(new Blob([workerText], { type: 'text/javascript' })), {
      type: 'module',
    });
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

  useEffect(() => {
    if (!worker) return;
    const spikeAmplitudesWorkerData: SpikeAmplitudesWorkerData = {
      units: units.map((u) => ({
        unitId: u.unitId,
        color: getUnitColor(u.unitId),
        times: u.times,
        amplitudes: u.amplitudes,
      })),
    };
    worker.postMessage({
      data: spikeAmplitudesWorkerData,
    });
  }, [units, worker]);

  useEffect(() => {
    if (!worker) return;
    if (visibleStartTimeSec === undefined) return;
    if (visibleEndTimeSec === undefined) return;
    if (minAmp === undefined) return;
    if (maxAmp === undefined) return;
    const opts: Opts = {
      canvasWidth,
      canvasHeight,
      margins,
      visibleStartTimeSec,
      visibleEndTimeSec,
      minAmp,
      maxAmp,
    };
    worker.postMessage({
      opts,
    });
  }, [canvasWidth, canvasHeight, margins, visibleStartTimeSec, visibleEndTimeSec, worker, minAmp, maxAmp]);

  const yAxisInfo = useMemo(
    () => ({
      showTicks: true,
      yMin: minAmp,
      yMax: maxAmp,
    }),
    [minAmp, maxAmp]
  );

  const content = (
    <TimeScrollView
      onCanvasElement={(elmt) => setCanvasElement(elmt)}
      gridlineOpts={gridlineOpts}
      width={width}
      height={height}
      yAxisInfo={yAxisInfo}
    />
  );
  return content;
};

export default SpikeAmplitudesWidget;
