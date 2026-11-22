import React, { useEffect } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { CreativeWorkItem } from '../data/portfolio';
import { GlassCardOrb } from './CubicGlassGrid';

interface CreativeLightboxProps {
  works: CreativeWorkItem[];
  activeIndex: number | null;
  onClose: () => void;
  onSelectIndex: (index: number) => void;
}

export const CreativeLightbox: React.FC<CreativeLightboxProps> = ({
  works,
  activeIndex,
  onClose,
  onSelectIndex,
}) => {
  const work = activeIndex !== null ? works[activeIndex] ?? null : null;

  useEffect(() => {
    if (activeIndex === null) return;
    const onKeyDown = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') {
        ev.stopPropagation();
        onClose();
      } else if (ev.key === 'ArrowRight') {
        ev.preventDefault();
        onSelectIndex((activeIndex + 1) % works.length);
      } else if (ev.key === 'ArrowLeft') {
        ev.preventDefault();
        onSelectIndex((activeIndex - 1 + works.length) % works.length);
      }
    };
    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, [activeIndex, works.length, onClose, onSelectIndex]);

  const [imageError, setImageError] = React.useState(false);

  useEffect(() => {
    setImageError(false);
  }, [work?.id, work?.featureImage]);

  if (!work || activeIndex === null) return null;

  const prevIndex = (activeIndex - 1 + works.length) % works.length;
  const nextIndex = (activeIndex + 1) % works.length;
  const showFeatureImage = Boolean(work.featureImage && !imageError);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#111215]/85 p-4 md:p-8"
      role="dialog"
      aria-modal="true"
      aria-labelledby="lightbox-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl max-h-[92dvh] overflow-y-auto bg-white text-[#141518] rounded-[28px] shadow-[0_32px_90px_rgba(0,0,0,0.45)] grid grid-cols-1 md:grid-cols-12 overflow-hidden"
        onClick={(ev) => ev.stopPropagation()}
      >
        {/* Left: Uploaded Feature Image or Sleek White Glass Gradient Card Visual */}
        <div className="md:col-span-6 bg-white flex flex-col justify-between min-h-[300px] md:min-h-[460px] border-b md:border-b-0 md:border-r border-[#141518]/10">
          <div className="p-6 pb-2">
            <div className="flex items-center justify-between text-xs text-[#6b7280]">
              <span className="font-mono-tech">{work.index} · {work.year}</span>
              <span>{work.category}</span>
            </div>
            <h3 className="mt-3 text-3xl font-extrabold tracking-[-0.04em] text-[#141518] m-0">
              {work.title}
            </h3>
            <p className="mt-1 text-xs text-[#6b7280] m-0">{work.handle}</p>
          </div>
          {showFeatureImage ? (
            <div className="relative h-[260px] md:h-[340px] w-full overflow-hidden bg-[#141518]">
              <img
                src={work.featureImage}
                alt={`${work.title} — ${work.subtitle}`}
                referrerPolicy="no-referrer"
                onError={() => setImageError(true)}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <GlassCardOrb theme={work.theme} className="h-[240px] md:h-[310px] w-full" />
          )}
        </div>

        {/* Right: Editorial Direction & Palette Details */}
        <div className="md:col-span-6 p-6 md:p-8 flex flex-col justify-between gap-6 bg-[#f8f9fb]">
          <div>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-[#2563eb] m-0">{work.medium}</p>
                <h2
                  id="lightbox-title"
                  className="mt-1 text-2xl font-semibold tracking-[-0.03em] text-[#141518]"
                >
                  {work.subtitle}
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close exhibition lightbox"
                className="w-9 h-9 rounded-full border border-[#141518]/15 bg-white hover:bg-[#141518] hover:text-white grid place-items-center text-[#141518] cursor-pointer transition-colors shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-6 space-y-5 text-[14px] leading-relaxed text-[#374151]">
              <div>
                <div className="font-mono-tech text-[11px] uppercase tracking-[0.12em] text-[#6b7280] mb-1">
                  Visual Direction
                </div>
                <p className="m-0">{work.brief}</p>
              </div>

              <div>
                <div className="font-mono-tech text-[11px] uppercase tracking-[0.12em] text-[#6b7280] mb-1">
                  Prompt &amp; Lighting Craft
                </div>
                <p className="m-0">{work.promptApproach}</p>
              </div>

              <div>
                <div className="font-mono-tech text-[11px] uppercase tracking-[0.12em] text-[#6b7280] mb-2">
                  Gradient Swatches
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  {work.palette.map((hex) => (
                    <div key={hex} className="flex items-center gap-1.5">
                      <span
                        className="w-5 h-5 rounded-md border border-black/10 inline-block shadow-xs"
                        style={{ backgroundColor: hex }}
                        aria-hidden="true"
                      />
                      <span className="font-mono-tech text-[11px] text-[#4b5563]">{hex}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-[#141518]/10">
            <button
              type="button"
              onClick={() => onSelectIndex(prevIndex)}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[#141518] px-3.5 py-2 rounded-full border border-[#141518]/15 bg-white hover:bg-[#141518] hover:text-white cursor-pointer transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Previous</span>
            </button>
            <span className="font-mono-tech text-xs text-[#6b7280]">
              {work.index} / {String(works.length).padStart(2, '0')}
            </span>
            <button
              type="button"
              onClick={() => onSelectIndex(nextIndex)}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[#141518] px-3.5 py-2 rounded-full border border-[#141518]/15 bg-white hover:bg-[#141518] hover:text-white cursor-pointer transition-colors"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
