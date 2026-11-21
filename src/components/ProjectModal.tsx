import React, { useEffect } from 'react';
import { ArrowUpRight, Layers, X } from 'lucide-react';
import { ProjectItem } from '../data/portfolio';

interface ProjectModalProps {
  project: ProjectItem | null;
  onClose: () => void;
}

export const ProjectModal: React.FC<ProjectModalProps> = ({ project, onClose }) => {
  useEffect(() => {
    if (!project) return;
    const onKeyDown = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') {
        ev.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, [project, onClose]);

  if (!project) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="project-modal-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl max-h-[90dvh] overflow-y-auto bg-[#f9faf9] text-[#111111] border-2 border-[#111111] shadow-[6px_7px_0_#111111] p-6 md:p-8"
        onClick={(ev) => ev.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-[#111111]/20 pb-4">
          <div>
            <div className="font-mono-tech text-[11px] uppercase tracking-[0.14em] text-[#4b4f55] flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-[#0f5c3f]" aria-hidden="true" />
              <span>Architecture Breakdown · {project.subtitle}</span>
            </div>
            <h2
              id="project-modal-title"
              className="mt-1.5 text-2xl md:text-3xl font-bold tracking-[-0.03em]"
            >
              {project.title}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label={`Close ${project.title} architecture details`}
            className="shrink-0 w-9 h-9 grid place-items-center border border-[#111111] bg-white hover:bg-[#ffc400] transition-colors cursor-pointer shadow-[2px_2px_0_#111111]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="mt-4 text-[14.5px] leading-relaxed text-[#33373d]">{project.summary}</p>

        {/* Data Flow Strip */}
        <div className="mt-5 border border-[#111111] bg-[#ffc400]/25 p-3.5">
          <div className="font-mono-tech text-[10px] font-bold uppercase tracking-[0.14em] text-[#111111]">
            System Data Flow
          </div>
          <div className="mt-1.5 font-mono-tech text-xs md:text-[13px] font-medium text-[#111111] leading-relaxed">
            {project.architecture.dataFlow}
          </div>
        </div>

        {/* Layers */}
        <div className="mt-5">
          <div className="font-mono-tech text-[10px] font-bold uppercase tracking-[0.14em] text-[#4b4f55] mb-2.5">
            Component Layers
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {project.architecture.layers.map((layer, index) => (
              <div
                key={layer.name}
                className="border border-[#111111] bg-white p-3.5 shadow-[2px_2px_0_#111111]"
              >
                <div className="font-mono-tech text-[10px] text-[#0f5c3f] font-bold">
                  0{index + 1} · {layer.name}
                </div>
                <p className="mt-1 text-[13px] leading-snug text-[#33373d]">{layer.role}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Engineering Notes */}
        <div className="mt-5">
          <div className="font-mono-tech text-[10px] font-bold uppercase tracking-[0.14em] text-[#4b4f55] mb-2">
            Implementation Notes
          </div>
          <ul className="list-disc pl-5 space-y-1.5 text-[13.5px] text-[#33373d]">
            {project.architecture.engineeringNotes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </div>

        {/* Footer actions */}
        <div className="mt-6 pt-4 border-t border-[#111111]/20 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {project.stack.map((tech) => (
              <span key={tech} className="tech-chip-tag">
                {tech}
              </span>
            ))}
          </div>
          <a
            href={project.githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 font-mono-tech text-xs font-bold uppercase px-4 py-2.5 border border-[#111111] bg-[#ffc400] text-[#111111] shadow-[3px_3px_0_#111111] hover:translate-x-[-1px] hover:translate-y-[-1px] transition-transform"
          >
            <span>View on GitHub</span>
            <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
          </a>
        </div>
      </div>
    </div>
  );
};
