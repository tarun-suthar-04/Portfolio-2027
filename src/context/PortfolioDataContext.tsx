import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  where,
  type Timestamp,
} from 'firebase/firestore';
import {
  CREATIVE_WORKS,
  PORTFOLIO_PROFILE,
  PROJECTS,
  type CreativePlatformLink,
  type CreativeWorkItem,
  type ProjectItem,
} from '../data/portfolio';
import {
  isBootstrapAdminEmail,
  type AdminRole,
  type SiteConfigInput,
} from '../lib/adminValidation';
import {
  auth,
  db,
  googleProvider,
  testFirestoreConnection,
} from '../lib/firebase';

export interface LiveProfileData extends SiteConfigInput {
  badge: string;
  portfolioUrl: string;
  coreFacts: readonly string[];
  creativeDiscipline: string;
}

export interface AdminRecord {
  uid: string;
  email: string;
  displayName: string;
  role: AdminRole;
  active: boolean;
  addedBy: string;
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
}

export interface ManagedProjectItem extends ProjectItem {
  published: boolean;
  sortOrder: number;
  updatedBy?: string;
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
}

export interface ManagedCreativeWorkItem extends CreativeWorkItem {
  published: boolean;
  sortOrder: number;
  updatedBy?: string;
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
}

interface PortfolioDataContextValue {
  profile: LiveProfileData;
  platformLinks: CreativePlatformLink[];
  projects: ProjectItem[];
  creativeWorks: CreativeWorkItem[];
  hasRemoteProfile: boolean;
  hasRemoteProjects: boolean;
  hasRemoteWorks: boolean;
  dbStatus: 'checking' | 'connected' | 'offline';
  user: User | null;
  authReady: boolean;
  roleChecking: boolean;
  isBootstrapAdmin: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  adminRecord: AdminRecord | null;
  authError: string | null;
  signInWithGoogle: () => Promise<void>;
  signOutAdmin: () => Promise<void>;
  clearAuthError: () => void;
}

const DEFAULT_LIVE_PROFILE: LiveProfileData = {
  firstName: PORTFOLIO_PROFILE.firstName,
  lastName: PORTFOLIO_PROFILE.lastName,
  fullName: PORTFOLIO_PROFILE.fullName,
  location: PORTFOLIO_PROFILE.location,
  contactEmail: PORTFOLIO_PROFILE.email,
  techRole: PORTFOLIO_PROFILE.tech.role,
  techBio: PORTFOLIO_PROFILE.tech.bio,
  creativeRole: PORTFOLIO_PROFILE.creative.role,
  creativeHeadline: PORTFOLIO_PROFILE.creative.headline,
  creativeSubline: PORTFOLIO_PROFILE.creative.subline,
  creativeYears: PORTFOLIO_PROFILE.creative.years,
  linkedinUrl: PORTFOLIO_PROFILE.linkedinUrl,
  githubUrl: PORTFOLIO_PROFILE.githubUrl,
  instagramUrl: PORTFOLIO_PROFILE.instagramUrl,
  fiverrUrl: PORTFOLIO_PROFILE.fiverrUrl,
  badge: PORTFOLIO_PROFILE.badge,
  portfolioUrl: PORTFOLIO_PROFILE.portfolioUrl,
  coreFacts: PORTFOLIO_PROFILE.tech.coreFacts,
  creativeDiscipline: PORTFOLIO_PROFILE.creative.discipline,
};

const DEFAULT_PROJECTS_BY_ID = new Map(PROJECTS.map((p) => [p.id, p]));

function buildFallbackArchitecture(project: {
  title: string;
  platform: string;
  stack: string[];
  demonstrates: string;
  highlights: string[];
}): ProjectItem['architecture'] {
  return {
    layers: [
      { name: 'Interface Layer', role: `${project.title} user workflow on ${project.platform}` },
      { name: 'Core Logic', role: project.demonstrates },
      { name: 'Technology Stack', role: project.stack.join(' · ') },
    ],
    dataFlow: `User Action → ${project.stack[0] ?? 'Application'} → Persistent Store → Live Output`,
    engineeringNotes:
      project.highlights.length > 0
        ? project.highlights
        : ['Managed via live portfolio administration panel.'],
  };
}

function normalizeHandleFromUrl(url: string, fallback: string): string {
  try {
    const parsed = new URL(url);
    const seg = parsed.pathname.split('/').filter(Boolean).pop();
    if (!seg) return fallback;
    return seg.startsWith('@') ? seg : seg;
  } catch {
    return fallback;
  }
}

const PortfolioDataContext = createContext<PortfolioDataContextValue | null>(null);

export function PortfolioDataProvider({ children }: { children: ReactNode }) {
  const [remoteProfile, setRemoteProfile] = useState<Partial<SiteConfigInput> | null>(null);
  const [remoteProjects, setRemoteProjects] = useState<ManagedProjectItem[] | null>(null);
  const [remoteWorks, setRemoteWorks] = useState<ManagedCreativeWorkItem[] | null>(null);
  const [dbStatus, setDbStatus] = useState<'checking' | 'connected' | 'offline'>('checking');

  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [roleChecking, setRoleChecking] = useState(false);
  const [adminRecord, setAdminRecord] = useState<AdminRecord | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  // Startup Firestore connectivity probe
  useEffect(() => {
    let active = true;
    testFirestoreConnection().then((status) => {
      if (active) setDbStatus(status);
    });
    return () => {
      active = false;
    };
  }, []);

  // Public live listener: /site_config/profile
  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, 'site_config', 'profile'),
      (snap) => {
        if (snap.exists()) {
          setRemoteProfile(snap.data() as Partial<SiteConfigInput>);
        } else {
          setRemoteProfile(null);
        }
      },
      (err) => {
        console.warn('Public site_config listener fallback:', err.message);
      }
    );
    return () => unsub();
  }, []);

  // Public live listener: published /projects (strictly filtered to match allow list)
  useEffect(() => {
    const q = query(collection(db, 'projects'), where('published', '==', true));
    const unsub = onSnapshot(
      q,
      (snap) => {
        if (snap.empty) {
          setRemoteProjects(null);
          return;
        }
        const items: ManagedProjectItem[] = snap.docs.map((docSnap) => {
          const d = docSnap.data();
          const defaultMatch = DEFAULT_PROJECTS_BY_ID.get(docSnap.id);
          const highlights = Array.isArray(d.highlights) ? d.highlights.map(String) : [];
          const stack = Array.isArray(d.stack) ? d.stack.map(String) : [];
          return {
            id: docSnap.id,
            title: String(d.title ?? ''),
            fileName: String(d.fileName ?? ''),
            fileExt: (d.fileExt as ProjectItem['fileExt']) ?? '.py',
            fileTypeLabel: String(d.fileTypeLabel ?? ''),
            fileAccent: String(d.fileAccent ?? '#111111'),
            platform: String(d.platform ?? ''),
            subtitle: String(d.subtitle ?? ''),
            summary: String(d.summary ?? ''),
            highlights,
            stack,
            demonstrates: String(d.demonstrates ?? ''),
            previewImage: String(d.previewImage ?? ''),
            previewAlt: String(d.previewAlt ?? ''),
            fallbackGradient: String(
              d.fallbackGradient ?? 'linear-gradient(135deg, #0f5c3f 0%, #111111 100%)'
            ),
            githubUrl: String(d.githubUrl ?? ''),
            liveUrl: typeof d.liveUrl === 'string' && d.liveUrl.trim() ? d.liveUrl : undefined,
            published: Boolean(d.published),
            sortOrder: typeof d.sortOrder === 'number' ? d.sortOrder : 100,
            updatedBy: typeof d.updatedBy === 'string' ? d.updatedBy : undefined,
            createdAt: (d.createdAt as Timestamp | null) ?? null,
            updatedAt: (d.updatedAt as Timestamp | null) ?? null,
            architecture:
              defaultMatch?.architecture ??
              buildFallbackArchitecture({
                title: String(d.title ?? 'Project'),
                platform: String(d.platform ?? 'Application'),
                stack,
                demonstrates: String(d.demonstrates ?? 'Software engineering'),
                highlights,
              }),
            caseStudy: defaultMatch?.caseStudy,
          };
        });
        items.sort((a, b) => a.sortOrder - b.sortOrder);
        setRemoteProjects(items);
      },
      (err) => {
        console.warn('Public projects listener fallback:', err.message);
      }
    );
    return () => unsub();
  }, []);

  // Public live listener: published /creative_works (strictly filtered to match allow list)
  useEffect(() => {
    const q = query(collection(db, 'creative_works'), where('published', '==', true));
    const unsub = onSnapshot(
      q,
      (snap) => {
        if (snap.empty) {
          setRemoteWorks(null);
          return;
        }
        const items: ManagedCreativeWorkItem[] = snap.docs.map((docSnap) => {
          const d = docSnap.data();
          return {
            id: docSnap.id,
            index: String(d.index ?? '01'),
            title: String(d.title ?? ''),
            handle: String(d.handle ?? ''),
            category: (d.category as CreativeWorkItem['category']) ?? 'Direction',
            subtitle: String(d.subtitle ?? ''),
            shortDescription: String(d.shortDescription ?? ''),
            masonrySize: (d.masonrySize as CreativeWorkItem['masonrySize']) ?? 'medium',
            theme: (d.theme as CreativeWorkItem['theme']) ?? 'cobalt',
            medium: String(d.medium ?? ''),
            year: String(d.year ?? '2025–2026'),
            brief: String(d.brief ?? ''),
            promptApproach: String(d.promptApproach ?? ''),
            palette: Array.isArray(d.palette) ? d.palette.map(String) : ['#1d4ed8', '#60a5fa', '#ffffff'],
            featureImage: typeof d.featureImage === 'string' && d.featureImage.trim() ? d.featureImage : undefined,
            published: Boolean(d.published),
            sortOrder: typeof d.sortOrder === 'number' ? d.sortOrder : 100,
            updatedBy: typeof d.updatedBy === 'string' ? d.updatedBy : undefined,
            createdAt: (d.createdAt as Timestamp | null) ?? null,
            updatedAt: (d.updatedAt as Timestamp | null) ?? null,
          };
        });
        items.sort((a, b) => a.sortOrder - b.sortOrder);
        setRemoteWorks(items);
      },
      (err) => {
        console.warn('Public creative_works listener fallback:', err.message);
      }
    );
    return () => unsub();
  }, []);

  // Auth listener & database-backed RBAC check
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser);
      setAdminRecord(null);

      if (!nextUser) {
        setAuthReady(true);
        setRoleChecking(false);
        return;
      }

      if (!nextUser.emailVerified) {
        setAuthReady(true);
        setRoleChecking(false);
        return;
      }

      setRoleChecking(true);
      try {
        const snap = await getDoc(doc(db, 'admins', nextUser.uid));
        if (snap.exists()) {
          const data = snap.data();
          setAdminRecord({
            uid: snap.id,
            email: String(data.email ?? nextUser.email ?? ''),
            displayName: String(data.displayName ?? nextUser.displayName ?? 'Admin'),
            role: data.role === 'super_admin' ? 'super_admin' : 'admin',
            active: Boolean(data.active),
            addedBy: String(data.addedBy ?? ''),
            createdAt: (data.createdAt as Timestamp | null) ?? null,
            updatedAt: (data.updatedAt as Timestamp | null) ?? null,
          });
        }
      } catch (err) {
        console.warn('RBAC self-lookup returned non-admin or unavailable:', err);
      } finally {
        setRoleChecking(false);
        setAuthReady(true);
      }
    });
    return () => unsub();
  }, []);

  const isBootstrapAdmin = Boolean(
    user && user.emailVerified && isBootstrapAdminEmail(user.email)
  );

  const isRegisteredAdmin = Boolean(user && user.emailVerified && adminRecord?.active === true);
  const isAdmin = isBootstrapAdmin || isRegisteredAdmin;
  const isSuperAdmin =
    isBootstrapAdmin || (isRegisteredAdmin && adminRecord?.role === 'super_admin');

  const signInWithGoogle = useCallback(async () => {
    setAuthError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      const code = (error as { code?: string })?.code ?? '';
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        setAuthError('Sign-in popup was closed before completing authentication.');
      } else if (code === 'auth/popup-blocked') {
        setAuthError('Browser blocked the Google sign-in popup. Allow popups for this preview and retry.');
      } else {
        setAuthError(
          error instanceof Error ? error.message : 'Unable to complete Google sign-in.'
        );
      }
    }
  }, []);

  const signOutAdmin = useCallback(async () => {
    setAuthError(null);
    await signOut(auth);
  }, []);

  const clearAuthError = useCallback(() => setAuthError(null), []);

  const profile = useMemo<LiveProfileData>(() => {
    if (!remoteProfile) return DEFAULT_LIVE_PROFILE;
    return {
      ...DEFAULT_LIVE_PROFILE,
      ...remoteProfile,
      coreFacts: [remoteProfile.location || DEFAULT_LIVE_PROFILE.location, 'Python', 'Java', 'SQL'],
    };
  }, [remoteProfile]);

  const platformLinks = useMemo<CreativePlatformLink[]>(() => {
    const igHandle = normalizeHandleFromUrl(profile.instagramUrl, 'tarunsuthar');
    const ghHandle = normalizeHandleFromUrl(profile.githubUrl, 'tarun-suthar-04');
    return [
      {
        id: 'fiverr',
        label: 'Fiverr',
        handle: 'Freelance gigs',
        href: profile.fiverrUrl,
        external: true,
        accent: '#1dbf73',
      },
      {
        id: 'portfolio',
        label: 'Portfolio',
        handle: 'Full visual archive',
        href: profile.portfolioUrl,
        external: false,
        accent: '#2563eb',
      },
      {
        id: 'instagram',
        label: 'Instagram',
        handle: igHandle.startsWith('@') ? igHandle : `@${igHandle}`,
        href: profile.instagramUrl,
        external: true,
        accent: '#e1306c',
      },
      {
        id: 'linkedin',
        label: 'LinkedIn',
        handle: profile.fullName,
        href: profile.linkedinUrl,
        external: true,
        accent: '#0a66c2',
      },
      {
        id: 'github',
        label: 'GitHub',
        handle: ghHandle,
        href: profile.githubUrl,
        external: true,
        accent: '#141518',
      },
    ];
  }, [profile]);

  const projects = useMemo<ProjectItem[]>(
    () => (remoteProjects && remoteProjects.length > 0 ? remoteProjects : PROJECTS),
    [remoteProjects]
  );

  const creativeWorks = useMemo<CreativeWorkItem[]>(
    () => (remoteWorks && remoteWorks.length > 0 ? remoteWorks : CREATIVE_WORKS),
    [remoteWorks]
  );

  const value = useMemo<PortfolioDataContextValue>(
    () => ({
      profile,
      platformLinks,
      projects,
      creativeWorks,
      hasRemoteProfile: remoteProfile !== null,
      hasRemoteProjects: remoteProjects !== null && remoteProjects.length > 0,
      hasRemoteWorks: remoteWorks !== null && remoteWorks.length > 0,
      dbStatus,
      user,
      authReady,
      roleChecking,
      isBootstrapAdmin,
      isAdmin,
      isSuperAdmin,
      adminRecord,
      authError,
      signInWithGoogle,
      signOutAdmin,
      clearAuthError,
    }),
    [
      profile,
      platformLinks,
      projects,
      creativeWorks,
      remoteProfile,
      remoteProjects,
      remoteWorks,
      dbStatus,
      user,
      authReady,
      roleChecking,
      isBootstrapAdmin,
      isAdmin,
      isSuperAdmin,
      adminRecord,
      authError,
      signInWithGoogle,
      signOutAdmin,
      clearAuthError,
    ]
  );

  return (
    <PortfolioDataContext.Provider value={value}>
      {children}
    </PortfolioDataContext.Provider>
  );
}

export function usePortfolioData(): PortfolioDataContextValue {
  const ctx = useContext(PortfolioDataContext);
  if (!ctx) {
    throw new Error('usePortfolioData must be used inside PortfolioDataProvider');
  }
  return ctx;
}
