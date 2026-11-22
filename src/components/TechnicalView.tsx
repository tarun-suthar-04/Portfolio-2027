import React, { useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowUpRight } from 'lucide-react';
import { ProjectItem } from '../data/portfolio';
import { usePortfolioData } from '../context/PortfolioDataContext';
import { calculatePullProgress, SPLIT_CONFIG, ViewMode } from '../lib/splitPhysics';
import { EditorialProjectsSection } from './EditorialProjectsSection';
import { ProjectContactFooter } from './ProjectContactFooter';
import { ProjectModal, ProjectModalTab } from './ProjectModal';
import { ResumeModal } from './ResumeModal';
import { TechStackMarquee } from './TechStackMarquee';

interface TechnicalViewProps {
  activeView: ViewMode;
  activeProjectId: string | null;
  onReturnLanding: () => void;
  onSwitchCreative: () => void;
  onOpenAdmin: () => void;
  onOpenProject: (project: ProjectItem) => void;
}

export const TechnicalView: React.FC<TechnicalViewProps> = ({
  activeView,
  activeProjectId,
  onReturnLanding,
  onSwitchCreative,
  onOpenAdmin,
  onOpenProject,
}) => {
  const { profile, projects } = usePortfolioData();
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const accRef = useRef<number>(0);
  const touchYRef = useRef<number>(0);
  const prevViewRef = useRef<ViewMode>(activeView);

  const [pullProgress, setPullProgress] = useState(0);
  const [modalState, setModalState] = useState<{
    project: ProjectItem | null;
    tab: ProjectModalTab;
  }>({ project: null, tab: 'preview' });
  const [resumeOpen, setResumeOpen] = useState(false);

  const isTechInteractive = activeView === 'tech' && !activeProjectId;

  // Reset scroll to top only when entering Technical from another top-level view
  useEffect(() => {
    if (activeView === 'tech' && prevViewRef.current !== 'tech' && scrollRef.current) {
      scrollRef.current.scrollTop = 0;
      accRef.current = 0;
      setPullProgress(0);
    }
    prevViewRef.current = activeView;
  }, [activeView]);

  // Overscroll bottom-to-landing gesture
  useEffect(() => {
    if (!isTechInteractive) return;

    const el = scrollRef.current;
    if (!el) return;

    const atBottom = () => el.scrollTop + el.clientHeight >= el.scrollHeight - 2;

    const pushDelta = (dy: number, threshold: number) => {
      if (modalState.project || resumeOpen) return;
      if (atBottom() && dy > 0) {
        accRef.current += dy;
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
      pushDelta(ev.deltaY, SPLIT_CONFIG.techReturnThreshold);
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
      if (ev.key === 'Escape' && !modalState.project && !resumeOpen) {
        onReturnLanding();
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
  }, [isTechInteractive, onReturnLanding, modalState.project, resumeOpen]);

  const scrollToSection = (sectionId: string) => {
    const container = scrollRef.current;
    const target = document.getElementById(sectionId);
    if (container && target) {
      const top = target.offsetTop - 68;
      container.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
    }
  };

  const handleOpenModal = (project: ProjectItem, initialTab: ProjectModalTab) => {
    setModalState({ project, tab: initialTab });
  };

  return (
    <div
      id="tech"
      ref={scrollRef}
      className="view-layer view-scroll"
      inert={!isTechInteractive}
      aria-hidden={!isTechInteractive}
      aria-label="Technical Portfolio"
    >
      {/* Floating Top Navigation */}
      <nav className="floating-nav-group top" aria-label="Technical view navigation">
        <button type="button" className="nav-chip-tech" onClick={onReturnLanding}>
          ↓ Landing
        </button>
        <button type="button" className="nav-chip-tech" onClick={onSwitchCreative}>
          Creative →
        </button>
      </nav>

      <div className="tech-wrap">
        {/* Portfolio Hero — Clean Full-Width Developer Identity */}
        <section aria-label="Developer introduction">
          <div className="tech-card flex flex-col justify-between gap-6 sm:p-8 lg:p-10">
            <div>
              <div className="font-mono-tech text-[11.5px] font-medium text-[#4b4f55] flex items-center gap-2 whitespace-nowrap">
                <span className="font-bold text-[#111111]">Software Developer</span>
                <span aria-hidden="true">·</span>
                <span>{profile.location}</span>
              </div>

              <h1 className="tech-h1">
                {profile.firstName}{' '}
                <span>{profile.lastName}</span>
              </h1>

              <p className="text-[16px] sm:text-[18px] leading-[1.58] text-[#22252a] max-w-[64ch] m-0">
                {profile.techBio}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => scrollToSection('tech-projects')}
                className="inline-flex items-center gap-2 font-mono-tech text-[12px] font-bold uppercase px-4 py-2.5 border border-[#111111] bg-[#ffc400] text-[#111111] shadow-[3px_3px_0_#111111] cursor-pointer hover:-translate-x-px hover:-translate-y-px transition-transform whitespace-nowrap shrink-0"
              >
                <span>Selected Projects</span>
                <ArrowDown className="w-3.5 h-3.5" aria-hidden="true" />
              </button>

              <a
                href={profile.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 font-mono-tech text-[12px] font-bold uppercase px-4 py-2.5 border border-[#111111] bg-white text-[#111111] shadow-[3px_3px_0_#111111] hover:bg-[#f4f4f1] hover:-translate-x-px hover:-translate-y-px transition-all whitespace-nowrap shrink-0"
              >
                <span>GitHub</span>
                <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
              </a>

              <button
                type="button"
                onClick={() => scrollToSection('tech-contact')}
                className="font-mono-tech text-[12px] font-bold uppercase text-[#111111] underline underline-offset-4 hover:text-[#0f5c3f] px-2 py-2 cursor-pointer whitespace-nowrap shrink-0"
              >
                Contact
              </button>
            </div>
          </div>
        </section>

        {/* Infinite Moving Tech Stack Logo Strip */}
        <TechStackMarquee />

        {/* Scroll-Driven Editorial Projects Showcase */}
        <EditorialProjectsSection
          projects={projects}
          scrollContainerRef={scrollRef}
          isActive={isTechInteractive}
          onOpenModal={handleOpenModal}
          onOpenProject={onOpenProject}
        />

        {/* Redesigned Footer & Start a Project Contact Form */}
        <ProjectContactFooter
          fullName={profile.fullName}
          location={profile.location}
          githubUrl={profile.githubUrl}
          linkedinUrl={profile.linkedinUrl}
          onOpenResume={() => setResumeOpen(true)}
          onOpenAdmin={onOpenAdmin}
        />

        {/* Overscroll return cue */}
        <div className="flex flex-col items-center gap-2 pt-2">
          <p className="font-mono-tech text-[11px] uppercase tracking-[0.14em] text-[#4b4f55] text-center m-0">
            Keep scrolling ↓ to return to landing
          </p>
          <div
            className="w-36 h-1 bg-[#111111]/15 overflow-hidden"
            aria-hidden="true"
          >
            <div
              className="h-full bg-[#111111] transition-[width] duration-75"
              style={{ width: `${Math.round(pullProgress * 100)}%` }}
            />
          </div>
        </div>
      </div>

      <ProjectModal
        project={modalState.project}
        initialTab={modalState.tab}
        onClose={() => setModalState((prev) => ({ ...prev, project: null }))}
      />
      <ResumeModal isOpen={resumeOpen} onClose={() => setResumeOpen(false)} />
    </div>
  );
};
