import React, { useEffect, useRef, useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import {
  CREATIVE_TOOLKIT,
  CreativeCategory,
  MANIFESTO_WORD_MEDIA,
  ManifestoWordKey,
  PROCESS_STEPS,
} from '../data/portfolio';
import { usePortfolioData } from '../context/PortfolioDataContext';
import { calculatePullProgress, SPLIT_CONFIG, ViewMode } from '../lib/splitPhysics';
import { calculateMagneticOffset, clampFloatingPreview } from '../lib/magneticCard';
import { CreativeLightbox } from './CreativeLightbox';
import { CreativeToolLogo, PlatformBrandLogo } from './CreativeBrandLogos';
import { CubicMatrixCluster, GlassCardOrb } from './CubicGlassGrid';
import { ProcessPreviewArt } from './CreativeArtwork';
import { CreativeContactSection } from './CreativeContactSection';

interface CreativeViewProps {
  activeView: ViewMode;
  onReturnLanding: () => void;
  onSwitchTechnical: () => void;
  onOpenAdmin: () => void;
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
  onOpenAdmin,
}) => {
  const { profile, platformLinks, creativeWorks } = usePortfolioData();
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
  const [hoveredWord, setHoveredWord] = useState<ManifestoWordKey | null>(null);
  const [pinnedWord, setPinnedWord] = useState<ManifestoWordKey | null>(null);
  const [failedWordImages, setFailedWordImages] = useState<Record<string, boolean>>({});
  const [failedWorkImages, setFailedWorkImages] = useState<Record<string, boolean>>({});

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

  const scrollToSection = (ev: React.MouseEvent<HTMLAnchorElement>, sectionId: string) => {
    ev.preventDefault();
    const target = document.getElementById(sectionId);
    if (!target) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
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
      ? creativeWorks
      : creativeWorks.filter((item) => item.category === selectedCategory);

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

      {/* SECTION 1: Studio Grid Editorial Hero */}
      <section className="studio-vertical-grid relative overflow-hidden border-b border-[#141518]/10 px-5 sm:px-10 lg:px-16 pt-7 pb-20 lg:pb-24">
        <div className="max-w-6xl mx-auto">
          {/* Clean 3-Zone Production Navbar */}
          <header className="cre-rv on flex items-center justify-between gap-6 pb-8 border-b border-[#141518]/10">
            <a
              href="#creative-work"
              onClick={(ev) => scrollToSection(ev, 'creative-work')}
              className="text-[17px] sm:text-[19px] font-semibold text-[#141518] tracking-tight no-underline whitespace-nowrap shrink-0"
            >
              {profile.firstName}{' '}
              <em className="font-serif-editorial italic font-normal text-[1.16em]">
                {profile.lastName}
              </em>
            </a>

            <nav
              aria-label="Creative sections"
              className="hidden md:flex items-center gap-7 text-[15px] font-medium text-[#374151]"
            >
              <a
                href="#creative-work"
                onClick={(ev) => scrollToSection(ev, 'creative-work')}
                className="text-[#374151] hover:text-[#141518] no-underline transition-colors whitespace-nowrap shrink-0"
              >
                Works
              </a>
              <a
                href="#creative-process"
                onClick={(ev) => scrollToSection(ev, 'creative-process')}
                className="text-[#374151] hover:text-[#141518] no-underline transition-colors whitespace-nowrap shrink-0"
              >
                Process
              </a>
              <a
                href="#creative-toolkit"
                onClick={(ev) => scrollToSection(ev, 'creative-toolkit')}
                className="text-[#374151] hover:text-[#141518] no-underline transition-colors whitespace-nowrap shrink-0"
              >
                Toolkit
              </a>
              <a
                href="#creative-contact"
                onClick={(ev) => scrollToSection(ev, 'creative-contact')}
                className="text-[#374151] hover:text-[#141518] no-underline transition-colors whitespace-nowrap shrink-0"
              >
                Contact
              </a>
            </nav>

            <a
              href="#creative-contact"
              onClick={(ev) => scrollToSection(ev, 'creative-contact')}
              className="inline-flex items-center gap-1.5 text-[14.5px] sm:text-[15px] font-semibold text-[#141518] hover:text-[#2563eb] no-underline transition-colors whitespace-nowrap shrink-0"
            >
              <span>Let&apos;s Talk</span>
              <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
            </a>
          </header>

          {/* Hero Split: Oversized Editorial Type + Stepped Cubic Emerald Glass */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center pt-12 lg:pt-16">
            <div className="lg:col-span-7">
              <p className="cre-rv on text-sm font-medium tracking-[0.02em] text-[#2563eb] m-0">
                AI Creative Artist · Visual Storytelling
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

              {/* Clean signature metadata line */}
              <div className="cre-rv on mt-6 flex flex-wrap items-center gap-2.5 text-sm text-[#4b5563]">
                <span className="font-semibold text-[#2563eb]">@tarunsuthar</span>
                <span aria-hidden="true">·</span>
                <span>{profile.location}</span>
                <span aria-hidden="true">·</span>
                <span>{profile.creativeYears}</span>
              </div>

              {/* Two-tone contrast sublead */}
              <p className="cre-rv on mt-7 text-[clamp(20px,2.4vw,26px)] leading-[1.3] tracking-[-0.03em] font-medium text-[#141518] max-w-md m-0">
                It isn&apos;t just raw prompts.{' '}
                <span className="text-[#6b7280]">
                  It&apos;s lighting, composition &amp; narrative intent.
                </span>
              </p>

              <div className="cre-rv on mt-8 flex flex-wrap items-center gap-6 text-sm font-semibold text-[#141518]">
                <a
                  href="#creative-work"
                  onClick={(ev) => scrollToSection(ev, 'creative-work')}
                  className="inline-flex items-center gap-1.5 text-[#141518] no-underline border-b border-[#141518] pb-0.5 hover:text-[#2563eb] hover:border-[#2563eb] transition-colors"
                >
                  <span>Explore My Works</span>
                  <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
                </a>
                <a
                  href="#creative-process"
                  onClick={(ev) => scrollToSection(ev, 'creative-process')}
                  className="inline-flex items-center gap-1.5 text-[#4b5563] no-underline hover:text-[#141518] transition-colors"
                >
                  <span>Creative Process</span>
                </a>
              </div>
            </div>

            {/* Right: Beveled 5x5 Lime-Emerald Cubic Pillow Cluster */}
            <div className="lg:col-span-5 flex flex-col items-center lg:items-end justify-center">
              <div className="w-full max-w-[330px] sm:max-w-[360px]">
                <CubicMatrixCluster variant="emerald" pattern={HERO_EMERALD_MATRIX} />
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
          <h2 className="cre-rv font-serif-editorial font-normal text-[clamp(40px,6.8vw,86px)] leading-[1.04] tracking-[-0.02em] text-[#f5ede1] m-0 text-balance">
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
        </div>
      </section>

      {/* SECTION 3: My Visual Works Gallery */}
      <section
        id="creative-work"
        className="bg-[#1b1c20] text-white px-5 sm:px-10 lg:px-16 py-20 lg:py-28"
      >
        <div className="max-w-6xl mx-auto">
          <div className="cre-rv flex flex-col md:flex-row md:items-end justify-between gap-6 pb-10 border-b border-white/10">
            <div>
              <h2 className="text-3xl md:text-5xl font-semibold tracking-[-0.04em] text-white m-0">
                My Visual{' '}
                <span className="font-serif-editorial italic font-normal text-[#93c5fd]">
                  Works
                </span>
              </h2>
            </div>

            {/* Category Filter Tabs */}
            <div
              className="flex flex-wrap items-center gap-1.5 bg-white/5 p-1.5 rounded-xl border border-white/10"
              role="group"
              aria-label="Filter visual works by category"
            >
              {(['All', 'Direction', 'Motion & Frame', 'Concept'] as const).map((cat) => {
                const active = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3.5 py-2 rounded-lg text-xs font-medium cursor-pointer transition-colors whitespace-nowrap ${
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
              const globalIndex = creativeWorks.findIndex((item) => item.id === work.id);
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
                  aria-label={`Open ${work.title}`}
                  className="group sleek-glass-card break-inside-avoid mb-7 w-full text-left flex flex-col justify-between cursor-pointer p-0 border-0"
                >
                  <div className="relative z-10 p-6 pb-3 w-full bg-white/85 backdrop-blur-md">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[19px] font-bold tracking-[-0.03em] text-[#141518]">
                        {work.title}
                      </span>
                      <span className="inline-flex items-center gap-1 font-mono-tech text-[11px] text-[#6b7280] shrink-0">
                        <span>{work.index}</span>
                        <ArrowUpRight className="w-3.5 h-3.5 text-[#9ca3af]" aria-hidden="true" />
                      </span>
                    </div>
                    <div className="mt-0.5 text-xs text-[#6b7280]">{work.category}</div>
                    <p className="mt-2.5 text-[13.5px] text-[#374151] leading-relaxed m-0">
                      {work.shortDescription}
                    </p>
                  </div>

                  {work.featureImage && !failedWorkImages[`${work.id}:${work.featureImage}`] ? (
                    <div className={`relative w-full ${orbHeightClass} overflow-hidden bg-[#141518]`}>
                      <img
                        src={work.featureImage}
                        alt={`${work.title} — ${work.subtitle}`}
                        loading="lazy"
                        referrerPolicy="no-referrer"
                        onError={() =>
                          setFailedWorkImages((prev) => ({
                            ...prev,
                            [`${work.id}:${work.featureImage}`]: true,
                          }))
                        }
                        className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                      />
                    </div>
                  ) : (
                    <GlassCardOrb theme={work.theme} className={`w-full ${orbHeightClass}`} />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* SECTION 4: Interactive Process Workflow */}
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
              <h2 className="text-3xl md:text-5xl font-semibold tracking-[-0.04em] text-[#141518] m-0">
                How an idea becomes{' '}
                <span className="font-serif-editorial italic font-normal text-[#7c3aed]">
                  a finished frame
                </span>
              </h2>
            </div>
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
                        className={`font-mono-tech text-xs tabular-nums ${
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
                      className={`text-sm transition-transform ${
                        isActive ? 'text-[#7c3aed] translate-x-0.5' : 'text-[#9ca3af]'
                      }`}
                      aria-hidden="true"
                    >
                      →
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
                    <span className="font-mono-tech text-xs tabular-nums text-[#7c3aed]">
                      {activeStep.index} / 05
                    </span>
                    <h3 className="mt-1 text-2xl font-bold tracking-[-0.03em] text-[#141518] m-0">
                      {activeStep.title}
                    </h3>
                  </div>
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

      {/* SECTION 5: Creative Toolkit (Logo-First) & Branded Contact Finale */}
      <section
        id="creative-toolkit"
        className="studio-grid-surface relative px-5 sm:px-10 lg:px-16 pt-20 pb-36"
      >
        <div className="max-w-6xl mx-auto">
          {/* Logo-First Interactive Creative Toolkit */}
          <div className="cre-rv rounded-[24px] bg-white border border-[#141518]/10 p-6 md:p-8 shadow-[0_12px_36px_rgba(0,0,0,0.04)]">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pb-6 border-b border-[#141518]/8">
              <div>
                <h3 className="text-xl sm:text-2xl font-semibold tracking-[-0.03em] text-[#141518] m-0">
                  Creative Toolkit
                </h3>
                <p className="mt-1.5 text-sm text-[#4b5563] m-0">
                  <span className="font-semibold text-[#141518]">{activeTool.name}</span> —{' '}
                  {activeTool.role}
                </p>
              </div>
            </div>

            <div
              className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3"
              role="group"
              aria-label="Creative toolkit tools"
            >
              {CREATIVE_TOOLKIT.map((tool) => {
                const selected = tool.name === activeToolName;
                return (
                  <button
                    key={tool.id}
                    type="button"
                    aria-pressed={selected}
                    aria-label={`${tool.name}: ${tool.role}`}
                    onClick={() => setActiveToolName(tool.name)}
                    onMouseEnter={() => setActiveToolName(tool.name)}
                    className={`group flex items-center gap-3 p-3.5 rounded-2xl text-left cursor-pointer border transition-all ${
                      selected
                        ? 'bg-[#141518] text-white border-[#141518] shadow-[0_10px_24px_rgba(20,21,24,0.18)] -translate-y-0.5'
                        : 'bg-[#f8f9fb] text-[#141518] border-[#141518]/10 hover:bg-white hover:border-[#141518]/30'
                    }`}
                  >
                    <CreativeToolLogo id={tool.id} className="w-9 h-9 shrink-0" />
                    <span className="text-[13.5px] font-semibold tracking-[-0.015em] leading-tight whitespace-nowrap truncate">
                      {tool.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Closing Contact Form + Socials, Fiverr & Portfolio Links with Logos */}
          <div id="creative-contact" className="cre-rv mt-14 lg:mt-16">
            <CreativeContactSection
              location={profile.location}
              creativeYears={profile.creativeYears}
              onOpenAdmin={onOpenAdmin}
            />

            {/* Branded Platform & Social Links Grid: Fiverr, Portfolio, Instagram, LinkedIn, GitHub */}
            <div
              className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3"
              aria-label="Social platforms, Fiverr and portfolio links"
            >
              {platformLinks.map((platform) => (
                <a
                  key={platform.id}
                  href={platform.href}
                  target={platform.external ? '_blank' : undefined}
                  rel={platform.external ? 'noopener noreferrer' : undefined}
                  onClick={
                    !platform.external && platform.href.startsWith('#')
                      ? (ev) => scrollToSection(ev, platform.href.slice(1))
                      : undefined
                  }
                  className="group flex items-center justify-between gap-3 p-4 rounded-2xl bg-white border border-[#141518]/12 text-[#141518] no-underline hover:border-[#141518]/40 hover:shadow-[0_12px_28px_rgba(20,21,24,0.08)] hover:-translate-y-0.5 transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <PlatformBrandLogo id={platform.id} className="w-7 h-7 shrink-0" />
                    <div className="min-w-0">
                      <div className="text-[14.5px] font-semibold tracking-[-0.015em] text-[#141518] truncate">
                        {platform.label}
                      </div>
                      <div className="text-xs text-[#6b7280] truncate">{platform.handle}</div>
                    </div>
                  </div>
                  <ArrowUpRight
                    className="w-4 h-4 text-[#9ca3af] group-hover:text-[#141518] shrink-0 transition-colors"
                    aria-hidden="true"
                  />
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>

      <CreativeLightbox
        works={creativeWorks}
        activeIndex={lightboxIndex}
        onClose={() => setLightboxIndex(null)}
        onSelectIndex={(idx) => setLightboxIndex(idx)}
      />
    </div>
  );
};
