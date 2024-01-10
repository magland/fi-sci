import { FunctionComponent, useEffect, useMemo, useState } from 'react';
import { PlaceField } from './PlaceFieldsViewData';

export type PlaceFieldPlotProps = {
  width: number;
  height: number;
  placeField: PlaceField;
  color: string;
  bounds: {
    xmin: number;
    xmax: number;
    ymin: number;
    ymax: number;
  };
};

const PlaceFieldPlot: FunctionComponent<PlaceFieldPlotProps> = ({ width, height, placeField, bounds, color }) => {
  const [canvasElement, setCanvasElement] = useState<HTMLCanvasElement | undefined>(undefined);

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

  useEffect(() => {
    if (!canvasElement) return;
    const ctx = canvasElement.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);
    for (let i = 0; i < placeField.x.length; i++) {
      const { xp, yp } = coordToPixel(placeField.x[i], placeField.y[i]);
      const radius = 2;
      ctx.beginPath();
      ctx.arc(xp, yp, radius, 0, 2 * Math.PI);
      ctx.fillStyle = color;
      ctx.fill();
    }
  }, [placeField, canvasElement, width, height, color, coordToPixel]);

  return (
    <div style={{ position: 'relative', width, height }}>
      <canvas ref={(elmt) => elmt && setCanvasElement(elmt)} width={width} height={height} />
    </div>
  );
};

export default PlaceFieldPlot;
