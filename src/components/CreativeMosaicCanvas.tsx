import React, { useEffect, useRef } from 'react';
import {
  computeMosaicGridDimensions,
  computeMosaicTileValue,
  getMosaicTileSize,
  sampleMosaicBlueColor,
} from '../lib/creativeMosaic';

interface CreativeMosaicCanvasProps {
  isActive: boolean;
}

/**
 * Landing (v2) Creative half — Liquid-Glass Mosaic.
 * A tiny 1-pixel-per-tile canvas scaled with image-rendering: pixelated so each
 * canvas pixel aligns 1:1 with the CSS --tile (44px mobile / 64px desktop)
 * glass mask, specular rim, and pointer spotlight layers.
 */
export const CreativeMosaicCanvas: React.FC<CreativeMosaicCanvasProps> = ({ isActive }) => {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: false });
    if (!ctx) return;

    const mqReduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    let tileSize = getMosaicTileSize(window.innerWidth);
    let cols = 1;
    let rows = 1;
    let isVertical = window.innerWidth <= 800;
    let imgData: ImageData | null = null;
    let pointerCol: number | null = null;
    let pointerRow: number | null = null;
    let smoothCol: number | null = null;
    let smoothRow: number | null = null;
    let rafId = 0;
    let lastDrawMs = 0;

    const syncGrid = () => {
      const vw = Math.max(1, window.innerWidth);
      const vh = Math.max(1, window.innerHeight);
      isVertical = vw <= 800;
      tileSize = getMosaicTileSize(vw);

      const dims = computeMosaicGridDimensions(vw, vh, tileSize);
      cols = dims.cols;
      rows = dims.rows;

      canvas.width = cols;
      canvas.height = rows;
      canvas.style.width = `${cols * tileSize}px`;
      canvas.style.height = `${rows * tileSize}px`;
      canvas.dataset.tileSize = String(tileSize);
      imgData = ctx.createImageData(cols, rows);
    };

    const renderFrame = (timeMs: number) => {
      if (!imgData) return;
      const reduced = mqReduced.matches;

      if (pointerCol !== null && pointerRow !== null) {
        smoothCol = smoothCol === null ? pointerCol : smoothCol + (pointerCol - smoothCol) * 0.16;
        smoothRow = smoothRow === null ? pointerRow : smoothRow + (pointerRow - smoothRow) * 0.16;
      } else {
        smoothCol = null;
        smoothRow = null;
      }

      const data = imgData.data;
      const timeSec = timeMs * 0.001;

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const t = computeMosaicTileValue({
            col,
            row,
            cols,
            rows,
            isVertical,
            timeSec,
            pointerCol: smoothCol,
            pointerRow: smoothRow,
            reducedMotion: reduced,
          });
          const { r, g, b } = sampleMosaicBlueColor(t);
          const idx = (row * cols + col) * 4;
          data[idx] = r;
          data[idx + 1] = g;
          data[idx + 2] = b;
          data[idx + 3] = 255;
        }
      }

      ctx.putImageData(imgData, 0, 0);
    };

    syncGrid();
    renderFrame(performance.now());

    if (!isActive) return;

    const onPointerMove = (ev: PointerEvent) => {
      if (ev.pointerType === 'touch') return;
      const rect = wrap.getBoundingClientRect();
      const x = ev.clientX - rect.left;
      const y = ev.clientY - rect.top;
      if (x >= -tileSize && x <= rect.width + tileSize && y >= -tileSize && y <= rect.height + tileSize) {
        pointerCol = x / tileSize;
        pointerRow = y / tileSize;
        wrap.style.setProperty('--mx', `${x.toFixed(1)}px`);
        wrap.style.setProperty('--my', `${y.toFixed(1)}px`);
        wrap.style.setProperty('--m-op', '1');
      } else {
        pointerCol = null;
        pointerRow = null;
        wrap.style.setProperty('--m-op', '0');
      }
    };

    const clearPointer = () => {
      pointerCol = null;
      pointerRow = null;
      wrap.style.setProperty('--m-op', '0');
    };

    const onResize = () => {
      syncGrid();
      renderFrame(performance.now());
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('resize', onResize, { passive: true });
    window.addEventListener('blur', clearPointer);
    document.documentElement.addEventListener('mouseleave', clearPointer);

    if (!mqReduced.matches) {
      const tick = (now: number) => {
        // Fast 33ms updates while pointer interacts; gentle 110ms updates for idle wave drift
        const interval = pointerCol !== null ? 33 : 110;
        if (now - lastDrawMs >= interval) {
          lastDrawMs = now;
          renderFrame(now);
        }
        rafId = requestAnimationFrame(tick);
      };
      rafId = requestAnimationFrame(tick);
    }

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('blur', clearPointer);
      document.documentElement.removeEventListener('mouseleave', clearPointer);
    };
  }, [isActive]);

  return (
    <div ref={wrapRef} className="cre-mosaic-stage" aria-hidden="true">
      {/* 1px-per-tile quantized blue gradient canvas */}
      <canvas
        ref={canvasRef}
        data-testid="cre-mosaic-canvas"
        className="cre-mosaic-canvas"
      />
      {/* Layer 1: backdrop-filter masked to rounded squares */}
      <div className="cre-mosaic-blur" />
      {/* Layer 2: repeating SVG specular rim/bevel tile */}
      <div className="cre-mosaic-rim" />
      {/* Layer 3: pointer spotlight masked to the same rounded-square tiles */}
      <div className="cre-mosaic-spot" />
      {/* Drifting soft-light specular sheen */}
      <div className="cre-mosaic-sheen" />
      {/* Tactile film grain */}
      <div className="cre-mosaic-grain" />
    </div>
  );
};
