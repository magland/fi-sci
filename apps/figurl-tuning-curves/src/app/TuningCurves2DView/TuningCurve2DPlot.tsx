import { FunctionComponent, useEffect, useMemo, useState } from 'react';
import { TuningCurve2D } from './TuningCurves2DViewData';

export type TuningCurve2DPlotProps = {
  width: number;
  height: number;
  tuningCurve2D: TuningCurve2D;
  xBinPositions: number[];
  yBinPositions: number[];
};

const TuningCurve2DPlot: FunctionComponent<TuningCurve2DPlotProps> = ({ width, height, tuningCurve2D, xBinPositions, yBinPositions }) => {
  const [canvasElement, setCanvasElement] = useState<HTMLCanvasElement | undefined>(undefined);

  const bounds: {xmin: number, xmax: number, ymin: number, ymax: number} = useMemo(() => {
    const xBinSpacing = xBinPositions[1] - xBinPositions[0];
    const yBinSpacing = yBinPositions[1] - yBinPositions[0];
    const xmin = xBinPositions[0] - xBinSpacing / 2;
    const xmax = xBinPositions[xBinPositions.length - 1] + xBinSpacing / 2;
    const ymin = yBinPositions[0] - yBinSpacing / 2;
    const ymax = yBinPositions[yBinPositions.length - 1] + yBinSpacing / 2;
    return {xmin, xmax, ymin, ymax};
  }, [xBinPositions, yBinPositions]);

  const { isotropicScale, xPixelOffset, yPixelOffset } = useMemo(() => {
    const { xmin, xmax, ymin, ymax } = bounds;
    const xspan = xmax - xmin;
    const yspan = ymax - ymin;
    const xPixelMarginLeft = 20;
    const xPixelMarginRight = 20;
    const yPixelMarginTop = 20;
    const yPixelMarginBottom = 20;
    const W = width - xPixelMarginLeft - xPixelMarginRight;
    const H = height - yPixelMarginTop - yPixelMarginBottom;
    const xratio = W / xspan;
    const yratio = H / yspan;
    const isotropicScale = Math.min(xratio, yratio);
    const xPixelOffset = xPixelMarginLeft + (W - xspan * isotropicScale) / 2;
    const yPixelOffset = yPixelMarginTop + (H - yspan * isotropicScale) / 2;
    return {
      isotropicScale,
      xPixelOffset,
      yPixelOffset,
    };
  }, [width, height, bounds]);

  const coordToPixel = useMemo(
    () => (x: number, y: number) => {
      const { xmin, ymin } = bounds;
      const xp = xPixelOffset + (x - xmin) * isotropicScale;
      const yp = yPixelOffset + (y - ymin) * isotropicScale;
      return { xp, yp };
    },
    [xPixelOffset, yPixelOffset, bounds, isotropicScale]
  );

//   const pixelToCoord = useMemo(
//     () => (xp: number, yp: number) => {
//       const { xmin, ymin } = bounds;
//       const x = xmin + (xp - xPixelOffset) / isotropicScale;
//       const y = ymin + (yp - yPixelOffset) / isotropicScale;
//       return { x, y };
//     },
//     [xPixelOffset, yPixelOffset, bounds, isotropicScale]
//   );

  const maxValue = useMemo(() => {
    const allValues: number[] = [];
    for (let i = 0; i < tuningCurve2D.values.length; i++) {
      for (let j = 0; j < tuningCurve2D.values[i].length; j++) {
        const v = tuningCurve2D.values[i][j];
        if (!isNaN(v)) {
          allValues.push(v);
        }
      }
    }
    return getPercentile(allValues, 0.97);
  }, [tuningCurve2D]);

  console.log('maxValue', maxValue);

  useEffect(() => {
    if (!canvasElement) return;
    const ctx = canvasElement.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);

    const nx = xBinPositions.length;
    const ny = yBinPositions.length;

    const xSpacing = xBinPositions[1] - xBinPositions[0];
    const ySpacing = yBinPositions[1] - yBinPositions[0];

    const xBinEdges = [...xBinPositions.map(x => x - xSpacing / 2), xBinPositions[xBinPositions.length - 1] + xSpacing / 2];
    const yBinEdges = [...yBinPositions.map(y => y - ySpacing / 2), yBinPositions[yBinPositions.length - 1] + ySpacing / 2];

    // make a heatmap
    for (let i = 0; i < nx; i++) {
      const x1 = xBinEdges[i];
      const x2 = xBinEdges[i + 1];
      for (let j = 0; j < ny; j++) {
        const y1 = yBinEdges[j];
        const y2 = yBinEdges[j + 1];
        const v = tuningCurve2D.values[i][j];
        const { xp: xp1, yp: yp1 } = coordToPixel(x1, y1);
        const { xp: xp2, yp: yp2 } = coordToPixel(x2, y2);
        let color: string
        if (!isNaN(v)) {
          const [r, g, b] = heatmap(v / maxValue * 255);
          color = `rgb(${r}, ${g}, ${b})`;
        }
        else {
          color = 'rgb(128, 128, 128)';
        }
        ctx.fillStyle = color;
        ctx.fillRect(xp1, yp1, xp2 - xp1 + 0.1, yp2 - yp1 + 0.1);
      }
    }
  }, [canvasElement, width, height, tuningCurve2D, xBinPositions, yBinPositions, coordToPixel, maxValue]);

  return (
    <div style={{ position: 'relative', width, height }}>
      <canvas ref={(elmt) => elmt && setCanvasElement(elmt)} width={width} height={height} />
    </div>
  );
};

function generateHeatMapColors() {
  const colors: [number, number, number][] = [];
  for (let i = 0; i < 256; i++) {
      let r, g, b;

      if (i <= 64) {
          // Black to Blue
          r = 0;
          g = 0;
          b = i * 4; // Gradually increase blue
      } else if (i <= 128) {
          // Blue to Red
          r = (i - 64) * 4; // Gradually increase red
          g = 0;
          b = 256 - ((i - 64) * 4); // Gradually decrease blue
      } else if (i <= 192) {
          // Red to Yellow
          r = 255;
          g = (i - 128) * 4; // Gradually increase green
          b = 0;
      } else {
          // Final transition to Yellow
          r = 255;
          g = 255;
          b = (i - 192) * 4; // Not necessary for yellow, but can be used for further transitions
      }

      colors.push([r, g, b]);
  }
  return colors;
}

const heatMapColors = generateHeatMapColors();

const heatmap = (v: number) => {
  if (!v) return heatMapColors[0];
  const i = Math.min(255, Math.max(0, Math.floor(v)));
  return heatMapColors[i];
}

const getPercentile = (values: number[], p: number) => {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const i = Math.floor(p * sorted.length);
  return sorted[i];
}

export default TuningCurve2DPlot;
