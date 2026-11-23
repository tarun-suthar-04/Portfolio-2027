import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import type { ProjectItem } from '../data/portfolio';
import { buildProjectStripFrames, type ProjectStripFrame } from '../lib/editorialProjects';

interface ProjectHoverMediaStripProps {
  project: ProjectItem;
  isExpanded: boolean;
}

const StripFrameVisual: React.FC<{
  frame: ProjectStripFrame;
  imgFailed: boolean;
  onImgError: () => void;
}> = ({ frame, imgFailed, onImgError }) => {
  if (frame.kind === 'screen-primary' || frame.kind === 'screen-detail') {
    return (
      <div className="relative w-full h-full overflow-hidden bg-[#16181d]">
        {frame.imageSrc && !imgFailed ? (
          <img
            src={frame.imageSrc}
            alt=""
            referrerPolicy="no-referrer"
            loading="lazy"
            decoding="async"
            onError={onImgError}
            className="w-full h-full object-contain"
          />
        ) : (
          <div
            className="w-full h-full flex flex-col items-center justify-center p-3 text-center text-white"
            style={{ background: frame.fallbackGradient }}
          >
            <span className="font-mono-tech text-[9px] uppercase tracking-[0.1em] text-[#ffc400]">
              {frame.fileName}
            </span>
            <span className="mt-1 text-xs font-bold">{frame.title}</span>
          </div>
        )}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-[#111111]/88 via-[#111111]/45 to-transparent" />
        <span className="pointer-events-none absolute top-2 left-2 px-1.5 py-0.5 bg-[#111111]/90 text-[#ffc400] border border-white/15 font-mono-tech text-[8px] font-bold uppercase tracking-[0.08em]">
          {frame.index} · {frame.tag}
        </span>
        <div className="pointer-events-none absolute bottom-2 inset-x-2 flex items-baseline justify-between gap-2">
          <span className="text-[11px] font-bold text-white truncate">{frame.title}</span>
          <span className="font-mono-tech text-[9px] text-white/75 whitespace-nowrap shrink-0">
            {frame.caption}
          </span>
        </div>
      </div>
    );
  }

  if (frame.kind === 'architecture-flow') {
    const steps = frame.flowSteps ?? [];
    return (
      <div className="w-full h-full bg-[#f9faf9] p-2.5 flex flex-col justify-between text-[#111111]">
        <div className="flex items-center justify-between gap-1.5">
          <span className="font-mono-tech text-[8px] font-bold uppercase tracking-[0.08em] px-1 py-0.5 bg-[#ffc400] text-[#111111] border border-[#111111] whitespace-nowrap">
            {frame.index} · {frame.tag}
          </span>
          <span className="font-mono-tech text-[8px] text-[#4b4f55] truncate">{frame.caption}</span>
        </div>
        <div className="my-1 flex flex-wrap items-center gap-1">
          {steps.slice(0, 4).map((step, idx) => (
            <React.Fragment key={`${step}-${idx}`}>
              <span className="font-mono-tech text-[8px] font-semibold leading-tight px-1 py-0.5 border border-[#111111] bg-white text-[#111111]">
                {step}
              </span>
              {idx < Math.min(steps.length, 4) - 1 && (
                <ArrowRight className="w-2.5 h-2.5 text-[#0f5c3f] shrink-0" aria-hidden="true" />
              )}
            </React.Fragment>
          ))}
        </div>
        <div className="pt-1 border-t border-[#111111]/15 flex items-center justify-between font-mono-tech text-[8px] text-[#4b4f55]">
          <span className="font-bold text-[#111111] truncate">{frame.title}</span>
          <span className="truncate">{frame.fileName}</span>
        </div>
      </div>
    );
  }

  if (frame.kind === 'layers-blueprint') {
    return (
      <div className="w-full h-full bg-[#f4f4f1] p-2.5 flex flex-col justify-between text-[#111111]">
        <div className="flex items-center justify-between gap-1.5">
          <span className="font-mono-tech text-[8px] font-bold uppercase tracking-[0.08em] px-1 py-0.5 bg-[#0f5c3f] text-white border border-[#111111]">
            {frame.index} · {frame.tag}
          </span>
          <span className="font-mono-tech text-[8px] text-[#4b4f55] truncate">{frame.caption}</span>
        </div>
        <ul className="m-0 p-0 list-none space-y-1 my-1">
          {(frame.layers ?? []).slice(0, 3).map((layer, idx) => (
            <li key={layer.name} className="flex items-baseline gap-1 border-b border-[#111111]/12 pb-0.5 last:border-b-0">
              <span className="font-mono-tech text-[8px] font-bold text-[#0f5c3f]">0{idx + 1}</span>
              <span className="text-[9px] font-bold text-[#111111] truncate">{layer.name}</span>
            </li>
          ))}
        </ul>
        <div className="font-mono-tech text-[8px] text-[#4b4f55] truncate">{frame.title}</div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-[#111111] p-2.5 flex flex-col justify-between text-white">
      <div className="flex items-center justify-between gap-1.5">
        <span className="font-mono-tech text-[8px] font-bold uppercase tracking-[0.08em] px-1 py-0.5 bg-[#ffc400] text-[#111111]">
          {frame.index} · {frame.tag}
        </span>
        <span className="font-mono-tech text-[8px] text-white/65 truncate">{frame.fileName}</span>
      </div>
      <p className="m-0 text-[9px] leading-[1.35] text-white/90 line-clamp-3">{frame.note}</p>
      <div className="pt-1 border-t border-white/15 font-mono-tech text-[8px] text-[#ffc400] truncate">
        {(frame.stack ?? []).join(' · ')}
      </div>
    </div>
  );
};

export const ProjectHoverMediaStrip: React.FC<ProjectHoverMediaStripProps> = ({ project, isExpanded }) => {
  const [imgFailed, setImgFailed] = useState(false);
  const frames = useMemo(() => buildProjectStripFrames(project).slice(0, 3), [project]);

  useEffect(() => setImgFailed(false), [project.id, project.previewImage]);

  return (
    <div
      data-testid={`project-hover-strip-${project.id}`}
      data-expanded={isExpanded ? 'true' : 'false'}
      aria-hidden="true"
      className={`editorial-media-strip-shell${isExpanded ? ' is-expanded' : ''}`}
    >
      <ArrowRight className="editorial-media-strip-arrow" aria-hidden="true" />
      <div className="editorial-media-strip-track">
        {frames.map((frame, index) => (
          <div
            key={frame.id}
            data-testid={`project-strip-frame-${frame.id}`}
            className="editorial-media-strip-frame"
            style={{ transitionDelay: `${index * 60}ms` }}
          >
            <StripFrameVisual
              frame={frame}
              imgFailed={imgFailed}
              onImgError={() => setImgFailed(true)}
            />
          </div>
        ))}
      </div>
    </div>
  );
};
