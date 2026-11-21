import React, { useEffect, useRef } from 'react';
import { PORTFOLIO_PROFILE } from '../data/portfolio';
import {
  clampProgress,
  computeVelocity,
  easeInOutCubic,
  easeOutBack,
  PointerSample,
  resolveSwipeOutcome,
  ViewMode,
} from '../lib/splitPhysics';
import { TechnicalAsciiCanvas } from './TechnicalAsciiCanvas';

// Stepped frosted cube cluster for Creative Liquid Glass composition
const LIQUID_CUBIC_PATTERN = [
  1, 1, 2, 0,
  1, 2, 1, 0,
  2, 1, 1, 1,
];

interface LandingSplitProps {
  activeView: ViewMode;
  onOpenView: (target: 'tech' | 'cre') => void;
}

interface DragState {
  pointerId: number;
  isVertical: boolean;
  startedOnHandle: boolean;
  startX: number;
  startY: number;
  startCoord: number;
  startProgress: number;
  moved: boolean;
  samples: PointerSample[];
}

export const LandingSplit: React.FC<LandingSplitProps> = ({ activeView, onOpenView }) => {
  const containerRef = useRef<HTMLElement | null>(null);
  const progressRef = useRef<number>(0.5);
  const lockRef = useRef<boolean>(false);
  const dragRef = useRef<DragState | null>(null);
  const suppressClickRef = useRef<boolean>(false);
  const rafRef = useRef<number>(0);
  const resetTimerRef = useRef<number>(0);
  const clickTimerRef = useRef<number>(0);
  const activeViewRef = useRef<ViewMode>(activeView);
  const onOpenViewRef = useRef(onOpenView);

  activeViewRef.current = activeView;
  onOpenViewRef.current = onOpenView;

  const setDraggingAttr = (dragging: boolean) => {
    if (!containerRef.current) return;
    if (dragging) {
      containerRef.current.dataset.dragging = 'true';
    } else {
      delete containerRef.current.dataset.dragging;
    }
  };

  const setProgress = (value: number) => {
    const clamped = clampProgress(value);
    progressRef.current = clamped;
    if (containerRef.current) {
      containerRef.current.style.setProperty('--p', String(clamped));
    }
  };

  const tweenProgress = (
    target: number,
    durationMs: number,
    easing: (t: number) => number,
    onDone?: () => void
  ) => {
    cancelAnimationFrame(rafRef.current);
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const duration = reduced ? 0 : durationMs;
    const from = progressRef.current;
    const start = performance.now();

    const step = (now: number) => {
      const elapsed = duration > 0 ? Math.min(1, (now - start) / duration) : 1;
      setProgress(from + (target - from) * easing(elapsed));
      if (elapsed < 1) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        onDone?.();
      }
    };

    rafRef.current = requestAnimationFrame(step);
  };

  const commitOpen = (target: 'tech' | 'cre') => {
    if (lockRef.current || activeViewRef.current !== 'land') return;
    window.clearTimeout(resetTimerRef.current);
    lockRef.current = true;
    const destProgress = target === 'tech' ? 1 : 0;
    tweenProgress(destProgress, 240, easeInOutCubic, () => {
      onOpenViewRef.current(target);
      resetTimerRef.current = window.setTimeout(() => {
        if (activeViewRef.current !== 'land') {
          setProgress(0.5);
          lockRef.current = false;
        }
      }, 360);
    });
  };

  // Reset split to center cleanly whenever returning to landing
  useEffect(() => {
    if (activeView === 'land') {
      window.clearTimeout(resetTimerRef.current);
      cancelAnimationFrame(rafRef.current);
      lockRef.current = false;
      dragRef.current = null;
      suppressClickRef.current = false;
      setDraggingAttr(false);
      setProgress(0.5);
    }
  }, [activeView]);

  useEffect(() => {
    const mqMobile = window.matchMedia('(max-width: 800px)');

    const safeReleaseCapture = (pointerId: number) => {
      try {
        if (containerRef.current?.hasPointerCapture(pointerId)) {
          containerRef.current.releasePointerCapture(pointerId);
        }
      } catch {
        // Ignore release errors when pointer capture was not active
      }
    };

    const scheduleClearClickSuppression = () => {
      window.clearTimeout(clickTimerRef.current);
      clickTimerRef.current = window.setTimeout(() => {
        suppressClickRef.current = false;
      }, 80);
    };

    const onPointerMove = (ev: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag || ev.pointerId !== drag.pointerId) return;

      const coord = drag.isVertical ? ev.clientY : ev.clientX;
      const delta = coord - drag.startCoord;

      if (!drag.moved) {
        const threshold = drag.startedOnHandle ? 3 : drag.isVertical ? 12 : 10;
        const dx = Math.abs(ev.clientX - drag.startX);
        const dy = Math.abs(ev.clientY - drag.startY);
        const primaryDelta = drag.isVertical ? dy : dx;
        const crossDelta = drag.isVertical ? dx : dy;

        if (primaryDelta < threshold) return;
        if (!drag.startedOnHandle && crossDelta > primaryDelta * 1.35) {
          dragRef.current = null;
          setDraggingAttr(false);
          return;
        }

        drag.moved = true;
        suppressClickRef.current = true;
        setDraggingAttr(true);
        try {
          containerRef.current?.setPointerCapture(ev.pointerId);
        } catch {
          // Ignore pointer capture failures on synthetic events
        }
      }

      const span = drag.isVertical ? window.innerHeight : window.innerWidth;
      setProgress(drag.startProgress - delta / Math.max(1, span));

      const now = performance.now();
      drag.samples.push({ time: now, coord });
      while (drag.samples.length > 2 && drag.samples[0].time < now - 90) {
        drag.samples.shift();
      }
    };

    const onPointerEnd = (ev: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag || ev.pointerId !== drag.pointerId) return;
      dragRef.current = null;
      setDraggingAttr(false);
      safeReleaseCapture(ev.pointerId);

      if (!drag.moved) {
        if (drag.startedOnHandle) {
          suppressClickRef.current = false;
        }
        return;
      }

      scheduleClearClickSuppression();

      const velocity = computeVelocity(drag.samples);
      const outcome = resolveSwipeOutcome({
        progress: progressRef.current,
        velocity,
        isVertical: drag.isVertical,
      });

      if (outcome.action === 'open' && outcome.targetView) {
        commitOpen(outcome.targetView);
      } else if (Math.abs(progressRef.current - 0.5) < 0.004) {
        setProgress(0.5);
      } else {
        tweenProgress(0.5, 320, easeOutBack);
      }
    };

    const onKeyDown = (ev: KeyboardEvent) => {
      if (activeViewRef.current !== 'land' || lockRef.current) return;
      const isVertical = mqMobile.matches;
      if (ev.key === (isVertical ? 'ArrowUp' : 'ArrowLeft')) {
        ev.preventDefault();
        commitOpen('tech');
      } else if (ev.key === (isVertical ? 'ArrowDown' : 'ArrowRight')) {
        ev.preventDefault();
        commitOpen('cre');
      }
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerEnd);
    window.addEventListener('pointercancel', onPointerEnd);
    window.addEventListener('keydown', onKeyDown);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.clearTimeout(resetTimerRef.current);
      window.clearTimeout(clickTimerRef.current);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerEnd);
      window.removeEventListener('pointercancel', onPointerEnd);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  const handlePointerDown = (ev: React.PointerEvent<HTMLElement>) => {
    if (lockRef.current || activeViewRef.current !== 'land') return;
    if (ev.pointerType === 'mouse' && ev.button !== 0) return;

    const isVertical = window.matchMedia('(max-width: 800px)').matches;
    const target = ev.target as HTMLElement | null;
    const startedOnHandle = Boolean(target?.closest('.split-handle'));

    const coord = isVertical ? ev.clientY : ev.clientX;
    suppressClickRef.current = false;

    dragRef.current = {
      pointerId: ev.pointerId,
      isVertical,
      startedOnHandle,
      startX: ev.clientX,
      startY: ev.clientY,
      startCoord: coord,
      startProgress: progressRef.current,
      moved: false,
      samples: [{ time: performance.now(), coord }],
    };

    if (startedOnHandle) {
      setDraggingAttr(true);
      try {
        containerRef.current?.setPointerCapture(ev.pointerId);
      } catch {
        // Ignore pointer capture failures on synthetic events
      }
    }
  };

  const handleHalfClick = (
    ev: React.MouseEvent<HTMLButtonElement>,
    target: 'tech' | 'cre'
  ) => {
    if (suppressClickRef.current) {
      ev.preventDefault();
      ev.stopPropagation();
      return;
    }
    commitOpen(target);
  };

  return (
    <main
      id="land"
      ref={containerRef}
      className="view-layer"
      aria-label="Choose a side"
      inert={activeView !== 'land'}
      onPointerDown={handlePointerDown}
    >
      {/* CREATIVE HALF — Liquid Glass Refractive Studio */}
      <button
        type="button"
        id="goC"
        className="half-panel c"
        aria-label="Open Creative Portfolio: AI Creative Artist"
        onClick={(ev) => handleHalfClick(ev, 'cre')}
      >
        {/* Subtle studio vertical grid + fluted optical glass refraction + caustics */}
        <div className="cre-liquid-backdrop" aria-hidden="true" />
        <div className="cre-fluted-overlay" aria-hidden="true" />
        <div className="cre-caustic-orb is-sapphire" aria-hidden="true" />
        <div className="cre-caustic-orb is-coral" aria-hidden="true" />

        {/* Stepped frosted cubic glass corner tiles (desktop) */}
        <div className="cre-liquid-cubes" aria-hidden="true">
          {LIQUID_CUBIC_PATTERN.map((cell, idx) =>
            cell > 0 ? (
              <div
                key={idx}
                className={cell === 2 ? 'cre-liquid-cube is-lit' : 'cre-liquid-cube'}
              />
            ) : (
              <div key={idx} />
            )
          )}
        </div>

        {/* Stacked translucent Liquid Glass optical lenses (desktop top-left focal sculpture) */}
        <div className="cre-liquid-stack" aria-hidden="true">
          <div className="cre-liquid-lens is-front" />
          <div className="cre-liquid-lens is-mid" />
          <div className="cre-liquid-lens is-back" />
        </div>

        <div className="half-inner">
          <div className="cre-liquid-card">
            <span className="half-kicker text-[#dbeafe]">
              <span className="split-mobile-only">↓ Swipe down</span>
              <span className="split-desktop-only">Drag right →</span> · Creative
            </span>
            <h2 className="half-title">
              AI Creative <em className="cre-artist-glass-pill">Artist</em>
            </h2>
            <p className="half-desc">
              Ideas into visuals. Imagination into motion.
            </p>
          </div>
        </div>
      </button>

      {/* TECHNICAL HALF — Full-Bleed Drifting ASCII Macrodata Canvas + Vignette */}
      <button
        type="button"
        id="goT"
        className="half-panel t"
        aria-label="Open Technical Portfolio: Software Developer"
        onClick={(ev) => handleHalfClick(ev, 'tech')}
      >
        {/* Vignette behind ASCII field */}
        <div className="tech-vignette" aria-hidden="true" />
        <div className="tech-margin-rule" aria-hidden="true" />

        {/* Full-bleed drifting ASCII field canvas */}
        <TechnicalAsciiCanvas isActive={activeView === 'land'} />

        <div className="half-inner">
          <div className="tech-poster-card">
            <div className="tech-poster-top-bar" aria-hidden="true" />
            <h2 className="half-title">Software Developer</h2>
            <p className="half-desc">
              Python · Java · SQL · Android. Practical, database-backed applications.
            </p>
            <span className="half-kicker text-[#0f5c3f]">
              <span className="split-mobile-only">↑ Swipe up</span>
              <span className="split-desktop-only">← Drag left</span> · Technical
            </span>
          </div>
        </div>
      </button>

      <h1 className="split-name">
        {PORTFOLIO_PROFILE.firstName}
        <br />
        {PORTFOLIO_PROFILE.lastName}
      </h1>

      <div className="split-badge">{PORTFOLIO_PROFILE.badge}</div>

      <div className="split-handle" aria-hidden="true">
        <div className="split-handle-knob">
          <span className="split-mobile-only">↕</span>
          <span className="split-desktop-only">↔</span>
        </div>
      </div>
    </main>
  );
};
