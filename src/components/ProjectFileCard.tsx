import React, { useState } from 'react';
import { ArrowUpRight, Eye, FileCode2, Layers, Package, Terminal } from 'lucide-react';
import { ProjectFileExt, ProjectItem } from '../data/portfolio';
import { resolveProjectPreviewMode } from '../lib/techPortfolio';

interface ProjectFileCardProps {
  project: ProjectItem;
  featured?: boolean;
  onOpenModal: (project: ProjectItem, initialTab: 'preview' | 'architecture') => void;
}

const FileExtIcon: React.FC<{ ext: ProjectFileExt }> = ({ ext }) => {
  switch (ext) {
    case '.apk':
      return <Package className="w-3.5 h-3.5 text-white shrink-0" aria-hidden="true" />;
    case '.jar':
      return <Terminal className="w-3.5 h-3.5 text-[#ffc400] shrink-0" aria-hidden="true" />;
    case '.py':
    default:
      return <FileCode2 className="w-3.5 h-3.5 text-white shrink-0" aria-hidden="true" />;
  }
};

const GitHubMark: React.FC = () => (
  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 shrink-0" fill="currentColor" aria-hidden="true">
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M12 2C6.48 2 2 6.58 2 12.26c0 4.53 2.87 8.37 6.84 9.73.5.09.68-.22.68-.49 0-.24-.01-.88-.01-1.72-2.78.62-3.37-1.37-3.37-1.37-.45-1.18-1.11-1.5-1.11-1.5-.91-.64.07-.63.07-.63 1 .07 1.53 1.05 1.53 1.05.9 1.57 2.36 1.12 2.94.86.09-.67.35-1.12.64-1.38-2.22-.26-4.56-1.14-4.56-5.08 0-1.12.39-2.04 1.03-2.76-.1-.26-.45-1.31.1-2.72 0 0 .84-.28 2.75 1.05A9.38 9.38 0 0 1 12 6.84c.85 0 1.71.12 2.51.35 1.91-1.33 2.75-1.05 2.75-1.05.55 1.41.2 2.46.1 2.72.64.72 1.03 1.64 1.03 2.76 0 3.95-2.34 4.82-4.57 5.07.36.32.68.94.68 1.9 0 1.37-.01 2.48-.01 2.82 0 .27.18.59.69.49A10.27 10.27 0 0 0 22 12.26C22 6.58 17.52 2 12 2Z"
    />
  </svg>
);

export const ProjectFileCard: React.FC<ProjectFileCardProps> = ({
  project,
  featured = false,
  onOpenModal,
}) => {
  const [imgFailed, setImgFailed] = useState(false);
  const previewMode = resolveProjectPreviewMode(project);

  return (
    <article
      id={`project-${project.id}`}
      data-testid={`project-file-card-${project.id}`}
      className="project-file-folder flex flex-col min-w-0"
    >
      {/* File Tab Ear + Shoulder Metadata */}
      <div className="flex items-end justify-between gap-3 pr-1">
        <div className="project-file-tab">
          <span
            className="inline-flex items-center justify-center w-5 h-5 border border-[#111111] shrink-0"
            style={{ backgroundColor: project.fileAccent }}
          >
            <FileExtIcon ext={project.fileExt} />
          </span>
          <span className="font-mono-tech text-[12px] font-bold text-[#111111] tracking-[-0.01em] truncate">
            {project.fileName}
          </span>
          <span
            className="font-mono-tech text-[10px] font-bold uppercase tracking-[0.08em] text-[#4b4f55] hidden sm:inline"
          >
            · {project.fileTypeLabel}
          </span>
        </div>

        <span className="font-mono-tech text-[11px] text-[#4b4f55] pb-1.5 hidden sm:inline whitespace-nowrap truncate">
          {project.platform}
        </span>
      </div>

      {/* Main File Window Body */}
      <div
        className={`project-file-shell bg-white border border-[#111111] shadow-[5px_6px_0_#111111] overflow-hidden ${
          featured ? 'grid grid-cols-1 lg:grid-cols-12 items-stretch' : 'flex flex-col flex-1'
        }`}
      >
        {/* Visual Project Preview Image */}
        <button
          type="button"
          onClick={() => onOpenModal(project, 'preview')}
          aria-label={`Open ${project.title} live preview`}
          className={`group relative block w-full text-left overflow-hidden bg-[#16181d] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffc400] ${
            featured
              ? 'lg:col-span-7 border-b lg:border-b-0 lg:border-r border-[#111111] aspect-[4/3] lg:aspect-auto lg:min-h-[360px]'
              : 'border-b border-[#111111] aspect-[4/3]'
          }`}
        >
          {!imgFailed ? (
            <img
              src={project.previewImage}
              alt={project.previewAlt}
              referrerPolicy="no-referrer"
              loading="lazy"
              onError={() => setImgFailed(true)}
              className="w-full h-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03]"
            />
          ) : (
            <div
              className="w-full h-full flex flex-col items-center justify-center p-6 text-white text-center"
              style={{ background: project.fallbackGradient }}
            >
              <span className="font-mono-tech text-xs uppercase tracking-[0.14em] text-[#ffc400]">
                {project.fileName}
              </span>
              <span className="mt-2 text-xl font-bold">{project.title}</span>
            </div>
          )}

          {/* Hover inspect badge */}
          <span className="pointer-events-none absolute top-3 right-3 z-10 font-mono-tech text-[10.5px] font-bold uppercase tracking-[0.08em] px-2.5 py-1 bg-[#111111]/88 text-[#ffc400] border border-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
            Open Preview ↗
          </span>

          {/* Subtle bottom contrast scrim */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/65 via-black/25 to-transparent"
          />
          <span className="pointer-events-none absolute bottom-3 left-3.5 right-3.5 font-mono-tech text-[11px] font-medium text-white/95 drop-shadow-sm truncate">
            {project.demonstrates}
          </span>
        </button>

        {/* Project Dossier Content */}
        <div
          className={`flex flex-col justify-between p-5 sm:p-6 ${
            featured ? 'lg:col-span-5' : 'flex-1'
          }`}
        >
          <div>
            <div className="font-mono-tech text-[11px] text-[#4b4f55] flex items-center gap-2">
              <span className="font-bold text-[#111111]">{project.fileExt.toUpperCase()}</span>
              <span aria-hidden="true">·</span>
              <span>{project.subtitle}</span>
            </div>

            <h3
              className={`mt-1.5 font-bold tracking-[-0.03em] text-[#111111] leading-[1.12] ${
                featured ? 'text-[26px] sm:text-[30px]' : 'text-[22px]'
              }`}
            >
              {project.title}
            </h3>

            <p className="mt-2.5 text-[14.5px] leading-[1.56] text-[#33373d]">
              {project.summary}
            </p>

            <ul className="mt-3.5 space-y-1.5 text-[13.5px] leading-[1.48] text-[#22252a] pl-4 list-disc">
              {project.highlights.map((bullet) => (
                <li key={bullet}>{bullet}</li>
              ))}
            </ul>
          </div>

          <div className="mt-5 pt-4 border-t border-[#111111]/15 space-y-3.5">
            {/* Unboxed stack line (Zero-Pill discipline) */}
            <div className="font-mono-tech text-[11.5px] text-[#4b4f55] leading-relaxed">
              {project.stack.join(' · ')}
            </div>

            {/* Action Row: Live Preview + GitHub Source + Architecture */}
            <div className="flex flex-wrap items-center gap-2.5">
              {previewMode === 'external' && project.liveUrl ? (
                <a
                  href={project.liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 font-mono-tech text-[11.5px] font-bold uppercase px-3.5 py-2 border border-[#111111] bg-[#ffc400] text-[#111111] shadow-[2px_2px_0_#111111] hover:-translate-x-px hover:-translate-y-px transition-transform whitespace-nowrap shrink-0"
                >
                  <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Live Preview</span>
                  <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
                </a>
              ) : (
                <button
                  type="button"
                  onClick={() => onOpenModal(project, 'preview')}
                  aria-label={`Live preview of ${project.title}`}
                  className="inline-flex items-center gap-1.5 font-mono-tech text-[11.5px] font-bold uppercase px-3.5 py-2 border border-[#111111] bg-[#ffc400] text-[#111111] shadow-[2px_2px_0_#111111] cursor-pointer hover:-translate-x-px hover:-translate-y-px transition-transform whitespace-nowrap shrink-0"
                >
                  <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Live Preview</span>
                </button>
              )}

              <a
                href={project.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`View ${project.title} source code on GitHub`}
                className="inline-flex items-center gap-1.5 font-mono-tech text-[11.5px] font-bold uppercase px-3.5 py-2 border border-[#111111] bg-white text-[#111111] shadow-[2px_2px_0_#111111] hover:bg-[#f4f4f1] hover:-translate-x-px hover:-translate-y-px transition-all whitespace-nowrap shrink-0"
              >
                <GitHubMark />
                <span>GitHub</span>
                <ArrowUpRight className="w-3 h-3" aria-hidden="true" />
              </a>

              <button
                type="button"
                onClick={() => onOpenModal(project, 'architecture')}
                aria-label={`Inspect ${project.title} architecture`}
                className="inline-flex items-center gap-1 font-mono-tech text-[11px] font-bold uppercase text-[#33373d] hover:text-[#0f5c3f] underline underline-offset-4 px-1.5 py-2 cursor-pointer whitespace-nowrap shrink-0"
              >
                <Layers className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Architecture</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
};
