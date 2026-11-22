import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowLeft, ArrowRight, ArrowUpRight, CheckCircle2 } from 'lucide-react';
import { ProjectItem } from '../data/portfolio';
import { formatProjectIndex } from '../lib/editorialProjects';
import {
  buildProjectHash,
  getAdjacentProjects,
  resolveProjectCaseStudy,
} from '../lib/projectCaseStudy';
import { resolveProjectPreviewMode } from '../lib/techPortfolio';
import { InteractiveProjectWorkbench } from './ProjectModal';

interface ProjectDetailPageProps {
  project: ProjectItem | null;
  projects: readonly ProjectItem[];
  isOpen: boolean;
  onBackToProjects: () => void;
  onSelectProject: (project: ProjectItem) => void;
}

const DETAIL_EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];
const INTERACTIVE_WORKBENCH_IDS = new Set(['order-analyzer', 'pixault', 'employee-management']);

interface RevealBlockProps {
  children: React.ReactNode;
  scrollContainerRef: React.RefObject<HTMLDivElement | null>;
  resetKey: string;
  delay?: number;
  className?: string;
}

const EditorialRevealBlock: React.FC<RevealBlockProps> = ({
  children,
  scrollContainerRef,
  resetKey,
  delay = 0,
  className = '',
}) => {
  const prefersReduced = useReducedMotion();
  const blockRef = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState<boolean>(() => Boolean(prefersReduced));

  useEffect(() => {
    setVisible(Boolean(prefersReduced));
  }, [resetKey, prefersReduced]);

  useEffect(() => {
    if (prefersReduced || visible) return;
    const node = blockRef.current;
    const root = scrollContainerRef.current;
    if (!node) return;

    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting || entry.intersectionRatio > 0.06)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      {
        root: root ?? null,
        rootMargin: '0px 0px -6% 0px',
        threshold: [0.06, 0.16],
      }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [prefersReduced, visible, scrollContainerRef, resetKey]);

  return (
    <motion.div
      ref={blockRef}
      className={className}
      initial={prefersReduced ? false : { opacity: 0, y: 20 }}
      animate={visible ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{
        duration: prefersReduced ? 0 : 0.6,
        delay: prefersReduced ? 0 : delay,
        ease: DETAIL_EASE,
      }}
    >
      {children}
    </motion.div>
  );
};

export const ProjectDetailPage: React.FC<ProjectDetailPageProps> = ({
  project,
  projects,
  isOpen,
  onBackToProjects,
  onSelectProject,
}) => {
  const prefersReduced = useReducedMotion();
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => {
    setImgFailed(false);
    if (isOpen && scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [project?.id, isOpen]);

  // Escape key returns to Selected Projects
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') {
        ev.preventDefault();
        onBackToProjects();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onBackToProjects]);

  const caseStudy = useMemo(
    () => (project ? resolveProjectCaseStudy(project) : null),
    [project]
  );

  const adjacent = useMemo(
    () => (project ? getAdjacentProjects(projects, project.id) : null),
    [projects, project]
  );

  const previewMode = project ? resolveProjectPreviewMode(project) : 'workbench';
  const indexLabel = adjacent && adjacent.index >= 0 ? formatProjectIndex(adjacent.index) : '01';
  const totalLabel = formatProjectIndex(Math.max(0, projects.length - 1));
  const hasWorkbench = project ? INTERACTIVE_WORKBENCH_IDS.has(project.id) : false;

  return (
    <div
      id="project-detail"
      ref={scrollRef}
      className="view-layer view-scroll"
      inert={!isOpen}
      aria-hidden={!isOpen}
      aria-label={project ? `${project.title} case study` : 'Project case study'}
    >
      {project && caseStudy && (
        <>
          {/* Full-Bleed Sticky Top Editorial Bar */}
          <header className="sticky top-0 z-20 w-full bg-[#f4f4f1]/94 backdrop-blur-md border-b border-[#111111]/15">
            <div className="project-detail-header-inner flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={onBackToProjects}
                className="inline-flex items-center gap-2 font-mono-tech text-[11.5px] font-bold uppercase tracking-[0.08em] px-3.5 py-2 border border-[#111111] bg-white text-[#111111] shadow-[2px_2px_0_#111111] hover:bg-[#ffc400] hover:-translate-x-px hover:-translate-y-px transition-all cursor-pointer whitespace-nowrap"
              >
                <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Back to Projects</span>
              </button>

              <div className="hidden md:flex items-center gap-2.5 font-mono-tech text-[11.5px] text-[#4b4f55]">
                <span className="font-bold text-[#111111] tabular-nums">
                  {indexLabel} / {totalLabel}
                </span>
                <span aria-hidden="true">·</span>
                <span>{project.fileName}</span>
              </div>

              <div className="flex items-center gap-2.5">
                {previewMode === 'external' && project.liveUrl && (
                  <a
                    href={project.liveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 font-mono-tech text-[11.5px] font-bold uppercase px-3.5 py-2 border border-[#111111] bg-[#ffc400] text-[#111111] shadow-[2px_2px_0_#111111] hover:bg-[#111111] hover:text-[#ffc400] transition-colors whitespace-nowrap"
                  >
                    <span>Live Site</span>
                    <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
                  </a>
                )}
                <a
                  href={project.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 font-mono-tech text-[11.5px] font-bold uppercase px-3.5 py-2 border border-[#111111] bg-white text-[#111111] shadow-[2px_2px_0_#111111] hover:bg-[#111111] hover:text-[#ffc400] transition-colors whitespace-nowrap"
                >
                  <span>GitHub</span>
                  <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
                </a>
              </div>
            </div>
          </header>

          <div className="project-detail-wrap">
            <main className="pt-10 sm:pt-14 pb-20">
            {/* Hero Section */}
            <motion.section
              key={`hero-${project.id}`}
              aria-labelledby="project-detail-title"
              initial={prefersReduced ? false : { opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: prefersReduced ? 0 : 0.55, ease: DETAIL_EASE }}
            >
              <div className="flex flex-wrap items-center gap-2.5 font-mono-tech text-[12px] text-[#4b4f55]">
                <span className="inline-flex items-center px-2 py-0.5 bg-[#ffc400] text-[#111111] font-bold border border-[#111111] tabular-nums">
                  {indexLabel}
                </span>
                <span className="font-bold text-[#111111]">{project.fileTypeLabel}</span>
                <span aria-hidden="true">·</span>
                <span>{project.platform}</span>
              </div>

              <h1
                id="project-detail-title"
                className="mt-5 mb-0 text-[40px] sm:text-[60px] lg:text-[78px] font-extrabold tracking-[-0.05em] leading-[0.94] text-[#111111] text-balance"
              >
                {project.title}
              </h1>

              <p className="mt-6 text-[17px] sm:text-[19px] leading-[1.6] text-[#22252a] max-w-[60ch] m-0">
                {project.summary}
              </p>

              {/* Clean Hairline Spec Row (Zero Cards, Zero Pills) */}
              <div className="mt-8 pt-5 pb-5 border-y border-[#111111]/20 grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div>
                  <div className="font-mono-tech text-[10.5px] font-bold uppercase tracking-[0.14em] text-[#4b4f55]">
                    Scope
                  </div>
                  <div className="mt-1.5 text-[14.5px] font-semibold text-[#111111]">
                    {caseStudy.scopeLabel}
                  </div>
                </div>
                <div>
                  <div className="font-mono-tech text-[10.5px] font-bold uppercase tracking-[0.14em] text-[#4b4f55]">
                    Deliverable
                  </div>
                  <div className="mt-1.5 text-[14.5px] font-semibold text-[#111111]">
                    {caseStudy.deliverableLabel}
                  </div>
                </div>
                <div>
                  <div className="font-mono-tech text-[10.5px] font-bold uppercase tracking-[0.14em] text-[#4b4f55]">
                    Technology
                  </div>
                  <div className="mt-1.5 font-mono-tech text-[12.5px] font-medium text-[#111111] leading-snug">
                    {project.stack.join(' · ')}
                  </div>
                </div>
              </div>

              {/* Hero Visual Showcase */}
              <figure className="mt-10 m-0">
                <div className="relative overflow-hidden border border-[#111111] bg-[#16181d] aspect-[16/10] max-h-[580px] w-full">
                  {!imgFailed ? (
                    <motion.img
                      src={project.previewImage}
                      alt={project.previewAlt}
                      referrerPolicy="no-referrer"
                      onError={() => setImgFailed(true)}
                      initial={prefersReduced ? false : { scale: 1.035 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: prefersReduced ? 0 : 0.85, ease: DETAIL_EASE }}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div
                      className="w-full h-full flex flex-col items-center justify-center p-8 text-white text-center"
                      style={{ background: project.fallbackGradient }}
                    >
                      <span className="font-mono-tech text-xs uppercase tracking-[0.14em] text-[#ffc400]">
                        {project.fileName}
                      </span>
                      <span className="mt-2 text-3xl font-bold tracking-[-0.03em]">
                        {project.title}
                      </span>
                    </div>
                  )}
                </div>
                <figcaption className="mt-3 flex flex-wrap items-baseline justify-between gap-4 font-mono-tech text-[11.5px] text-[#4b4f55]">
                  <span>{project.demonstrates}</span>
                  <span className="text-[#111111] font-medium">{project.fileName}</span>
                </figcaption>
              </figure>
            </motion.section>

            {/* 3.1 The Challenge / The Solution — Premium Two-Column Editorial Split */}
            <section
              aria-label="The challenge and the solution"
              className="mt-16 sm:mt-24 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16"
            >
              <EditorialRevealBlock
                scrollContainerRef={scrollRef}
                resetKey={project.id}
                delay={0}
                className="border-t border-[#111111]/25 pt-6"
              >
                <div className="flex items-center gap-2.5 font-mono-tech text-[11px] font-bold uppercase tracking-[0.15em] text-[#111111]">
                  <span
                    className="inline-block w-2.5 h-2.5 bg-[#ffc400] border border-[#111111] shrink-0"
                    aria-hidden="true"
                  />
                  <span>The Challenge</span>
                </div>
                <h2 className="mt-5 mb-0 text-[26px] sm:text-[32px] lg:text-[36px] font-bold tracking-[-0.035em] leading-[1.12] text-[#111111] text-balance">
                  {caseStudy.challengeHeading}
                </h2>
                <p className="mt-5 mb-0 text-[16px] leading-[1.72] text-[#2c3036] max-w-[46ch]">
                  {caseStudy.challengeBody}
                </p>
              </EditorialRevealBlock>

              <EditorialRevealBlock
                scrollContainerRef={scrollRef}
                resetKey={project.id}
                delay={0.09}
                className="border-t border-[#111111]/25 pt-6"
              >
                <div className="flex items-center gap-2.5 font-mono-tech text-[11px] font-bold uppercase tracking-[0.15em] text-[#111111]">
                  <span
                    className="inline-block w-2.5 h-2.5 bg-[#0f5c3f] border border-[#111111] shrink-0"
                    aria-hidden="true"
                  />
                  <span>The Solution</span>
                </div>
                <h2 className="mt-5 mb-0 text-[26px] sm:text-[32px] lg:text-[36px] font-bold tracking-[-0.035em] leading-[1.12] text-[#111111] text-balance">
                  {caseStudy.solutionHeading}
                </h2>
                <p className="mt-5 mb-0 text-[16px] leading-[1.72] text-[#2c3036] max-w-[46ch]">
                  {caseStudy.solutionBody}
                </p>
              </EditorialRevealBlock>
            </section>

            {/* 3.2 The Project — Spacious Asymmetric Editorial Overview & Architecture */}
            <section
              aria-labelledby="case-study-project-heading"
              className="mt-20 sm:mt-28 pt-12 sm:pt-16 border-t border-[#111111]/25"
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
                <EditorialRevealBlock
                  scrollContainerRef={scrollRef}
                  resetKey={project.id}
                  delay={0}
                  className="lg:col-span-5"
                >
                  <div className="font-mono-tech text-[11px] font-bold uppercase tracking-[0.15em] text-[#4b4f55]">
                    Architecture &amp; Approach
                  </div>
                  <h2
                    id="case-study-project-heading"
                    className="mt-3 mb-0 text-[38px] sm:text-[48px] lg:text-[54px] font-extrabold tracking-[-0.045em] leading-[0.98] text-[#111111]"
                  >
                    {caseStudy.overviewHeading}
                  </h2>

                  <div className="mt-8 pt-6 border-t border-[#111111]/15 space-y-4">
                    <div>
                      <div className="font-mono-tech text-[10.5px] uppercase tracking-[0.14em] text-[#4b4f55]">
                        Data Flow
                      </div>
                      <p className="mt-1.5 mb-0 font-mono-tech text-[12.5px] leading-[1.6] text-[#111111] font-medium border-l-2 border-[#ffc400] pl-3.5">
                        {project.architecture.dataFlow}
                      </p>
                    </div>
                  </div>
                </EditorialRevealBlock>

                <EditorialRevealBlock
                  scrollContainerRef={scrollRef}
                  resetKey={project.id}
                  delay={0.08}
                  className="lg:col-span-7 space-y-6"
                >
                  {caseStudy.overviewBody.map((paragraph) => (
                    <p
                      key={paragraph}
                      className="m-0 text-[16.5px] sm:text-[17.5px] leading-[1.74] text-[#22252a] max-w-[58ch]"
                    >
                      {paragraph}
                    </p>
                  ))}

                  {/* Clean Hairline-Separated System Layers (No Nested Cards) */}
                  <div className="pt-6">
                    <div className="font-mono-tech text-[11px] font-bold uppercase tracking-[0.15em] text-[#4b4f55] mb-3">
                      System Layers
                    </div>
                    <ol className="m-0 p-0 list-none border-t border-[#111111]/20 divide-y divide-[#111111]/15">
                      {project.architecture.layers.map((layer, layerIdx) => (
                        <li
                          key={layer.name}
                          className="py-4 grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-4 items-baseline"
                        >
                          <div className="sm:col-span-5 flex items-baseline gap-3">
                            <span className="font-mono-tech text-[11px] font-bold text-[#0f5c3f] tabular-nums">
                              {formatProjectIndex(layerIdx)}
                            </span>
                            <span className="font-bold text-[15px] text-[#111111]">
                              {layer.name}
                            </span>
                          </div>
                          <p className="sm:col-span-7 m-0 text-[14.5px] leading-[1.58] text-[#3a3f46]">
                            {layer.role}
                          </p>
                        </li>
                      ))}
                    </ol>
                  </div>
                </EditorialRevealBlock>
              </div>
            </section>

            {/* 3.3 The Outcome — Verified Capabilities & Interactive Preview (No Fabricated Testimonials) */}
            <section
              aria-labelledby="case-study-outcome-heading"
              className="mt-20 sm:mt-28 pt-12 sm:pt-16 border-t border-[#111111]/25"
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
                <EditorialRevealBlock
                  scrollContainerRef={scrollRef}
                  resetKey={project.id}
                  delay={0}
                  className="lg:col-span-5"
                >
                  <div className="flex items-center gap-2 font-mono-tech text-[11px] font-bold uppercase tracking-[0.15em] text-[#0f5c3f]">
                    <span
                      className="inline-block w-2.5 h-2.5 bg-[#0f5c3f] border border-[#111111]"
                      aria-hidden="true"
                    />
                    <span>Delivered Results</span>
                  </div>
                  <h2
                    id="case-study-outcome-heading"
                    className="mt-3 mb-0 text-[38px] sm:text-[48px] lg:text-[54px] font-extrabold tracking-[-0.045em] leading-[0.98] text-[#111111]"
                  >
                    {caseStudy.outcomeHeading}
                  </h2>
                  <p className="mt-5 mb-0 text-[16px] leading-[1.68] text-[#2c3036] max-w-[40ch]">
                    {caseStudy.outcomeSummary}
                  </p>
                </EditorialRevealBlock>

                <EditorialRevealBlock
                  scrollContainerRef={scrollRef}
                  resetKey={project.id}
                  delay={0.08}
                  className="lg:col-span-7 space-y-8"
                >
                  <ul className="m-0 p-0 list-none border-t border-[#111111]/20 divide-y divide-[#111111]/15">
                    {caseStudy.deliveredPoints.map((point) => (
                      <li key={point} className="py-4 flex items-start gap-3.5">
                        <CheckCircle2
                          className="w-4 h-4 text-[#0f5c3f] shrink-0 mt-1"
                          aria-hidden="true"
                        />
                        <span className="text-[15.5px] leading-[1.6] text-[#111111] font-medium">
                          {point}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {project.architecture.engineeringNotes.length > 0 && (
                    <div className="border-l-2 border-[#111111] pl-5 space-y-2.5">
                      <div className="font-mono-tech text-[10.5px] font-bold uppercase tracking-[0.14em] text-[#4b4f55]">
                        Engineering Notes
                      </div>
                      {project.architecture.engineeringNotes.map((note) => (
                        <p
                          key={note}
                          className="m-0 text-[14.5px] leading-[1.62] text-[#3a3f46]"
                        >
                          {note}
                        </p>
                      ))}
                    </div>
                  )}
                </EditorialRevealBlock>
              </div>

              {/* Embedded Interactive Preview Workbench for Core Projects */}
              {hasWorkbench && (
                <EditorialRevealBlock
                  scrollContainerRef={scrollRef}
                  resetKey={project.id}
                  delay={0.12}
                  className="mt-14 pt-10 border-t border-[#111111]/15"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-3 mb-4">
                    <div>
                      <div className="font-mono-tech text-[11px] font-bold uppercase tracking-[0.14em] text-[#4b4f55]">
                        Interactive Sandbox
                      </div>
                      <h3 className="mt-1 mb-0 text-[22px] sm:text-[26px] font-bold tracking-[-0.03em] text-[#111111]">
                        Try the {project.title} workflow
                      </h3>
                    </div>
                    <a
                      href={project.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="editorial-inline-link inline-flex items-center gap-1.5 font-mono-tech text-[12px] font-bold uppercase text-[#111111] py-1"
                    >
                      <span>Explore Source on GitHub</span>
                      <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
                    </a>
                  </div>

                  <InteractiveProjectWorkbench projectId={project.id} idPrefix="detail" />
                </EditorialRevealBlock>
              )}
            </section>

            {/* Footer Case Study Navigation */}
            <nav
              aria-label="Adjacent projects"
              className="mt-20 sm:mt-24 pt-10 border-t-2 border-[#111111] grid grid-cols-1 sm:grid-cols-2 gap-6"
            >
              {adjacent?.prev ? (
                <a
                  href={buildProjectHash(adjacent.prev.id)}
                  onClick={(ev) => {
                    ev.preventDefault();
                    onSelectProject(adjacent.prev!);
                  }}
                  className="group block border border-[#111111] bg-[#f9faf9] p-6 shadow-[3px_3px_0_#111111] hover:bg-[#ffc400] transition-colors no-underline"
                >
                  <div className="flex items-center gap-2 font-mono-tech text-[11px] font-bold uppercase tracking-[0.12em] text-[#4b4f55] group-hover:text-[#111111]">
                    <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1" />
                    <span>Previous Project</span>
                  </div>
                  <div className="mt-2.5 text-[22px] sm:text-[26px] font-extrabold tracking-[-0.035em] text-[#111111]">
                    {adjacent.prev.title}
                  </div>
                  <div className="mt-1 font-mono-tech text-[11.5px] text-[#4b4f55] group-hover:text-[#111111]">
                    {adjacent.prev.platform}
                  </div>
                </a>
              ) : (
                <div />
              )}

              {adjacent?.next && (
                <a
                  href={buildProjectHash(adjacent.next.id)}
                  onClick={(ev) => {
                    ev.preventDefault();
                    onSelectProject(adjacent.next!);
                  }}
                  className="group block border border-[#111111] bg-[#f9faf9] p-6 shadow-[3px_3px_0_#111111] hover:bg-[#ffc400] transition-colors text-left sm:text-right no-underline"
                >
                  <div className="flex items-center sm:justify-end gap-2 font-mono-tech text-[11px] font-bold uppercase tracking-[0.12em] text-[#4b4f55] group-hover:text-[#111111]">
                    <span>Next Project</span>
                    <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                  </div>
                  <div className="mt-2.5 text-[22px] sm:text-[26px] font-extrabold tracking-[-0.035em] text-[#111111]">
                    {adjacent.next.title}
                  </div>
                  <div className="mt-1 font-mono-tech text-[11.5px] text-[#4b4f55] group-hover:text-[#111111]">
                    {adjacent.next.platform}
                  </div>
                </a>
              )}
            </nav>
            </main>
          </div>
        </>
      )}
    </div>
  );
};
