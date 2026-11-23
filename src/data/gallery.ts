import { CREATIVE_CATEGORIES, type CreativeCategory, type CreativeWorkItem } from './portfolio';

export const GALLERY_CATEGORIES = CREATIVE_CATEGORIES.map((id) => ({ id, label: id }));

const LEGACY_CATEGORY_BY_ID: Record<string, CreativeCategory> = {
  portraits: 'AI Portraits',
  geometric: 'Experiments',
  'kinetic-type': 'AI Video',
  cinematic: 'AI Video',
  editorial: 'Graphics',
  'solar-stage': 'Experiments',
  characters: 'AI Portraits',
  'botanical-glass': 'Experiments',
  advertising: 'Graphics',
};

export function normalizeCreativeCategory(value: string, id: string): CreativeCategory {
  if ((CREATIVE_CATEGORIES as readonly string[]).includes(value)) return value as CreativeCategory;
  if (LEGACY_CATEGORY_BY_ID[id]) return LEGACY_CATEGORY_BY_ID[id];
  if (value === 'Direction') return 'AI Portraits';
  if (value === 'Motion & Frame') return 'AI Video';
  return 'Experiments';
}

export interface GalleryWork {
  id: string;
  title: string;
  category: CreativeCategory;
  aspect: number;
  src?: string;
  videoSrc?: string;
  promptText?: string;
  alt: string;
  width: number;
  height: number;
  theme: CreativeWorkItem['theme'];
}

// CreativeWorkItem remains the source of truth; these dimensions stabilize the row before media loads.
export function toGalleryWorks(works: CreativeWorkItem[]): GalleryWork[] {
  return works.map((work) => {
    const width = work.mediaWidth ?? (work.masonrySize === 'tall' ? 820 : work.masonrySize === 'compact' ? 1380 : 1120);
    const height = work.mediaHeight ?? 1000;
    const aspect = width / height;
    return {
      id: work.id,
      title: work.title,
      category: work.category,
      aspect,
      src: work.featureImage,
      videoSrc: work.featureVideo,
      promptText: work.promptText,
      alt: `${work.title} — ${work.subtitle}`,
      width,
      height,
      theme: work.theme,
    };
  });
}

// Add images under public/work/ as WebP or AVIF (max 1600px, 250KB) and set featureImage in the Creative work data.
