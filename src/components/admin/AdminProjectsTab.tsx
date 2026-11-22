import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  Eye,
  EyeOff,
  ExternalLink,
  FileCode2,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import {
  deleteDoc,
  doc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import type { ProjectFileExt } from '../../data/portfolio';
import type { ManagedProjectItem } from '../../context/PortfolioDataContext';
import {
  ALLOWED_FILE_EXTS,
  slugifyDocId,
  validateProjectPayload,
} from '../../lib/adminValidation';
import { db, handleFirestoreError, OperationType, recordAuditLog } from '../../lib/firebase';

interface AdminProjectsTabProps {
  projects: ManagedProjectItem[];
  actorUid: string;
  onNotify: (msg: string, tone?: 'success' | 'error') => void;
}

const PREVIEW_PRESETS = [
  {
    label: 'Order Analyzer (.apk)',
    path: '/src/assets/images/project_order_analyzer_1795258265910.jpg',
  },
  {
    label: 'Pixault (.jar)',
    path: '/src/assets/images/project_pixault_1795258346548.jpg',
  },
  {
    label: 'Employee Manager (.py)',
    path: '/src/assets/images/project_employee_manager_1795258264291.jpg',
  },
];

const GRADIENT_PRESETS = [
  'linear-gradient(135deg, #0f5c3f 0%, #111111 100%)',
  'linear-gradient(135deg, #1f2937 0%, #111111 100%)',
  'linear-gradient(135deg, #1d4ed8 0%, #111111 100%)',
  'linear-gradient(135deg, #7c3aed 0%, #111111 100%)',
];

interface ProjectFormState {
  id: string;
  title: string;
  fileName: string;
  fileExt: ProjectFileExt;
  fileTypeLabel: string;
  fileAccent: string;
  platform: string;
  subtitle: string;
  summary: string;
  highlightsText: string;
  stackText: string;
  demonstrates: string;
  previewImage: string;
  previewAlt: string;
  fallbackGradient: string;
  githubUrl: string;
  liveUrl: string;
  published: boolean;
  sortOrder: number;
}

function createEmptyProjectForm(nextOrder: number): ProjectFormState {
  return {
    id: '',
    title: '',
    fileName: '',
    fileExt: '.py',
    fileTypeLabel: 'Python App',
    fileAccent: '#2563eb',
    platform: 'Python · SQL',
    subtitle: 'Application · Python',
    summary: '',
    highlightsText: 'Clean relational data model\nAutomated validation & reporting',
    stackText: 'Python, SQL',
    demonstrates: 'Backend logic · Database design',
    previewImage: PREVIEW_PRESETS[2].path,
    previewAlt: 'Application interface screenshot',
    fallbackGradient: GRADIENT_PRESETS[2],
    githubUrl: 'https://github.com/tarun-suthar-04',
    liveUrl: '',
    published: true,
    sortOrder: nextOrder,
  };
}

export const AdminProjectsTab: React.FC<AdminProjectsTabProps> = ({
  projects,
  actorUid,
  onNotify,
}) => {
  const [search, setSearch] = useState('');
  const [extFilter, setExtFilter] = useState<'all' | ProjectFileExt>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<ProjectFormState>(() => createEmptyProjectForm(projects.length + 1));
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return projects.filter((p) => {
      if (extFilter !== 'all' && p.fileExt !== extFilter) return false;
      if (statusFilter === 'published' && !p.published) return false;
      if (statusFilter === 'draft' && p.published) return false;
      if (!q) return true;
      return (
        p.title.toLowerCase().includes(q) ||
        p.fileName.toLowerCase().includes(q) ||
        p.platform.toLowerCase().includes(q) ||
        p.stack.some((s) => s.toLowerCase().includes(q))
      );
    });
  }, [projects, search, extFilter, statusFilter]);

  const openCreateModal = () => {
    setEditingId(null);
    setForm(createEmptyProjectForm(projects.length + 1));
    setFormErrors([]);
    setModalOpen(true);
  };

  const openEditModal = (project: ManagedProjectItem) => {
    setEditingId(project.id);
    setForm({
      id: project.id,
      title: project.title,
      fileName: project.fileName,
      fileExt: project.fileExt,
      fileTypeLabel: project.fileTypeLabel,
      fileAccent: project.fileAccent,
      platform: project.platform,
      subtitle: project.subtitle,
      summary: project.summary,
      highlightsText: project.highlights.join('\n'),
      stackText: project.stack.join(', '),
      demonstrates: project.demonstrates,
      previewImage: project.previewImage,
      previewAlt: project.previewAlt,
      fallbackGradient: project.fallbackGradient,
      githubUrl: project.githubUrl,
      liveUrl: project.liveUrl ?? '',
      published: project.published,
      sortOrder: project.sortOrder,
    });
    setFormErrors([]);
    setModalOpen(true);
  };

  const handleSave = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setFormErrors([]);

    const resolvedId = editingId ?? (form.id.trim() || slugifyDocId(form.title, 'project'));
    const highlights = form.highlightsText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
    const stack = form.stackText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const validated = validateProjectPayload({
      id: resolvedId,
      title: form.title,
      fileName: form.fileName,
      fileExt: form.fileExt,
      fileTypeLabel: form.fileTypeLabel,
      fileAccent: form.fileAccent,
      platform: form.platform,
      subtitle: form.subtitle,
      summary: form.summary,
      highlights,
      stack,
      demonstrates: form.demonstrates,
      previewImage: form.previewImage,
      previewAlt: form.previewAlt,
      fallbackGradient: form.fallbackGradient,
      githubUrl: form.githubUrl,
      liveUrl: form.liveUrl,
      published: form.published,
      sortOrder: form.sortOrder,
    });

    if (!validated.ok || !validated.data) {
      setFormErrors(validated.errors);
      return;
    }

    const clean = validated.data;
    setSaving(true);
    try {
      const ref = doc(db, 'projects', clean.id);
      const baseFields = {
        title: clean.title,
        fileName: clean.fileName,
        fileExt: clean.fileExt,
        fileTypeLabel: clean.fileTypeLabel,
        fileAccent: clean.fileAccent,
        platform: clean.platform,
        subtitle: clean.subtitle,
        summary: clean.summary,
        highlights: clean.highlights,
        stack: clean.stack,
        demonstrates: clean.demonstrates,
        previewImage: clean.previewImage,
        previewAlt: clean.previewAlt,
        fallbackGradient: clean.fallbackGradient,
        githubUrl: clean.githubUrl,
        liveUrl: clean.liveUrl ?? '',
        published: clean.published,
        sortOrder: clean.sortOrder,
        updatedBy: actorUid,
        updatedAt: serverTimestamp(),
      };

      if (editingId) {
        await updateDoc(ref, baseFields);
        await recordAuditLog({
          action: 'update',
          resourceType: 'projects',
          resourceId: clean.id,
          summary: `Updated technical project "${clean.title}" (${clean.fileName})`,
        });
        onNotify(`Updated project "${clean.title}".`);
      } else {
        await setDoc(ref, {
          ...baseFields,
          createdAt: serverTimestamp(),
        });
        await recordAuditLog({
          action: 'create',
          resourceType: 'projects',
          resourceId: clean.id,
          summary: `Created technical project "${clean.title}" (${clean.fileName})`,
        });
        onNotify(`Created project "${clean.title}".`);
      }
      setModalOpen(false);
    } catch (error) {
      try {
        handleFirestoreError(
          error,
          editingId ? OperationType.UPDATE : OperationType.CREATE,
          `projects/${clean.id}`
        );
      } catch (e) {
        onNotify(e instanceof Error ? e.message : 'Failed to save project.', 'error');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePublished = async (project: ManagedProjectItem) => {
    setBusyId(project.id);
    const nextState = !project.published;
    try {
      await updateDoc(doc(db, 'projects', project.id), {
        published: nextState,
        updatedBy: actorUid,
        updatedAt: serverTimestamp(),
      });
      await recordAuditLog({
        action: 'publish_toggle',
        resourceType: 'projects',
        resourceId: project.id,
        summary: `${nextState ? 'Published' : 'Unpublished'} project "${project.title}"`,
      });
      onNotify(`"${project.title}" is now ${nextState ? 'Published' : 'Draft'}.`);
    } catch (error) {
      onNotify(
        error instanceof Error ? error.message : 'Unable to update visibility.',
        'error'
      );
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (project: ManagedProjectItem) => {
    setBusyId(project.id);
    try {
      await deleteDoc(doc(db, 'projects', project.id));
      await recordAuditLog({
        action: 'delete',
        resourceType: 'projects',
        resourceId: project.id,
        summary: `Deleted technical project "${project.title}" (${project.fileName})`,
      });
      setConfirmDeleteId(null);
      onNotify(`Deleted "${project.title}".`);
    } catch (error) {
      onNotify(error instanceof Error ? error.message : 'Failed to delete project.', 'error');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search
              className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search projects, files, stack..."
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-400"
            />
          </div>

          <select
            aria-label="Filter by file extension"
            value={extFilter}
            onChange={(e) => setExtFilter(e.target.value as 'all' | ProjectFileExt)}
            className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:border-slate-400"
          >
            <option value="all">All file types</option>
            {ALLOWED_FILE_EXTS.map((ext) => (
              <option key={ext} value={ext}>
                {ext}
              </option>
            ))}
          </select>

          <select
            aria-label="Filter by publish status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | 'published' | 'draft')}
            className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:border-slate-400"
          >
            <option value="all">All statuses</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </select>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 cursor-pointer transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" aria-hidden="true" />
          <span>New Project</span>
        </button>
      </div>

      {/* Table */}
      <div className="rounded-xl bg-white border border-slate-200 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-10 text-center">
            <FileCode2 className="w-8 h-8 text-slate-300 mx-auto mb-2.5" aria-hidden="true" />
            <p className="text-sm font-medium text-slate-900 m-0">No matching projects in Firestore</p>
            <p className="text-xs text-slate-500 mt-1 mb-0">
              Create a new project or initialize default portfolio data from Overview.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-4">Project &amp; File</th>
                  <th className="py-3 px-4">Type &amp; Stack</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Order</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filtered.map((project) => {
                  const isBusy = busyId === project.id;
                  const confirming = confirmDeleteId === project.id;
                  return (
                    <tr key={project.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3 min-w-[220px]">
                          <div
                            className="w-11 h-11 rounded-lg border border-slate-200 overflow-hidden shrink-0"
                            style={{ background: project.fallbackGradient }}
                          >
                            {project.previewImage && (
                              <img
                                src={project.previewImage}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-slate-900 truncate">
                              {project.title}
                            </div>
                            <div className="font-mono-tech text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                              <span>{project.fileName}</span>
                              <a
                                href={project.githubUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-0.5 text-blue-600 hover:underline"
                                title="Open GitHub source"
                              >
                                <span>GitHub</span>
                                <ExternalLink className="w-3 h-3" aria-hidden="true" />
                              </a>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="text-xs font-medium text-slate-800">{project.fileTypeLabel}</div>
                        <div className="text-xs text-slate-500 mt-0.5 truncate max-w-[220px]">
                          {project.stack.join(' · ')}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${
                            project.published
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              project.published ? 'bg-emerald-500' : 'bg-amber-500'
                            }`}
                          />
                          {project.published ? 'Published' : 'Draft'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono-tech text-xs text-slate-600 tabular-nums">
                        {project.sortOrder}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        {confirming ? (
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => handleDelete(project)}
                              className="px-2.5 py-1.5 rounded-md bg-red-600 text-white text-xs font-medium hover:bg-red-700 cursor-pointer"
                            >
                              Confirm Delete
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(null)}
                              className="px-2.5 py-1.5 rounded-md border border-slate-200 bg-white text-slate-700 text-xs hover:bg-slate-50 cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => handleTogglePublished(project)}
                              title={project.published ? 'Unpublish to draft' : 'Publish live'}
                              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 cursor-pointer transition-colors"
                            >
                              {project.published ? (
                                <EyeOff className="w-4 h-4" aria-hidden="true" />
                              ) : (
                                <Eye className="w-4 h-4" aria-hidden="true" />
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => openEditModal(project)}
                              title="Edit project"
                              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 cursor-pointer transition-colors"
                            >
                              <Pencil className="w-4 h-4" aria-hidden="true" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(project.id)}
                              title="Delete project"
                              className="p-2 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 cursor-pointer transition-colors"
                            >
                              <Trash2 className="w-4 h-4" aria-hidden="true" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-[2px] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="project-form-title"
        >
          <div className="w-full max-w-2xl max-h-[90vh] rounded-2xl bg-white border border-slate-200 shadow-2xl flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h2 id="project-form-title" className="text-base font-semibold text-slate-900 m-0">
                {editingId ? `Edit Project · ${editingId}` : 'Create Technical Project'}
              </h2>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="overflow-y-auto p-6 space-y-4 text-sm">
              {formErrors.length > 0 && (
                <div className="rounded-xl bg-red-50 border border-red-200 p-3.5 text-xs text-red-700 space-y-1">
                  {formErrors.map((err) => (
                    <div key={err}>• {err}</div>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="block space-y-1">
                  <span className="text-xs font-medium text-slate-700">Project Title *</span>
                  <input
                    type="text"
                    required
                    maxLength={80}
                    value={form.title}
                    onChange={(e) => {
                      const title = e.target.value;
                      setForm((prev) => ({
                        ...prev,
                        title,
                        id: editingId ? prev.id : slugifyDocId(title, 'project'),
                      }));
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-900 focus:outline-none focus:border-slate-400"
                    placeholder="Order Analyzer"
                  />
                </label>

                <label className="block space-y-1">
                  <span className="text-xs font-medium text-slate-700">Document ID *</span>
                  <input
                    type="text"
                    required
                    disabled={Boolean(editingId)}
                    maxLength={128}
                    value={form.id}
                    onChange={(e) => setForm((prev) => ({ ...prev, id: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 font-mono-tech text-xs text-slate-900 disabled:bg-slate-100 disabled:text-slate-500"
                    placeholder="order-analyzer"
                  />
                </label>

                <label className="block space-y-1">
                  <span className="text-xs font-medium text-slate-700">File Name *</span>
                  <input
                    type="text"
                    required
                    maxLength={64}
                    value={form.fileName}
                    onChange={(e) => setForm((prev) => ({ ...prev, fileName: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 font-mono-tech text-xs text-slate-900"
                    placeholder="order-analyzer.apk"
                  />
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <label className="block space-y-1">
                    <span className="text-xs font-medium text-slate-700">Extension *</span>
                    <select
                      value={form.fileExt}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          fileExt: e.target.value as ProjectFileExt,
                        }))
                      }
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-900"
                    >
                      {ALLOWED_FILE_EXTS.map((ext) => (
                        <option key={ext} value={ext}>
                          {ext}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block space-y-1">
                    <span className="text-xs font-medium text-slate-700">Accent Hex *</span>
                    <input
                      type="text"
                      required
                      value={form.fileAccent}
                      onChange={(e) => setForm((prev) => ({ ...prev, fileAccent: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 font-mono-tech text-xs text-slate-900"
                      placeholder="#0f5c3f"
                    />
                  </label>
                </div>

                <label className="block space-y-1">
                  <span className="text-xs font-medium text-slate-700">File Type Label *</span>
                  <input
                    type="text"
                    required
                    maxLength={40}
                    value={form.fileTypeLabel}
                    onChange={(e) => setForm((prev) => ({ ...prev, fileTypeLabel: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-900"
                    placeholder="Android App"
                  />
                </label>

                <label className="block space-y-1">
                  <span className="text-xs font-medium text-slate-700">Platform *</span>
                  <input
                    type="text"
                    required
                    maxLength={80}
                    value={form.platform}
                    onChange={(e) => setForm((prev) => ({ ...prev, platform: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-900"
                    placeholder="Android · SQLite + Firestore"
                  />
                </label>

                <label className="block space-y-1">
                  <span className="text-xs font-medium text-slate-700">Subtitle *</span>
                  <input
                    type="text"
                    required
                    maxLength={80}
                    value={form.subtitle}
                    onChange={(e) => setForm((prev) => ({ ...prev, subtitle: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-900"
                    placeholder="Android app · Java"
                  />
                </label>

                <label className="block space-y-1">
                  <span className="text-xs font-medium text-slate-700">Sort Order</span>
                  <input
                    type="number"
                    min={0}
                    max={9999}
                    value={form.sortOrder}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, sortOrder: Number(e.target.value) || 0 }))
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 font-mono-tech text-slate-900"
                  />
                </label>
              </div>

              <label className="block space-y-1">
                <span className="text-xs font-medium text-slate-700">Summary (10–500 chars) *</span>
                <textarea
                  required
                  rows={3}
                  maxLength={500}
                  value={form.summary}
                  onChange={(e) => setForm((prev) => ({ ...prev, summary: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-900 resize-y"
                />
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="block space-y-1">
                  <span className="text-xs font-medium text-slate-700">
                    Highlights (one per line, 1–8) *
                  </span>
                  <textarea
                    required
                    rows={3}
                    value={form.highlightsText}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, highlightsText: e.target.value }))
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs text-slate-900"
                  />
                </label>

                <div className="space-y-3">
                  <label className="block space-y-1">
                    <span className="text-xs font-medium text-slate-700">
                      Tech Stack (comma-separated, 1–12) *
                    </span>
                    <input
                      type="text"
                      required
                      value={form.stackText}
                      onChange={(e) => setForm((prev) => ({ ...prev, stackText: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-900"
                      placeholder="Java, Android, SQLite, Firestore"
                    />
                  </label>
                  <label className="block space-y-1">
                    <span className="text-xs font-medium text-slate-700">Demonstrates *</span>
                    <input
                      type="text"
                      required
                      maxLength={160}
                      value={form.demonstrates}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, demonstrates: e.target.value }))
                      }
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-900"
                    />
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="block space-y-1">
                  <span className="text-xs font-medium text-slate-700">GitHub URL (https://) *</span>
                  <input
                    type="url"
                    required
                    value={form.githubUrl}
                    onChange={(e) => setForm((prev) => ({ ...prev, githubUrl: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-mono-tech text-slate-900"
                  />
                </label>

                <label className="block space-y-1">
                  <span className="text-xs font-medium text-slate-700">
                    External Live URL (optional https://)
                  </span>
                  <input
                    type="url"
                    value={form.liveUrl}
                    onChange={(e) => setForm((prev) => ({ ...prev, liveUrl: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-mono-tech text-slate-900"
                    placeholder="https://..."
                  />
                </label>
              </div>

              <div className="space-y-2 rounded-xl bg-slate-50 border border-slate-200 p-3.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-medium text-slate-700">Preview Image Path / HTTPS URL *</span>
                  <div className="flex flex-wrap gap-1.5">
                    {PREVIEW_PRESETS.map((preset) => (
                      <button
                        key={preset.path}
                        type="button"
                        onClick={() =>
                          setForm((prev) => ({ ...prev, previewImage: preset.path }))
                        }
                        className="px-2 py-1 rounded-md border border-slate-200 bg-white text-[11px] text-slate-700 hover:bg-slate-100 cursor-pointer"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
                <input
                  type="text"
                  required
                  value={form.previewImage}
                  onChange={(e) => setForm((prev) => ({ ...prev, previewImage: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white font-mono-tech text-xs text-slate-900"
                />
                <label className="block space-y-1">
                  <span className="text-xs font-medium text-slate-700">Image Alt Description *</span>
                  <input
                    type="text"
                    required
                    maxLength={220}
                    value={form.previewAlt}
                    onChange={(e) => setForm((prev) => ({ ...prev, previewAlt: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs text-slate-900"
                  />
                </label>
              </div>

              <div className="flex items-center justify-between pt-2">
                <label className="inline-flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={form.published}
                    onChange={(e) => setForm((prev) => ({ ...prev, published: e.target.checked }))}
                    className="w-4 h-4 rounded border-slate-300"
                  />
                  <span className="text-sm font-medium text-slate-800">
                    Publish immediately to live portfolio
                  </span>
                </label>

                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 disabled:opacity-60 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                    <span>{saving ? 'Saving...' : editingId ? 'Save Changes' : 'Create Project'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
