import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowUpRight } from 'lucide-react';
import { ProjectItem } from '../data/portfolio';
import {
  isProjectInteractive,
  lerpValue,
} from '../lib/editorialProjects';
import { buildProjectHash } from '../lib/projectCaseStudy';
import { ProjectHoverMediaStrip } from './ProjectHoverMediaStrip';
import { ProjectModalTab } from './ProjectModal';

interface EditorialProjectsSectionProps {
  projects: readonly ProjectItem[];
  scrollContainerRef: React.RefObject<HTMLDivElement | null>;
  isActive: boolean;
  onOpenModal?: (project: ProjectItem, initialTab: ProjectModalTab) => void;
  onOpenProject: (project: ProjectItem) => void;
}

const EDITORIAL_EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

interface EditorialProjectRowProps {
  project: ProjectItem;
  index: number;
  isLast: boolean;
  scrollContainerRef: React.RefObject<HTMLDivElement | null>;
  isActiveView: boolean;
  onOpenProject: (project: ProjectItem) => void;
  onBadgeUpdate: (visible: boolean, clientX: number, clientY: number) => void;
}

const EditorialProjectRow: React.FC<EditorialProjectRowProps> = ({
  project,
  index,
  isLast,
  scrollContainerRef,
  isActiveView,
  onOpenProject,
  onBadgeUpdate,
}) => {
  const prefersReduced = useReducedMotion();
  const articleRef = useRef<HTMLElement | null>(null);
  const pointerRatioRef = useRef<number>(0);

  const [isRevealed, setIsRevealed] = useState<boolean>(() => Boolean(prefersReduced));
  const [rowHovered, setRowHovered] = useState(false);

  const interactive = isProjectInteractive(project);
  const projectHash = buildProjectHash(project.id);

  useEffect(() => {
    if (prefersReduced) {
      setIsRevealed(true);
    }
  }, [prefersReduced]);

  // Collapse hover states when leaving the Technical view
  useEffect(() => {
    if (!isActiveView && rowHovered) {
      setRowHovered(false);
      onBadgeUpdate(false, 0, 0);
    }
  }, [isActiveView, rowHovered, onBadgeUpdate]);

  // Subtle viewport entrance anchored to #tech's scroll container
  useEffect(() => {
    if (prefersReduced || isRevealed) return;
    if (!isActiveView) return;
    const node = articleRef.current;
    const root = scrollContainerRef.current;
    if (!node) return;

    const checkInView = () => {
      const nodeRect = node.getBoundingClientRect();
      const rootRect = root
        ? root.getBoundingClientRect()
        : { top: 0, bottom: window.innerHeight };
      if (nodeRect.top <= rootRect.bottom + 140 && nodeRect.bottom >= rootRect.top - 140) {
        setIsRevealed(true);
        return true;
      }
      return false;
    };

    if (checkInView() || typeof IntersectionObserver === 'undefined') {
      setIsRevealed(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting || entry.intersectionRatio > 0) {
            setIsRevealed(true);
            observer.disconnect();
            break;
          }
        }
      },
      {
        root: root ?? null,
        rootMargin: '140px 0px 140px 0px',
        threshold: 0.01,
      }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [isActiveView, isRevealed, prefersReduced, scrollContainerRef]);

  const updatePointerRatio = (clientX: number) => {
    const node = articleRef.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    if (rect.width <= 0) return;
    pointerRatioRef.current = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
  };

  const handleRowPointerEnter = (ev: React.PointerEvent<HTMLElement>) => {
    if (!interactive || ev.pointerType !== 'mouse') return;
    updatePointerRatio(ev.clientX);
    setRowHovered(true);
    onBadgeUpdate(!prefersReduced, ev.clientX, ev.clientY);
  };

  const handleRowPointerMove = (ev: React.PointerEvent<HTMLElement>) => {
    if (!interactive || ev.pointerType !== 'mouse') return;
    updatePointerRatio(ev.clientX);
    if (!rowHovered) setRowHovered(true);
    onBadgeUpdate(!prefersReduced, ev.clientX, ev.clientY);
  };

  const handleRowPointerLeave = () => {
    setRowHovered(false);
    onBadgeUpdate(false, 0, 0);
  };

  const handleOpenCaseStudy = (ev: React.MouseEvent<HTMLAnchorElement>) => {
    if (!interactive) {
      ev.preventDefault();
      return;
    }
    if (ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey || ev.button !== 0) return;
    ev.preventDefault();
    setRowHovered(false);
    onBadgeUpdate(false, 0, 0);
    onOpenProject(project);
  };

  const revealDuration = prefersReduced ? 0 : 0.42;

  return (
    <article
      ref={articleRef}
      id={`project-${project.id}`}
      data-testid={`editorial-project-${project.id}`}
      data-hovered={rowHovered ? 'true' : 'false'}
      onPointerEnter={handleRowPointerEnter}
      onPointerMove={handleRowPointerMove}
      onPointerLeave={handleRowPointerLeave}
      className={`editorial-project-row py-8 sm:py-10 lg:py-11 border-t border-[#111111]/25 ${
        isLast ? 'border-b border-[#111111]/25' : ''
      } scroll-mt-20 transition-colors duration-250 ${
        rowHovered && interactive ? 'bg-[#111111]/[0.02]' : ''
      }`}
    >
      <motion.div
        initial={prefersReduced ? false : { opacity: 0.2, y: 12 }}
        animate={isRevealed ? { opacity: 1, y: 0 } : { opacity: 0.2, y: 12 }}
        transition={{
          duration: revealDuration,
          delay: prefersReduced ? 0 : Math.min(index * 0.04, 0.12),
          ease: EDITORIAL_EASE,
        }}
      >
        {interactive ? (
          <a
            href={projectHash}
            onClick={handleOpenCaseStudy}
            data-testid={`project-title-link-${project.id}`}
            className="editorial-title-trigger group/row grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 lg:gap-10 items-baseline w-full text-left cursor-pointer no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#111111] focus-visible:ring-offset-4 focus-visible:ring-offset-[#f4f4f1]"
          >
            <h3 className="lg:col-span-6 m-0 text-[30px] sm:text-[40px] lg:text-[48px] font-extrabold tracking-[-0.045em] leading-[1.02] text-[#111111] text-balance">
              <span className="editorial-title-link group-hover/row:text-[#0f5c3f] transition-colors duration-300">
                {project.title}
              </span>
            </h3>

            <p className="lg:col-span-6 m-0 text-[15px] sm:text-[16px] leading-[1.58] text-[#3a3f46] max-w-[48ch] lg:justify-self-end lg:text-right">
              {project.summary}
            </p>
          </a>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 lg:gap-10 items-baseline w-full opacity-60">
            <h3 className="lg:col-span-6 m-0 text-[30px] sm:text-[40px] lg:text-[48px] font-extrabold tracking-[-0.045em] leading-[1.02] text-[#111111] text-balance">
              {project.title}
            </h3>
            <p className="lg:col-span-6 m-0 text-[15px] sm:text-[16px] leading-[1.58] text-[#3a3f46] max-w-[48ch] lg:justify-self-end lg:text-right">
              {project.summary}
            </p>
          </div>
        )}
      </motion.div>

      {/* Images only revealed on hover via smooth vertical-push horizontal media strip */}
      {interactive && (
        <ProjectHoverMediaStrip
          project={project}
          isExpanded={rowHovered}
          pointerRatioRef={pointerRatioRef}
          prefersReduced={Boolean(prefersReduced)}
          onOpenProject={(selected) => {
            setRowHovered(false);
            onBadgeUpdate(false, 0, 0);
            onOpenProject(selected);
          }}
        />
      )}
    </article>
  );
};

export const EditorialProjectsSection: React.FC<EditorialProjectsSectionProps> = ({
  projects,
  scrollContainerRef,
  isActive,
  onOpenProject,
}) => {
  const prefersReduced = useReducedMotion();
  const headerRef = useRef<HTMLDivElement | null>(null);
  const badgeRef = useRef<HTMLDivElement | null>(null);
  const badgeTargetRef = useRef({ x: 0, y: 0, visible: false, initialized: false });
  const badgePosRef = useRef({ x: 0, y: 0 });
  const badgeRafRef = useRef<number>(0);

  const [headerVisible, setHeaderVisible] = useState<boolean>(() => Boolean(prefersReduced));
  const [badgeVisible, setBadgeVisible] = useState(false);

  const stopBadgeLoop = useCallback(() => {
    if (badgeRafRef.current !== 0) {
      window.cancelAnimationFrame(badgeRafRef.current);
      badgeRafRef.current = 0;
    }
  }, []);

  const stepBadgeLoop = useCallback(() => {
    const el = badgeRef.current;
    const target = badgeTargetRef.current;
    if (!el || !target.visible) {
      badgeRafRef.current = 0;
      return;
    }

    const pos = badgePosRef.current;
    const nextX = lerpValue(pos.x, target.x, 0.24);
    const nextY = lerpValue(pos.y, target.y, 0.24);

    pos.x = Math.abs(target.x - nextX) < 0.2 ? target.x : nextX;
    pos.y = Math.abs(target.y - nextY) < 0.2 ? target.y : nextY;

    el.style.transform = `translate3d(${(pos.x + 16).toFixed(1)}px, ${(pos.y + 16).toFixed(1)}px, 0)`;

    if (Math.abs(target.x - pos.x) > 0.2 || Math.abs(target.y - pos.y) > 0.2) {
      badgeRafRef.current = window.requestAnimationFrame(stepBadgeLoop);
    } else {
      badgeRafRef.current = 0;
    }
  }, []);

  const handleBadgeUpdate = useCallback(
    (visible: boolean, clientX: number, clientY: number) => {
      if (prefersReduced) {
        badgeTargetRef.current.visible = false;
        setBadgeVisible(false);
        stopBadgeLoop();
        return;
      }

      if (!visible) {
        badgeTargetRef.current.visible = false;
        badgeTargetRef.current.initialized = false;
        setBadgeVisible(false);
        stopBadgeLoop();
        return;
      }

      badgeTargetRef.current.x = clientX;
      badgeTargetRef.current.y = clientY;
      badgeTargetRef.current.visible = true;

      if (!badgeTargetRef.current.initialized) {
        badgeTargetRef.current.initialized = true;
        badgePosRef.current.x = clientX;
        badgePosRef.current.y = clientY;
        if (badgeRef.current) {
          badgeRef.current.style.transform = `translate3d(${(clientX + 16).toFixed(1)}px, ${(clientY + 16).toFixed(1)}px, 0)`;
        }
      }

      setBadgeVisible((prev) => (prev ? prev : true));

      if (badgeRafRef.current === 0) {
        badgeRafRef.current = window.requestAnimationFrame(stepBadgeLoop);
      }
    },
    [prefersReduced, stepBadgeLoop, stopBadgeLoop]
  );

  // Clean up cursor badge on unmount or view switch
  useEffect(() => {
    if (!isActive) {
      badgeTargetRef.current.visible = false;
      badgeTargetRef.current.initialized = false;
      setBadgeVisible(false);
      stopBadgeLoop();
    }
    return () => stopBadgeLoop();
  }, [isActive, stopBadgeLoop]);

  useEffect(() => {
    if (prefersReduced) {
      setHeaderVisible(true);
    }
  }, [prefersReduced]);

  // Reveal editorial section heading smoothly when entering #tech viewport
  useEffect(() => {
    if (prefersReduced || headerVisible || !isActive) return;
    const node = headerRef.current;
    const root = scrollContainerRef.current;
    if (!node) return;

    if (typeof IntersectionObserver === 'undefined') {
      setHeaderVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setHeaderVisible(true);
          observer.disconnect();
        }
      },
      { root: root ?? null, threshold: 0.05 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [headerVisible, isActive, prefersReduced, scrollContainerRef]);

  return (
    <section
      id="tech-projects"
      aria-labelledby="selected-projects-heading"
      className="pt-8 sm:pt-12 pb-6"
    >
      {/* Editorial Section Introduction */}
      <div ref={headerRef} className="pb-8 sm:pb-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="overflow-hidden">
            <motion.p
              className="font-mono-tech text-[11.5px] font-medium uppercase tracking-[0.14em] text-[#4b4f55] m-0"
              initial={prefersReduced ? false : { opacity: 0, y: 12 }}
              animate={headerVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
              transition={{ duration: prefersReduced ? 0 : 0.45, ease: EDITORIAL_EASE }}
            >
              Engineering Works · {String(projects.length).padStart(2, '0')} Selected
            </motion.p>

            <motion.h2
              id="selected-projects-heading"
              className="mt-2.5 mb-0 text-[40px] sm:text-[56px] lg:text-[72px] font-extrabold tracking-[-0.05em] leading-[0.94] text-[#111111] text-balance"
              initial={prefersReduced ? false : { opacity: 0, y: 28 }}
              animate={headerVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 28 }}
              transition={{
                duration: prefersReduced ? 0 : 0.65,
                delay: prefersReduced ? 0 : 0.06,
                ease: EDITORIAL_EASE,
              }}
            >
              Selected{' '}
              <span className="inline-block bg-[#ffc400] border-2 border-[#111111] px-2.5 py-0.5 leading-[0.95]">
                Projects
              </span>
            </motion.h2>
          </div>

          <motion.p
            className="text-[15px] leading-[1.58] text-[#4b4f55] max-w-[38ch] m-0 md:text-right text-balance"
            initial={prefersReduced ? false : { opacity: 0, y: 16 }}
            animate={headerVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
            transition={{
              duration: prefersReduced ? 0 : 0.55,
              delay: prefersReduced ? 0 : 0.14,
              ease: EDITORIAL_EASE,
            }}
          >
            Hover any project to preview screens &amp; architecture—click to open the full case study.
          </motion.p>
        </div>
      </div>

      {/* Minimal Editorial Project List Rows (Images Revealed Only on Hover) */}
      {projects.length === 0 ? (
        <div className="py-12 border-t border-[#111111]/20 font-mono-tech text-sm text-[#4b4f55]">
          No projects published yet.
        </div>
      ) : (
        <div>
          {projects.map((project, index) => (
            <EditorialProjectRow
              key={project.id}
              project={project}
              index={index}
              isLast={index === projects.length - 1}
              scrollContainerRef={scrollContainerRef}
              isActiveView={isActive}
              onOpenProject={onOpenProject}
              onBadgeUpdate={handleBadgeUpdate}
            />
          ))}
        </div>
      )}

      {/* Custom Floating "View case" Cursor Badge (Desktop Fine-Pointer Only) */}
      {!prefersReduced && (
        <div
          ref={badgeRef}
          aria-hidden="true"
          data-testid="view-case-cursor-badge"
          data-visible={badgeVisible ? 'true' : 'false'}
          className={`editorial-case-cursor-badge ${badgeVisible ? 'is-visible' : ''}`}
        >
          <span>View case</span>
          <ArrowUpRight className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
        </div>
      )}
    </section>
  );
};
