import React from 'react';
import { CreativeToolLogoId, PlatformLogoId } from '../data/portfolio';

export const CreativeToolLogo: React.FC<{
  id: CreativeToolLogoId;
  className?: string;
}> = ({ id, className = 'w-7 h-7 shrink-0' }) => {
  switch (id) {
    case 'google-flow':
      return (
        <svg viewBox="0 0 32 32" className={className} fill="none" aria-hidden="true">
          <defs>
            <linearGradient id="gflow-a" x1="3" y1="6" x2="29" y2="26" gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor="#4285f4" />
              <stop offset="0.52" stopColor="#34a853" />
              <stop offset="1" stopColor="#fbbc05" />
            </linearGradient>
          </defs>
          <rect x="2" y="2" width="28" height="28" rx="8" fill="#0b1224" />
          <path
            d="M7.5 19.5c2.4-5.2 5.4-7.8 9-7.8 3.1 0 4.6 2.1 7.8 2.1"
            stroke="url(#gflow-a)"
            strokeWidth="3.2"
            strokeLinecap="round"
          />
          <path
            d="M7.5 13.8c2.6 0 4.4 2.4 7.8 5.2 2.4 1.9 5.2 2.4 9.2.6"
            stroke="#93c5fd"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeOpacity="0.92"
          />
          <circle cx="24" cy="13.8" r="2.2" fill="#ffffff" />
        </svg>
      );

    case 'canva':
      return (
        <svg viewBox="0 0 32 32" className={className} fill="none" aria-hidden="true">
          <defs>
            <linearGradient id="canva-bg" x1="3" y1="3" x2="29" y2="29" gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor="#00c4cc" />
              <stop offset="0.55" stopColor="#2e7cf6" />
              <stop offset="1" stopColor="#7d2ae8" />
            </linearGradient>
          </defs>
          <circle cx="16" cy="16" r="14" fill="url(#canva-bg)" />
          <path
            d="M20.9 12.1c-.9-1.5-2.5-2.3-4.5-2.3-4.1 0-7.2 3.3-7.2 7.4 0 3.4 2.3 5.5 5.6 5.5 2.7 0 5-1.4 6.2-3.5"
            stroke="#ffffff"
            strokeWidth="2.9"
            strokeLinecap="round"
          />
        </svg>
      );

    case 'capcut':
      return (
        <svg viewBox="0 0 32 32" className={className} fill="none" aria-hidden="true">
          <rect x="2" y="2" width="28" height="28" rx="8" fill="#141518" />
          <path
            d="M8.5 10.5 23.5 21.5M23.5 10.5 8.5 21.5"
            stroke="#ffffff"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <path
            d="M8.5 10.5h7.2a2.3 2.3 0 0 1 2.3 2.3v1.1M8.5 21.5h7.2a2.3 2.3 0 0 0 2.3-2.3v-1.1"
            stroke="#ffffff"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );

    case 'chatgpt':
      return (
        <svg viewBox="0 0 32 32" className={className} fill="none" aria-hidden="true">
          <rect x="2" y="2" width="28" height="28" rx="8" fill="#10a37f" />
          <g stroke="#ffffff" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 8.2a3.7 3.7 0 0 1 6.4 1.8 3.7 3.7 0 0 1 1.6 5.2" />
            <path d="M22.7 13.8a3.7 3.7 0 0 1-1.3 6.5 3.7 3.7 0 0 1-5.1 2.2" />
            <path d="M19.8 22.8a3.7 3.7 0 0 1-6.9-.6 3.7 3.7 0 0 1-4.3-3.5" />
            <path d="M9.3 18.2a3.7 3.7 0 0 1 1.3-6.5 3.7 3.7 0 0 1 5.1-2.2" />
            <polygon points="16,12.4 19.1,14.2 19.1,17.8 16,19.6 12.9,17.8 12.9,14.2" fill="none" />
          </g>
        </svg>
      );

    case 'ai-image':
    default:
      return (
        <svg viewBox="0 0 32 32" className={className} fill="none" aria-hidden="true">
          <defs>
            <linearGradient id="ai-img-bg" x1="3" y1="3" x2="29" y2="29" gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor="#7c3aed" />
              <stop offset="0.55" stopColor="#ec4899" />
              <stop offset="1" stopColor="#f59e0b" />
            </linearGradient>
          </defs>
          <rect x="2" y="2" width="28" height="28" rx="8" fill="url(#ai-img-bg)" />
          <path
            d="M16 7.5 18.3 13.7 24.5 16l-6.2 2.3L16 24.5l-2.3-6.2L7.5 16l6.2-2.3L16 7.5Z"
            fill="#ffffff"
          />
          <circle cx="22.8" cy="9.4" r="1.4" fill="#fef08a" />
        </svg>
      );
  }
};

export const PlatformBrandLogo: React.FC<{
  id: PlatformLogoId;
  className?: string;
}> = ({ id, className = 'w-5 h-5 shrink-0' }) => {
  switch (id) {
    case 'fiverr':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="11" fill="#1dbf73" />
          <path
            d="M13.3 8.8h-1.6c-.7 0-1.1.4-1.1 1.1V11h2.7v5.6h-2.1v-3.8H9.8v3.8H7.8V11H6.7V9.3h1.1v-.2c0-1.7 1.1-2.8 3-2.8h2.5v2.5Z"
            fill="#ffffff"
          />
          <circle cx="16.6" cy="15.4" r="1.4" fill="#ffffff" />
        </svg>
      );

    case 'instagram':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
          <defs>
            <linearGradient id="ig-grad" x1="3" y1="21" x2="21" y2="3" gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor="#f58529" />
              <stop offset="0.48" stopColor="#dd2a7b" />
              <stop offset="1" stopColor="#515bd4" />
            </linearGradient>
          </defs>
          <rect x="2" y="2" width="20" height="20" rx="5.5" fill="url(#ig-grad)" />
          <rect x="5.6" y="5.6" width="12.8" height="12.8" rx="3.6" stroke="#ffffff" strokeWidth="1.7" />
          <circle cx="12" cy="12" r="3" stroke="#ffffff" strokeWidth="1.7" />
          <circle cx="15.8" cy="8.2" r="1" fill="#ffffff" />
        </svg>
      );

    case 'linkedin':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
          <rect x="2" y="2" width="20" height="20" rx="4.5" fill="#0a66c2" />
          <circle cx="7.8" cy="8.1" r="1.3" fill="#ffffff" />
          <path d="M6.7 10.6h2.2v6.7H6.7v-6.7Z" fill="#ffffff" />
          <path
            d="M10.8 10.6h2.1v1c.5-.8 1.4-1.2 2.4-1.2 1.9 0 2.9 1.2 2.9 3.3v3.6h-2.2v-3.2c0-1.1-.4-1.8-1.4-1.8-.9 0-1.6.6-1.6 1.8v3.2h-2.2v-6.7Z"
            fill="#ffffff"
          />
        </svg>
      );

    case 'github':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M12 2C6.48 2 2 6.58 2 12.26c0 4.53 2.87 8.37 6.84 9.73.5.09.68-.22.68-.49 0-.24-.01-.88-.01-1.72-2.78.62-3.37-1.37-3.37-1.37-.45-1.18-1.11-1.5-1.11-1.5-.91-.64.07-.63.07-.63 1 .07 1.53 1.05 1.53 1.05.9 1.57 2.36 1.12 2.94.86.09-.67.35-1.12.64-1.38-2.22-.26-4.56-1.14-4.56-5.08 0-1.12.39-2.04 1.03-2.76-.1-.26-.45-1.31.1-2.72 0 0 .84-.28 2.75 1.05A9.38 9.38 0 0 1 12 6.84c.85 0 1.71.12 2.51.35 1.91-1.33 2.75-1.05 2.75-1.05.55 1.41.2 2.46.1 2.72.64.72 1.03 1.64 1.03 2.76 0 3.95-2.34 4.82-4.57 5.07.36.32.68.94.68 1.9 0 1.37-.01 2.48-.01 2.82 0 .27.18.59.69.49A10.27 10.27 0 0 0 22 12.26C22 6.58 17.52 2 12 2Z"
          />
        </svg>
      );

    case 'portfolio':
    default:
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
          <rect x="2" y="2" width="20" height="20" rx="5.5" fill="#2563eb" />
          <rect x="5.5" y="6.2" width="13" height="11.6" rx="2" stroke="#ffffff" strokeWidth="1.6" />
          <path d="M5.5 10h13" stroke="#ffffff" strokeWidth="1.4" />
          <circle cx="8" cy="8.1" r="0.7" fill="#ffffff" />
          <circle cx="10.2" cy="8.1" r="0.7" fill="#ffffff" />
          <path d="M9 14.8 11.4 12.4 13.4 14.2 15.6 12" stroke="#ffffff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
  }
};
