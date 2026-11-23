import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, Copy, X } from 'lucide-react';
import { CREATIVE_CATEGORIES, type CreativeCategory, type CreativeWorkItem } from '../data/portfolio';
import { toGalleryWorks, type GalleryWork } from '../data/gallery';

interface GalleryViewProps {
  activeView: string;
  works: CreativeWorkItem[];
  initialCategory: CreativeCategory | null;
  onBack: () => void;
  onNavigateLanding: () => void;
  onNavigateTechnical: () => void;
}

type RowState = { position: number; velocity: number; setWidth: number; hover: number; hovered: boolean; dragging: boolean; lastX: number; lastTime: number; moved: number; pressedId: string | null };
const makeRow = (): RowState => ({ position: 0, velocity: 0, setWidth: 1, hover: 0, hovered: false, dragging: false, lastX: 0, lastTime: 0, moved: 0, pressedId: null });
const getRowHeight = () => window.innerWidth <= 640
  ? Math.max(120, Math.min(210, window.innerHeight * 0.25))
  : Math.max(120, Math.min(320, window.innerHeight * 0.28));

const GalleryVideo: React.FC<{
  src: string;
  poster?: string;
  label: string;
  onError: () => void;
}> = ({ src, poster, label, onError }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) {
        video.pause();
      } else {
        void video.play().catch(() => undefined);
      }
    }, { threshold: 0.2 });
    observer.observe(video);
    return () => observer.disconnect();
  }, [src]);

  return (
    <video
      ref={videoRef}
      src={src}
      poster={poster}
      aria-label={label}
      muted
      loop
      playsInline
      preload="metadata"
      onError={onError}
    />
  );
};

export function GalleryView({ activeView, works, initialCategory, onBack, onNavigateLanding, onNavigateTechnical }: GalleryViewProps) {
  const allWorks = useMemo(() => toGalleryWorks(works), [works]);
  const [lightbox, setLightbox] = useState<GalleryWork | null>(null);
  const [screenEntering, setScreenEntering] = useState(false);
  const [repeatCount, setRepeatCount] = useState(3);
  const [rowHeight, setRowHeight] = useState(getRowHeight);
  const [failed, setFailed] = useState<Record<string, boolean>>({});
  const [activeCategory, setActiveCategory] = useState<CreativeCategory | null>(initialCategory);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const rows = useRef<[RowState, RowState]>([makeRow(), makeRow()]);
  const tracks = useRef<[HTMLDivElement | null, HTMLDivElement | null]>([null, null]);
  const rowElements = useRef<[HTMLDivElement | null, HTMLDivElement | null]>([null, null]);
  const lastFrame = useRef(0);
  const modalRef = useRef<HTMLDivElement | null>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const reducedMotion = useRef(false);
  useEffect(() => { setActiveCategory(initialCategory); }, [initialCategory]);
  const filtered = useMemo(
    () => activeCategory ? allWorks.filter((work) => work.category === activeCategory) : allWorks,
    [allWorks, activeCategory]
  );
  const rowItems = useMemo(() => {
    const first = filtered.filter((_, index) => index % 2 === 0);
    const second = filtered.filter((_, index) => index % 2 === 1);
    return [first.length ? first : second.slice().reverse(), second.length ? second : first.slice().reverse()] as const;
  }, [filtered]);
  const copyPrompt = async () => {
    if (!lightbox?.promptText) return;
    try {
      await navigator.clipboard.writeText(lightbox.promptText);
      setCopiedPrompt(true); setCopyError(false);
      window.setTimeout(() => setCopiedPrompt(false), 1800);
    } catch { setCopyError(true); }
  };

  useEffect(() => { setLightbox(null); }, [initialCategory, activeView]);

  useEffect(() => {
    if (activeView !== 'gallery') { setScreenEntering(false); return; }
    setScreenEntering(true);
    const timer = window.setTimeout(() => setScreenEntering(false), window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 450);
    return () => window.clearTimeout(timer);
  }, [activeView]);

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => { reducedMotion.current = query.matches; };
    update(); query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    if (activeView !== 'gallery') return;
    const measure = () => {
      const viewport = rowElements.current[0]?.clientWidth ?? window.innerWidth;
      const height = rowElements.current[0]?.clientHeight || getRowHeight();
      const gap = window.innerWidth <= 640 ? 3 : 4;
      setRowHeight(height);
      let copies = 3;
      rowItems.forEach((items, index) => {
        const setWidth = items.reduce((total, item) => total + height * item.aspect + gap, 0);
        rows.current[index].setWidth = Math.max(1, setWidth);
        copies = Math.max(copies, Math.ceil((viewport * 2) / Math.max(1, setWidth)) + 1);
      });
      setRepeatCount(copies);
    };
    measure();
    let timer = 0;
    const onResize = () => { window.clearTimeout(timer); timer = window.setTimeout(measure, 120); };
    window.addEventListener('resize', onResize);
    return () => { window.removeEventListener('resize', onResize); window.clearTimeout(timer); };
  }, [activeView, rowItems]);

  useEffect(() => {
    if (activeView !== 'gallery') return;
    let frame = 0;
    const tick = (time: number) => {
      const dt = Math.min(0.05, Math.max(0, (time - (lastFrame.current || time)) / 1000));
      lastFrame.current = time;
      const focused = document.activeElement?.closest('.gallery-row') !== null;
      rows.current.forEach((row, index) => {
        const focusedRow = focused && document.activeElement?.closest('.gallery-row') === rowElements.current[index];
        const hoverTarget = row.dragging || lightbox || focusedRow ? 0 : Number(row.hovered);
        row.hover += (hoverTarget - row.hover) * Math.min(1, dt * 3.5);
        const rate = focusedRow ? 0 : index === 0 ? 28 : -22;
        if (!row.dragging && !reducedMotion.current) row.velocity += (rate * (1 - row.hover) - row.velocity) * Math.min(1, dt * 1.4);
        else if (!row.dragging) row.velocity *= Math.exp(-dt * (reducedMotion.current ? 12 : 2.4));
        if (!row.dragging) row.position += row.velocity * dt;
        const width = row.setWidth || 1;
        row.position = ((row.position % width) + width) % width;
        tracks.current[index]?.style.setProperty('transform', `translate3d(${-row.position}px,0,0)`);
      });
      frame = requestAnimationFrame(tick);
    };
    lastFrame.current = 0;
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [activeView, lightbox]);

  useEffect(() => {
    if (!lightbox) return;
    returnFocus.current = document.activeElement as HTMLElement;
    modalRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.stopPropagation(); setLightbox(null); }
      if (event.key === 'Tab') {
        const focusable = modalRef.current?.querySelectorAll<HTMLElement>('button');
        if (!focusable?.length) return;
        const first = focusable[0], last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('keydown', onKey); returnFocus.current?.focus(); };
  }, [lightbox]);

  useEffect(() => {
    if (activeView !== 'gallery' || lightbox || screenEntering) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); onBack(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [activeView, lightbox, onBack, screenEntering]);

  const pointerDown = (index: number, event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    const row = rows.current[index]; row.dragging = true; row.lastX = event.clientX; row.lastTime = performance.now(); row.moved = 0; row.velocity = 0;
    row.pressedId = (event.target as HTMLElement).closest<HTMLElement>('[data-work-id]')?.dataset.workId ?? null;
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const pointerMove = (index: number, event: React.PointerEvent<HTMLDivElement>) => {
    const row = rows.current[index]; if (!row.dragging) return;
    const now = performance.now(), dx = event.clientX - row.lastX, dt = Math.max(1, now - row.lastTime);
    row.position -= dx; row.velocity = Math.max(-900, Math.min(900, -dx / dt * 1000)); row.moved += Math.abs(dx); row.lastX = event.clientX; row.lastTime = now;
    tracks.current[index]?.style.setProperty('transform', `translate3d(${-row.position}px,0,0)`);
  };
  const pointerUp = (index: number, event: React.PointerEvent<HTMLDivElement>, item?: GalleryWork) => {
    const row = rows.current[index]; if (!row.dragging) return;
    row.dragging = false;
    const pressed = item ?? filtered.find((work) => work.id === row.pressedId);
    if (row.moved < 6 && pressed) setLightbox(pressed);
    if (reducedMotion.current) row.velocity = 0;
    row.pressedId = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };
  const pointerCancel = (index: number, event: React.PointerEvent<HTMLDivElement>) => {
    const row = rows.current[index];
    row.dragging = false; row.pressedId = null; row.velocity = 0;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };
  const wheel = (event: React.WheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    const horizontal = Math.abs(event.deltaX) > Math.abs(event.deltaY);
    const delta = horizontal ? event.deltaX : event.deltaY;
    rows.current.forEach((row, index) => {
      const velocity = Math.max(-900, Math.min(900, horizontal ? delta * 3 : (index === 0 ? delta : -delta) * 3));
      if (reducedMotion.current) {
        row.position = ((row.position + velocity * 0.02) % row.setWidth + row.setWidth) % row.setWidth;
        tracks.current[index]?.style.setProperty('transform', `translate3d(${-row.position}px,0,0)`);
      } else row.velocity = velocity;
    });
  };

  const renderWork = (item: GalleryWork, index: number, rowIndex: number, duplicate: boolean) => (
    <button key={`${item.id}-${rowIndex}-${index}`} data-work-id={item.id} type="button" className="gallery-item" style={{ aspectRatio: `${item.aspect}`, width: `${rowHeight * item.aspect}px` }} aria-label={`Open ${item.alt}`} tabIndex={duplicate ? -1 : 0} onClick={(event) => { if (event.detail === 0) setLightbox(item); }} onKeyDown={(event) => { if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); const row = rows.current[rowIndex]; const delta = event.key === 'ArrowLeft' ? 60 : -60; if (reducedMotion.current) { row.position = ((row.position + delta) % row.setWidth + row.setWidth) % row.setWidth; tracks.current[rowIndex]?.style.setProperty('transform', `translate3d(${-row.position}px,0,0)`); } else row.velocity = delta * 3; } }}>
      {item.videoSrc && !failed[item.id] ? (
        <GalleryVideo
          src={item.videoSrc}
          poster={item.src}
          label={item.alt}
          onError={() => setFailed((prev) => ({ ...prev, [item.id]: true }))}
        />
      ) : item.src && !failed[item.id] ? (
        <img src={item.src} alt={item.alt} width={item.width} height={item.height} loading="lazy" decoding="async" onError={() => setFailed((prev) => ({ ...prev, [item.id]: true }))} />
      ) : <span className={`gallery-placeholder gallery-placeholder-${item.theme}`} aria-hidden="true">{import.meta.env.DEV && <span className="gallery-todo">TODO: add image</span>}</span>}
    </button>
  );

  return (
    <main id="gallery" className={`view-layer gallery-view${screenEntering ? ' is-entering' : ''}`} inert={activeView !== 'gallery'} aria-label="Creative work gallery">
      <header className="gallery-header">
        <h1>{activeCategory ?? 'Gallery'}</h1>
        <p aria-live="polite">{filtered.length} {filtered.length === 1 ? 'piece' : 'pieces'}</p>
      </header>
      <nav className="gallery-filters" aria-label="Filter gallery by category">
        <button type="button" aria-pressed={activeCategory === null} onClick={() => { setActiveCategory(null); setLightbox(null); }}>All</button>
        {CREATIVE_CATEGORIES.map((category) => (
          <button
            key={category}
            type="button"
            aria-pressed={activeCategory === category}
            onClick={() => { setActiveCategory(category); setLightbox(null); }}
          >
            {category}
          </button>
        ))}
      </nav>
      <section className="gallery-rows" aria-label="Work rows">
        {rowItems.map((items, rowIndex) => (
          <div key={rowIndex} role="region" className="gallery-row" aria-label={`Gallery row ${rowIndex + 1}`} ref={(el) => { rowElements.current[rowIndex] = el; }} onPointerDown={(event) => pointerDown(rowIndex, event)} onPointerMove={(event) => pointerMove(rowIndex, event)} onPointerUp={(event) => pointerUp(rowIndex, event)} onPointerCancel={(event) => pointerCancel(rowIndex, event)} onPointerEnter={(event) => { if (event.pointerType === 'mouse') rows.current[rowIndex].hovered = true; }} onPointerLeave={(event) => { if (event.pointerType === 'mouse') rows.current[rowIndex].hovered = false; }} onWheel={wheel}>
            <div className="gallery-track" ref={(el) => { tracks.current[rowIndex] = el; }}>
              {Array.from({ length: repeatCount }, (_, copy) => (
                <div key={copy} className="gallery-set" aria-hidden={copy > 0 || undefined}>
                  {items.map((item, index) => renderWork(item, index, rowIndex, copy > 0))}
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>
      <footer className="gallery-footer">
        <p className="gallery-hint">Drifts on its own · Drag, swipe or scroll · Tap a piece to open</p>
        <nav aria-label="Portfolio navigation" className="gallery-footer-nav">
          <button type="button" onClick={onNavigateLanding}>Landing</button>
          <button type="button" onClick={onBack}>Creative</button>
          <button type="button" onClick={onNavigateTechnical}>Technical</button>
        </nav>
      </footer>
      {lightbox && (
        <div className="gallery-lightbox" role="presentation" onClick={(event) => { if (event.target === event.currentTarget) setLightbox(null); }}>
          <div className="gallery-lightbox-panel" role="dialog" aria-modal="true" aria-label={lightbox.title} tabIndex={-1} ref={modalRef}>
            <button className="gallery-close" type="button" aria-label="Close image" onClick={() => setLightbox(null)}><X size={20} /></button>
            {lightbox.videoSrc && !failed[lightbox.id] ? (
              <video src={lightbox.videoSrc} poster={lightbox.src} width={lightbox.width} height={lightbox.height} controls autoPlay loop muted playsInline preload="metadata" onError={() => setFailed((prev) => ({ ...prev, [lightbox.id]: true }))} />
            ) : lightbox.src && !failed[lightbox.id] ? (
              <img src={lightbox.src} alt={lightbox.alt} width={lightbox.width} height={lightbox.height} decoding="async" onError={() => setFailed((prev) => ({ ...prev, [lightbox.id]: true }))} />
            ) : (
              <div className={`gallery-lightbox-placeholder gallery-placeholder-${lightbox.theme}`}>{import.meta.env.DEV && <span className="gallery-todo">TODO: add image</span>}</div>
            )}
            <div className="gallery-lightbox-meta"><h2>{lightbox.title}</h2><span>{lightbox.category}</span></div>
            {['AI Portraits', 'AI Video'].includes(lightbox.category) && (
              <div className="gallery-prompt-actions">
                <button type="button" onClick={copyPrompt} disabled={!lightbox.promptText}>
                  {copiedPrompt ? <Check size={15} aria-hidden="true" /> : <Copy size={15} aria-hidden="true" />}
                  {copiedPrompt ? 'Prompt copied' : 'Copy prompt'}
                </button>
                {copyError && <span role="status">Clipboard unavailable</span>}
                {!lightbox.promptText && <span>No exact prompt saved for this piece.</span>}
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
