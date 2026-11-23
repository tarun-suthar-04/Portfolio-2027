import React, { useEffect, useRef, useState } from 'react';
import { ArrowDown } from 'lucide-react';
import { ProjectItem } from '../data/portfolio';
import { usePortfolioData } from '../context/PortfolioDataContext';
import { ViewMode } from '../lib/splitPhysics';
import { EditorialProjectsSection } from './EditorialProjectsSection';
import { ProjectContactFooter } from './ProjectContactFooter';
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
  const detailRef = useRef<HTMLDivElement | null>(null);
  const prevViewRef = useRef<ViewMode>(activeView);

  const [resumeOpen, setResumeOpen] = useState(false);

  const isTechInteractive = activeView === 'tech' && !activeProjectId;

  // Reset scroll to top only when entering Technical from another top-level view
  useEffect(() => {
    if (activeView === 'tech' && prevViewRef.current !== 'tech' && scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
    prevViewRef.current = activeView;
  }, [activeView]);

  // Keep Escape as a keyboard route back to Landing.
  useEffect(() => {
    if (!isTechInteractive) return;
    const onKeyDown = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape' && !resumeOpen) onReturnLanding();
    };

    window.addEventListener('keydown', onKeyDown);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isTechInteractive, onReturnLanding, resumeOpen]);

  const scrollToSection = (sectionId: string) => {
    const container = scrollRef.current;
    const target = document.getElementById(sectionId);
    if (container && target) {
      const top = target.offsetTop - 68;
      container.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
    }
  };

  // Scrub the About lines against the Technical view's own scroll position.
  useEffect(() => {
    const container = scrollRef.current;
    const detail = detailRef.current;
    if (!container || !detail) return;

    const lines = Array.from(detail.querySelectorAll<HTMLElement>('[data-scroll-reveal]'));
    let frame = 0;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const bounds = container.getBoundingClientRect();
        lines.forEach((line) => {
          if (reducedMotion.matches) {
            line.style.setProperty('--line-reveal', '1');
            return;
          }
          const progress = (bounds.bottom * 0.88 - line.getBoundingClientRect().top) / (bounds.height * 0.4);
          line.style.setProperty('--line-reveal', String(Math.max(0.18, Math.min(1, progress))));
        });
      });
    };
    container.addEventListener('scroll', update, { passive: true });
    reducedMotion.addEventListener('change', update);
    update();
    return () => {
      cancelAnimationFrame(frame);
      container.removeEventListener('scroll', update);
      reducedMotion.removeEventListener('change', update);
    };
  }, []);

  const aboutLines = [
    'M.Sc. Computer Science graduate.',
    'Building practical, database-backed applications in Java and Python.',
    'Using AI-assisted development tools in my workflow.',
    'Seeking a Software Development Engineer I role.',
  ];

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
          <div className="tech-card tech-profile-card">
            <div>
              <div className="font-mono-tech text-[11.5px] font-medium text-[#4b4f55] flex items-center gap-2 whitespace-nowrap">
                <span>{profile.location}</span>
                <span aria-hidden="true">·</span>
                <span>PROFILE 01</span>
              </div>

              <h1 className="tech-h1">
                {profile.firstName}{' '}
                <span>{profile.lastName}</span>
              </h1>
              <p className="tech-profile-role">{profile.techRole}</p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => scrollToSection('tech-projects')}
                className="inline-flex items-center gap-2 font-mono-tech text-[13px] font-bold uppercase px-4 py-2.5 border border-[#111111] bg-[#ffc400] text-[#111111] shadow-[3px_3px_0_#111111] cursor-pointer hover:-translate-x-px hover:-translate-y-px transition-transform whitespace-nowrap shrink-0"
              >
                <span>Explore my work</span>
                <ArrowDown className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            </div>
          </div>
        </section>

        <section className="tech-about-card" aria-labelledby="tech-about-title" ref={detailRef}>
          <div className="tech-lab"><span className="tech-lab-mark bg-[#ffc400]" />ABOUT ME</div>
          <h2 id="tech-about-title" className="tech-h2">What I do<span aria-hidden="true">.</span></h2>
          <div className="tech-about-lines">
            {aboutLines.map((line, index) => (
              <p key={`${index}-${line}`} data-scroll-reveal>{line}</p>
            ))}
          </div>
        </section>

        {/* Infinite Moving Tech Stack Logo Strip */}
        <TechStackMarquee />

        {/* Scroll-Driven Editorial Projects Showcase */}
        <EditorialProjectsSection
          projects={projects}
          scrollContainerRef={scrollRef}
          isActive={isTechInteractive}
          onOpenProject={onOpenProject}
        />

        {/* Redesigned Footer & Start a Project Contact Form */}
        <ProjectContactFooter
          fullName={profile.fullName}
          location={profile.location}
          contactEmail={profile.contactEmail}
          githubUrl={profile.githubUrl}
          linkedinUrl={profile.linkedinUrl}
          onOpenResume={() => setResumeOpen(true)}
          onOpenAdmin={onOpenAdmin}
        />

      </div>

      <ResumeModal isOpen={resumeOpen} onClose={() => setResumeOpen(false)} />
    </div>
  );
};
