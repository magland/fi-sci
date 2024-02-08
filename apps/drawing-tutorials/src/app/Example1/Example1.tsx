import { FunctionComponent, useEffect, useState } from 'react';

/*
This example demonstrates how to create a simple drawing using the HTML5 canvas element.
*/

type Example1Props = {
  width: number;
  height: number;
};

const Example1: FunctionComponent<Example1Props> = ({ width, height }) => {
  const [canvasElement, setCanvasElement] = useState<HTMLCanvasElement | undefined>(undefined);

  useEffect(() => {
    if (!canvasElement) return;
    const ctx = canvasElement.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);

    // draw a house (thanks copilot)
    ctx.fillStyle = 'red';
    ctx.fillRect(100, 100, 200, 200);
    ctx.fillStyle = 'blue';
    ctx.fillRect(150, 300, 100, 100);
    ctx.fillStyle = 'black';
    ctx.beginPath();
    ctx.moveTo(100, 100);
    ctx.lineTo(200, 50);
    ctx.lineTo(300, 100);
    ctx.closePath();
    ctx.fill();
  }, [canvasElement, width, height]);

  return (
    <div style={{ position: 'relative', width, height }}>
      <canvas ref={(elmt) => elmt && setCanvasElement(elmt)} width={width} height={height} />
    </div>
  );
};

export default Example1;
