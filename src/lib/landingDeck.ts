export type CreativeAuraId = 'indigo' | 'emerald' | 'orchid';

export interface CreativeAuraPreset {
  id: CreativeAuraId;
  label: string;
  swatch: string;
  accentHex: string;
  glowGradient: string;
}

export const CREATIVE_AURA_PRESETS: CreativeAuraPreset[] = [
  {
    id: 'indigo',
    label: 'Indigo',
    swatch: '#4f46e5',
    accentHex: '#93c5fd',
    glowGradient:
      'radial-gradient(62% 72% at 62% 72%, rgba(56, 130, 246, 0.72), transparent 64%), radial-gradient(58% 68% at 20% 24%, rgba(139, 92, 246, 0.52), transparent 66%), radial-gradient(48% 55% at 82% 20%, rgba(45, 212, 191, 0.34), transparent 64%), linear-gradient(145deg, #0b1026 0%, #151b3b 52%, #0a1428 100%)',
  },
  {
    id: 'emerald',
    label: 'Emerald',
    swatch: '#10b981',
    accentHex: '#6ee7b7',
    glowGradient:
      'radial-gradient(64% 72% at 68% 72%, rgba(163, 230, 53, 0.58), transparent 62%), radial-gradient(62% 70% at 24% 26%, rgba(16, 185, 129, 0.56), transparent 66%), radial-gradient(46% 52% at 84% 18%, rgba(20, 184, 166, 0.45), transparent 62%), linear-gradient(145deg, #061b18 0%, #0a2d28 52%, #081816 100%)',
  },
  {
    id: 'orchid',
    label: 'Orchid',
    swatch: '#c084fc',
    accentHex: '#f0abfc',
    glowGradient:
      'radial-gradient(62% 72% at 66% 70%, rgba(217, 70, 239, 0.58), transparent 64%), radial-gradient(60% 70% at 22% 24%, rgba(99, 102, 241, 0.52), transparent 66%), radial-gradient(48% 54% at 82% 20%, rgba(244, 114, 182, 0.36), transparent 62%), linear-gradient(145deg, #160a28 0%, #22103d 52%, #110920 100%)',
  },
];

export function getAuraPreset(id: CreativeAuraId): CreativeAuraPreset {
  return CREATIVE_AURA_PRESETS.find((preset) => preset.id === id) ?? CREATIVE_AURA_PRESETS[0];
}
