import React, { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, Bookmark, Check, Copy } from 'lucide-react';
import {
  CREATIVE_TOOLKIT,
  CREATIVE_WORKS,
  CreativeCategory,
  MANIFESTO_WORD_MEDIA,
  ManifestoWordKey,
  PORTFOLIO_PROFILE,
  PROCESS_STEPS,
} from '../data/portfolio';
import { calculatePullProgress, SPLIT_CONFIG, ViewMode } from '../lib/splitPhysics';
import { calculateMagneticOffset, clampFloatingPreview } from '../lib/magneticCard';
import { CreativeLightbox } from './CreativeLightbox';
import { CubicMatrixCluster, GlassCardOrb } from './CubicGlassGrid';
import { ProcessPreviewArt } from './CreativeArtwork';

interface CreativeViewProps {
  activeView: ViewMode;
  onReturnLanding: () => void;
  onSwitchTechnical: () => void;
}

// 5x5 vibrant lime-emerald cubic block (Image 1 & Image 3 style)
const HERO_EMERALD_MATRIX = [
  [1, 1, 1, 1, 1],
  [1, 2, 2, 2, 1],
  [1, 2, 2, 2, 1],
  [1, 2, 2, 2, 1],
  [1, 1, 1, 1, 1],
];

// Stepped corner cobalt wave (Image 4 style)
const COBALT_STEPPED_MATRIX = [
  [0, 0, 0, 1, 1, 1],
  [0, 0, 1, 2, 2, 1],
  [0, 1, 2, 2, 2, 2],
  [1, 1, 2, 2, 2, 2],
  [1, 2, 2, 2, 2, 2],
];

// Stepped violet-orchid cluster (Image 5 style)
const VIOLET_STEPPED_MATRIX = [
  [1, 1, 0, 0, 0, 0],
  [2, 2, 1, 1, 0, 0],
  [2, 2, 2, 1, 1, 1],
  [1, 2, 2, 2, 2, 1],
  [1, 1, 2, 2, 1, 1],
];

export const CreativeView: React.FC<CreativeViewProps> = ({
  activeView,
  onReturnLanding,
  onSwitchTechnical,
}) => {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const accRef = useRef<number>(0);
  const touchYRef = useRef<number>(0);
  const manifestoSectionRef = useRef<HTMLElement | null>(null);
  const manifestoPreviewRef = useRef<HTMLDivElement | null>(null);

  const [pullProgress, setPullProgress] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<'All' | CreativeCategory>('All');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [activeStepIndex, setActiveStepIndex] = useState<number>(0);
  const [activeToolName, setActiveToolName] = useState<string>(CREATIVE_TOOLKIT[0].name);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [hoveredWord, setHoveredWord] = useState<ManifestoWordKey | null>(null);
  const [pinnedWord, setPinnedWord] = useState<ManifestoWordKey | null>(null);
  const [failedWordImages, setFailedWordImages] = useState<Record<string, boolean>>({});

  // Reset scroll to top on entry
  useEffect(() => {
    if (activeView === 'cre' && scrollRef.current) {
      scrollRef.current.scrollTop = 0;
      accRef.current = 0;
      setPullProgress(0);
    }
  }, [activeView]);

  // Intersection reveal scoped to #cre
  useEffect(() => {
    const rootEl = scrollRef.current;
    if (!rootEl) return;

    const revealNodes = Array.from(rootEl.querySelectorAll<HTMLElement>('.cre-rv'));
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('on');
            io.unobserve(entry.target);
          }
        });
      },
      { root: rootEl, threshold: 0.06 }
    );

    revealNodes.forEach((node) => io.observe(node));
    return () => io.disconnect();
  }, []);

  // Preload manifesto hover images when Creative view opens
  useEffect(() => {
    if (activeView !== 'cre') return;
    Object.values(MANIFESTO_WORD_MEDIA).forEach((media) => {
      const img = new Image();
      img.src = media.imageSrc;
    });
  }, [activeView]);

  // Overscroll top-to-landing gesture
  useEffect(() => {
    if (activeView !== 'cre') return;
    const el = scrollRef.current;
    if (!el) return;

    const atTop = () => el.scrollTop <= 0;

    const pushDelta = (dy: number, threshold: number) => {
      if (lightboxIndex !== null) return;
      if (atTop() && dy < 0) {
        accRef.current -= dy;
        setPullProgress(calculatePullProgress(accRef.current, threshold));
        if (accRef.current > threshold) {
          accRef.current = 0;
          setPullProgress(0);
          onReturnLanding();
        }
      } else if (accRef.current !== 0) {
        accRef.current = 0;
        setPullProgress(0);
      }
    };

    const onWheel = (ev: WheelEvent) => {
      pushDelta(ev.deltaY, SPLIT_CONFIG.creReturnThreshold);
    };

    const onTouchStart = (ev: TouchEvent) => {
      touchYRef.current = ev.touches[0]?.clientY ?? 0;
      accRef.current = 0;
      setPullProgress(0);
    };

    const onTouchMove = (ev: TouchEvent) => {
      const y = ev.touches[0]?.clientY ?? touchYRef.current;
      pushDelta(touchYRef.current - y, 110);
      touchYRef.current = y;
    };

    const onKeyDown = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') {
        if (pinnedWord !== null || hoveredWord !== null) {
          setPinnedWord(null);
          setHoveredWord(null);
          return;
        }
        if (lightboxIndex === null) {
          onReturnLanding();
        }
      }
    };

    el.addEventListener('wheel', onWheel, { passive: true });
    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('keydown', onKeyDown);

    return () => {
      el.removeEventListener('wheel', onWheel);
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [activeView, onReturnLanding, lightboxIndex, pinnedWord, hoveredWord]);

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText(PORTFOLIO_PROFILE.email);
      setCopiedEmail(true);
      window.setTimeout(() => setCopiedEmail(false), 2200);
    } catch {
      window.location.href = `mailto:${PORTFOLIO_PROFILE.email}`;
    }
  };

  const resetCardMagnetic = (el: HTMLButtonElement) => {
    el.style.setProperty('--mag-x', '0px');
    el.style.setProperty('--mag-y', '0px');
  };

  const handleCardPointerMove = (ev: React.PointerEvent<HTMLButtonElement>) => {
    if (ev.pointerType === 'touch') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const el = ev.currentTarget;
    const { x, y } = calculateMagneticOffset(
      ev.clientX,
      ev.clientY,
      el.getBoundingClientRect(),
      7
    );
    el.style.setProperty('--mag-x', `${x}px`);
    el.style.setProperty('--mag-y', `${y}px`);
  };

  const updateManifestoPreviewPos = (clientX: number, clientY: number) => {
    const sectionEl = manifestoSectionRef.current;
    const previewEl = manifestoPreviewRef.current;
    if (!sectionEl || !previewEl) return;
    const rect = sectionEl.getBoundingClientRect();
    const { x, y } = clampFloatingPreview({
      relX: clientX - rect.left,
      relY: clientY - rect.top,
      containerWidth: rect.width,
      containerHeight: rect.height,
    });
    previewEl.style.setProperty('--pv-x', `${x}px`);
    previewEl.style.setProperty('--pv-y', `${y}px`);
  };

  const activeWordKey = hoveredWord ?? pinnedWord;
  const activeWordMedia = activeWordKey ? MANIFESTO_WORD_MEDIA[activeWordKey] : null;

  const renderManifestoWord = (key: ManifestoWordKey) => {
    const media = MANIFESTO_WORD_MEDIA[key];
    const isActive = activeWordKey === key;

    return (
      <button
        type="button"
        data-active={isActive ? 'true' : 'false'}
        aria-label={`Preview visual for ${media.word}`}
        style={{ '--word-accent': media.accentHex } as React.CSSProperties}
        className="manifesto-word-btn"
        onPointerEnter={(ev) => {
          if (ev.pointerType === 'touch') return;
          setHoveredWord(key);
          updateManifestoPreviewPos(ev.clientX, ev.clientY);
        }}
        onPointerMove={(ev) => {
          if (ev.pointerType === 'touch') return;
          updateManifestoPreviewPos(ev.clientX, ev.clientY);
        }}
        onPointerLeave={(ev) => {
          if (ev.pointerType === 'touch') return;
          setHoveredWord((prev) => (prev === key ? null : prev));
        }}
        onFocus={(ev) => {
          const r = ev.currentTarget.getBoundingClientRect();
          setHoveredWord(key);
          updateManifestoPreviewPos(r.left + r.width / 2, r.top + r.height / 2);
        }}
        onBlur={() => {
          setHoveredWord((prev) => (prev === key ? null : prev));
        }}
        onClick={(ev) => {
          const r = ev.currentTarget.getBoundingClientRect();
          updateManifestoPreviewPos(r.left + r.width / 2, r.top + r.height / 2);
          setPinnedWord((prev) => (prev === key ? null : key));
        }}
      >
        {media.word}
      </button>
    );
  };

  const filteredWorks =
    selectedCategory === 'All'
      ? CREATIVE_WORKS
      : CREATIVE_WORKS.filter((item) => item.category === selectedCategory);

  const activeStep = PROCESS_STEPS[activeStepIndex] ?? PROCESS_STEPS[0];
  const activeTool =
    CREATIVE_TOOLKIT.find((tool) => tool.name === activeToolName) ?? CREATIVE_TOOLKIT[0];

  return (
    <div
      id="cre"
      ref={scrollRef}
      className="view-layer view-scroll"
      inert={activeView !== 'cre'}
      aria-label="Creative Portfolio"
    >
      {/* Top overscroll progress cue */}
      {pullProgress > 0.05 && (
        <div
          className="fixed top-0 left-0 right-0 z-30 h-1 bg-black/10 pointer-events-none"
          aria-hidden="true"
        >
          <div
            className="h-full bg-[#2563eb] transition-[width] duration-75"
            style={{ width: `${Math.round(pullProgress * 100)}%` }}
          />
        </div>
      )}

      {/* Floating Bottom Navigation */}
      <nav className="floating-nav-group bot" aria-label="Creative view navigation">
        <button type="button" className="nav-chip-cre" onClick={onReturnLanding}>
          ↑ Landing
        </button>
        <button type="button" className="nav-chip-cre" onClick={onSwitchTechnical}>
          Technical →
        </button>
      </nav>

      {/* SECTION 1: Studio Grid Editorial Hero (Images 1 & 4 inspired) */}
      <section className="studio-vertical-grid relative overflow-hidden border-b border-[#141518]/10 px-5 sm:px-10 lg:px-16 pt-8 pb-20 lg:pb-24">
        <div className="max-w-6xl mx-auto">
          {/* Clean 3-zone Editorial Header Strip */}
          <header className="cre-rv on flex flex-wrap items-center justify-between gap-4 pb-10 border-b border-[#141518]/10 text-xs text-[#4b5563]">
            <span className="font-semibold text-[#141518] tracking-tight">
              {PORTFOLIO_PROFILE.firstName}{' '}
              <em className="font-serif-editorial italic font-normal text-[1.18em]">
                {PORTFOLIO_PROFILE.lastName}
              </em>
            </span>
            <span>AI Creative Artist · Visual Content Creator</span>
            <span className="font-mono-tech">{PORTFOLIO_PROFILE.creative.years}</span>
          </header>

          {/* Hero Split: Oversized Editorial Type + Stepped Cubic Emerald/Cobalt Glass */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center pt-12 lg:pt-16">
            <div className="lg:col-span-7">
              <p className="cre-rv on text-xs font-medium tracking-[0.04em] text-[#2563eb] m-0">
                Visual Storytelling · Light &amp; Motion
              </p>

              <h1 className="cre-rv on mt-4 text-[clamp(48px,7.5vw,92px)] leading-[0.94] tracking-[-0.055em] font-semibold text-[#141518] m-0 text-balance">
                Ideas into{' '}
                <span className="text-[#2563eb] font-serif-editorial italic font-normal tracking-[-0.02em]">
                  visuals,
                </span>
                <br />
                imagination into{' '}
                <span className="text-[#16a34a]">motion.</span>
              </h1>

              {/* Tilted clean handle callout inspired by Image 4 */}
              <div className="cre-rv on mt-6 inline-block -rotate-2 bg-white px-4 py-1.5 rounded-full border border-[#141518]/10 shadow-[0_10px_28px_rgba(37,99,235,0.12)]">
                <span className="text-xs font-semibold text-[#2563eb]">
                  @tarunsuthar
                </span>
                <span className="mx-2 text-[#9ca3af]">·</span>
                <span className="text-xs text-[#4b5563]">Indore, India</span>
              </div>

              {/* Two-tone contrast sublead (Image 4 style) */}
              <p className="cre-rv on mt-8 text-[clamp(20px,2.4vw,26px)] leading-[1.3] tracking-[-0.03em] font-medium text-[#141518] max-w-md m-0">
                It isn&apos;t just raw prompts.{' '}
                <span className="text-[#7c828d]">
                  It&apos;s lighting, composition &amp; narrative intent.
                </span>
              </p>

              <div className="cre-rv on mt-8 flex flex-wrap items-center gap-6 text-xs font-semibold tracking-[0.04em] text-[#141518]">
                <a
                  href="#creative-work"
                  className="inline-flex items-center gap-1.5 text-[#141518] no-underline border-b border-[#141518] pb-0.5 hover:text-[#2563eb] hover:border-[#2563eb] transition-colors"
                >
                  <span>Explore Visual Studies</span>
                  <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
                </a>
                <a
                  href="#creative-process"
                  className="inline-flex items-center gap-1.5 text-[#4b5563] no-underline hover:text-[#141518] transition-colors"
                >
                  <span>5-Step Workflow</span>
                </a>
              </div>
            </div>

            {/* Right: Beveled 5x5 Lime-Emerald Cubic Pillow Cluster (Image 1 style) */}
            <div className="lg:col-span-5 flex flex-col items-center lg:items-end justify-center">
              <div className="w-full max-w-[330px] sm:max-w-[360px]">
                <CubicMatrixCluster variant="emerald" pattern={HERO_EMERALD_MATRIX} />
                <div className="mt-4 flex items-center justify-between text-[11px] font-mono-tech text-[#6b7280]">
                  <span>CUBIC GLASS STUDY · 01</span>
                  <span>25 REFRACTIVE TILES</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: Nocturnal Plum & Amber Manifesto with Hover-Triggered Visuals */}
      <section
        ref={manifestoSectionRef}
        className="manifesto-plum-canvas relative overflow-hidden border-b border-[#f5ede1]/10 px-5 sm:px-10 lg:px-16 py-24 lg:py-32 text-[#f5ede1]"
      >
        {/* Subtle nocturnal violet cubic gradient corners */}
        <div
          className="hidden md:block absolute -left-12 -bottom-12 w-[360px] pointer-events-none opacity-45"
          aria-hidden="true"
        >
          <CubicMatrixCluster variant="violet" pattern={COBALT_STEPPED_MATRIX} />
        </div>
        <div
          className="hidden md:block absolute -right-10 -top-10 w-[340px] pointer-events-none opacity-40"
          aria-hidden="true"
        >
          <CubicMatrixCluster variant="violet" pattern={VIOLET_STEPPED_MATRIX} />
        </div>

        {/* Desktop cursor-following floating image reveal */}
        <div
          ref={manifestoPreviewRef}
          className={`manifesto-preview-card hidden md:block ${
            activeWordMedia ? 'is-visible' : ''
          }`}
          aria-hidden="true"
        >
          {activeWordMedia && (
            <div className="rounded-[20px] bg-[#1d1726]/95 border border-[#f5ede1]/22 p-2 shadow-[0_28px_60px_rgba(0,0,0,0.65)]">
              <div
                className="relative aspect-[4/3] w-full overflow-hidden rounded-[14px]"
                style={{ background: activeWordMedia.fallbackGradient }}
              >
                {!failedWordImages[activeWordMedia.key] && (
                  <img
                    key={activeWordMedia.key}
                    src={activeWordMedia.imageSrc}
                    alt={activeWordMedia.caption}
                    referrerPolicy="no-referrer"
                    onError={() =>
                      setFailedWordImages((prev) => ({
                        ...prev,
                        [activeWordMedia.key]: true,
                      }))
                    }
                    className="h-full w-full object-cover"
                  />
                )}
              </div>
              <div className="mt-2 px-1.5 pb-1 flex items-center justify-between gap-2 text-[11px] font-mono-tech">
                <span className="text-[#f5ede1] font-medium truncate">
                  {activeWordMedia.caption}
                </span>
                <span style={{ color: activeWordMedia.accentHex }}>
                  {activeWordMedia.index}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <p className="cre-rv text-xs font-medium text-[#d6c7b8] tracking-[0.06em] m-0">
            Manifesto · Visual Philosophy
          </p>

          <h2 className="cre-rv mt-6 font-serif-editorial font-normal text-[clamp(40px,6.8vw,86px)] leading-[1.02] tracking-[-0.02em] text-[#f5ede1] m-0 text-balance">
            I {renderManifestoWord('create')} visuals, I {renderManifestoWord('experiment')} with{' '}
            {renderManifestoWord('ideas')}, and I bring {renderManifestoWord('imagination')} to{' '}
            {renderManifestoWord('life')}.
          </h2>

          {/* Responsive inline preview card for mobile / pinned tap inspection */}
          {activeWordMedia && (
            <div className="md:hidden mt-8 mx-auto max-w-[300px] rounded-[20px] bg-[#1d1726] border border-[#f5ede1]/20 p-2.5 text-left shadow-[0_20px_44px_rgba(0,0,0,0.5)]">
              <div
                className="relative aspect-[4/3] w-full overflow-hidden rounded-[14px]"
                style={{ background: activeWordMedia.fallbackGradient }}
              >
                {!failedWordImages[activeWordMedia.key] && (
                  <img
                    src={activeWordMedia.imageSrc}
                    alt={activeWordMedia.caption}
                    referrerPolicy="no-referrer"
                    onError={() =>
                      setFailedWordImages((prev) => ({
                        ...prev,
                        [activeWordMedia.key]: true,
                      }))
                    }
                    className="h-full w-full object-cover"
                  />
                )}
              </div>
              <div className="mt-2 px-1 flex items-center justify-between gap-2 text-[11px] font-mono-tech">
                <span className="text-[#f5ede1]">{activeWordMedia.caption}</span>
                <span style={{ color: activeWordMedia.accentHex }}>
                  {activeWordMedia.index}
                </span>
              </div>
            </div>
          )}

          <div className="cre-rv mt-9 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-[#b8a99a] font-mono-tech">
            <span>(01) CONCEPTUAL FRAMING</span>
            <span aria-hidden="true">·</span>
            <span>(02) STRUCTURED LIGHTING</span>
            <span aria-hidden="true">·</span>
            <span>(03) EDITORIAL FINISH</span>
          </div>
        </div>
      </section>

      {/* SECTION 3: Sleek Glass Gradient Cards Gallery (Image 2 exact aesthetic) */}
      <section
        id="creative-work"
        className="bg-[#1b1c20] text-white px-5 sm:px-10 lg:px-16 py-20 lg:py-28"
      >
        <div className="max-w-6xl mx-auto">
          <div className="cre-rv flex flex-col md:flex-row md:items-end justify-between gap-6 pb-10 border-b border-white/10">
            <div>
              <p className="font-mono-tech text-[11px] uppercase tracking-[0.14em] text-[#9ca3af] m-0">
                Selected Work · Card Studies
              </p>
              <h2 className="mt-2 text-3xl md:text-5xl font-semibold tracking-[-0.04em] text-white m-0">
                Visual Studies{' '}
                <span className="font-serif-editorial italic font-normal text-[#93c5fd]">
                  &amp; Direction
                </span>
              </h2>
            </div>

            {/* Category Filter Tabs */}
            <div
              className="flex flex-wrap items-center gap-1.5 bg-white/5 p-1.5 rounded-xl border border-white/10"
              role="group"
              aria-label="Filter visual studies by category"
            >
              {(['All', 'Direction', 'Motion & Frame', 'Concept'] as const).map((cat) => {
                const active = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors whitespace-nowrap ${
                      active
                        ? 'bg-white text-[#141518]'
                        : 'text-[#d1d5db] hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Masonry-Style Glassmorphic Gallery */}
          <div className="mt-10 columns-1 md:columns-2 lg:columns-3 gap-7">
            {filteredWorks.map((work) => {
              const globalIndex = CREATIVE_WORKS.findIndex((item) => item.id === work.id);
              const orbHeightClass =
                work.masonrySize === 'tall'
                  ? 'h-[260px]'
                  : work.masonrySize === 'medium'
                    ? 'h-[205px]'
                    : 'h-[155px]';

              return (
                <button
                  key={work.id}
                  type="button"
                  onClick={(ev) => {
                    resetCardMagnetic(ev.currentTarget);
                    setLightboxIndex(globalIndex);
                  }}
                  onPointerMove={handleCardPointerMove}
                  onPointerLeave={(ev) => resetCardMagnetic(ev.currentTarget)}
                  aria-label={`Inspect ${work.title} visual study`}
                  className="sleek-glass-card break-inside-avoid mb-7 w-full text-left flex flex-col justify-between cursor-pointer p-0 border-0"
                >
                  <div className="relative z-10 p-6 pb-3 w-full bg-white/85 backdrop-blur-md">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[19px] font-bold tracking-[-0.03em] text-[#141518]">
                        {work.title}
                      </span>
                      <span className="inline-flex items-center gap-1.5 font-mono-tech text-[11px] text-[#6b7280] shrink-0">
                        <span>{work.index}</span>
                        <Bookmark className="w-3.5 h-3.5 text-[#9ca3af]" aria-hidden="true" />
                      </span>
                    </div>
                    <div className="mt-0.5 text-xs text-[#6b7280]">{work.handle}</div>
                    <p className="mt-2.5 text-[13.5px] text-[#374151] leading-relaxed m-0">
                      {work.shortDescription}
                    </p>
                  </div>

                  <GlassCardOrb theme={work.theme} className={`w-full ${orbHeightClass}`} />
                </button>
              );
            })}
          </div>

          <div className="mt-4 flex items-center justify-between text-xs text-[#9ca3af]">
            <span>@tarunsuthar · {filteredWorks.length} AI visual projects</span>
            <span>Click any card to inspect direction notes &amp; palette</span>
          </div>
        </div>
      </section>

      {/* SECTION 4: Interactive Process Workflow over Orchid-Violet Cubic Grid (Image 5 inspired) */}
      <section
        id="creative-process"
        className="studio-vertical-grid relative overflow-hidden border-b border-[#141518]/10 px-5 sm:px-10 lg:px-16 py-20 lg:py-28"
      >
        <div
          className="hidden lg:block absolute -left-10 bottom-6 w-[320px] pointer-events-none opacity-80"
          aria-hidden="true"
        >
          <CubicMatrixCluster variant="violet" pattern={VIOLET_STEPPED_MATRIX} />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto">
          <div className="cre-rv flex flex-wrap items-end justify-between gap-4 pb-8 border-b border-[#141518]/10">
            <div>
              <p className="font-mono-tech text-[11px] uppercase tracking-[0.14em] text-[#7c3aed] m-0">
                Creative Process · 01–05
              </p>
              <h2 className="mt-2 text-3xl md:text-5xl font-semibold tracking-[-0.04em] text-[#141518] m-0">
                How an idea becomes{' '}
                <span className="font-serif-editorial italic font-normal text-[#7c3aed]">
                  a finished frame
                </span>
              </h2>
            </div>
            <span className="text-xs text-[#6b7280]">Select a stage to inspect</span>
          </div>

          <div className="mt-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Step List */}
            <div className="lg:col-span-6 flex flex-col divide-y divide-[#141518]/12 border-t border-b border-[#141518]/12">
              {PROCESS_STEPS.map((step, index) => {
                const isActive = index === activeStepIndex;
                return (
                  <button
                    key={step.id}
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => setActiveStepIndex(index)}
                    onMouseEnter={() => setActiveStepIndex(index)}
                    className={`group flex items-baseline justify-between gap-4 py-5 px-3 text-left cursor-pointer border-0 transition-colors ${
                      isActive ? 'bg-white shadow-sm' : 'bg-transparent hover:bg-white/60'
                    }`}
                  >
                    <div className="flex items-baseline gap-4">
                      <span
                        className={`font-mono-tech text-xs ${
                          isActive ? 'text-[#7c3aed] font-bold' : 'text-[#9ca3af]'
                        }`}
                      >
                        {step.index}
                      </span>
                      <span
                        className={`text-2xl md:text-3xl tracking-[-0.03em] transition-colors ${
                          isActive
                            ? 'font-semibold text-[#141518]'
                            : 'font-normal text-[#4b5563] group-hover:text-[#141518]'
                        }`}
                      >
                        {step.title}
                      </span>
                    </div>
                    <span
                      className={`text-xs font-mono-tech ${
                        isActive ? 'text-[#7c3aed]' : 'text-[#9ca3af]'
                      }`}
                    >
                      {isActive ? 'ACTIVE' : '→'}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Live Interactive Stage Preview Card */}
            <div className="lg:col-span-6">
              <div className="rounded-[26px] bg-white border border-[#141518]/10 shadow-[0_24px_60px_rgba(124,58,237,0.12)] overflow-hidden">
                <div className="p-6 pb-4 flex items-center justify-between border-b border-[#141518]/8">
                  <div>
                    <span className="font-mono-tech text-[11px] uppercase tracking-[0.14em] text-[#7c3aed]">
                      Stage {activeStep.index} / 05
                    </span>
                    <h3 className="mt-1 text-2xl font-bold tracking-[-0.03em] text-[#141518] m-0">
                      {activeStep.title}
                    </h3>
                  </div>
                  <span className="font-mono-tech text-xs text-[#6b7280]">WORKFLOW</span>
                </div>

                <div className="h-[230px] relative overflow-hidden">
                  <ProcessPreviewArt stepId={activeStep.id} />
                </div>

                <div className="p-6 bg-[#f9fafb] border-t border-[#141518]/8">
                  <p className="text-[14.5px] leading-relaxed text-[#374151] m-0">
                    {activeStep.caption}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 5: Toolkit & Contact Finale */}
      <section className="studio-grid-surface relative px-5 sm:px-10 lg:px-16 pt-20 pb-32">
        <div className="max-w-6xl mx-auto">
          {/* Interactive Toolkit Selector */}
          <div className="cre-rv rounded-[24px] bg-white border border-[#141518]/10 p-6 md:p-8 shadow-[0_12px_36px_rgba(0,0,0,0.04)]">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <p className="font-mono-tech text-[11px] uppercase tracking-[0.14em] text-[#6b7280] m-0">
                  Creative Toolkit
                </p>
                <p className="mt-1.5 text-sm text-[#141518] font-medium m-0">
                  {activeTool.name} —{' '}
                  <span className="text-[#4b5563] font-normal">{activeTool.role}</span>
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {CREATIVE_TOOLKIT.map((tool) => {
                  const selected = tool.name === activeToolName;
                  return (
                    <button
                      key={tool.name}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => setActiveToolName(tool.name)}
                      className={`px-3.5 py-2 rounded-lg text-xs font-medium cursor-pointer border transition-colors whitespace-nowrap ${
                        selected
                          ? 'bg-[#141518] text-white border-[#141518]'
                          : 'bg-[#f8f9fa] text-[#374151] border-[#141518]/12 hover:border-[#141518]/35'
                      }`}
                    >
                      {tool.name}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Closing Contact Statement */}
          <div className="cre-rv mt-16 lg:mt-20 flex flex-col lg:flex-row lg:items-end justify-between gap-10">
            <div>
              <h2 className="text-[clamp(42px,6.5vw,84px)] leading-[0.95] tracking-[-0.05em] font-semibold text-[#141518] m-0 text-balance">
                I bring imagination{' '}
                <span className="font-serif-editorial italic font-normal text-[#2563eb]">
                  to life.
                </span>
              </h2>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <a
                  href={`mailto:${PORTFOLIO_PROFILE.email}`}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-[#141518] text-white text-sm font-medium no-underline hover:bg-[#2563eb] transition-colors"
                >
                  <span>Say hello</span>
                  <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
                </a>
                <a
                  href={PORTFOLIO_PROFILE.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-white text-[#141518] border border-[#141518]/18 text-sm font-medium no-underline hover:border-[#141518] transition-colors"
                >
                  <span>LinkedIn</span>
                  <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
                </a>
                <button
                  type="button"
                  onClick={handleCopyEmail}
                  className="inline-flex items-center gap-2 px-4 py-3 rounded-full bg-white text-[#374151] border border-[#141518]/18 text-sm font-medium cursor-pointer hover:text-[#141518] hover:border-[#141518] transition-colors"
                >
                  {copiedEmail ? (
                    <>
                      <Check className="w-4 h-4 text-[#16a34a]" aria-hidden="true" />
                      <span>Copied Email</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" aria-hidden="true" />
                      <span>Copy Email</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="font-mono-tech text-xs text-[#6b7280] space-y-1 lg:text-right">
              <div>CREATIVE PORTFOLIO</div>
              <div>{PORTFOLIO_PROFILE.creative.years} · {PORTFOLIO_PROFILE.location.toUpperCase()}</div>
            </div>
          </div>
        </div>
      </section>

      <CreativeLightbox
        works={CREATIVE_WORKS}
        activeIndex={lightboxIndex}
        onClose={() => setLightboxIndex(null)}
        onSelectIndex={(idx) => setLightboxIndex(idx)}
      />
    </div>
  );
};
