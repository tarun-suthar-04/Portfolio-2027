import React, { useEffect, useRef } from 'react';
import {
  ASCII_FIELD_CONFIG,
  AsciiCell,
  computeAsciiCellState,
  createAsciiGrid,
  getAsciiCellSize,
  mutateRandomAsciiCells,
} from '../lib/asciiField';

interface AsciiFieldCanvasProps {
  active: boolean;
  pointerRef: React.MutableRefObject<{ x: number | null; y: number | null }>;
}

export const AsciiFieldCanvas: React.FC<AsciiFieldCanvasProps> = ({ active, pointerRef }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const cellsRef = useRef<AsciiCell[]>([]);
  const sizeRef = useRef<{ width: number; height: number; dpr: number }>({
    width: 0,
    height: 0,
    dpr: 1,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rebuildGrid = () => {
      const rect = canvas.getBoundingClientRect();
      const width = Math.max(1, Math.floor(rect.width));
      const height = Math.max(1, Math.floor(rect.height));
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      sizeRef.current = { width, height, dpr };
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);

      const cellSize = getAsciiCellSize(window.innerWidth);
      cellsRef.current = createAsciiGrid(width, height, cellSize);
      canvas.dataset.cellSize = String(cellSize);
      canvas.dataset.cellCount = String(cellsRef.current.length);
    };

    const drawFrame = (timeMs: number, reducedMotion: boolean) => {
      const { width, height, dpr } = sizeRef.current;
      if (width <= 0 || height <= 0) return;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const px = pointerRef.current.x;
      const py = pointerRef.current.y;
      const cells = cellsRef.current;
      const sampleTime = reducedMotion ? 0 : timeMs;

      for (let i = 0; i < cells.length; i++) {
        const cell = cells[i];
        const { x, y, fontSize, alpha, influence } = computeAsciiCellState({
          cell,
          timeMs: sampleTime,
          pointerX: px,
          pointerY: py,
        });

        const drawX = reducedMotion ? cell.baseX : x;
        const drawY = reducedMotion ? cell.baseY : y;
        const weight = influence > 0.45 ? 700 : 500;
        ctx.font = `${weight} ${fontSize.toFixed(1)}px "JetBrains Mono", ui-monospace, monospace`;

        if (influence > 0.25) {
          const g = Math.round(17 + (92 - 17) * influence);
          const b = Math.round(17 + (63 - 17) * influence);
          ctx.fillStyle = `rgba(15, ${g}, ${b}, ${alpha.toFixed(3)})`;
        } else {
          ctx.fillStyle = `rgba(17, 17, 17, ${alpha.toFixed(3)})`;
        }

        ctx.fillText(cell.char, drawX, drawY);
      }
    };

    rebuildGrid();

    const ro = new ResizeObserver(() => {
      rebuildGrid();
      drawFrame(performance.now(), window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    });
    ro.observe(canvas);

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!active || reducedMotion) {
      drawFrame(performance.now(), reducedMotion);
      return () => ro.disconnect();
    }

    let rafId = 0;
    let lastMutation = performance.now();

    const tick = (now: number) => {
      if (now - lastMutation >= ASCII_FIELD_CONFIG.mutationIntervalMs) {
        mutateRandomAsciiCells(cellsRef.current);
        lastMutation = now;
      }
      drawFrame(now, false);
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
    };
  }, [active, pointerRef]);

  return <canvas ref={canvasRef} className="tech-ascii-canvas" aria-hidden="true" />;
};
