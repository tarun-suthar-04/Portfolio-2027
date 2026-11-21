import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDown, ArrowUpRight, Check, Copy, FileCode2, FolderOpen, Package, Terminal } from 'lucide-react';
import { PORTFOLIO_PROFILE, ProjectFileExt, ProjectItem, PROJECTS } from '../data/portfolio';
import { calculatePullProgress, SPLIT_CONFIG, ViewMode } from '../lib/splitPhysics';
import {
  filterProjectsByFileType,
  getProjectFileCounts,
  ProjectFileFilter,
} from '../lib/techPortfolio';
import { ProjectFileCard } from './ProjectFileCard';
import { ProjectModal, ProjectModalTab } from './ProjectModal';
import { ResumeModal } from './ResumeModal';
import { TechStackMarquee } from './TechStackMarquee';

interface TechnicalViewProps {
  activeView: ViewMode;
  onReturnLanding: () => void;
  onSwitchCreative: () => void;
}

const DirectoryRowIcon: React.FC<{ ext: ProjectFileExt }> = ({ ext }) => {
  switch (ext) {
    case '.apk':
      return <Package className="w-4 h-4 text-[#0f5c3f] shrink-0" aria-hidden="true" />;
    case '.jar':
      return <Terminal className="w-4 h-4 text-[#111111] shrink-0" aria-hidden="true" />;
    case '.py':
    default:
      return <FileCode2 className="w-4 h-4 text-[#2563eb] shrink-0" aria-hidden="true" />;
  }
};

export const TechnicalView: React.FC<TechnicalViewProps> = ({
  activeView,
  onReturnLanding,
  onSwitchCreative,
}) => {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const accRef = useRef<number>(0);
  const touchYRef = useRef<number>(0);

  const [pullProgress, setPullProgress] = useState(0);
  const [fileFilter, setFileFilter] = useState<ProjectFileFilter>('all');
  const [modalState, setModalState] = useState<{
    project: ProjectItem | null;
    tab: ProjectModalTab;
  }>({ project: null, tab: 'preview' });
  const [resumeOpen, setResumeOpen] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);

  const fileCounts = useMemo(() => getProjectFileCounts(PROJECTS), []);
  const visibleProjects = useMemo(
    () => filterProjectsByFileType(PROJECTS, fileFilter),
    [fileFilter]
  );

  // Reset scroll to top on entry
  useEffect(() => {
    if (activeView === 'tech' && scrollRef.current) {
      scrollRef.current.scrollTop = 0;
      accRef.current = 0;
      setPullProgress(0);
    }
  }, [activeView]);

  // Overscroll bottom-to-landing gesture
  useEffect(() => {
    if (activeView !== 'tech') return;

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
  }, [activeView, onReturnLanding, modalState.project, resumeOpen]);

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText(PORTFOLIO_PROFILE.email);
      setCopiedEmail(true);
      window.setTimeout(() => setCopiedEmail(false), 2200);
    } catch {
      window.location.href = `mailto:${PORTFOLIO_PROFILE.email}`;
    }
  };

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

  const featuredProject = visibleProjects[0] ?? null;
  const secondaryProjects = visibleProjects.slice(1);

  return (
    <div
      id="tech"
      ref={scrollRef}
      className="view-layer view-scroll"
      inert={activeView !== 'tech'}
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
        {/* Portfolio Hero — Visual Developer Identity + Project File Index */}
        <section
          aria-label="Developer introduction"
          className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch"
        >
          {/* Left Identity Block */}
          <div className="lg:col-span-7 tech-card flex flex-col justify-between gap-6">
            <div>
              <div className="font-mono-tech text-[11.5px] font-medium text-[#4b4f55] flex items-center gap-2 whitespace-nowrap">
                <span className="font-bold text-[#111111]">Software Developer</span>
                <span aria-hidden="true">·</span>
                <span>{PORTFOLIO_PROFILE.location}</span>
              </div>

              <h1 className="tech-h1">
                {PORTFOLIO_PROFILE.firstName}{' '}
                <span>{PORTFOLIO_PROFILE.lastName}</span>
              </h1>

              <p className="text-[16px] sm:text-[17px] leading-[1.55] text-[#22252a] max-w-[56ch] m-0">
                Building practical, database-backed software across Android, desktop, and SQL — designed for real workflows and clean codebases.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => scrollToSection('tech-projects')}
                className="inline-flex items-center gap-2 font-mono-tech text-[12px] font-bold uppercase px-4 py-2.5 border border-[#111111] bg-[#ffc400] text-[#111111] shadow-[3px_3px_0_#111111] cursor-pointer hover:-translate-x-px hover:-translate-y-px transition-transform whitespace-nowrap shrink-0"
              >
                <span>Browse Project Files</span>
                <ArrowDown className="w-3.5 h-3.5" aria-hidden="true" />
              </button>

              <a
                href={PORTFOLIO_PROFILE.githubUrl}
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

          {/* Right Directory Index Window */}
          <aside
            aria-label="Project file directory"
            className="lg:col-span-5 bg-white border border-[#111111] shadow-[4px_5px_0_#111111] flex flex-col overflow-hidden"
          >
            <div className="flex items-center justify-between gap-2 px-4 py-2.5 bg-[#111111] text-white">
              <div className="flex items-center gap-2 min-w-0">
                <FolderOpen className="w-3.5 h-3.5 text-[#ffc400] shrink-0" aria-hidden="true" />
                <span className="font-mono-tech text-[11.5px] font-bold truncate">
                  tarun-suthar / projects
                </span>
              </div>
              <span className="font-mono-tech text-[10.5px] text-white/70 shrink-0 tabular-nums">
                {PROJECTS.length} files
              </span>
            </div>

            <div className="divide-y divide-[#111111]/12 flex-1 flex flex-col justify-center">
              {PROJECTS.map((project) => (
                <button
                  key={project.id}
                  type="button"
                  onClick={() => handleOpenModal(project, 'preview')}
                  className="group w-full text-left px-4 py-3.5 flex items-center justify-between gap-3 hover:bg-[#ffc400]/22 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <DirectoryRowIcon ext={project.fileExt} />
                    <div className="min-w-0">
                      <div className="font-mono-tech text-[12.5px] font-bold text-[#111111] truncate group-hover:underline">
                        {project.fileName}
                      </div>
                      <div className="text-[12.5px] text-[#4b4f55] truncate">
                        {project.title} · {project.fileTypeLabel}
                      </div>
                    </div>
                  </div>
                  <span className="font-mono-tech text-[10.5px] font-bold uppercase text-[#111111] shrink-0 opacity-75 group-hover:opacity-100">
                    Preview →
                  </span>
                </button>
              ))}
            </div>

            <div className="px-4 py-2.5 bg-[#f9faf9] border-t border-[#111111]/15 flex items-center justify-between gap-2 font-mono-tech text-[11px] text-[#4b4f55]">
              <span className="truncate">Select a file to preview</span>
              <span className="text-[#111111] font-bold whitespace-nowrap shrink-0">
                .apk · .jar · .py
              </span>
            </div>
          </aside>
        </section>

        {/* Infinite Moving Tech Stack Logo Strip */}
        <TechStackMarquee />

        {/* Visual Project Files Showcase */}
        <section id="tech-projects" aria-labelledby="projects-heading" className="space-y-6 pt-2">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2
                id="projects-heading"
                className="text-[28px] sm:text-[34px] font-bold tracking-[-0.035em] leading-none text-[#111111]"
              >
                Project Files
              </h2>
              <p className="mt-1.5 text-[14.5px] text-[#4b4f55] m-0">
                Visual walkthroughs, interactive previews, and source repositories.
              </p>
            </div>

            {/* Interactive File Extension Filter */}
            <div
              className="flex flex-wrap items-center gap-1.5"
              role="group"
              aria-label="Filter projects by file type"
            >
              {(
                [
                  { id: 'all', label: `All Files (${fileCounts.all})` },
                  { id: '.apk', label: `.apk (${fileCounts['.apk']})` },
                  { id: '.jar', label: `.jar (${fileCounts['.jar']})` },
                  { id: '.py', label: `.py (${fileCounts['.py']})` },
                ] as const
              ).map((tab) => {
                const active = fileFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setFileFilter(tab.id)}
                    aria-pressed={active}
                    className={`font-mono-tech text-[11px] font-bold px-3 py-1.5 border border-[#111111] cursor-pointer transition-colors whitespace-nowrap shrink-0 ${
                      active
                        ? 'bg-[#111111] text-[#ffc400] shadow-[2px_2px_0_#ffc400]'
                        : 'bg-white text-[#111111] hover:bg-[#ffc400]/35'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Featured File Card + 2-Column File Grid */}
          <div className="space-y-6">
            {featuredProject && (
              <ProjectFileCard
                project={featuredProject}
                featured
                onOpenModal={handleOpenModal}
              />
            )}

            {secondaryProjects.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
                {secondaryProjects.map((project) => (
                  <ProjectFileCard
                    key={project.id}
                    project={project}
                    onOpenModal={handleOpenModal}
                  />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Compact Contact Footer */}
        <section id="tech-contact" className="tech-card is-dark mt-2">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-5">
            <div>
              <div className="font-mono-tech text-[11px] uppercase tracking-[0.14em] text-[#ffc400]">
                Contact
              </div>
              <h2 className="tech-h2 text-white mt-1.5 mb-0">
                Let’s build something practical.
              </h2>
            </div>

            <div className="tech-btn-bar flex flex-wrap gap-2.5">
              <a href={`mailto:${PORTFOLIO_PROFILE.email}`}>Email</a>
              <button
                type="button"
                onClick={handleCopyEmail}
                className="inline-flex items-center gap-1.5"
              >
                {copiedEmail ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-[#0f5c3f]" aria-hidden="true" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Copy Email</span>
                  </>
                )}
              </button>
              <a
                href={PORTFOLIO_PROFILE.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                GitHub ↗
              </a>
              <a
                href={PORTFOLIO_PROFILE.linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                LinkedIn ↗
              </a>
              <button type="button" onClick={() => setResumeOpen(true)}>
                Resume PDF
              </button>
            </div>
          </div>
        </section>

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
