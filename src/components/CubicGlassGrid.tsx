import React from 'react';
import { GlassTheme } from '../data/portfolio';

const ORB_GRADIENTS: Record<GlassTheme, string> = {
  sunset:
    'radial-gradient(circle at 50% 72%, #fffbeb 0%, #fde047 22%, #fb923c 48%, #ea580c 68%, rgba(255,255,255,0) 86%)',
  emerald:
    'radial-gradient(circle at 50% 74%, #f7fee7 0%, #bef264 20%, #4ade80 48%, #16a34a 70%, rgba(255,255,255,0) 88%)',
  violet:
    'radial-gradient(circle at 50% 74%, #fdf4ff 0%, #f0abfc 24%, #c084fc 50%, #7c3aed 72%, rgba(255,255,255,0) 88%)',
  cobalt:
    'radial-gradient(circle at 50% 74%, #eff6ff 0%, #93c5fd 24%, #3b82f6 52%, #1d4ed8 72%, rgba(255,255,255,0) 88%)',
  amber:
    'radial-gradient(circle at 50% 74%, #fffbeb 0%, #fde68a 24%, #f59e0b 52%, #b45309 72%, rgba(255,255,255,0) 88%)',
  orchid:
    'radial-gradient(circle at 50% 74%, #fdf2f8 0%, #f9a8d4 24%, #d946ef 52%, #9333ea 72%, rgba(255,255,255,0) 88%)',
};

interface GlassCardOrbProps {
  theme: GlassTheme;
  className?: string;
}

/**
 * Renders a luminous radial orb refracted through a crisp frosted square cubic grid,
 * matching the sleek rounded glass card aesthetic.
 */
export const GlassCardOrb: React.FC<GlassCardOrbProps> = ({ theme, className = '' }) => {
  return (
    <div className={`relative overflow-hidden ${className}`} aria-hidden="true">
      <div
        className="absolute inset-0 scale-110"
        style={{ background: ORB_GRADIENTS[theme], filter: 'blur(14px)' }}
      />
      <div className="orb-cubic-overlay absolute inset-0" />
      <div
        className="absolute inset-x-0 top-0 h-14 pointer-events-none"
        style={{
          background: 'linear-gradient(180deg, #ffffff 0%, rgba(255,255,255,0) 100%)',
        }}
      />
    </div>
  );
};

interface CubicMatrixClusterProps {
  variant: 'emerald' | 'cobalt' | 'violet';
  pattern: number[][];
  className?: string;
}

const CLUSTER_COLORS: Record<'emerald' | 'cobalt' | 'violet', string> = {
  emerald:
    'radial-gradient(circle at 55% 58%, #bef264 0%, #4ade80 32%, #16a34a 64%, rgba(247,248,250,0) 86%)',
  cobalt:
    'radial-gradient(circle at 65% 65%, #93c5fd 0%, #3b82f6 36%, #1d4ed8 68%, rgba(247,248,250,0) 88%)',
  violet:
    'radial-gradient(circle at 48% 52%, #e9d5ff 0%, #c084fc 36%, #9333ea 68%, rgba(247,248,250,0) 88%)',
};

/**
 * Stepped matrix of 3D beveled frosted cubic pillow tiles floating over an ambient gradient bloom.
 */
export const CubicMatrixCluster: React.FC<CubicMatrixClusterProps> = ({
  variant,
  pattern,
  className = '',
}) => {
  const cols = pattern[0]?.length ?? 5;

  return (
    <div className={`relative select-none ${className}`} aria-hidden="true">
      <div
        className="absolute inset-2 rounded-3xl pointer-events-none"
        style={{ background: CLUSTER_COLORS[variant], filter: 'blur(26px)', opacity: 0.92 }}
      />
      <div
        className="relative grid gap-[2px]"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      >
        {pattern.flatMap((row, rIdx) =>
          row.map((cell, cIdx) =>
            cell > 0 ? (
              <div
                key={`${rIdx}-${cIdx}`}
                className="cubic-pillow aspect-square"
                style={{ opacity: cell === 2 ? 0.96 : 0.72 }}
              />
            ) : (
              <div key={`${rIdx}-${cIdx}`} className="aspect-square" />
            )
          )
        )}
      </div>
    </div>
  );
};
