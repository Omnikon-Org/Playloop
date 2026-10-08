export function setupCanvas(canvas: HTMLCanvasElement, logicalWidth: number, logicalHeight: number) {
  const gCtx = canvas.getContext('2d');
  if (!gCtx) throw new Error('No 2d context');

  const resize = () => {
    const parent = canvas.parentElement;
    if (!parent) return;

    const rect = parent.getBoundingClientRect();
    const parentW = rect.width || canvas.clientWidth || 360;
    const parentH = rect.height || canvas.clientHeight || 640;

    // Scale to fit with letterboxing
    const scaleToFit = Math.min(parentW / logicalWidth, parentH / logicalHeight);
    const displayW = Math.floor(logicalWidth * scaleToFit);
    const displayH = Math.floor(logicalHeight * scaleToFit);

    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    // Physical pixels
    const physW = Math.floor(displayW * dpr);
    const physH = Math.floor(displayH * dpr);

    if (canvas.width !== physW || canvas.height !== physH) {
      canvas.width = physW;
      canvas.height = physH;
    }

    canvas.style.width = `${displayW}px`;
    canvas.style.height = `${displayH}px`;

    // Reset transform then set the combined DPR + logical scale
    gCtx.setTransform(1, 0, 0, 1, 0, 0);
    gCtx.scale(dpr * scaleToFit, dpr * scaleToFit);
  };

  resize();

  return { ctx: gCtx, resize };
}
