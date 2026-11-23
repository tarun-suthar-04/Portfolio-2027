import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { FolderOpen, MousePointer2 } from 'lucide-react';
import { ProjectItem } from '../data/portfolio';
import { formatProjectIndex, isProjectInteractive, lerpValue } from '../lib/editorialProjects';
import { buildProjectHash } from '../lib/projectCaseStudy';
import { ProjectHoverMediaStrip } from './ProjectHoverMediaStrip';

interface EditorialProjectsSectionProps {
  projects: readonly ProjectItem[];
  scrollContainerRef: React.RefObject<HTMLDivElement | null>;
  isActive: boolean;
  onOpenProject: (project: ProjectItem) => void;
}

const EDITORIAL_EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];
const DESKTOP_HOVER_QUERY = '(hover: hover) and (pointer: fine) and (min-width: 801px)';

interface EditorialProjectRowProps {
  project: ProjectItem;
  index: number;
  isLast: boolean;
  isActiveRow: boolean;
  isHovered: boolean;
  scrollContainerRef: React.RefObject<HTMLDivElement | null>;
  isActiveView: boolean;
  prefersReduced: boolean;
  onOpenProject: (project: ProjectItem) => void;
  onProjectHover: (projectId: string | null) => void;
  onBadgeUpdate: (visible: boolean, clientX: number, clientY: number) => void;
  registerRow: (projectId: string, node: HTMLElement | null) => void;
}

const EditorialProjectRow: React.FC<EditorialProjectRowProps> = ({
  project,
  index,
  isLast,
  isActiveRow,
  isHovered,
  scrollContainerRef,
  isActiveView,
  prefersReduced,
  onOpenProject,
  onProjectHover,
  onBadgeUpdate,
  registerRow,
}) => {
  const articleRef = useRef<HTMLElement | null>(null);
  const [isRevealed, setIsRevealed] = useState(prefersReduced);
  const interactive = isProjectInteractive(project);
  const projectHash = buildProjectHash(project.id);

  useEffect(() => {
    if (prefersReduced) setIsRevealed(true);
  }, [prefersReduced]);

  useEffect(() => {
    const node = articleRef.current;
    if (!node || !isActiveView || isRevealed || prefersReduced) return;
    const root = scrollContainerRef.current;
    const isInRange = () => {
      const nodeRect = node.getBoundingClientRect();
      const rootRect = root?.getBoundingClientRect() ?? { top: 0, bottom: window.innerHeight };
      return nodeRect.top <= rootRect.bottom + 140 && nodeRect.bottom >= rootRect.top - 140;
    };

    if (isInRange() || typeof IntersectionObserver === 'undefined') {
      setIsRevealed(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setIsRevealed(true);
          observer.disconnect();
        }
      },
      { root: root ?? null, rootMargin: '140px 0px 140px 0px', threshold: 0.01 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [isActiveView, isRevealed, prefersReduced, scrollContainerRef]);

  const setArticleRef = useCallback(
    (node: HTMLElement | null) => {
      articleRef.current = node;
      registerRow(project.id, node);
    },
    [project.id, registerRow]
  );

  useEffect(() => {
    if (!isActiveView && isHovered) {
      onProjectHover(null);
      onBadgeUpdate(false, 0, 0);
    }
  }, [isActiveView, isHovered, onBadgeUpdate, onProjectHover]);

  const supportsDesktopHover = () =>
    typeof window !== 'undefined' && window.matchMedia(DESKTOP_HOVER_QUERY).matches;

  const handlePointerEnter = (event: React.PointerEvent<HTMLElement>) => {
    if (!interactive || event.pointerType !== 'mouse' || !supportsDesktopHover()) return;
    onProjectHover(project.id);
    onBadgeUpdate(!prefersReduced, event.clientX, event.clientY);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLElement>) => {
    if (!interactive || event.pointerType !== 'mouse' || !supportsDesktopHover()) return;
    onBadgeUpdate(!prefersReduced, event.clientX, event.clientY);
  };

  const handlePointerLeave = () => {
    onProjectHover(null);
    onBadgeUpdate(false, 0, 0);
  };

  const handleOpenCaseStudy = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
    event.preventDefault();
    onProjectHover(null);
    onBadgeUpdate(false, 0, 0);
    onOpenProject(project);
  };

  const handleSpaceActivation = (event: React.KeyboardEvent<HTMLAnchorElement>) => {
    if (event.key !== ' ' || !interactive) return;
    event.preventDefault();
    onProjectHover(null);
    onBadgeUpdate(false, 0, 0);
    onOpenProject(project);
  };

  const headingContents = (
    <>
      <span className="editorial-project-index" aria-hidden="true">
        {formatProjectIndex(index)}
      </span>
      <h3 id={`editorial-project-title-${project.id}`}>
        <span className="editorial-project-title-text">{project.title}</span>
        {project.subtitle && <small>{project.subtitle}</small>}
      </h3>
      <p className="editorial-project-summary">{project.summary}</p>
    </>
  );

  return (
    <article
      ref={setArticleRef}
      id={`project-${project.id}`}
      data-testid={`editorial-project-${project.id}`}
      data-hovered={isHovered ? 'true' : 'false'}
      data-active={isActiveRow ? 'true' : 'false'}
      data-interactive={interactive ? 'true' : 'false'}
      aria-labelledby={`editorial-project-title-${project.id}`}
      onPointerEnter={handlePointerEnter}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className={`editorial-project-row ${isLast ? 'is-last' : ''}`}
    >
      <motion.div
        className="editorial-project-row-reveal"
        initial={prefersReduced ? false : { opacity: 0.2, y: 12 }}
        animate={isRevealed ? { opacity: 1, y: 0 } : { opacity: 0.2, y: 12 }}
        transition={{
          duration: prefersReduced ? 0 : 0.42,
          delay: prefersReduced ? 0 : Math.min(index * 0.04, 0.12),
          ease: EDITORIAL_EASE,
        }}
      >
        {interactive ? (
          <a
            href={projectHash}
            aria-label={`Open ${project.title} case study`}
            onClick={handleOpenCaseStudy}
            onKeyDown={handleSpaceActivation}
            data-testid={`project-title-link-${project.id}`}
            className="editorial-project-heading"
          >
            {headingContents}
          </a>
        ) : (
          <div className="editorial-project-heading is-disabled">{headingContents}</div>
        )}
      </motion.div>

      {interactive && (
        <ProjectHoverMediaStrip project={project} isExpanded={isHovered} />
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
  const rowElementsRef = useRef(new Map<string, HTMLElement>());
  const badgeRef = useRef<HTMLDivElement | null>(null);
  const badgeTargetRef = useRef({ x: 0, y: 0, visible: false, initialized: false });
  const badgePosRef = useRef({ x: 0, y: 0 });
  const badgeRafRef = useRef<number>(0);

  const [headerVisible, setHeaderVisible] = useState(Boolean(prefersReduced));
  const [scrollActiveProjectId, setScrollActiveProjectId] = useState<string | null>(
    projects[0]?.id ?? null
  );
  const [hoveredProjectId, setHoveredProjectId] = useState<string | null>(null);
  const [hoverActiveProjectId, setHoverActiveProjectId] = useState<string | null>(null);
  const [badgeVisible, setBadgeVisible] = useState(false);
  const hoverActivationTimerRef = useRef<number | null>(null);

  const registerRow = useCallback((projectId: string, node: HTMLElement | null) => {
    if (node) rowElementsRef.current.set(projectId, node);
    else rowElementsRef.current.delete(projectId);
  }, []);

  const stopBadgeLoop = useCallback(() => {
    if (badgeRafRef.current !== 0) {
      window.cancelAnimationFrame(badgeRafRef.current);
      badgeRafRef.current = 0;
    }
  }, []);

  const stepBadgeLoop = useCallback(() => {
    const element = badgeRef.current;
    const target = badgeTargetRef.current;
    if (!element || !target.visible) {
      badgeRafRef.current = 0;
      return;
    }

    const position = badgePosRef.current;
    const factor = prefersReduced ? 1 : 0.18;
    const nextX = lerpValue(position.x, target.x, factor);
    const nextY = lerpValue(position.y, target.y, factor);
    position.x = Math.abs(target.x - nextX) < 0.2 ? target.x : nextX;
    position.y = Math.abs(target.y - nextY) < 0.2 ? target.y : nextY;

    element.style.transform = `translate3d(${position.x.toFixed(1)}px, ${position.y.toFixed(1)}px, 0) translate(-50%, -50%)`;

    if (Math.abs(target.x - position.x) > 0.2 || Math.abs(target.y - position.y) > 0.2) {
      badgeRafRef.current = window.requestAnimationFrame(stepBadgeLoop);
    } else {
      badgeRafRef.current = 0;
    }
  }, [prefersReduced]);

  const handleBadgeUpdate = useCallback(
    (visible: boolean, clientX: number, clientY: number) => {
      if (!visible || prefersReduced) {
        badgeTargetRef.current.visible = false;
        badgeTargetRef.current.initialized = false;
        setBadgeVisible(false);
        stopBadgeLoop();
        return;
      }

      const target = badgeTargetRef.current;
      target.x = clientX;
      target.y = clientY;
      target.visible = true;

      if (!target.initialized) {
        target.initialized = true;
        badgePosRef.current = { x: clientX, y: clientY };
      }

      setBadgeVisible(true);
      if (badgeRafRef.current === 0) {
        badgeRafRef.current = window.requestAnimationFrame(stepBadgeLoop);
      }
    },
    [prefersReduced, stepBadgeLoop, stopBadgeLoop]
  );

  const handleProjectHover = useCallback(
    (projectId: string | null) => {
      setHoveredProjectId(projectId);
      if (hoverActivationTimerRef.current !== null) {
        window.clearTimeout(hoverActivationTimerRef.current);
        hoverActivationTimerRef.current = null;
      }
      if (projectId === null) {
        setHoverActiveProjectId(null);
      } else if (prefersReduced) {
        setHoverActiveProjectId(projectId);
      } else {
        hoverActivationTimerRef.current = window.setTimeout(() => {
          setHoverActiveProjectId(projectId);
          hoverActivationTimerRef.current = null;
        }, 70);
      }
    },
    [prefersReduced]
  );

  // Keep the row nearest the view's 45% focal line active while scrolling.
  useEffect(() => {
    const root = scrollContainerRef.current;
    if (!root || !isActive) return;

    let frame = 0;
    const updateActiveRow = () => {
      frame = 0;
      const rootRect = root.getBoundingClientRect();
      const focalY = rootRect.top + root.clientHeight * 0.45;
      let nearestId: string | null = null;
      let nearestDistance = Number.POSITIVE_INFINITY;

      for (const [projectId, row] of rowElementsRef.current) {
        const rect = row.getBoundingClientRect();
        if (rect.bottom < rootRect.top || rect.top > rootRect.bottom) continue;
        const distance = focalY < rect.top ? rect.top - focalY : focalY > rect.bottom ? focalY - rect.bottom : 0;
        if (distance < nearestDistance) {
          nearestId = projectId;
          nearestDistance = distance;
        }
      }

      if (nearestId) setScrollActiveProjectId(nearestId);
    };

    const scheduleUpdate = () => {
      if (frame === 0) frame = window.requestAnimationFrame(updateActiveRow);
    };

    root.addEventListener('scroll', scheduleUpdate, { passive: true });
    window.addEventListener('resize', scheduleUpdate);
    scheduleUpdate();
    return () => {
      root.removeEventListener('scroll', scheduleUpdate);
      window.removeEventListener('resize', scheduleUpdate);
      if (frame !== 0) window.cancelAnimationFrame(frame);
    };
  }, [isActive, projects, scrollContainerRef]);

  useEffect(() => {
    if (projects.length > 0 && !projects.some((project) => project.id === scrollActiveProjectId)) {
      setScrollActiveProjectId(projects[0].id);
    }
  }, [projects, scrollActiveProjectId]);

  useEffect(() => {
    if (!prefersReduced && headerVisible && isActive) return;
    if (prefersReduced) {
      setHeaderVisible(true);
      return;
    }
    if (!isActive) return;
    const node = headerRef.current;
    const root = scrollContainerRef.current;
    if (!node) return;
    if (typeof IntersectionObserver === 'undefined') {
      setHeaderVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setHeaderVisible(true);
          observer.disconnect();
        }
      },
      { root: root ?? null, threshold: 0.05 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [headerVisible, isActive, prefersReduced, scrollContainerRef]);

  useEffect(() => {
    if (isActive) return;
    handleProjectHover(null);
    handleBadgeUpdate(false, 0, 0);
  }, [handleBadgeUpdate, handleProjectHover, isActive]);

  useEffect(() => () => stopBadgeLoop(), [stopBadgeLoop]);
  useEffect(
    () => () => {
      if (hoverActivationTimerRef.current !== null) {
        window.clearTimeout(hoverActivationTimerRef.current);
      }
    },
    []
  );

  const activeProjectId = hoverActiveProjectId ?? scrollActiveProjectId;

  return (
    <section
      id="tech-projects"
      aria-labelledby="selected-projects-heading"
      className="pt-8 sm:pt-12 pb-6"
    >
      <div ref={headerRef} className="editorial-projects-header">
        <div>
          <p className="editorial-projects-count">Projects · {String(projects.length).padStart(2, '0')}</p>
          <motion.h2
            id="selected-projects-heading"
            initial={prefersReduced ? false : { opacity: 0, y: 28 }}
            animate={headerVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 28 }}
            transition={{
              duration: prefersReduced ? 0 : 0.65,
              delay: prefersReduced ? 0 : 0.06,
              ease: EDITORIAL_EASE,
            }}
          >
            Selected <span>Projects</span>
          </motion.h2>
        </div>
        <p className="editorial-projects-hint">Scroll or hover to preview. Click to open the case study.</p>
      </div>

      {projects.length === 0 ? (
        <div className="py-12 border-t border-[#111111]/20 font-mono-tech text-sm text-[#4b4f55]">
          No projects published yet.
        </div>
      ) : (
        <div
          className="editorial-project-list"
          data-hovering={hoveredProjectId ? 'true' : 'false'}
        >
          {projects.map((project, index) => (
            <EditorialProjectRow
              key={project.id}
              project={project}
              index={index}
              isLast={index === projects.length - 1}
              isActiveRow={activeProjectId === project.id}
              isHovered={hoveredProjectId === project.id}
              scrollContainerRef={scrollContainerRef}
              isActiveView={isActive}
              prefersReduced={Boolean(prefersReduced)}
              onOpenProject={onOpenProject}
              onProjectHover={handleProjectHover}
              onBadgeUpdate={handleBadgeUpdate}
              registerRow={registerRow}
            />
          ))}
        </div>
      )}

      {!prefersReduced && (
        <div
          ref={badgeRef}
          aria-hidden="true"
          data-testid="view-project-cursor-badge"
          data-visible={badgeVisible ? 'true' : 'false'}
          className={`editorial-case-cursor-badge${badgeVisible ? ' is-visible' : ''}`}
        >
          <FolderOpen className="editorial-cursor-folder" aria-hidden="true" />
          <span>View project</span>
          <MousePointer2 className="editorial-cursor-pointer" aria-hidden="true" />
        </div>
      )}
    </section>
  );
};
