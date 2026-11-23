import type { CreativeCategory, CreativeWorkItem } from './portfolio';

interface WorkFolderAsset {
  id: string;
  title: string;
  subtitle: string;
  category: CreativeCategory;
  image: string;
  width: number;
  height: number;
  video?: string;
  description: string;
}

const assets: WorkFolderAsset[] = [
  { id: 'love-poster', title: 'Love Poster', subtitle: 'Type poster', category: 'Graphics', image: '/work/love-poster.webp', width: 1080, height: 1080, description: 'A red poster with geometric lettering.' },
  { id: 'illustrated-portrait', title: 'Illustrated Portrait', subtitle: 'Black and white portrait', category: 'AI Portraits', image: '/work/illustrated-portrait.webp', width: 1600, height: 1501, description: 'A monochrome illustrated portrait.' },
  { id: 'character-turnaround-sheet', title: 'Character Turnaround', subtitle: 'Four view character sheet', category: 'AI Portraits', image: '/work/character-turnaround.webp', width: 1600, height: 1195, description: 'A character shown from four angles.' },
  { id: 'character-turntable', title: 'Character Turntable', subtitle: 'Character rotation clip', category: 'AI Video', image: '/work/character-turntable-poster.webp', video: '/work/character-turntable.mp4', width: 720, height: 1280, description: 'A character rotation video.' },
  { id: 'suit-turntable', title: 'Suit Turntable', subtitle: 'Character rotation clip', category: 'AI Video', image: '/work/character-suit-turntable-poster.webp', video: '/work/character-suit-turntable.mp4', width: 1080, height: 1920, description: 'A suited character rotation video.' },
  { id: 'jacket-turntable', title: 'Jacket Turntable', subtitle: 'Character rotation clip', category: 'AI Video', image: '/work/character-jacket-turntable-poster.webp', video: '/work/character-jacket-turntable.mp4', width: 1080, height: 1920, description: 'A character rotation video with a jacket.' },
  { id: 'portfolio-promo', title: 'Portfolio Website Promo', subtitle: 'Portfolio graphic', category: 'Graphics', image: '/work/portfolio-promo.webp', width: 1600, height: 1078, description: 'A portfolio website promotional graphic.' },
  { id: 'portfolio-promo-alt', title: 'Portfolio Artwork', subtitle: 'Portrait artwork', category: 'AI Portraits', image: '/work/portfolio-promo-alt.webp', width: 1600, height: 1600, description: 'A portrait illustration with portfolio lettering.' },
  { id: 'portrait-orange-art', title: 'Orange Portrait', subtitle: 'Illustrated portrait', category: 'AI Portraits', image: '/work/portrait-orange-art.webp', width: 1536, height: 1024, description: 'A warm colored illustrated portrait.' },
  { id: 'portrait-line-art', title: 'Portrait Line Art', subtitle: 'Black and white portrait', category: 'AI Portraits', image: '/work/portrait-line-art.webp', width: 1600, height: 1600, description: 'A black and white line illustration of a face.' },
  { id: 'pixel-profile-views', title: 'Pixel Profile Views', subtitle: 'Pixel character sheet', category: 'Experiments', image: '/work/pixel-profile-views.webp', width: 1600, height: 1600, description: 'Pixel character views arranged in a sheet.' },
  { id: 'designer-character-views', title: 'Designer Character Views', subtitle: 'Four view character sheet', category: 'AI Portraits', image: '/work/designer-character-views.webp', width: 1600, height: 1195, description: 'A character shown in several outfits and angles.' },
  { id: 'order-manager-logo', title: 'Order Manager Logo', subtitle: 'App logo', category: 'Graphics', image: '/work/order-manager-logo.webp', width: 1254, height: 1254, description: 'A delivery themed app logo.' },
  { id: 'random-frames', title: 'Random Frames', subtitle: 'Nature video', category: 'Random', image: '/work/random-frames-poster.webp', video: '/work/random-frames.mp4', width: 1440, height: 1080, description: 'A nature video with a title card.' },
  { id: 'architecture-clip', title: 'Architecture Clip', subtitle: 'Vertical video', category: 'Video Editing', image: '/work/architecture-clip-poster.webp', video: '/work/architecture-clip.mp4', width: 1080, height: 1920, description: 'A vertical clip showing a building.' },
  { id: 'tree-canopy-clip', title: 'Tree Canopy Clip', subtitle: 'Nature video', category: 'Video Editing', image: '/work/tree-canopy-clip-poster.webp', video: '/work/tree-canopy-clip.mp4', width: 1440, height: 1080, description: 'A video looking up through tree branches.' },
  { id: 'sky-video-edit', title: 'Sky Video Edit', subtitle: 'Multi shot video', category: 'Video Editing', image: '/work/sky-video-edit-poster.webp', video: '/work/sky-video-edit.mp4', width: 1080, height: 1920, description: 'A sequence of vertical sky clips.' },
  { id: 'minimal-portfolio-dashboard', title: 'Portfolio Dashboard', subtitle: 'Dashboard screenshot', category: 'Graphics', image: '/work/portfolio-dashboard-minimal.webp', width: 1600, height: 900, description: 'A screenshot of a portfolio dashboard layout.' },
  { id: 'iron-man-pop-art', title: 'Iron Man Pop Art', subtitle: 'Comic style illustration', category: 'Graphics', image: '/work/iron-man-pop-art.webp', width: 1249, height: 1600, description: 'A comic style portrait of Iron Man.' },
  { id: 'red-pop-art-portrait', title: 'Red Pop Art Portrait', subtitle: 'Illustrated portrait', category: 'Graphics', image: '/work/red-pop-art-portrait.webp', width: 1283, height: 1600, description: 'A red and black pop art portrait.' },
  { id: 'pixel-coding-loop', title: 'Pixel Coding Loop', subtitle: 'Pixel animation', category: 'AI Video', image: '/work/pixel-coding-loop-poster.webp', video: '/work/pixel-coding-loop.mp4', width: 1280, height: 720, description: 'A pixel character animation at a computer.' },
  { id: 'developer-character-views', title: 'Developer Character Views', subtitle: 'Four view character sheet', category: 'AI Portraits', image: '/work/developer-character-views.webp', width: 1600, height: 1195, description: 'A character shown from four angles.' },
  { id: 'portfolio-dashboard', title: 'Portfolio Dashboard UI', subtitle: 'Dashboard screenshot', category: 'Graphics', image: '/work/portfolio-dashboard.webp', width: 1536, height: 1024, description: 'A screenshot of a portfolio dashboard interface.' },
  { id: 'temple-clip', title: 'Temple Clip', subtitle: 'Vertical video', category: 'Random', image: '/work/temple-clip-poster.webp', video: '/work/temple-clip.mp4', width: 1072, height: 1906, description: 'A vertical clip showing a temple exterior.' },
];

const works: CreativeWorkItem[] = assets.map((asset, index) => {
  const aspect = asset.width / asset.height;
  return {
    id: asset.id,
    index: String(index + 10).padStart(2, '0'),
    title: asset.title,
    handle: '@tarunsuthar · Gallery',
    category: asset.category,
    subtitle: asset.subtitle,
    shortDescription: asset.description,
    masonrySize: aspect < 0.9 ? 'tall' : aspect > 1.3 ? 'compact' : 'medium',
    theme: 'cobalt',
    medium: asset.video ? 'Video' : 'Image',
    year: 'Undated',
    brief: 'Media added from the supplied work folder.',
    promptApproach: 'No original prompt text was included with this media file.',
    promptText: '',
    palette: [],
    featureImage: asset.image,
    featureVideo: asset.video,
    mediaWidth: asset.width,
    mediaHeight: asset.height,
  };
});

export default works;
