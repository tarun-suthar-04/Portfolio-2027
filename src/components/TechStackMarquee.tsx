import React from 'react';
import { TECH_STACK_LOGOS, TechLogoItem } from '../data/portfolio';

const TechLogoIcon: React.FC<{ id: string; accent: string }> = ({ id, accent }) => {
  switch (id) {
    case 'java':
      return (
        <svg viewBox="0 0 24 24" className="w-6 h-6 shrink-0" fill="none" aria-hidden="true">
          <path d="M9.5 3.5c1.5 1.6-1.5 2.9 0 4.5M13.5 3c1.6 1.7-1.4 3 0 4.6" stroke={accent} strokeWidth="1.8" strokeLinecap="round" />
          <path d="M5.5 11h10.5v3.5a4.5 4.5 0 0 1-4.5 4.5H10a4.5 4.5 0 0 1-4.5-4.5V11Z" stroke="#111111" strokeWidth="1.8" fill="#ffffff" />
          <path d="M16 12h1.6a2.2 2.2 0 1 1 0 4.4H16" stroke="#111111" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M4.5 21h13" stroke={accent} strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    case 'python':
      return (
        <svg viewBox="0 0 24 24" className="w-6 h-6 shrink-0" fill="none" aria-hidden="true">
          <path d="M11.8 3C8.2 3 8.5 4.6 8.5 4.6V7h3.5v.8H6.6S4 7.5 4 11.4c0 3.8 2.2 3.7 2.2 3.7h1.3v-1.8s-.1-2.2 2.2-2.2h3.7s2.1 0 2.1-2V5.3S15.8 3 11.8 3Z" fill="#2563eb" />
          <circle cx="9.8" cy="5.2" r="0.85" fill="#ffffff" />
          <path d="M12.2 21c3.6 0 3.3-1.6 3.3-1.6V17H12v-.8h5.4s2.6.3 2.6-3.6c0-3.8-2.2-3.7-2.2-3.7h-1.3v1.8s.1 2.2-2.2 2.2h-3.7s-2.1 0-2.1 2v3.8S8.2 21 12.2 21Z" fill="#f59e0b" />
          <circle cx="14.2" cy="18.8" r="0.85" fill="#111111" />
        </svg>
      );
    case 'sql':
      return (
        <svg viewBox="0 0 24 24" className="w-6 h-6 shrink-0" fill="none" aria-hidden="true">
          <ellipse cx="12" cy="6" rx="7" ry="3" fill={accent} fillOpacity="0.18" stroke="#111111" strokeWidth="1.7" />
          <path d="M5 6v6c0 1.66 3.13 3 7 3s7-1.34 7-3V6" stroke="#111111" strokeWidth="1.7" />
          <path d="M5 12v6c0 1.66 3.13 3 7 3s7-1.34 7-3v-6" stroke={accent} strokeWidth="1.7" />
        </svg>
      );
    case 'android':
      return (
        <svg viewBox="0 0 24 24" className="w-6 h-6 shrink-0" fill="none" aria-hidden="true">
          <path d="M7.5 8.5 5.8 5.8M16.5 8.5l1.7-2.7" stroke={accent} strokeWidth="1.8" strokeLinecap="round" />
          <path d="M5 14a7 7 0 0 1 14 0v2.5a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 16.5V14Z" fill={accent} fillOpacity="0.2" stroke={accent} strokeWidth="1.8" />
          <circle cx="9.4" cy="12.5" r="1" fill="#111111" />
          <circle cx="14.6" cy="12.5" r="1" fill="#111111" />
        </svg>
      );
    case 'mysql':
      return (
        <svg viewBox="0 0 24 24" className="w-6 h-6 shrink-0" fill="none" aria-hidden="true">
          <path d="M4 17.5C6.2 10.5 11.5 6 18 6c-1.8 2.4-2.1 4.6-1 6.5 1 1.6 2.5 2.4 3 3.5-2.6-.2-4.6-1.1-6.2-2.6-2.1 1.2-4.3 2.5-5.6 4.6" stroke={accent} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="14.5" cy="9.2" r="1" fill="#f59e0b" />
        </svg>
      );
    case 'sqlite':
      return (
        <svg viewBox="0 0 24 24" className="w-6 h-6 shrink-0" fill="none" aria-hidden="true">
          <rect x="4" y="4" width="16" height="16" rx="3" fill="#0369a1" fillOpacity="0.14" stroke="#111111" strokeWidth="1.7" />
          <path d="M16.5 6.5C13 9 10.5 12.2 9.2 17.5M12 10.5c1.5-.3 3.1.2 4.3 1" stroke={accent} strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    case 'firebase':
      return (
        <svg viewBox="0 0 24 24" className="w-6 h-6 shrink-0" fill="none" aria-hidden="true">
          <path d="M5.5 17.8 8.6 5.2a.7.7 0 0 1 1.3-.15l2.3 4.35 3.1-3.1a.7.7 0 0 1 1.18.35L18.5 17.8 12 21l-6.5-3.2Z" fill="#ffc400" stroke="#111111" strokeWidth="1.6" strokeLinejoin="round" />
        </svg>
      );
    case 'javafx':
      return (
        <svg viewBox="0 0 24 24" className="w-6 h-6 shrink-0" fill="none" aria-hidden="true">
          <rect x="3.5" y="4.5" width="17" height="15" rx="2" stroke="#111111" strokeWidth="1.7" fill="#ffffff" />
          <path d="M3.5 9h17" stroke="#111111" strokeWidth="1.5" />
          <path d="M8 14.5 10.5 12l2.5 2.5L16 11.5" stroke={accent} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'git':
      return (
        <svg viewBox="0 0 24 24" className="w-6 h-6 shrink-0" fill="none" aria-hidden="true">
          <path d="M12 3.2 20.8 12 12 20.8 3.2 12 12 3.2Z" fill={accent} fillOpacity="0.16" stroke={accent} strokeWidth="1.7" strokeLinejoin="round" />
          <circle cx="12" cy="8.5" r="1.5" fill="#111111" />
          <circle cx="12" cy="15.5" r="1.5" fill="#111111" />
          <circle cx="15.5" cy="12" r="1.5" fill="#111111" />
          <path d="M12 10v4M13.1 9.6 14.4 10.9" stroke="#111111" strokeWidth="1.5" />
        </svg>
      );
    case 'github':
      return (
        <svg viewBox="0 0 24 24" className="w-6 h-6 shrink-0" fill="currentColor" aria-hidden="true">
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M12 2C6.48 2 2 6.58 2 12.26c0 4.53 2.87 8.37 6.84 9.73.5.09.68-.22.68-.49 0-.24-.01-.88-.01-1.72-2.78.62-3.37-1.37-3.37-1.37-.45-1.18-1.11-1.5-1.11-1.5-.91-.64.07-.63.07-.63 1 .07 1.53 1.05 1.53 1.05.9 1.57 2.36 1.12 2.94.86.09-.67.35-1.12.64-1.38-2.22-.26-4.56-1.14-4.56-5.08 0-1.12.39-2.04 1.03-2.76-.1-.26-.45-1.31.1-2.72 0 0 .84-.28 2.75 1.05A9.38 9.38 0 0 1 12 6.84c.85 0 1.71.12 2.51.35 1.91-1.33 2.75-1.05 2.75-1.05.55 1.41.2 2.46.1 2.72.64.72 1.03 1.64 1.03 2.76 0 3.95-2.34 4.82-4.57 5.07.36.32.68.94.68 1.9 0 1.37-.01 2.48-.01 2.82 0 .27.18.59.69.49A10.27 10.27 0 0 0 22 12.26C22 6.58 17.52 2 12 2Z"
          />
        </svg>
      );
    case 'maven':
      return (
        <svg viewBox="0 0 24 24" className="w-6 h-6 shrink-0" fill="none" aria-hidden="true">
          <path d="M4.5 18V6l4.5 7 4.5-7v12M16.5 11.5l3 6.5" stroke={accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M15.5 15h4.5" stroke="#111111" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    case 'gradle':
      return (
        <svg viewBox="0 0 24 24" className="w-6 h-6 shrink-0" fill="none" aria-hidden="true">
          <path d="M6 16.5c0-4.2 3.2-7.5 7.5-7.5 2.2 0 4.2.9 5.5 2.5" stroke={accent} strokeWidth="2.1" strokeLinecap="round" />
          <path d="M8.5 16.5A4.8 4.8 0 0 1 16 12.8" stroke="#111111" strokeWidth="1.8" strokeLinecap="round" />
          <circle cx="15.5" cy="16" r="1.6" fill={accent} />
        </svg>
      );
    case 'django':
      return (
        <svg viewBox="0 0 24 24" className="w-6 h-6 shrink-0" fill="none" aria-hidden="true">
          <rect x="3.5" y="3.5" width="17" height="17" rx="3" fill={accent} />
          <path d="M10.5 7v8.2a2.3 2.3 0 0 1-2.3 2.3c-1.4 0-2.2-.9-2.2-2.2s.8-2.2 2.2-2.2h2.3M14.5 10.5v5.3c0 1.4-.6 2.2-1.8 2.6" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" />
          <circle cx="14.5" cy="7.8" r="1" fill="#ffffff" />
        </svg>
      );
    case 'flask':
      return (
        <svg viewBox="0 0 24 24" className="w-6 h-6 shrink-0" fill="none" aria-hidden="true">
          <path d="M9.5 4h5M10.5 4v5.2L6.2 17.5A2 2 0 0 0 8 20.3h8a2 2 0 0 0 1.8-2.8l-4.3-8.3V4" stroke="#111111" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M8 15.5h8" stroke="#ffc400" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case 'docker':
      return (
        <svg viewBox="0 0 24 24" className="w-6 h-6 shrink-0" fill="none" aria-hidden="true">
          <rect x="6" y="9" width="3" height="2.6" fill={accent} />
          <rect x="9.6" y="9" width="3" height="2.6" fill={accent} />
          <rect x="13.2" y="9" width="3" height="2.6" fill={accent} />
          <rect x="9.6" y="5.8" width="3" height="2.6" fill={accent} />
          <path d="M4 13h14.5c1.5 0 2.4-.7 2.8-1.8-.3 4.3-3.1 7.3-8.5 7.3-5.2 0-8.8-2.4-8.8-5.5Z" stroke="#111111" strokeWidth="1.7" fill={accent} fillOpacity="0.16" strokeLinejoin="round" />
        </svg>
      );
    case 'aws':
      return (
        <svg viewBox="0 0 24 24" className="w-6 h-6 shrink-0" fill="none" aria-hidden="true">
          <path d="M6.5 12.5 8.5 7l2 5.5M7.2 11h2.6M13 7l1.3 5.5L15.8 8l1.5 4.5L18.5 7" stroke="#111111" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M4.5 16.5c4.6 2.8 10.4 2.8 15 0" stroke={accent} strokeWidth="2" strokeLinecap="round" />
          <path d="M17.5 15.5l2.2.8-.6 2.2" stroke={accent} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'linux':
      return (
        <svg viewBox="0 0 24 24" className="w-6 h-6 shrink-0" fill="none" aria-hidden="true">
          <rect x="3.5" y="4.5" width="17" height="15" rx="2" fill="#111111" />
          <path d="m7.5 9.5 3 2.5-3 2.5M12.5 14.5h4" stroke="#ffc400" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'openai':
      return (
        <svg viewBox="0 0 24 24" className="w-6 h-6 shrink-0" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="8" stroke={accent} strokeWidth="1.7" />
          <path d="M12 4v16M5.1 8l13.8 8M18.9 8 5.1 16" stroke="#111111" strokeWidth="1.4" strokeLinecap="round" />
          <circle cx="12" cy="12" r="2.2" fill="#ffffff" stroke={accent} strokeWidth="1.6" />
        </svg>
      );
    case 'claude':
    default:
      return (
        <svg viewBox="0 0 24 24" className="w-6 h-6 shrink-0" fill="none" aria-hidden="true">
          <path d="M12 3.5v17M3.5 12h17M6 6l12 12M18 6 6 18" stroke={accent} strokeWidth="1.9" strokeLinecap="round" />
          <circle cx="12" cy="12" r="2.3" fill="#ffffff" stroke="#111111" strokeWidth="1.5" />
        </svg>
      );
  }
};

const LogoPillTile: React.FC<{ item: TechLogoItem }> = ({ item }) => (
  <div className="tech-marquee-tile" title={item.name} role="listitem">
    <span className="tech-marquee-mark">
      <TechLogoIcon id={item.id} accent={item.accent} />
    </span>
    <span className="tech-marquee-name">{item.name}</span>
  </div>
);

export const TechStackMarquee: React.FC = () => {
  return (
    <section
      aria-label="Technology stack logos"
      data-testid="tech-stack-marquee"
      className="tech-marquee relative border-y border-[#111111] bg-[#f9faf9] py-3.5 overflow-hidden"
    >
      {/* Edge gradients for seamless disappear/reappear */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-0 w-12 sm:w-20 z-10 bg-gradient-to-r from-[#f9faf9] to-transparent"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 right-0 w-12 sm:w-20 z-10 bg-gradient-to-l from-[#f9faf9] to-transparent"
      />

      <div className="tech-marquee-track">
        <div className="tech-marquee-group" role="list" aria-label="Technologies">
          {TECH_STACK_LOGOS.map((item) => (
            <LogoPillTile key={`a-${item.id}`} item={item} />
          ))}
        </div>
        <div className="tech-marquee-group" aria-hidden="true">
          {TECH_STACK_LOGOS.map((item) => (
            <LogoPillTile key={`b-${item.id}`} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
};
