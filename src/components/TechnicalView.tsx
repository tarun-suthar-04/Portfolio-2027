import React, { useEffect, useRef, useState } from 'react';
import { Check, Copy, Layers } from 'lucide-react';
import {
  CERTIFICATIONS,
  EDUCATION,
  LEARNING_GOALS,
  PORTFOLIO_PROFILE,
  PROJECTS,
  ProjectItem,
  SKILL_GROUPS,
  SkillTierId,
} from '../data/portfolio';
import { calculatePullProgress, SPLIT_CONFIG, ViewMode } from '../lib/splitPhysics';
import { ProjectModal } from './ProjectModal';
import { ResumeModal } from './ResumeModal';

interface TechnicalViewProps {
  activeView: ViewMode;
  onReturnLanding: () => void;
  onSwitchCreative: () => void;
}

export const TechnicalView: React.FC<TechnicalViewProps> = ({
  activeView,
  onReturnLanding,
  onSwitchCreative,
}) => {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const accRef = useRef<number>(0);
  const touchYRef = useRef<number>(0);

  const [pullProgress, setPullProgress] = useState(0);
  const [skillFilter, setSkillFilter] = useState<'all' | SkillTierId>('all');
  const [selectedProject, setSelectedProject] = useState<ProjectItem | null>(null);
  const [resumeOpen, setResumeOpen] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);

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
      if (selectedProject || resumeOpen) return;
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
      if (ev.key === 'Escape' && !selectedProject && !resumeOpen) {
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
  }, [activeView, onReturnLanding, selectedProject, resumeOpen]);

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText(PORTFOLIO_PROFILE.email);
      setCopiedEmail(true);
      window.setTimeout(() => setCopiedEmail(false), 2200);
    } catch {
      // Fallback if clipboard API unavailable
      window.location.href = `mailto:${PORTFOLIO_PROFILE.email}`;
    }
  };

  const visibleSkillGroups =
    skillFilter === 'all'
      ? SKILL_GROUPS
      : SKILL_GROUPS.filter((group) => group.id === skillFilter);

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
        {/* 01 Profile */}
        <section className="tech-card">
          <div className="tech-lab">
            <span className="tech-lab-mark bg-[#c81e1e]" aria-hidden="true" />
            <span>01 Profile · Technical</span>
          </div>
          <h1 className="tech-h1">
            {PORTFOLIO_PROFILE.firstName}
            <br />
            <span>{PORTFOLIO_PROFILE.lastName}</span>
          </h1>
          <div className="font-mono-tech text-xs font-bold mb-2.5 text-[#111111]">
            {PORTFOLIO_PROFILE.tech.role}
          </div>
          <p className="text-[14.5px] leading-[1.58] text-[#33373d] max-w-[780px]">
            {PORTFOLIO_PROFILE.tech.bio}
          </p>
          <div className="flex flex-wrap gap-2 mt-3.5">
            {PORTFOLIO_PROFILE.tech.coreFacts.map((fact) => (
              <span key={fact} className="tech-chip-tag">
                {fact}
              </span>
            ))}
          </div>
        </section>

        {/* 02 Skills */}
        <section className="tech-card">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="tech-lab">
                <span className="tech-lab-mark bg-[#0f5c3f]" aria-hidden="true" />
                <span>02 Skills</span>
              </div>
              <h2 className="tech-h2">
                What I know, <em>honestly</em>
              </h2>
            </div>

            {/* Interactive Skill Tier Filter */}
            <div
              className="flex flex-wrap items-center gap-1.5"
              role="group"
              aria-label="Filter skills by depth"
            >
              {(
                [
                  { id: 'all', label: 'All (4)' },
                  { id: 'hands-on', label: 'Hands-on' },
                  { id: 'foundational', label: 'Foundational' },
                  { id: 'learning', label: 'Learning' },
                  { id: 'ai-tools', label: 'AI Tools' },
                ] as const
              ).map((tab) => {
                const active = skillFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setSkillFilter(tab.id)}
                    aria-pressed={active}
                    className={`font-mono-tech text-[10.5px] font-bold uppercase tracking-[0.08em] px-2.5 py-1.5 border border-[#111111] cursor-pointer transition-colors whitespace-nowrap ${
                      active
                        ? 'bg-[#111111] text-[#ffc400]'
                        : 'bg-white text-[#111111] hover:bg-[#ffc400]/40'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div
            className={`grid gap-4 mt-2 ${
              visibleSkillGroups.length === 1
                ? 'grid-cols-1'
                : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
            }`}
          >
            {visibleSkillGroups.map((group) => (
              <div key={group.id}>
                <span
                  className="font-mono-tech text-[11px] font-bold px-2 py-0.5 inline-block text-white mb-2.5"
                  style={{ backgroundColor: group.accentColor }}
                >
                  {group.label}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {group.skills.map((skill) => (
                    <span key={skill} className="tech-chip-tag">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 03 Featured Projects */}
        <div className="tech-lab mt-1.5">
          <span className="tech-lab-mark bg-[#c81e1e]" aria-hidden="true" />
          <span>03 Featured projects</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 -mt-1.5">
          {PROJECTS.map((project) => (
            <article
              key={project.id}
              className="tech-card bg-white flex flex-col gap-3 min-w-0"
            >
              <h3 className="text-[19px] font-bold tracking-[-0.02em] leading-[1.15]">
                {project.title}
              </h3>
              <div className="tech-lab">{project.subtitle}</div>
              <p className="text-[14px] leading-[1.52] text-[#33373d] m-0">
                {project.summary}
              </p>
              <ul className="pl-4 list-disc text-[13px] leading-[1.5] text-[#33373d] space-y-1 m-0">
                {project.highlights.map((bullet) => (
                  <li key={bullet}>{bullet}</li>
                ))}
              </ul>
              <div className="flex flex-wrap gap-1.5">
                {project.stack.map((tech) => (
                  <span key={tech} className="tech-chip-tag">
                    {tech}
                  </span>
                ))}
              </div>
              <div className="font-mono-tech text-[11.5px] leading-[1.5] text-[#4b4f55] border-t border-[#cccccc] pt-2 mt-auto">
                {project.demonstrates}
              </div>
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setSelectedProject(project)}
                  aria-label={`Inspect ${project.title} architecture`}
                  className="inline-flex items-center gap-1.5 font-mono-tech text-[11px] font-bold uppercase px-2.5 py-1.5 border border-[#111111] bg-[#ffc400] text-[#111111] shadow-[2px_2px_0_#111111] cursor-pointer hover:translate-x-[-1px] hover:translate-y-[-1px] transition-transform"
                >
                  <Layers className="w-3 h-3" aria-hidden="true" />
                  <span>Architecture</span>
                </button>
                <a
                  href={project.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono-tech text-[11px] font-bold text-[#111111] uppercase underline underline-offset-4 hover:text-[#0f5c3f]"
                >
                  Source ↗
                </a>
              </div>
            </article>
          ))}
        </div>

        {/* 04 Education & 05 Certifications */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <section className="tech-card">
            <div className="tech-lab">
              <span className="tech-lab-mark bg-[#ffc400] border border-[#111111]" aria-hidden="true" />
              <span>04 Education</span>
            </div>
            <h2 className="tech-h2">Degrees</h2>
            <div>
              {EDUCATION.map((edu, index) => (
                <div
                  key={edu.degree}
                  className={`flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-3 py-2.5 text-[13.5px] ${
                    index > 0 ? 'border-t border-[#cccccc]' : ''
                  }`}
                >
                  <strong className="font-semibold">{edu.degree}</strong>
                  <span className="font-mono-tech text-[11.5px] text-[#4b4f55] sm:text-right">
                    {edu.meta}
                    <br />
                    {edu.institution}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section className="tech-card">
            <div className="tech-lab">
              <span className="tech-lab-mark bg-[#0f5c3f]" aria-hidden="true" />
              <span>05 Certifications &amp; achievements</span>
            </div>
            <h2 className="tech-h2">Proof</h2>
            <div>
              {CERTIFICATIONS.map((cert, index) => (
                <div
                  key={cert.title}
                  className={`flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-3 py-2.5 text-[13.5px] ${
                    index > 0 ? 'border-t border-[#cccccc]' : ''
                  }`}
                >
                  <strong className="font-semibold">{cert.title}</strong>
                  <span className="font-mono-tech text-[11.5px] text-[#4b4f55] sm:text-right">
                    {cert.dateOrStatus}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* 06 Currently Learning */}
        <section className="tech-card">
          <div className="tech-lab">
            <span className="tech-lab-mark bg-[#c81e1e]" aria-hidden="true" />
            <span>06 Currently learning</span>
          </div>
          <h2 className="tech-h2">
            Goals, <em>not claims</em>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {LEARNING_GOALS.map((goal) => (
              <div key={goal.title}>
                <strong className="text-[14.5px] font-bold">{goal.title}</strong>
                <p className="mt-1 text-[13.5px] leading-[1.5] text-[#33373d] m-0">
                  {goal.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* 07 Contact */}
        <section className="tech-card is-dark">
          <div className="tech-lab text-[#bbbbbb]">
            <span className="tech-lab-mark bg-[#c81e1e]" aria-hidden="true" />
            <span>07 Contact</span>
          </div>
          <h2 className="tech-h2 text-white">Let’s build something practical</h2>
          <div className="tech-btn-bar flex flex-wrap gap-2.5 mt-2">
            <a href={`mailto:${PORTFOLIO_PROFILE.email}`}>Email</a>
            <button
              type="button"
              onClick={handleCopyEmail}
              className="inline-flex items-center gap-1.5"
            >
              {copiedEmail ? (
                <>
                  <Check className="w-3.5 h-3.5 text-[#0f5c3f]" aria-hidden="true" />
                  <span>Copied Email</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Copy Email</span>
                </>
              )}
            </button>
            <a
              href={PORTFOLIO_PROFILE.linkedinUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              LinkedIn ↗
            </a>
            <a
              href={PORTFOLIO_PROFILE.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub ↗
            </a>
            <button type="button" onClick={() => setResumeOpen(true)}>
              Resume Sheet
            </button>
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
        project={selectedProject}
        onClose={() => setSelectedProject(null)}
      />
      <ResumeModal isOpen={resumeOpen} onClose={() => setResumeOpen(false)} />
    </div>
  );
};
