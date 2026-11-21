import React, { useEffect } from 'react';
import { Printer, X } from 'lucide-react';
import {
  CERTIFICATIONS,
  EDUCATION,
  PORTFOLIO_PROFILE,
  PROJECTS,
  SKILL_GROUPS,
} from '../data/portfolio';

interface ResumeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ResumeModal: React.FC<ResumeModalProps> = ({ isOpen, onClose }) => {
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') {
        ev.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="resume-modal-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl max-h-[90dvh] overflow-y-auto bg-white text-[#111111] border-2 border-[#111111] shadow-[6px_7px_0_#ffc400] p-6 md:p-10"
        onClick={(ev) => ev.stopPropagation()}
      >
        {/* Top bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-[#111111] pb-4">
          <div>
            <h2 id="resume-modal-title" className="text-3xl font-extrabold tracking-[-0.04em]">
              {PORTFOLIO_PROFILE.fullName}
            </h2>
            <p className="font-mono-tech text-xs text-[#4b4f55] mt-1">
              {PORTFOLIO_PROFILE.tech.role} · {PORTFOLIO_PROFILE.location} · {PORTFOLIO_PROFILE.email}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 font-mono-tech text-[11px] font-bold uppercase px-3 py-2 border border-[#111111] bg-[#ffc400] text-[#111111] shadow-[2px_2px_0_#111111] cursor-pointer hover:bg-[#ffd23f]"
            >
              <Printer className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Print / PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close resume preview"
              className="w-9 h-9 grid place-items-center border border-[#111111] bg-white hover:bg-[#f4f4f1] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Summary */}
        <section className="mt-5">
          <h3 className="font-mono-tech text-[11px] font-bold uppercase tracking-[0.14em] text-[#0f5c3f]">
            Summary
          </h3>
          <p className="mt-1.5 text-sm leading-relaxed text-[#22252a]">
            {PORTFOLIO_PROFILE.tech.bio}
          </p>
        </section>

        {/* Skills */}
        <section className="mt-5">
          <h3 className="font-mono-tech text-[11px] font-bold uppercase tracking-[0.14em] text-[#0f5c3f]">
            Technical Skills
          </h3>
          <div className="mt-2 space-y-1.5 text-[13.5px]">
            {SKILL_GROUPS.map((group) => (
              <div key={group.id}>
                <strong className="font-semibold">{group.label}:</strong>{' '}
                <span className="text-[#33373d]">{group.skills.join(' · ')}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Projects */}
        <section className="mt-5">
          <h3 className="font-mono-tech text-[11px] font-bold uppercase tracking-[0.14em] text-[#0f5c3f]">
            Projects
          </h3>
          <div className="mt-2 space-y-3">
            {PROJECTS.map((proj) => (
              <div key={proj.id} className="border-t border-[#111111]/15 pt-2.5 first:border-0 first:pt-0">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <strong className="text-[15px] font-bold">{proj.title}</strong>
                  <span className="font-mono-tech text-[11px] text-[#4b4f55]">
                    {proj.subtitle} · {proj.stack.join(', ')}
                  </span>
                </div>
                <p className="mt-1 text-[13px] text-[#33373d]">{proj.summary}</p>
                <ul className="mt-1 list-disc pl-5 text-[12.5px] text-[#33373d]">
                  {proj.highlights.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* Education & Proof */}
        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-5 border-t border-[#111111]/20 pt-4">
          <section>
            <h3 className="font-mono-tech text-[11px] font-bold uppercase tracking-[0.14em] text-[#0f5c3f]">
              Education
            </h3>
            <div className="mt-2 space-y-2 text-[13px]">
              {EDUCATION.map((edu) => (
                <div key={edu.degree}>
                  <div className="font-semibold">{edu.degree}</div>
                  <div className="font-mono-tech text-[11px] text-[#4b4f55]">
                    {edu.meta} — {edu.institution}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h3 className="font-mono-tech text-[11px] font-bold uppercase tracking-[0.14em] text-[#0f5c3f]">
              Certifications & DSA
            </h3>
            <div className="mt-2 space-y-1.5 text-[13px]">
              {CERTIFICATIONS.map((cert) => (
                <div key={cert.title} className="flex justify-between gap-2">
                  <span>{cert.title}</span>
                  <span className="font-mono-tech text-[11px] text-[#4b4f55] shrink-0">
                    {cert.dateOrStatus}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
