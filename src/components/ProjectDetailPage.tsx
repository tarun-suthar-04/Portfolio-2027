import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowLeft, ArrowRight, ArrowUpRight } from 'lucide-react';
import { ProjectItem } from '../data/portfolio';
import { formatProjectIndex } from '../lib/editorialProjects';
import { buildProjectHash, getAdjacentProjects } from '../lib/projectCaseStudy';

interface ProjectDetailPageProps {
  project: ProjectItem | null;
  projects: readonly ProjectItem[];
  isOpen: boolean;
  onBackToProjects: () => void;
  onSelectProject: (project: ProjectItem) => void;
}

const DETAIL_EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];
const GALLERY_CROPS = [
  { label: 'Overview', className: 'col-span-2 row-span-2' },
  { label: 'View 2', className: '' },
  { label: 'View 3', className: '' },
  { label: 'View 4', className: '' },
  { label: 'View 5', className: '' },
];

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
    if (isOpen && scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [project?.id, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onBackToProjects();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onBackToProjects]);

  const adjacent = useMemo(
    () => (project ? getAdjacentProjects(projects, project.id) : null),
    [projects, project]
  );
  const indexLabel = adjacent && adjacent.index >= 0 ? formatProjectIndex(adjacent.index) : '01';
  const totalLabel = formatProjectIndex(Math.max(0, projects.length - 1));

  return (
    <div
      id="project-detail"
      ref={scrollRef}
      className="view-layer view-scroll"
      inert={!isOpen}
      aria-hidden={!isOpen}
      aria-label={project ? `${project.title} project details` : 'Project details'}
    >
      {project && (
        <>
          <header className="sticky top-0 z-20 w-full bg-[#f4f4f1]/94 backdrop-blur-md border-b border-[#111111]/15">
            <div className="project-detail-header-inner flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={onBackToProjects}
                className="inline-flex items-center gap-2 font-mono-tech text-[11.5px] font-bold uppercase tracking-[0.08em] px-3.5 py-2 border border-[#111111] bg-white text-[#111111] shadow-[2px_2px_0_#111111] hover:bg-[#ffc400] transition-colors cursor-pointer whitespace-nowrap"
              >
                <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Back to Projects</span>
              </button>
              <div className="hidden md:flex items-center gap-2.5 font-mono-tech text-[11.5px] text-[#4b4f55]">
                <span className="font-bold text-[#111111] tabular-nums">{indexLabel} / {totalLabel}</span>
                <span aria-hidden="true">·</span>
                <span>{project.platform}</span>
              </div>
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
          </header>

          <div className="project-detail-wrap">
            <main className="pt-10 sm:pt-14 pb-20">
              <motion.section
                key={project.id}
                initial={prefersReduced ? false : { opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: prefersReduced ? 0 : 0.5, ease: DETAIL_EASE }}
                aria-labelledby="project-detail-title"
              >
                <div className="flex flex-wrap items-center gap-2.5 font-mono-tech text-[12px] text-[#4b4f55]">
                  <span className="inline-flex items-center px-2 py-0.5 bg-[#ffc400] text-[#111111] font-bold border border-[#111111] tabular-nums">
                    {indexLabel}
                  </span>
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
              </motion.section>

              <section aria-label={`${project.title} screenshots`} className="mt-10 sm:mt-14">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 auto-rows-[130px] sm:auto-rows-[170px] lg:auto-rows-[190px]">
                  {GALLERY_CROPS.map((crop, index) => (
                    <figure
                      key={crop.label}
                      className={`relative overflow-hidden border border-[#111111] bg-[#16181d] m-0 ${crop.className}`}
                    >
                      {!imgFailed ? (
                        <img
                          src={project.previewImage}
                          alt={`${project.title} ${crop.label.toLowerCase()} crop from the project preview`}
                          referrerPolicy="no-referrer"
                          onError={() => setImgFailed(true)}
                          className="w-full h-full object-contain"
                          style={{ background: project.fallbackGradient }}
                        />
                      ) : (
                        <div
                          className="w-full h-full flex items-center justify-center p-4 text-center text-white"
                          style={{ background: project.fallbackGradient }}
                        >
                          <span className="text-lg font-bold">{project.title}</span>
                        </div>
                      )}
                      <figcaption className="absolute bottom-2 left-2 px-2 py-1 bg-[#111111]/85 text-white font-mono-tech text-[10px] sm:text-[11px]">
                        {String(index + 1).padStart(2, '0')} · {crop.label}
                      </figcaption>
                    </figure>
                  ))}
                </div>
              </section>

              <section className="mt-16 sm:mt-20 grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
                <div className="border-t border-[#111111]/25 pt-5">
                  <h2 className="mt-0 mb-4 text-[26px] sm:text-[32px] font-bold tracking-[-0.035em] text-[#111111]">
                    What it does
                  </h2>
                  <p className="m-0 text-[16px] leading-[1.72] text-[#2c3036] max-w-[52ch]">
                    {project.summary}
                  </p>
                </div>
                <div className="border-t border-[#111111]/25 pt-5">
                  <h2 className="mt-0 mb-4 text-[26px] sm:text-[32px] font-bold tracking-[-0.035em] text-[#111111]">
                    Key features
                  </h2>
                  <ul className="m-0 p-0 list-none border-t border-[#111111]/15 divide-y divide-[#111111]/15">
                    {project.highlights.slice(0, 4).map((highlight) => (
                      <li key={highlight} className="py-3 text-[15px] leading-[1.6] text-[#22252a]">
                        {highlight}
                      </li>
                    ))}
                  </ul>
                </div>
              </section>

              <nav
                aria-label="Other projects"
                className="mt-20 sm:mt-24 pt-10 border-t-2 border-[#111111] grid grid-cols-1 sm:grid-cols-2 gap-6"
              >
                {adjacent?.prev ? (
                  <a
                    href={buildProjectHash(adjacent.prev.id)}
                    onClick={(event) => {
                      event.preventDefault();
                      onSelectProject(adjacent.prev!);
                    }}
                    className="group block border border-[#111111] bg-[#f9faf9] p-6 shadow-[3px_3px_0_#111111] hover:bg-[#ffc400] transition-colors no-underline"
                  >
                    <div className="flex items-center gap-2 font-mono-tech text-[11px] font-bold uppercase tracking-[0.12em] text-[#4b4f55] group-hover:text-[#111111]">
                      <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Previous Project</span>
                    </div>
                    <div className="mt-2.5 text-[22px] sm:text-[26px] font-extrabold tracking-[-0.035em] text-[#111111]">
                      {adjacent.prev.title}
                    </div>
                  </a>
                ) : <div />}
                {adjacent?.next && (
                  <a
                    href={buildProjectHash(adjacent.next.id)}
                    onClick={(event) => {
                      event.preventDefault();
                      onSelectProject(adjacent.next!);
                    }}
                    className="group block border border-[#111111] bg-[#f9faf9] p-6 shadow-[3px_3px_0_#111111] hover:bg-[#ffc400] transition-colors text-left sm:text-right no-underline"
                  >
                    <div className="flex items-center sm:justify-end gap-2 font-mono-tech text-[11px] font-bold uppercase tracking-[0.12em] text-[#4b4f55] group-hover:text-[#111111]">
                      <span>Next Project</span>
                      <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                    </div>
                    <div className="mt-2.5 text-[22px] sm:text-[26px] font-extrabold tracking-[-0.035em] text-[#111111]">
                      {adjacent.next.title}
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
