import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowUpRight,
  CheckCircle2,
  Database,
  FileCode2,
  FolderKanban,
  Inbox,
  LayoutDashboard,
  LogOut,
  Menu,
  Palette,
  ShieldCheck,
  UserCog,
  X,
} from 'lucide-react';
import {
  collection,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  where,
  writeBatch,
  type Timestamp,
} from 'firebase/firestore';
import {
  CREATIVE_WORKS,
  PORTFOLIO_PROFILE,
  PROJECTS,
  type CreativeWorkItem,
  type ProjectItem,
} from '../data/portfolio';
import { normalizeCreativeCategory } from '../data/gallery';
import {
  usePortfolioData,
  type AdminRecord,
  type ManagedCreativeWorkItem,
  type ManagedProjectItem,
} from '../context/PortfolioDataContext';
import type { ViewMode } from '../lib/splitPhysics';
import { db, recordAuditLog } from '../lib/firebase';
import { AdminAuthGate } from './admin/AdminAuthGate';
import { AdminCreativeWorksTab } from './admin/AdminCreativeWorksTab';
import { AdminInquiriesTab, type ProjectInquiryRecord } from './admin/AdminInquiriesTab';
import { AdminProfileTab } from './admin/AdminProfileTab';
import { AdminProjectsTab } from './admin/AdminProjectsTab';
import { AdminSecurityTab, type AuditLogItem } from './admin/AdminSecurityTab';

type AdminTab = 'overview' | 'projects' | 'creative' | 'inquiries' | 'profile' | 'security';

interface AdminPanelProps {
  activeView: ViewMode;
  onNavigateView: (next: ViewMode) => void;
}

const NAV_ITEMS: { id: AdminTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'projects', label: 'Technical Projects', icon: FolderKanban },
  { id: 'creative', label: 'Creative Works', icon: Palette },
  { id: 'inquiries', label: 'Project Inquiries', icon: Inbox },
  { id: 'profile', label: 'Profile & Links', icon: UserCog },
  { id: 'security', label: 'Security & Access', icon: ShieldCheck },
];

function mapProjectDoc(id: string, d: Record<string, unknown>): ManagedProjectItem {
  const highlights = Array.isArray(d.highlights) ? d.highlights.map(String) : [];
  const stack = Array.isArray(d.stack) ? d.stack.map(String) : [];
  return {
    id,
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
    liveUrl: typeof d.liveUrl === 'string' ? d.liveUrl : '',
    published: Boolean(d.published),
    sortOrder: typeof d.sortOrder === 'number' ? d.sortOrder : 100,
    updatedBy: typeof d.updatedBy === 'string' ? d.updatedBy : undefined,
    createdAt: (d.createdAt as Timestamp | null) ?? null,
    updatedAt: (d.updatedAt as Timestamp | null) ?? null,
    architecture: {
      layers: [{ name: 'Stack', role: stack.join(' · ') }],
      dataFlow: String(d.demonstrates ?? ''),
      engineeringNotes: highlights,
    },
  };
}

function mapWorkDoc(id: string, d: Record<string, unknown>): ManagedCreativeWorkItem {
  return {
    id,
    index: String(d.index ?? '01'),
    title: String(d.title ?? ''),
    handle: String(d.handle ?? ''),
    category: normalizeCreativeCategory(String(d.category ?? ''), id),
    subtitle: String(d.subtitle ?? ''),
    shortDescription: String(d.shortDescription ?? ''),
    masonrySize: (d.masonrySize as CreativeWorkItem['masonrySize']) ?? 'medium',
    theme: (d.theme as CreativeWorkItem['theme']) ?? 'cobalt',
    medium: String(d.medium ?? ''),
    year: String(d.year ?? '2025–2026'),
    brief: String(d.brief ?? ''),
    promptApproach: String(d.promptApproach ?? ''),
    promptText: String(d.promptText ?? ''),
    palette: Array.isArray(d.palette) ? d.palette.map(String) : ['#1d4ed8', '#60a5fa', '#ffffff'],
    featureImage: typeof d.featureImage === 'string' ? d.featureImage : '',
    featureVideo: typeof d.featureVideo === 'string' ? d.featureVideo : undefined,
    categoryCover: d.categoryCover === true,
    mediaWidth: typeof d.mediaWidth === 'number' ? d.mediaWidth : undefined,
    mediaHeight: typeof d.mediaHeight === 'number' ? d.mediaHeight : undefined,
    published: Boolean(d.published),
    sortOrder: typeof d.sortOrder === 'number' ? d.sortOrder : 100,
    updatedBy: typeof d.updatedBy === 'string' ? d.updatedBy : undefined,
    createdAt: (d.createdAt as Timestamp | null) ?? null,
    updatedAt: (d.updatedAt as Timestamp | null) ?? null,
  };
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ activeView, onNavigateView }) => {
  const {
    profile,
    hasRemoteProfile,
    dbStatus,
    user,
    authReady,
    isBootstrapAdmin,
    isAdmin,
    isSuperAdmin,
    signOutAdmin,
  } = usePortfolioData();

  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [toast, setToast] = useState<{ msg: string; tone: 'success' | 'error' } | null>(null);
  const [seeding, setSeeding] = useState(false);

  const [adminProjects, setAdminProjects] = useState<ManagedProjectItem[]>([]);
  const [adminWorks, setAdminWorks] = useState<ManagedCreativeWorkItem[]>([]);
  const [adminInquiries, setAdminInquiries] = useState<ProjectInquiryRecord[]>([]);
  const [adminRoster, setAdminRoster] = useState<AdminRecord[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);

  const notify = useCallback((msg: string, tone: 'success' | 'error' = 'success') => {
    setToast({ msg, tone });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 4000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  // Attach private admin Firestore listeners ONLY after verified admin auth
  useEffect(() => {
    if (activeView !== 'admin' || !authReady || !isAdmin || !user) return;

    const unsubs: (() => void)[] = [];

    if (isBootstrapAdmin) {
      // Bootstrap admin satisfies allow list without query filter
      unsubs.push(
        onSnapshot(collection(db, 'projects'), (snap) => {
          const items = snap.docs
            .map((d) => mapProjectDoc(d.id, d.data()))
            .sort((a, b) => a.sortOrder - b.sortOrder);
          setAdminProjects(items);
        })
      );

      unsubs.push(
        onSnapshot(collection(db, 'creative_works'), (snap) => {
          const items = snap.docs
            .map((d) => mapWorkDoc(d.id, d.data()))
            .sort((a, b) => a.sortOrder - b.sortOrder);
          setAdminWorks(items);
        })
      );

      unsubs.push(
        onSnapshot(collection(db, 'admins'), (snap) => {
          const list: AdminRecord[] = snap.docs.map((d) => {
            const data = d.data();
            return {
              uid: d.id,
              email: String(data.email ?? ''),
              displayName: String(data.displayName ?? ''),
              role: data.role === 'super_admin' ? 'super_admin' : 'admin',
              active: Boolean(data.active),
              addedBy: String(data.addedBy ?? ''),
              createdAt: (data.createdAt as Timestamp | null) ?? null,
              updatedAt: (data.updatedAt as Timestamp | null) ?? null,
            };
          });
          setAdminRoster(list);
        })
      );

      unsubs.push(
        onSnapshot(collection(db, 'audit_logs'), (snap) => {
          const list: AuditLogItem[] = snap.docs
            .map((d) => {
              const data = d.data();
              return {
                id: d.id,
                actorUid: String(data.actorUid ?? ''),
                actorEmail: String(data.actorEmail ?? ''),
                action: (data.action as AuditLogItem['action']) ?? 'update',
                resourceType: (data.resourceType as AuditLogItem['resourceType']) ?? 'projects',
                resourceId: String(data.resourceId ?? ''),
                summary: String(data.summary ?? ''),
                createdAt: (data.createdAt as Timestamp | null) ?? null,
              };
            })
            .sort((a, b) => {
              const ta = a.createdAt?.toMillis?.() ?? 0;
              const tb = b.createdAt?.toMillis?.() ?? 0;
              return tb - ta;
            });
          setAuditLogs(list);
        })
      );

      unsubs.push(
        onSnapshot(collection(db, 'project_inquiries'), (snap) => {
          const list: ProjectInquiryRecord[] = snap.docs
            .map((d) => {
              const data = d.data();
              const statusVal =
                data.status === 'reviewed' || data.status === 'archived' ? data.status : 'new';
              const sourceVal: ProjectInquiryRecord['source'] =
                data.source === 'creative' ? 'creative' : 'technical';
              return {
                id: d.id,
                name: String(data.name ?? ''),
                email: String(data.email ?? data.contact ?? ''),
                phone: String(data.phone ?? ''),
                reason: String(data.reason ?? ''),
                message: String(data.message ?? data.details ?? ''),
                source: sourceVal,
                status: statusVal,
                createdAt: (data.createdAt as Timestamp | null) ?? null,
              };
            })
            .sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0));
          setAdminInquiries(list);
        })
      );
    } else {
      // Secondary registered admin: use rule-compliant filtered queries (zero get() in allow list)
      const pubProjects = new Map<string, ManagedProjectItem>();
      const ownProjects = new Map<string, ManagedProjectItem>();
      const syncProjects = () => {
        const merged = new Map<string, ManagedProjectItem>([...pubProjects, ...ownProjects]);
        setAdminProjects([...merged.values()].sort((a, b) => a.sortOrder - b.sortOrder));
      };

      unsubs.push(
        onSnapshot(query(collection(db, 'projects'), where('published', '==', true)), (snap) => {
          pubProjects.clear();
          snap.docs.forEach((d) => pubProjects.set(d.id, mapProjectDoc(d.id, d.data())));
          syncProjects();
        })
      );
      unsubs.push(
        onSnapshot(query(collection(db, 'projects'), where('updatedBy', '==', user.uid)), (snap) => {
          ownProjects.clear();
          snap.docs.forEach((d) => ownProjects.set(d.id, mapProjectDoc(d.id, d.data())));
          syncProjects();
        })
      );

      const pubWorks = new Map<string, ManagedCreativeWorkItem>();
      const ownWorks = new Map<string, ManagedCreativeWorkItem>();
      const syncWorks = () => {
        const merged = new Map<string, ManagedCreativeWorkItem>([...pubWorks, ...ownWorks]);
        setAdminWorks([...merged.values()].sort((a, b) => a.sortOrder - b.sortOrder));
      };

      unsubs.push(
        onSnapshot(
          query(collection(db, 'creative_works'), where('published', '==', true)),
          (snap) => {
            pubWorks.clear();
            snap.docs.forEach((d) => pubWorks.set(d.id, mapWorkDoc(d.id, d.data())));
            syncWorks();
          }
        )
      );
      unsubs.push(
        onSnapshot(
          query(collection(db, 'creative_works'), where('updatedBy', '==', user.uid)),
          (snap) => {
            ownWorks.clear();
            snap.docs.forEach((d) => ownWorks.set(d.id, mapWorkDoc(d.id, d.data())));
            syncWorks();
          }
        )
      );

      unsubs.push(
        onSnapshot(query(collection(db, 'admins'), where('uid', '==', user.uid)), (snap) => {
          setAdminRoster(
            snap.docs.map((d) => {
              const data = d.data();
              return {
                uid: d.id,
                email: String(data.email ?? ''),
                displayName: String(data.displayName ?? ''),
                role: data.role === 'super_admin' ? 'super_admin' : 'admin',
                active: Boolean(data.active),
                addedBy: String(data.addedBy ?? ''),
                createdAt: (data.createdAt as Timestamp | null) ?? null,
                updatedAt: (data.updatedAt as Timestamp | null) ?? null,
              };
            })
          );
        })
      );

      unsubs.push(
        onSnapshot(
          query(collection(db, 'audit_logs'), where('actorUid', '==', user.uid)),
          (snap) => {
            const list: AuditLogItem[] = snap.docs
              .map((d) => {
                const data = d.data();
                return {
                  id: d.id,
                  actorUid: String(data.actorUid ?? ''),
                  actorEmail: String(data.actorEmail ?? ''),
                  action: (data.action as AuditLogItem['action']) ?? 'update',
                  resourceType: (data.resourceType as AuditLogItem['resourceType']) ?? 'projects',
                  resourceId: String(data.resourceId ?? ''),
                  summary: String(data.summary ?? ''),
                  createdAt: (data.createdAt as Timestamp | null) ?? null,
                };
              })
              .sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0));
            setAuditLogs(list);
          }
        )
      );
    }

    return () => {
      unsubs.forEach((fn) => fn());
    };
  }, [activeView, authReady, isAdmin, isBootstrapAdmin, user]);

  // Explicit one-click database initializer for default portfolio data
  const handleSeedDatabase = async () => {
    if (!user) return;
    setSeeding(true);
    try {
      const batch = writeBatch(db);
      const now = serverTimestamp();

      if (!hasRemoteProfile) {
        batch.set(doc(db, 'site_config', 'profile'), {
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
          updatedBy: user.uid,
          updatedAt: now,
        });
      }

      if (adminProjects.length === 0) {
        PROJECTS.forEach((p, idx) => {
          batch.set(doc(db, 'projects', p.id), {
            title: p.title,
            fileName: p.fileName,
            fileExt: p.fileExt,
            fileTypeLabel: p.fileTypeLabel,
            fileAccent: p.fileAccent,
            platform: p.platform,
            subtitle: p.subtitle,
            summary: p.summary,
            highlights: p.highlights,
            stack: p.stack,
            demonstrates: p.demonstrates,
            previewImage: p.previewImage,
            previewAlt: p.previewAlt,
            fallbackGradient: p.fallbackGradient,
            githubUrl: p.githubUrl,
            liveUrl: p.liveUrl ?? '',
            published: true,
            sortOrder: idx + 1,
            updatedBy: user.uid,
            createdAt: now,
            updatedAt: now,
          });
        });
      }

      const existingWorkIds = new Set(adminWorks.map((work) => work.id));
      const missingWorks = CREATIVE_WORKS.filter((work) => !existingWorkIds.has(work.id));
      if (missingWorks.length) {
        missingWorks.forEach((w, idx) => {
          batch.set(doc(db, 'creative_works', w.id), {
            index: w.index,
            title: w.title,
            handle: w.handle,
            category: w.category,
            subtitle: w.subtitle,
            shortDescription: w.shortDescription,
            masonrySize: w.masonrySize,
            theme: w.theme,
            medium: w.medium,
            year: w.year,
            brief: w.brief,
            promptApproach: w.promptApproach,
            promptText: w.promptText ?? '',
            palette: w.palette,
            featureImage: w.featureImage ?? '',
            featureVideo: w.featureVideo ?? '',
            ...(w.mediaWidth && w.mediaHeight
              ? { mediaWidth: w.mediaWidth, mediaHeight: w.mediaHeight }
              : {}),
            published: true,
            sortOrder: (adminWorks.length + idx + 1),
            updatedBy: user.uid,
            createdAt: now,
            updatedAt: now,
          });
        });
      }

      await batch.commit();
      await recordAuditLog({
        action: 'seed',
        resourceType: 'site_config',
        resourceId: 'profile',
        summary: `Initialized live Firestore data; added ${missingWorks.length} missing creative works`,
      });
      notify('Portfolio data initialized in Cloud Firestore.');
    } catch (error) {
      notify(
        error instanceof Error ? error.message : 'Failed to initialize database.',
        'error'
      );
    } finally {
      setSeeding(false);
    }
  };

  const metrics = useMemo(() => {
    const pubProj = adminProjects.filter((p) => p.published).length;
    const pubWorks = adminWorks.filter((w) => w.published).length;
    const drafts =
      adminProjects.filter((p) => !p.published).length +
      adminWorks.filter((w) => !w.published).length;
    return {
      pubProj,
      pubWorks,
      drafts,
      auditCount: auditLogs.length,
    };
  }, [adminProjects, adminWorks, auditLogs]);

  const needsSeed = !hasRemoteProfile || adminProjects.length === 0 || adminWorks.length === 0;
  const activeNavMeta = NAV_ITEMS.find((item) => item.id === activeTab) ?? NAV_ITEMS[0];

  return (
    <div
      id="admin"
      className="view-layer view-scroll bg-[#f8fafc] text-[#0f172a]"
      inert={activeView !== 'admin'}
      aria-label="Portfolio Admin Panel"
    >
      {!authReady || !isAdmin || !user ? (
        <AdminAuthGate onReturnPortfolio={() => onNavigateView('land')} />
      ) : (
        <div className="min-h-full flex">
          {/* Desktop 256px Fixed Sidebar */}
          <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 bg-white border-r border-slate-200 z-20">
            <div className="h-16 px-5 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4 h-4" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold tracking-tight text-slate-900 truncate">
                    Portfolio Admin
                  </div>
                  <div className="font-mono-tech text-[10.5px] text-slate-500 truncate">
                    {isSuperAdmin ? 'Super Admin' : 'Admin'}
                  </div>
                </div>
              </div>
            </div>

            <nav className="flex-1 p-3 space-y-1 overflow-y-auto" aria-label="Admin navigation">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const active = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium cursor-pointer transition-colors ${
                      active
                        ? 'bg-slate-900 text-white'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </nav>

            <div className="p-3 border-t border-slate-200 space-y-2">
              <div className="px-3 py-2 rounded-lg bg-slate-50 border border-slate-200/80">
                <div className="text-xs font-semibold text-slate-900 truncate">
                  {user.displayName || 'Administrator'}
                </div>
                <div className="font-mono-tech text-[11px] text-slate-500 truncate">
                  {user.email}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => onNavigateView('land')}
                  className="inline-flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Site</span>
                </button>
                <button
                  type="button"
                  onClick={signOutAdmin}
                  className="inline-flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-lg border border-slate-200 bg-white text-xs font-medium text-red-600 hover:bg-red-50 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </aside>

          {/* Mobile Drawer */}
          {mobileNavOpen && (
            <div className="lg:hidden fixed inset-0 z-40 flex">
              <div
                className="fixed inset-0 bg-slate-950/40"
                onClick={() => setMobileNavOpen(false)}
                aria-hidden="true"
              />
              <div className="relative w-64 max-w-[82vw] bg-white border-r border-slate-200 flex flex-col z-10">
                <div className="h-16 px-4 border-b border-slate-200 flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-900">Portfolio Admin</span>
                  <button
                    type="button"
                    onClick={() => setMobileNavOpen(false)}
                    className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 cursor-pointer"
                    aria-label="Close navigation"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <nav className="flex-1 p-3 space-y-1">
                  {NAV_ITEMS.map((item) => {
                    const Icon = item.icon;
                    const active = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setActiveTab(item.id);
                          setMobileNavOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium cursor-pointer ${
                          active
                            ? 'bg-slate-900 text-white'
                            : 'text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </nav>
                <div className="p-3 border-t border-slate-200 flex gap-2">
                  <button
                    type="button"
                    onClick={() => onNavigateView('land')}
                    className="flex-1 py-2 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 cursor-pointer"
                  >
                    Back to Site
                  </button>
                  <button
                    type="button"
                    onClick={signOutAdmin}
                    className="flex-1 py-2 rounded-lg border border-red-200 text-xs font-medium text-red-600 cursor-pointer"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Main Workspace */}
          <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
            {/* Top Contextual Breadcrumb Bar */}
            <header className="sticky top-0 z-10 h-16 bg-white/95 backdrop-blur border-b border-slate-200 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <button
                  type="button"
                  onClick={() => setMobileNavOpen(true)}
                  className="lg:hidden p-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer"
                  aria-label="Open navigation"
                >
                  <Menu className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-2 text-sm min-w-0">
                  <span className="text-slate-400 hidden sm:inline">Admin</span>
                  <span className="text-slate-300 hidden sm:inline">/</span>
                  <h1 className="text-base font-semibold tracking-tight text-slate-900 m-0 truncate">
                    {activeNavMeta.label}
                  </h1>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span
                  className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border font-mono-tech text-[11px] ${
                    dbStatus === 'offline'
                      ? 'bg-red-50 text-red-700 border-red-200'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      dbStatus === 'offline' ? 'bg-red-500' : 'bg-emerald-500'
                    }`}
                  />
                  {dbStatus === 'offline' ? 'Offline' : 'Firestore Live'}
                </span>

                <button
                  type="button"
                  onClick={() => onNavigateView('tech')}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  <span>Technical</span>
                  <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => onNavigateView('cre')}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  <span>Creative</span>
                  <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              </div>
            </header>

            {/* Toast Notification */}
            {toast && (
              <div className="px-4 sm:px-6 lg:px-8 pt-4">
                <div
                  role="status"
                  className={`rounded-xl px-4 py-3 text-sm border flex items-center justify-between gap-3 ${
                    toast.tone === 'error'
                      ? 'bg-red-50 border-red-200 text-red-800'
                      : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span>{toast.msg}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setToast(null)}
                    className="text-xs font-semibold hover:underline cursor-pointer bg-transparent border-0"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}

            {/* Main Content */}
            <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Seed Callout when Firestore is uninitialized */}
                  {needsSeed && (
                    <div className="rounded-xl bg-slate-900 text-white p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-start gap-3.5">
                        <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                          <Database className="w-5 h-5 text-emerald-400" aria-hidden="true" />
                        </div>
                        <div>
                          <h2 className="text-base font-semibold m-0">
                            Initialize Portfolio Data in Firestore
                          </h2>
                          <p className="mt-1 text-xs sm:text-sm text-slate-300 m-0 max-w-xl">
                            Sync your current Technical projects, 9 Creative visual works, and profile settings into Cloud Firestore so you can edit, publish, and manage them live.
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        disabled={seeding}
                        onClick={handleSeedDatabase}
                        className="px-4 py-2.5 rounded-lg bg-white text-slate-900 text-sm font-semibold hover:bg-slate-100 disabled:opacity-60 cursor-pointer shrink-0 transition-colors"
                      >
                        {seeding ? 'Initializing...' : 'Initialize Database'}
                      </button>
                    </div>
                  )}

                  {/* KPI Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                    <div className="rounded-xl bg-white border border-slate-200 p-5">
                      <div className="text-xs font-medium text-slate-500">Published Projects</div>
                      <div className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 font-mono-tech tabular-nums">
                        {metrics.pubProj}
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        Live on Technical portfolio
                      </div>
                    </div>

                    <div className="rounded-xl bg-white border border-slate-200 p-5">
                      <div className="text-xs font-medium text-slate-500">Published Visual Works</div>
                      <div className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 font-mono-tech tabular-nums">
                        {metrics.pubWorks}
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        Live in My Visual Works
                      </div>
                    </div>

                    <div className="rounded-xl bg-white border border-slate-200 p-5">
                      <div className="text-xs font-medium text-slate-500">Unpublished Drafts</div>
                      <div className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 font-mono-tech tabular-nums">
                        {metrics.drafts}
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        Hidden from public visitors
                      </div>
                    </div>

                    <div className="rounded-xl bg-white border border-slate-200 p-5">
                      <div className="text-xs font-medium text-slate-500">Audit Trail Events</div>
                      <div className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 font-mono-tech tabular-nums">
                        {metrics.auditCount}
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        Append-only immutable log
                      </div>
                    </div>
                  </div>

                  {/* Quick Actions + Recent Audit Events */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    <div className="lg:col-span-5 rounded-xl bg-white border border-slate-200 p-5 space-y-3">
                      <h2 className="text-sm font-semibold text-slate-900 m-0">Quick Actions</h2>
                      <div className="space-y-2">
                        <button
                          type="button"
                          onClick={() => setActiveTab('projects')}
                          className="w-full flex items-center justify-between px-4 py-3 rounded-lg border border-slate-200 hover:bg-slate-50 text-left cursor-pointer transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <FileCode2 className="w-4 h-4 text-emerald-700" aria-hidden="true" />
                            <div>
                              <div className="text-sm font-medium text-slate-900">
                                Manage Technical Projects
                              </div>
                              <div className="text-xs text-slate-500">
                                Add, edit, or publish project listings
                              </div>
                            </div>
                          </div>
                          <ArrowUpRight className="w-4 h-4 text-slate-400" aria-hidden="true" />
                        </button>

                        <button
                          type="button"
                          onClick={() => setActiveTab('creative')}
                          className="w-full flex items-center justify-between px-4 py-3 rounded-lg border border-slate-200 hover:bg-slate-50 text-left cursor-pointer transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <Palette className="w-4 h-4 text-blue-600" aria-hidden="true" />
                            <div>
                              <div className="text-sm font-medium text-slate-900">
                                Manage My Visual Works
                              </div>
                              <div className="text-xs text-slate-500">
                                Curate gallery cards, palettes, and briefs
                              </div>
                            </div>
                          </div>
                          <ArrowUpRight className="w-4 h-4 text-slate-400" aria-hidden="true" />
                        </button>

                        <button
                          type="button"
                          onClick={() => setActiveTab('profile')}
                          className="w-full flex items-center justify-between px-4 py-3 rounded-lg border border-slate-200 hover:bg-slate-50 text-left cursor-pointer transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <UserCog className="w-4 h-4 text-slate-700" aria-hidden="true" />
                            <div>
                              <div className="text-sm font-medium text-slate-900">
                                Edit Profile &amp; Platform Links
                              </div>
                              <div className="text-xs text-slate-500">
                                Update Fiverr, GitHub, LinkedIn, Instagram &amp; bio
                              </div>
                            </div>
                          </div>
                          <ArrowUpRight className="w-4 h-4 text-slate-400" aria-hidden="true" />
                        </button>
                      </div>
                    </div>

                    <div className="lg:col-span-7 rounded-xl bg-white border border-slate-200 p-5 space-y-3">
                      <div className="flex items-center justify-between">
                        <h2 className="text-sm font-semibold text-slate-900 m-0">
                          Recent Security Audit Activity
                        </h2>
                        <button
                          type="button"
                          onClick={() => setActiveTab('security')}
                          className="text-xs font-medium text-blue-600 hover:underline cursor-pointer bg-transparent border-0 p-0"
                        >
                          View all →
                        </button>
                      </div>
                      {auditLogs.length === 0 ? (
                        <p className="text-xs text-slate-500 py-6 text-center m-0">
                          No changes recorded yet. Every create, update, publish toggle, and delete is automatically logged here.
                        </p>
                      ) : (
                        <ul className="divide-y divide-slate-100 m-0 p-0 list-none">
                          {auditLogs.slice(0, 6).map((log) => (
                            <li
                              key={log.id}
                              className="py-2.5 flex items-start justify-between gap-3 text-xs"
                            >
                              <div className="min-w-0">
                                <div className="font-medium text-slate-800 truncate">
                                  {log.summary}
                                </div>
                                <div className="font-mono-tech text-[11px] text-slate-500 mt-0.5">
                                  {log.actorEmail} · {log.resourceType}/{log.resourceId}
                                </div>
                              </div>
                              <span className="font-mono-tech text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 shrink-0">
                                {log.action}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'projects' && (
                <AdminProjectsTab
                  projects={adminProjects}
                  actorUid={user.uid}
                  onNotify={notify}
                />
              )}

              {activeTab === 'creative' && (
                <AdminCreativeWorksTab
                  works={adminWorks}
                  actorUid={user.uid}
                  onNotify={notify}
                />
              )}

              {activeTab === 'inquiries' && (
                <AdminInquiriesTab
                  inquiries={adminInquiries}
                  onNotify={notify}
                />
              )}

              {activeTab === 'profile' && (
                <AdminProfileTab
                  profile={profile}
                  actorUid={user.uid}
                  onNotify={notify}
                />
              )}

              {activeTab === 'security' && (
                <AdminSecurityTab
                  admins={adminRoster}
                  auditLogs={auditLogs}
                  currentUid={user.uid}
                  isSuperAdmin={isSuperAdmin}
                  onNotify={notify}
                />
              )}
            </main>
          </div>
        </div>
      )}
    </div>
  );
};
