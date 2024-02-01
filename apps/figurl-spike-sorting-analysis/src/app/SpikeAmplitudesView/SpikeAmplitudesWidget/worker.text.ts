export default `"use strict";
let canvas = undefined;
let opts = undefined;
let data = undefined;
onmessage = function (evt) {
    if (evt.data.canvas) {
        canvas = evt.data.canvas;
        drawDebounced();
    }
    if (evt.data.opts) {
        opts = evt.data.opts;
        drawDebounced();
    }
    if (evt.data.data) {
        data = evt.data.data;
        drawDebounced();
    }
    // if (evt.data.annotation) {
    //     annotation = evt.data.annotation
    //     drawDebounced()
    // }
};
function debounce(f, msec) {
    let scheduled = false;
    return () => {
        if (scheduled)
            return;
        scheduled = true;
        setTimeout(() => {
            scheduled = false;
            f();
        }, msec);
    };
}
// let drawCode = 0;
async function draw() {
    if (!canvas)
        return;
    if (!opts)
        return;
    if (!data)
        return;
    const { margins, canvasWidth, canvasHeight, visibleStartTimeSec, visibleEndTimeSec, minAmp, maxAmp } = opts;
    // this is important because main thread no longer has control of canvas (it seems)
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    const canvasContext = canvas.getContext('2d');
    if (!canvasContext)
        return;
    // drawCode += 1;
    // const thisDrawCode = drawCode;
    const coordToPixel = (p) => {
        return {
            x: margins.left +
                ((p.x - visibleStartTimeSec) / (visibleEndTimeSec - visibleStartTimeSec)) *
                    (canvasWidth - margins.left - margins.right),
            y: canvasHeight -
                margins.bottom -
                ((p.y - minAmp) / (maxAmp - minAmp)) * (canvasHeight - margins.top - margins.bottom),
        };
    };
    const pixelZero = coordToPixel({ x: 0, y: 0 }).y;
    const pixelUnits = data.units.map((unit, i) => {
        return {
            pixelTimes: unit.times.map((t) => coordToPixel({ x: t, y: 0 }).x),
            pixelAmps: unit.amplitudes.map((y) => coordToPixel({ x: 0, y }).y),
            color: unit.color,
        };
    });
    const x0 = coordToPixel({ x: visibleStartTimeSec, y: 0 }).x;
    const x1 = coordToPixel({ x: visibleEndTimeSec, y: 0 }).x;
    // draw pixel zero as black line
    canvasContext.strokeStyle = 'black';
    canvasContext.beginPath();
    canvasContext.moveTo(x0, pixelZero);
    canvasContext.lineTo(x1, pixelZero);
    canvasContext.stroke();
    for (const unit of pixelUnits) {
        canvasContext.strokeStyle = unit.color;
        canvasContext.fillStyle = unit.color;
        for (let i = 0; i < unit.pixelTimes.length; i++) {
            const x = unit.pixelTimes[i];
            const y = unit.pixelAmps[i];
            const radius = 3;
            // fill ellipse
            canvasContext.beginPath();
            canvasContext.ellipse(x, y, radius, radius, 0, 0, Math.PI * 2, false);
            canvasContext.fill();
        }
    }
}
const drawDebounced = debounce(draw, 10);
`;