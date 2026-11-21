import React, { useEffect, useRef } from 'react';
import {
  ASCII_FIELD_CONFIG,
  AsciiCell,
  computeAsciiCellState,
  createAsciiGrid,
  getAsciiCellSize,
  mutateRandomAsciiCells,
} from '../lib/asciiField';

interface TechnicalAsciiCanvasProps {
  isActive: boolean;
}

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
    let pointerX: number | null = null;
    let pointerY: number | null = null;
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

      cellSize = getAsciiCellSize(window.innerWidth);
      canvas.dataset.cellSize = String(cellSize);
      cells = createAsciiGrid(width, height, cellSize);
      lastDrawnCellSize = cellSize;
    };

    const drawFrame = (timeMs: number) => {
      if (width <= 0 || height <= 0) return;
      ctx.clearRect(0, 0, width, height);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      for (let i = 0; i < cells.length; i++) {
        const cell = cells[i];
        const state = computeAsciiCellState({
          cell,
          timeMs,
          pointerX,
          pointerY,
        });

        const weight = state.influence > 0.3 ? 700 : 500;
        ctx.font = `${weight} ${state.fontSize.toFixed(1)}px "JetBrains Mono", ui-monospace, monospace`;

        if (state.influence > 0.08) {
          // Swell & brighten: shift dark ink into crisp vivid MDR emerald near pointer
          const r = Math.round(17 + state.influence * (8 - 17));
          const g = Math.round(17 + state.influence * (122 - 17));
          const b = Math.round(17 + state.influence * (82 - 17));
          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${state.alpha.toFixed(3)})`;
        } else {
          ctx.fillStyle = `rgba(17, 17, 17, ${state.alpha.toFixed(3)})`;
        }

        ctx.fillText(cell.char, state.x, state.y);
      }
    };

    rebuildGrid();
    drawFrame(performance.now());

    if (!isActive) {
      return;
    }

    const onPointerMove = (ev: PointerEvent) => {
      if (ev.pointerType === 'touch') {
        pointerX = null;
        pointerY = null;
        return;
      }
      const rect = canvas.getBoundingClientRect();
      // Track pointer slightly past the canvas boundary so 190px radius smoothly crosses seam
      if (
        ev.clientX >= rect.left - ASCII_FIELD_CONFIG.pointerRadiusPx &&
        ev.clientX <= rect.right + ASCII_FIELD_CONFIG.pointerRadiusPx &&
        ev.clientY >= rect.top - ASCII_FIELD_CONFIG.pointerRadiusPx &&
        ev.clientY <= rect.bottom + ASCII_FIELD_CONFIG.pointerRadiusPx
      ) {
        pointerX = ev.clientX - rect.left;
        pointerY = ev.clientY - rect.top;
      } else {
        pointerX = null;
        pointerY = null;
      }
    };

    const clearPointer = () => {
      pointerX = null;
      pointerY = null;
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
      const tick = (now: number) => {
        drawFrame(now);
        rafId = requestAnimationFrame(tick);
      };
      rafId = requestAnimationFrame(tick);

      timerId = window.setInterval(() => {
        mutateRandomAsciiCells(cells);
      }, ASCII_FIELD_CONFIG.mutationIntervalMs);
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
