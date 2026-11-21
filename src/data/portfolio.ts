export type SkillTierId = 'hands-on' | 'foundational' | 'learning' | 'ai-tools';

export interface SkillGroup {
  id: SkillTierId;
  label: string;
  accentColor: string;
  skills: string[];
}

export interface ProjectItem {
  id: string;
  title: string;
  subtitle: string;
  summary: string;
  highlights: string[];
  stack: string[];
  demonstrates: string;
  githubUrl: string;
  architecture: {
    layers: { name: string; role: string }[];
    dataFlow: string;
    engineeringNotes: string[];
  };
}

export interface EducationItem {
  degree: string;
  meta: string;
  institution: string;
}

export interface CertificationItem {
  title: string;
  dateOrStatus: string;
}

export interface LearningGoal {
  title: string;
  description: string;
}

export type CreativeCategory = 'Direction' | 'Motion & Frame' | 'Concept';

export type GlassTheme = 'sunset' | 'emerald' | 'violet' | 'cobalt' | 'amber' | 'orchid';

export type MasonrySize = 'tall' | 'medium' | 'compact';

export interface CreativeWorkItem {
  id: string;
  index: string;
  title: string;
  handle: string;
  category: CreativeCategory;
  subtitle: string;
  shortDescription: string;
  masonrySize: MasonrySize;
  theme: GlassTheme;
  medium: string;
  year: string;
  brief: string;
  promptApproach: string;
  palette: string[];
}

export interface ProcessStep {
  id: string;
  index: string;
  title: string;
  caption: string;
}

export interface ToolkitItem {
  name: string;
  role: string;
}

export const PORTFOLIO_PROFILE = {
  firstName: 'Tarun',
  lastName: 'Suthar',
  fullName: 'Tarun Suthar',
  badge: 'TWO SIDES · ONE PERSON',
  email: 'cdstarun1837@gmail.com',
  location: 'Indore, India',
  linkedinUrl: 'https://linkedin.com/in/tarun-suthar-307838266',
  githubUrl: 'https://github.com/tarun-suthar-04',
  tech: {
    role: 'Software Developer · SDE I (entry-level)',
    bio: 'M.Sc. Computer Science graduate building practical, database-backed applications in Java and Python, using AI-assisted development tools in my workflow. Seeking a Software Development Engineer I role.',
    coreFacts: ['Indore, India', 'Python', 'Java', 'SQL'],
  },
  creative: {
    role: 'AI Creative Artist & Visual Content Creator',
    discipline: 'Visual storytelling',
    headline: 'Ideas into visuals.',
    subline: 'Imagination into motion.',
    years: '2025–2026',
  },
} as const;

export const SKILL_GROUPS: SkillGroup[] = [
  {
    id: 'hands-on',
    label: 'Hands-on in projects',
    accentColor: '#0f5c3f',
    skills: [
      'Python',
      'Java',
      'SQL · MySQL · SQLite',
      'Android (Java)',
      'JavaFX',
      'Tkinter',
      'Firebase Auth & Firestore',
      'Git/GitHub',
      'Maven · Gradle',
    ],
  },
  {
    id: 'foundational',
    label: 'Foundational',
    accentColor: '#8a6d00',
    skills: [
      'C++',
      'DSA · OOP',
      'Django (basics)',
      'Flask (basics)',
      'HTML · CSS',
      'Servlets · JDBC',
      'Pandas · NumPy',
      'AWS EC2 · S3 · IAM',
    ],
  },
  {
    id: 'learning',
    label: 'Learning',
    accentColor: '#c81e1e',
    skills: [
      'REST APIs',
      'Backend architecture',
      'Linux',
      'DevOps · CI/CD',
      'Cybersecurity',
    ],
  },
  {
    id: 'ai-tools',
    label: 'AI Tools',
    accentColor: '#2563eb',
    skills: [
      'ChatGPT',
      'Prompt Engineering',
      'Generative AI',
      'Codex',
      'Claude Code',
      'Antigravity',
      'AI-Assisted Development',
    ],
  },
];

export const PROJECTS: ProjectItem[] = [
  {
    id: 'order-analyzer',
    title: 'Order Analyzer',
    subtitle: 'Android app · Java',
    summary:
      'Helps a retail business record orders, review daily totals, and analyze order data. Used in a real shop workflow.',
    highlights: [
      'Offline-first SQLite',
      'Firebase Auth + Firestore sync',
      'Excel/CSV analysis, CSV export',
    ],
    stack: ['Java', 'SQLite', 'Firestore', 'Apache POI'],
    demonstrates: 'Shows: local DB design, cloud sync, spreadsheet processing.',
    githubUrl: 'https://github.com/tarun-suthar-04?tab=repositories',
    architecture: {
      layers: [
        { name: 'Android UI (Java)', role: 'Order capture forms, daily summary dashboard, and ledger filters' },
        { name: 'Local SQLite Store', role: 'Immediate offline persistence with indexed transaction timestamps' },
        { name: 'Sync Engine + Firestore', role: 'Authenticated background reconciliation via Firebase Auth & Firestore' },
        { name: 'Apache POI Exporter', role: 'Parses incoming Excel/CSV sheets and exports clean daily CSV reports' },
      ],
      dataFlow: 'Shop Entry → SQLite (Immediate Write) → Sync Queue → Cloud Firestore → CSV/Excel Analytics',
      engineeringNotes: [
        'Designed around intermittent retail shop connectivity so billing never blocks on network availability.',
        'Normalized order line items locally for rapid daily revenue and item-level aggregation.',
      ],
    },
  },
  {
    id: 'pixault',
    title: 'Pixault',
    subtitle: 'Desktop app · Java 21 + JavaFX',
    summary:
      'Encrypts sensitive data and hides it inside an image. An educational project, not an audited security product.',
    highlights: [
      'AES-256 · PBKDF2 · SHA-256',
      'Randomized LSB steganography',
      'Integrity check + email OTP',
    ],
    stack: ['JavaFX', 'MySQL', 'Maven'],
    demonstrates: 'Shows: crypto in an app workflow, auth, DB integration.',
    githubUrl: 'https://github.com/tarun-suthar-04?tab=repositories',
    architecture: {
      layers: [
        { name: 'JavaFX Desktop Shell', role: 'Encode/decode workspace, image preview, and OTP verification dialogs' },
        { name: 'Crypto Pipeline', role: 'PBKDF2 key derivation + AES-256 payload encryption + SHA-256 digest' },
        { name: 'Randomized LSB Engine', role: 'Distributes encrypted bits across carrier pixel channels deterministically' },
        { name: 'MySQL Audit Store', role: 'Stores user accounts, OTP verification state, and payload metadata' },
      ],
      dataFlow: 'Plaintext + Passphrase → PBKDF2 + AES-256 → SHA-256 Tag → Seeded LSB Pixel Embed → PNG Output',
      engineeringNotes: [
        'Built with explicit honesty as an educational cryptography & steganography workflow.',
        'Combines integrity verification with email OTP gating before payload extraction.',
      ],
    },
  },
  {
    id: 'employee-management',
    title: 'Employee Management System',
    subtitle: 'Desktop app · Python',
    summary: 'Manage employee records through a GUI backed by MySQL.',
    highlights: [
      'Add, update, delete records',
      'Table view of all employees',
    ],
    stack: ['Python', 'Tkinter', 'MySQL'],
    demonstrates: 'Shows: Python GUI, MySQL connection, CRUD.',
    githubUrl: 'https://github.com/tarun-suthar-04?tab=repositories',
    architecture: {
      layers: [
        { name: 'Tkinter Desktop GUI', role: 'Structured form inputs, validation alerts, and Treeview employee ledger' },
        { name: 'Controller Layer', role: 'Input sanitization, CRUD action dispatch, and selection state sync' },
        { name: 'MySQL Connector', role: 'Parameterized SQL queries for safe insert, update, delete, and search' },
      ],
      dataFlow: 'Tkinter Form → Validation → Parameterized SQL → MySQL Table → Treeview Refresh',
      engineeringNotes: [
        'Clean separation between Tkinter widget bindings and MySQL database operations.',
        'Supports live table refresh immediately after record mutations.',
      ],
    },
  },
];

export const EDUCATION: EducationItem[] = [
  {
    degree: 'M.Sc. Computer Science',
    meta: '2026 · CGPA 8.58',
    institution: 'SCSIT, DAVV, Indore',
  },
  {
    degree: 'B.Sc. Computer Science',
    meta: '2024 · CGPA 7.53',
    institution: 'Govt. Holkar Science College',
  },
  {
    degree: 'XII · X (CBSE)',
    meta: '2021 · 2019',
    institution: 'JNV Jhalawar',
  },
];

export const CERTIFICATIONS: CertificationItem[] = [
  { title: 'HackerRank Java Gold badge', dateOrStatus: 'Jul 2025' },
  { title: '120+ DSA problems, LeetCode', dateOrStatus: 'solved' },
  { title: 'Python Basics · HackerRank', dateOrStatus: 'Aug 2025' },
  { title: 'Java Basics · HackerRank', dateOrStatus: 'May 2025' },
  { title: 'Intro to Python · GUVI', dateOrStatus: 'Aug 2023' },
  { title: 'AI for INDIA · GUVI', dateOrStatus: 'Aug 2023' },
];

export const LEARNING_GOALS: LearningGoal[] = [
  {
    title: 'Python backend',
    description: 'Django, Flask, API development, testing, SQL and data handling.',
  },
  {
    title: 'DevOps & cloud',
    description: 'Linux, Git workflows, CI/CD with GitHub Actions, Docker, AWS fundamentals.',
  },
  {
    title: 'Security',
    description: 'Networking and web security basics, in labs and on systems I own or have permission to test.',
  },
];

export const CREATIVE_WORKS: CreativeWorkItem[] = [
  {
    id: 'portraits',
    index: '01',
    title: 'PORTRAITS',
    handle: '@tarunsuthar · Direction',
    category: 'Direction',
    subtitle: 'Atmospheric lighting & character mood',
    shortDescription:
      'AI-directed twilight portrait series balancing sculpted rim light, natural skin grain, and deep violet falloff.',
    masonrySize: 'tall',
    theme: 'violet',
    medium: 'AI Visual Study · Lighting & Skin Tone',
    year: '2025–2026',
    brief: 'Exploring sculpted twilight rim-lighting, violet-to-indigo gradient falloff, and restrained editorial framing.',
    promptApproach: 'Controlled focal length cues, low-key key light ratios, and clean darkroom shadow roll-off without over-sharpened artifacts.',
    palette: ['#7c3aed', '#c084fc', '#e9d5ff', '#ffffff'],
  },
  {
    id: 'geometric',
    index: '02',
    title: 'GEOMETRIC',
    handle: '@tarunsuthar · Concept',
    category: 'Concept',
    subtitle: 'Architectural rhythm & balance',
    shortDescription:
      'Botanical emerald planes refracted through frosted cubic glass symmetry and calm orthographic framing.',
    masonrySize: 'compact',
    theme: 'emerald',
    medium: 'Generative Form · Spatial Rhythm',
    year: '2025–2026',
    brief: 'High-contrast botanical emerald planes intersected by frosted cubic refraction and rigid structural symmetry.',
    promptApproach: 'Orthographic camera lock with crisp material diffusion and deep jade ambient bounce.',
    palette: ['#16a34a', '#4ade80', '#bef264', '#f8fafc'],
  },
  {
    id: 'kinetic-type',
    index: '03',
    title: 'KINETIC MOTION',
    handle: '@tarunsuthar · Google Flow',
    category: 'Motion & Frame',
    subtitle: 'AI sequence pacing & visual rhythm',
    shortDescription:
      'Short-form visual loops combining Google Flow camera sweeps with crisp editorial typography cuts.',
    masonrySize: 'medium',
    theme: 'cobalt',
    medium: 'Motion Direction · Google Flow & CapCut',
    year: '2025–2026',
    brief: 'Continuous motion transitions bridging abstract glass textures with high-contrast typographic beats.',
    promptApproach: 'Keyframe-anchored camera velocity prompts paired with rhythm-matched edit points.',
    palette: ['#1d4ed8', '#60a5fa', '#dbeafe', '#ffffff'],
  },
  {
    id: 'cinematic',
    index: '04',
    title: 'CINEMATIC',
    handle: '@tarunsuthar · Motion',
    category: 'Motion & Frame',
    subtitle: 'Anamorphic heat & motion frames',
    shortDescription:
      'Widescreen narrative stills driven by tungsten-amber halation, dramatic silhouettes, and tense camera depth.',
    masonrySize: 'medium',
    theme: 'sunset',
    medium: 'Motion Frame Study · Color Grading',
    year: '2025–2026',
    brief: 'Wide-aspect narrative frames driven by tungsten-amber flare, deep shadows, and kinetic camera tension.',
    promptApproach: 'Anamorphic lens language, film halation warmth, and deliberate silhouette negative space.',
    palette: ['#ea580c', '#fb923c', '#fde047', '#fff7ed'],
  },
  {
    id: 'editorial',
    index: '05',
    title: 'EDITORIAL',
    handle: '@tarunsuthar · Direction',
    category: 'Direction',
    subtitle: 'Warm monochrome & tactile grain',
    shortDescription:
      'Magazine-ready sandstone and amber light studies crafted for understated poise and tactile print contrast.',
    masonrySize: 'tall',
    theme: 'amber',
    medium: 'Editorial Direction · Print Texture',
    year: '2025–2026',
    brief: 'Sandstone and warm gold tonal studies built for magazine spreads, emphasizing quiet poise and fine paper grain.',
    promptApproach: 'Natural window shadow play paired with muted warm highlights and tactile print contrast.',
    palette: ['#b45309', '#f59e0b', '#fde68a', '#fafaf9'],
  },
  {
    id: 'solar-stage',
    index: '06',
    title: 'PRODUCT STAGE',
    handle: '@tarunsuthar · Commercial',
    category: 'Direction',
    subtitle: 'Minimalist studio hardware lighting',
    shortDescription:
      'Clean commercial object staging with warm horizon bounce light and distraction-free negative space.',
    masonrySize: 'compact',
    theme: 'sunset',
    medium: 'AI Product Staging · Studio Lighting',
    year: '2025–2026',
    brief: 'Minimalist product pedestals illuminated by warm directional bounce light for modern hero campaigns.',
    promptApproach: 'Macro 85mm studio framing, soft matte surfaces, and controlled specular edge highlights.',
    palette: ['#ea580c', '#fdba74', '#fef3c7', '#ffffff'],
  },
  {
    id: 'characters',
    index: '07',
    title: 'CHARACTERS',
    handle: '@tarunsuthar · Concept',
    category: 'Concept',
    subtitle: 'World-building & silhouette clarity',
    shortDescription:
      'Original character silhouettes lit by cool cobalt atmospheric fog and crisp directional key highlights.',
    masonrySize: 'compact',
    theme: 'cobalt',
    medium: 'Concept Design · Character Lighting',
    year: '2025–2026',
    brief: 'Stylized character studies anchored by electric cobalt key lights against cool atmospheric fog.',
    promptApproach: 'Consistent silhouette readability, costume material contrast, and expressive posture framing.',
    palette: ['#1d4ed8', '#3b82f6', '#93c5fd', '#eff6ff'],
  },
  {
    id: 'botanical-glass',
    index: '08',
    title: 'BOTANICAL GLASS',
    handle: '@tarunsuthar · Exploration',
    category: 'Concept',
    subtitle: 'Translucent flora & refractive light',
    shortDescription:
      'Macro botanical forms suspended behind fluted glass layers, blending organic gradients with crisp grid geometry.',
    masonrySize: 'tall',
    theme: 'emerald',
    medium: 'Generative Texture · Macro Refraction',
    year: '2025–2026',
    brief: 'Exploring organic botanical color diffusion filtered through crisp architectural glass tiles.',
    promptApproach: 'Subsurface scattering cues paired with bright lime-to-jade backlit gradients.',
    palette: ['#15803d', '#4ade80', '#d9f99d', '#ffffff'],
  },
  {
    id: 'advertising',
    index: '09',
    title: 'ADVERTISING',
    handle: '@tarunsuthar · Motion',
    category: 'Motion & Frame',
    subtitle: 'High-impact campaign visuals',
    shortDescription:
      'Radiant orchid-to-magenta campaign frames engineered for bold social storytelling and visual recall.',
    masonrySize: 'medium',
    theme: 'orchid',
    medium: 'Commercial Direction · Campaign Frame',
    year: '2025–2026',
    brief: 'Radiant magenta-orchid lighting tailored for bold hero campaigns, product reveals, and thumb-stopping social motion.',
    promptApproach: 'Clean foreground subject separation, luminous gradient backdrops, and crisp typography-safe margins.',
    palette: ['#9333ea', '#e879f9', '#fbcfe8', '#fdf4ff'],
  },
];

export const PROCESS_STEPS: ProcessStep[] = [
  {
    id: 's1',
    index: '01',
    title: 'Concept',
    caption: 'Start with story beats, moodboard framing, and clear visual intent before touching any generator.',
  },
  {
    id: 's2',
    index: '02',
    title: 'Prompt',
    caption: 'Translate composition, lens language, lighting ratio, and material texture into structured direction.',
  },
  {
    id: 's3',
    index: '03',
    title: 'Generate',
    caption: 'Explore controlled variations across lighting, posture, and color harmony to isolate the strongest frame.',
  },
  {
    id: 's4',
    index: '04',
    title: 'Refine',
    caption: 'Paint over artifacts, balance edge contrast, and sculpt depth so every detail holds up at full scale.',
  },
  {
    id: 's5',
    index: '05',
    title: 'Finish',
    caption: 'Grade color, layer subtle film grain or motion pacing, and deliver crisp campaign-ready output.',
  },
];

export const CREATIVE_TOOLKIT: ToolkitItem[] = [
  { name: 'Google Flow', role: 'Cinematic motion sequencing & scene pacing' },
  { name: 'Canva', role: 'Editorial layout composition & typography polish' },
  { name: 'CapCut', role: 'Rhythm editing, transitions & short-form visual cuts' },
  { name: 'ChatGPT', role: 'Concept ideation & structured prompt iteration' },
  { name: 'AI image generators', role: 'High-contrast frame synthesis & style exploration' },
];

export type ManifestoWordKey = 'create' | 'experiment' | 'ideas' | 'imagination' | 'life';

export interface ManifestoWordMedia {
  key: ManifestoWordKey;
  index: string;
  word: string;
  caption: string;
  imageSrc: string;
  accentHex: string;
  fallbackGradient: string;
}

export const MANIFESTO_WORD_MEDIA: Record<ManifestoWordKey, ManifestoWordMedia> = {
  create: {
    key: 'create',
    index: '01',
    word: 'create',
    caption: 'Amber Glass Prisms · Light Sculpting',
    imageSrc: '/src/assets/images/manifesto_create_1794992435838.jpg',
    accentHex: '#fb923c',
    fallbackGradient: 'linear-gradient(135deg, #27150c 0%, #fb923c 55%, #fde68a 100%)',
  },
  experiment: {
    key: 'experiment',
    index: '02',
    word: 'experiment',
    caption: 'Dichroic Quartz · Optical Refraction',
    imageSrc: '/src/assets/images/manifesto_experiment_1794992434889.jpg',
    accentHex: '#f472b6',
    fallbackGradient: 'linear-gradient(135deg, #2b0f26 0%, #f472b6 55%, #a78bfa 100%)',
  },
  ideas: {
    key: 'ideas',
    index: '03',
    word: 'ideas',
    caption: 'Archival Sketches · Golden Hour Framing',
    imageSrc: '/src/assets/images/manifesto_ideas_1794992436026.jpg',
    accentHex: '#facc15',
    fallbackGradient: 'linear-gradient(135deg, #28200d 0%, #f59e0b 55%, #fef08a 100%)',
  },
  imagination: {
    key: 'imagination',
    index: '04',
    word: 'imagination',
    caption: 'Twilight Monoliths · Atmospheric Horizon',
    imageSrc: '/src/assets/images/manifesto_imagination_1794992436162.jpg',
    accentHex: '#c084fc',
    fallbackGradient: 'linear-gradient(135deg, #160f29 0%, #7c3aed 55%, #c4b5fd 100%)',
  },
  life: {
    key: 'life',
    index: '05',
    word: 'life',
    caption: 'Sunlit Ribbed Flora · Living Motion',
    imageSrc: '/src/assets/images/manifesto_life_1794992438460.jpg',
    accentHex: '#4ade80',
    fallbackGradient: 'linear-gradient(135deg, #0c2618 0%, #16a34a 55%, #bef264 100%)',
  },
};

