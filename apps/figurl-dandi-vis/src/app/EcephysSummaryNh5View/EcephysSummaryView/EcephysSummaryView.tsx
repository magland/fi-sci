/* eslint-disable @typescript-eslint/no-explicit-any */
import { useTimeSelection } from '@fi-sci/context-time-selection';
import { TimeScrollView, useTimeScrollView } from '@fi-sci/time-scroll-view';
import { FunctionComponent, useEffect, useMemo, useState } from 'react';
import { RemoteNh5FileClient } from '../../nh5';

type EcephysSummaryViewProps = {
  width: number;
  height: number;
  data: EcephysSummaryData;
};

export type BinnedArray = {
  binSizeSec: number;
  binSizeFrames: number;
  numBins: number;
  data: number[][];
};

export class BinnedArrayClient {
  #chunkSize: number
  #chunks: { [index: number]: number[][] } = {};
  constructor(
    private fileClient: RemoteNh5FileClient,
    private minPath: string,
    private maxPath: string,
    private p_numBins: number,
    private p_binSizeSec: number,
    private p_binSizeFrames: number,
    private p_numChannels: number
  ) {
    this.#chunkSize = Math.floor(1000000 / p_numChannels);
  }
  get numBins() {
    return this.p_numBins;
  }
  get binSizeSec() {
    return this.p_binSizeSec;
  }
  get binSizeFrames() {
    return this.p_binSizeFrames;
  }
  get numChannels() {
    return this.p_numChannels;
  }
  async getData(startBinIndex: number, endBinIndex: number) {
    const result: number[][] = [];
    // first allocate all zeros
    for (let i = startBinIndex; i < endBinIndex; i++) {
      result.push(new Array(this.numChannels).fill(0));
    }
    const chunkIndex1 = Math.floor(startBinIndex / this.#chunkSize);
    const chunkIndex2 = Math.floor(endBinIndex / this.#chunkSize);
    for (let i = chunkIndex1; i <= chunkIndex2; i++) {
      const startBinIndexInChunk = i * this.#chunkSize;
      const endBinIndexInChunk = Math.min((i + 1) * this.#chunkSize, this.numBins);
      if (!this.#chunks[i]) {
        const chunkData = await this._getChunkData(startBinIndexInChunk, endBinIndexInChunk);
        if (chunkData) this.#chunks[i] = chunkData;
      }
      const ch = this.#chunks[i];
      if (!ch) continue;
      const startBinIndexInChunk2 = Math.max(startBinIndex, startBinIndexInChunk);
      const endBinIndexInChunk2 = Math.min(endBinIndex, endBinIndexInChunk);
      for (let j = startBinIndexInChunk2; j < endBinIndexInChunk2; j++) {
        result[j - startBinIndex] = ch[j - startBinIndexInChunk];
      }
    }
    return result;
  }
  async _getChunkData(startBinIndex: number, endBinIndex: number) {
    const minData = await this.fileClient.getDatasetData(this.minPath, { slice: [[startBinIndex, endBinIndex]] });
    if (!minData) console.warn('no min data', this.minPath, startBinIndex, endBinIndex);
    if (!minData) return undefined;
    const maxData = await this.fileClient.getDatasetData(this.maxPath, { slice: [[startBinIndex, endBinIndex]] });
    if (!maxData) return console.warn('no max data', this.maxPath, startBinIndex, endBinIndex);
    if (!maxData) return undefined;
    const data = maxData?.map((v, i) => v - minData[i]);
    return create2DArray(data, [endBinIndex - startBinIndex, this.numChannels]);
  }
}

export type EcephysSummaryData = {
  numFrames: number;
  samplingFrequency: number;
  numChannels: number;
  channelIds: (string | number)[];
  channelLocations: number[][];
  array: BinnedArrayClient;
  arrayDs5: BinnedArrayClient;
  arrayDs25: BinnedArrayClient;
};

const EcephysSummaryView: FunctionComponent<EcephysSummaryViewProps> = ({ width, height, data }) => {
  const [canvasElement, setCanvasElement] = useState<HTMLCanvasElement | undefined>();
  const { reportTotalTimeRange, setVisibleTimeRange, visibleStartTimeSec, visibleEndTimeSec } = useTimeSelection();

  const { canvasWidth, canvasHeight, margins } = useTimeScrollView({
    width,
    height,
  });

  const maxVal = useMaxVal(data.arrayDs25);

  const arrayToUse = useMemo(() => {
    if (visibleStartTimeSec === undefined || visibleEndTimeSec === undefined) return undefined
    const span = visibleEndTimeSec - visibleStartTimeSec;
    if (span < data.array.binSizeSec * 300) return data.array;
    else if (span < data.arrayDs5.binSizeSec * 300) return data.arrayDs5;
    else return data.arrayDs25;
  }, [data.array, data.arrayDs25, data.arrayDs5, visibleStartTimeSec, visibleEndTimeSec]);

  const coordToPix = useMemo(() => {
    if (visibleStartTimeSec === undefined || visibleEndTimeSec === undefined) return undefined;
    return ({ t, ch }: { t: number; ch: number }) => {
      const tFrac = (t - visibleStartTimeSec) / (visibleEndTimeSec - visibleStartTimeSec);
      const x = margins.left + tFrac * (canvasWidth - margins.left - margins.right);
      const yFrac = ch / data.numChannels;
      const y = margins.top + yFrac * (canvasHeight - margins.top - margins.bottom);
      return { x, y };
    };
  }, [canvasWidth, canvasHeight, margins, visibleStartTimeSec, visibleEndTimeSec, data.numChannels]);

  useEffect(() => {
    const ctx = canvasElement?.getContext('2d');
    if (!ctx) return;

    if (!coordToPix) return;
    if (visibleStartTimeSec === undefined || visibleEndTimeSec === undefined) return;
    if (!arrayToUse) return;

    let canceled = false;

    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    ; (async () => {
      const binStart = Math.floor(visibleStartTimeSec / arrayToUse.binSizeSec);
      const binEnd = Math.ceil(visibleEndTimeSec / arrayToUse.binSizeSec);
      const x = await arrayToUse.getData(binStart, binEnd);
      if (!x) return
      if (canceled) return;
      for (let j = binStart; j < binEnd; j++) {
        const t1 = j * arrayToUse.binSizeSec;
        const t2 = (j + 1) * arrayToUse.binSizeSec;
        if (t2 < visibleStartTimeSec) continue;
        if (t1 > visibleEndTimeSec) continue;
        for (let i = 0; i < data.numChannels; i++) {
          const { x: x1, y: y1 } = coordToPix({ t: t1, ch: i });
          const { x: x2, y: y2 } = coordToPix({ t: t2, ch: i + 1 });
          const val = x[j - binStart][i];
          const color = `rgb(${Math.floor((255 * val) / maxVal!)}, 0, 0)`;
          ctx.fillStyle = color;
          ctx.fillRect(x1, y1, x2 - x1, y2 - y1);
        }
      }
    })();

    return () => { canceled = true; }
  }, [arrayToUse, canvasElement, coordToPix, data.numChannels, maxVal, visibleStartTimeSec, visibleEndTimeSec]);

  useEffect(() => {
    reportTotalTimeRange(0, data.numFrames / data.samplingFrequency);
    setVisibleTimeRange(0, data.numFrames / data.samplingFrequency);
  }, [data.numFrames, data.samplingFrequency, reportTotalTimeRange, setVisibleTimeRange]);

  return <TimeScrollView width={width} height={height} onCanvasElement={setCanvasElement} />;
};

const useMaxVal = (array: BinnedArrayClient) => {
  const computeMaxVal = async (array: BinnedArrayClient) => {
    const d = await array.getData(0, array.numBins);
    if (!d) return 0;
    let maxVal = -Infinity;
    for (let i = 0; i < d.length; i++) {
      for (let j = 0; j < d[i].length; j++) {
        maxVal = Math.max(maxVal, d[i][j]);
      }
    }
    return maxVal;
  }
  const [maxVal, setMaxVal] = useState<number | undefined>(undefined);
  useEffect(() => {
    (async () => {
      const maxVal = await computeMaxVal(array);
      setMaxVal(maxVal);
    })();
  }, [array]);
  return maxVal;
};

const create2DArray = (data: any, shape: number[]) => {
  const result: number[][] = [];
  let offset = 0;
  for (let i = 0; i < shape[0]; i++) {
    const row: number[] = [];
    for (let j = 0; j < shape[1]; j++) {
      row.push(data[offset]);
      offset++;
    }
    result.push(row);
  }
  return result;
};

export default EcephysSummaryView;
