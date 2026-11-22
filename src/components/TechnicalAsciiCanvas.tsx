import React, { useEffect, useRef } from 'react';
import {
  ASCII_DEFAULTS,
  AsciiCell,
  computeAmbientPoint,
  computeAsciiCellColors,
  computeAsciiCellState,
  createAsciiGrid,
  getAsciiCellSize,
  mutateRandomAsciiCells,
  smoothPointer,
} from '../lib/asciiField';

interface TechnicalAsciiCanvasProps {
  isActive: boolean;
}

/**
 * Landing (v2) Technical half — Macrodata field harmonized with the Technical
 * section's Ruled-Paper Neo-Brutalism (#f4f4f1 paper, #111111 ink, #ffc400
 * signal yellow highlights, #0f5c3f forest-ink accent).
 * Supports smoothed pointer swell (11->37px, 0.16->1 alpha within 190px),
 * 180ms random character mutation, ambient touch drift, and prefers-reduced-motion.
 */
export const TechnicalAsciiCanvas: React.FC<TechnicalAsciiCanvasProps> = ({ isActive }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const mqReduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    let cells: AsciiCell[] = [];
    let width = 0;
    let height = 0;
    let cellSize = getAsciiCellSize(window.innerWidth);
    let isVertical = window.innerWidth <= ASCII_DEFAULTS.mobileBreakpoint;

    let rawPointerX: number | null = null;
    let rawPointerY: number | null = null;
    let smPointerX: number | null = null;
    let smPointerY: number | null = null;
    let hasFinePointer = false;
    let rafId = 0;
    let timerId = 0;
    let lastDrawnCellSize = 0;

    const rebuildGrid = () => {
      const rect = canvas.getBoundingClientRect();
      width = Math.max(1, Math.round(rect.width));
      height = Math.max(1, Math.round(rect.height));
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      isVertical = window.innerWidth <= ASCII_DEFAULTS.mobileBreakpoint;
      cellSize = getAsciiCellSize(window.innerWidth);
      canvas.dataset.cellSize = String(cellSize);
      cells = createAsciiGrid(width, height, cellSize);
      lastDrawnCellSize = cellSize;
    };

    const drawFrame = (timeMs: number) => {
      if (width <= 0 || height <= 0) return;
      const reduced = mqReduced.matches;
      ctx.clearRect(0, 0, width, height);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      let activeTargetX = rawPointerX;
      let activeTargetY = rawPointerY;

      // Touch / no active cursor -> slow ambient point drifts so the field stays alive
      if (!reduced && (activeTargetX === null || activeTargetY === null) && !hasFinePointer) {
        const ambient = computeAmbientPoint(width, height, timeMs, isVertical);
        activeTargetX = ambient.x;
        activeTargetY = ambient.y;
      }

      if (activeTargetX !== null && activeTargetY !== null) {
        smPointerX = smoothPointer(smPointerX, activeTargetX, 0.14);
        smPointerY = smoothPointer(smPointerY, activeTargetY, 0.14);
      } else {
        smPointerX = null;
        smPointerY = null;
      }

      const baseFont = `500 ${ASCII_DEFAULTS.minFontSize}px "JetBrains Mono", ui-monospace, monospace`;
      const baseStyle = computeAsciiCellColors(0, ASCII_DEFAULTS.minAlpha).textStyle;
      const swelled: Array<{ char: string; x: number; y: number; fontSize: number; influence: number; alpha: number }> = [];

      ctx.font = baseFont;
      ctx.fillStyle = baseStyle;

      for (let i = 0; i < cells.length; i++) {
        const cell = cells[i];
        const state = computeAsciiCellState({
          cell,
          timeMs,
          pointerX: smPointerX,
          pointerY: smPointerY,
          reducedMotion: reduced,
        });

        if (state.influence <= 0.005) {
          ctx.fillText(cell.char, state.x, state.y);
        } else {
          swelled.push({
            char: cell.char,
            x: state.x,
            y: state.y,
            fontSize: Math.round(state.fontSize),
            influence: state.influence,
            alpha: state.alpha,
          });
        }
      }

      let lastFontKey = '';
      for (let i = 0; i < swelled.length; i++) {
        const s = swelled[i];
        const colors = computeAsciiCellColors(s.influence, s.alpha);

        if (colors.highlightBg) {
          const boxSize = Math.round(s.fontSize * 1.12);
          const half = boxSize / 2;
          ctx.fillStyle = colors.highlightBg;
          ctx.fillRect(s.x - half, s.y - half, boxSize, boxSize);
          if (colors.highlightBorder) {
            ctx.strokeStyle = colors.highlightBorder;
            ctx.lineWidth = 1;
            ctx.strokeRect(
              Math.round(s.x - half) + 0.5,
              Math.round(s.y - half) + 0.5,
              boxSize - 1,
              boxSize - 1
            );
          }
        }

        const weight = s.influence > 0.28 ? 700 : 500;
        const fontKey = `${weight} ${s.fontSize}px "JetBrains Mono", ui-monospace, monospace`;
        if (fontKey !== lastFontKey) {
          ctx.font = fontKey;
          lastFontKey = fontKey;
        }
        ctx.fillStyle = colors.textStyle;
        ctx.fillText(s.char, s.x, s.y);
      }
    };

    rebuildGrid();
    drawFrame(performance.now());

    if (!isActive) return;

    const onPointerMove = (ev: PointerEvent) => {
      if (ev.pointerType === 'touch') {
        hasFinePointer = false;
        rawPointerX = null;
        rawPointerY = null;
        return;
      }
      hasFinePointer = true;
      const rect = canvas.getBoundingClientRect();
      if (
        ev.clientX >= rect.left - ASCII_DEFAULTS.pointerRadiusPx &&
        ev.clientX <= rect.right + ASCII_DEFAULTS.pointerRadiusPx &&
        ev.clientY >= rect.top - ASCII_DEFAULTS.pointerRadiusPx &&
        ev.clientY <= rect.bottom + ASCII_DEFAULTS.pointerRadiusPx
      ) {
        rawPointerX = ev.clientX - rect.left;
        rawPointerY = ev.clientY - rect.top;
      } else {
        rawPointerX = null;
        rawPointerY = null;
      }
    };

    const clearPointer = () => {
      hasFinePointer = false;
      rawPointerX = null;
      rawPointerY = null;
    };

    const ro = new ResizeObserver(() => {
      const nextCellSize = getAsciiCellSize(window.innerWidth);
      const rect = canvas.getBoundingClientRect();
      if (
        Math.abs(rect.width - width) > 1 ||
        Math.abs(rect.height - height) > 1 ||
        nextCellSize !== lastDrawnCellSize
      ) {
        rebuildGrid();
        if (mqReduced.matches) {
          drawFrame(0);
        }
      }
    });
    ro.observe(canvas);

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('blur', clearPointer);
    document.documentElement.addEventListener('mouseleave', clearPointer);

    if (!mqReduced.matches) {
      let lastTick = 0;
      const tick = (now: number) => {
        if (now - lastTick >= 33) {
          lastTick = now;
          drawFrame(now);
        }
        rafId = requestAnimationFrame(tick);
      };
      rafId = requestAnimationFrame(tick);

      timerId = window.setInterval(() => {
        mutateRandomAsciiCells(cells);
      }, ASCII_DEFAULTS.mutationIntervalMs);
    }

    return () => {
      cancelAnimationFrame(rafId);
      window.clearInterval(timerId);
      ro.disconnect();
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('blur', clearPointer);
      document.documentElement.removeEventListener('mouseleave', clearPointer);
    };
  }, [isActive]);

  return (
    <canvas
      ref={canvasRef}
      data-testid="tech-ascii-canvas"
      className="tech-ascii-canvas"
      aria-hidden="true"
    />
  );
};
