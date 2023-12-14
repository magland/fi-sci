export type Opts = {
  canvasWidth: number;
  canvasHeight: number;
  margins: { left: number; right: number; top: number; bottom: number };
  visibleStartTimeSec: number;
  visibleEndTimeSec: number;
  minAmp: number;
  maxAmp: number;
};

export type SpikeAmplitudesWorkerData = {
  units: {
    unitId: number | string;
    color: string;
    times: number[];
    amplitudes: number[];
  }[];
};
