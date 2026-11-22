import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import type { ProjectItem } from '../data/portfolio';
import {
  buildProjectStripFrames,
  computeStripPanOffset,
  lerpValue,
  type ProjectStripFrame,
} from '../lib/editorialProjects';
import { buildProjectHash } from '../lib/projectCaseStudy';

interface ProjectHoverMediaStripProps {
  project: ProjectItem;
  isExpanded: boolean;
  pointerRatioRef: React.MutableRefObject<number>;
  prefersReduced: boolean;
  onOpenProject: (project: ProjectItem) => void;
}

const StripFrameVisual: React.FC<{
  frame: ProjectStripFrame;
  imgFailed: boolean;
  onImgError: () => void;
}> = ({ frame, imgFailed, onImgError }) => {
  if (frame.kind === 'screen-primary' || frame.kind === 'screen-detail') {
    const isDetail = frame.kind === 'screen-detail';
    return (
      <div className="relative w-full h-full overflow-hidden bg-[#16181d]">
        {frame.imageSrc && !imgFailed ? (
          <img
            src={frame.imageSrc}
            alt={frame.imageAlt ?? frame.title}
            referrerPolicy="no-referrer"
            loading="lazy"
            onError={onImgError}
            className={`w-full h-full object-cover transition-transform duration-500 ease-out ${
              isDetail
                ? 'object-[70%_28%] scale-[1.24] group-hover/card:scale-[1.3]'
                : 'object-center group-hover/card:scale-[1.04]'
            }`}
          />
        ) : (
          <div
            className="w-full h-full flex flex-col items-center justify-center p-4 text-center text-white"
            style={{ background: frame.fallbackGradient }}
          >
            <span className="font-mono-tech text-[10px] uppercase tracking-[0.12em] text-[#ffc400]">
              {frame.fileName}
            </span>
            <span className="mt-1 text-sm font-bold">{frame.title}</span>
          </div>
        )}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-[#111111]/88 via-[#111111]/45 to-transparent" />
        <span className="pointer-events-none absolute top-2.5 left-2.5 px-1.5 py-0.5 bg-[#111111]/90 text-[#ffc400] border border-white/15 font-mono-tech text-[9.5px] font-bold uppercase tracking-[0.09em]">
          {frame.index} · {frame.tag}
        </span>
        <div className="pointer-events-none absolute bottom-2.5 inset-x-2.5 flex items-baseline justify-between gap-2">
          <span className="text-[12.5px] font-bold tracking-[-0.02em] text-white truncate">
            {frame.title}
          </span>
          <span className="font-mono-tech text-[10px] text-white/75 whitespace-nowrap shrink-0">
            {isDetail ? frame.fileName : frame.caption}
          </span>
        </div>
      </div>
    );
  }

  if (frame.kind === 'architecture-flow') {
    const steps = frame.flowSteps ?? [];
    return (
      <div className="w-full h-full bg-[#f9faf9] p-3.5 flex flex-col justify-between text-[#111111]">
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 font-mono-tech text-[9.5px] font-bold uppercase tracking-[0.1em] px-1.5 py-0.5 bg-[#ffc400] text-[#111111] border border-[#111111] whitespace-nowrap shrink-0">
            {frame.index} · {frame.tag}
          </span>
          <span className="font-mono-tech text-[10px] text-[#4b4f55] truncate">
            {frame.caption}
          </span>
        </div>

        <div className="my-2 flex flex-wrap items-center gap-1.5">
          {steps.slice(0, 5).map((step, idx) => (
            <React.Fragment key={`${step}-${idx}`}>
              <span className="font-mono-tech text-[10.5px] font-semibold leading-tight px-2 py-1 border border-[#111111] bg-white text-[#111111]">
                {step}
              </span>
              {idx < Math.min(steps.length, 5) - 1 && (
                <ArrowRight className="w-3 h-3 text-[#0f5c3f] shrink-0" aria-hidden="true" />
              )}
            </React.Fragment>
          ))}
        </div>

        <div className="pt-2 border-t border-[#111111]/15 flex items-center justify-between font-mono-tech text-[10px] text-[#4b4f55]">
          <span className="font-bold text-[#111111]">{frame.title}</span>
          <span>{frame.fileName}</span>
        </div>
      </div>
    );
  }

  if (frame.kind === 'layers-blueprint') {
    const layers = frame.layers ?? [];
    return (
      <div className="w-full h-full bg-[#f4f4f1] p-3.5 flex flex-col justify-between text-[#111111]">
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono-tech text-[9.5px] font-bold uppercase tracking-[0.1em] px-1.5 py-0.5 bg-[#0f5c3f] text-white border border-[#111111]">
            {frame.index} · {frame.tag}
          </span>
          <span className="font-mono-tech text-[10px] text-[#4b4f55]">{frame.caption}</span>
        </div>

        <ul className="m-0 p-0 list-none space-y-1.5 my-1.5">
          {layers.slice(0, 4).map((layer, idx) => (
            <li
              key={layer.name}
              className="flex items-baseline gap-2 border-b border-[#111111]/12 pb-1 last:border-b-0 last:pb-0"
            >
              <span className="font-mono-tech text-[9.5px] font-bold text-[#0f5c3f] shrink-0">
                0{idx + 1}
              </span>
              <span className="text-[11.5px] font-bold text-[#111111] truncate">{layer.name}</span>
            </li>
          ))}
        </ul>

        <div className="font-mono-tech text-[10px] text-[#4b4f55] truncate">{frame.title}</div>
      </div>
    );
  }

  // build-spec terminal snapshot
  return (
    <div className="w-full h-full bg-[#111111] p-3.5 flex flex-col justify-between text-white">
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono-tech text-[9.5px] font-bold uppercase tracking-[0.1em] px-1.5 py-0.5 bg-[#ffc400] text-[#111111]">
          {frame.index} · {frame.tag}
        </span>
        <span className="font-mono-tech text-[10px] text-white/65 truncate">{frame.fileName}</span>
      </div>

      <p className="m-0 text-[12px] leading-[1.45] text-white/90 line-clamp-3">{frame.note}</p>

      <div className="pt-2 border-t border-white/15 font-mono-tech text-[10px] text-[#ffc400] truncate">
        {(frame.stack ?? []).join(' · ')}
      </div>
    </div>
  );
};

export const ProjectHoverMediaStrip: React.FC<ProjectHoverMediaStripProps> = ({
  project,
  isExpanded,
  pointerRatioRef,
  prefersReduced,
  onOpenProject,
}) => {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const currentXRef = useRef(0);
  const [imgFailed, setImgFailed] = useState(false);

  const frames = useMemo(() => buildProjectStripFrames(project), [project]);
  const projectHash = buildProjectHash(project.id);

  useEffect(() => {
    setImgFailed(false);
  }, [project.previewImage]);

  // Smoothly pan the horizontal media strip while hovered (60fps damped RAF, paused when idle)
  useEffect(() => {
    const track = trackRef.current;
    const viewport = viewportRef.current;
    if (!track || !viewport) return;

    if (prefersReduced) {
      currentXRef.current = 0;
      track.style.transform = 'translate3d(0px, 0, 0)';
      return;
    }

    if (!isExpanded) {
      currentXRef.current = 0;
      track.style.transform = 'translate3d(0px, 0, 0)';
      return;
    }

    let rafId = 0;
    let active = true;

    const tick = () => {
      if (!active) return;
      const containerWidth = viewport.clientWidth;
      const trackWidth = track.scrollWidth;
      const targetX = computeStripPanOffset({
        pointerRatio: pointerRatioRef.current,
        containerWidth,
        trackWidth,
        edgeDeadZone: 0.1,
      });

      const nextX = lerpValue(currentXRef.current, targetX, 0.14);
      const snappedX = Math.abs(targetX - nextX) < 0.25 ? targetX : nextX;
      currentXRef.current = snappedX;
      track.style.transform = `translate3d(${snappedX.toFixed(2)}px, 0, 0)`;

      rafId = window.requestAnimationFrame(tick);
    };

    rafId = window.requestAnimationFrame(tick);
    return () => {
      active = false;
      if (rafId !== 0) window.cancelAnimationFrame(rafId);
    };
  }, [isExpanded, prefersReduced, pointerRatioRef]);

  const handleOpenCase = (ev: React.MouseEvent<HTMLAnchorElement>) => {
    if (ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey || ev.button !== 0) return;
    ev.preventDefault();
    onOpenProject(project);
  };

  return (
    <div
      data-testid={`project-hover-strip-${project.id}`}
      data-expanded={isExpanded ? 'true' : 'false'}
      aria-hidden={!isExpanded}
      className={`editorial-media-strip-shell ${isExpanded ? 'is-expanded' : ''}`}
    >
      <div className="editorial-media-strip-inner">
        <div
          ref={viewportRef}
          className="relative overflow-hidden py-1.5"
        >
          <div
            ref={trackRef}
            data-testid={`project-strip-track-${project.id}`}
            className="editorial-media-strip-track flex flex-nowrap items-stretch gap-3 w-max pr-1.5"
          >
            {frames.map((frame) => (
              <a
                key={frame.id}
                href={projectHash}
                tabIndex={isExpanded ? 0 : -1}
                onClick={handleOpenCase}
                aria-label={`Open ${project.title} case study from ${frame.title}`}
                className="group/card relative block w-[272px] sm:w-[306px] h-[172px] sm:h-[186px] shrink-0 overflow-hidden border-[1.5px] border-[#111111] bg-[#f9faf9] shadow-[3px_3px_0_#111111] transition-shadow duration-200 hover:shadow-[4px_4px_0_#ffc400] no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#111111] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f4f4f1]"
              >
                <StripFrameVisual
                  frame={frame}
                  imgFailed={imgFailed}
                  onImgError={() => setImgFailed(true)}
                />
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
