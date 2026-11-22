import React, { useMemo, useRef, useState } from 'react';
import {
  CheckCircle2,
  Eye,
  EyeOff,
  ImagePlus,
  Loader2,
  Palette,
  Pencil,
  Plus,
  Search,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import {
  deleteDoc,
  doc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import type { CreativeCategory, GlassTheme, MasonrySize } from '../../data/portfolio';
import type { ManagedCreativeWorkItem } from '../../context/PortfolioDataContext';
import {
  ALLOWED_CREATIVE_CATEGORIES,
  ALLOWED_GLASS_THEMES,
  ALLOWED_MASONRY_SIZES,
  slugifyDocId,
  validateCreativeWorkPayload,
} from '../../lib/adminValidation';
import {
  compressImageFileToDataUrl,
  estimateDataUrlBytes,
  formatFileSize,
} from '../../lib/imageUpload';
import { db, handleFirestoreError, OperationType, recordAuditLog } from '../../lib/firebase';

interface AdminCreativeWorksTabProps {
  works: ManagedCreativeWorkItem[];
  actorUid: string;
  onNotify: (msg: string, tone?: 'success' | 'error') => void;
}

const THEME_SWATCH: Record<GlassTheme, string> = {
  sunset: '#ea580c',
  emerald: '#16a34a',
  violet: '#7c3aed',
  cobalt: '#2563eb',
  amber: '#d97706',
  orchid: '#c026d3',
};

interface WorkFormState {
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
  paletteText: string;
  featureImage: string;
  published: boolean;
  sortOrder: number;
}

function createEmptyWorkForm(nextOrder: number): WorkFormState {
  return {
    id: '',
    index: String(nextOrder).padStart(2, '0'),
    title: '',
    handle: '@tarunsuthar · Direction',
    category: 'Direction',
    subtitle: '',
    shortDescription: '',
    masonrySize: 'medium',
    theme: 'cobalt',
    medium: 'AI Visual Study · Lighting',
    year: '2025–2026',
    brief: '',
    promptApproach: '',
    paletteText: '#1d4ed8, #60a5fa, #dbeafe, #ffffff',
    featureImage: '',
    published: true,
    sortOrder: nextOrder,
  };
}

export const AdminCreativeWorksTab: React.FC<AdminCreativeWorksTabProps> = ({
  works,
  actorUid,
  onNotify,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'All' | CreativeCategory>('All');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<WorkFormState>(() => createEmptyWorkForm(works.length + 1));
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [uploadMeta, setUploadMeta] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return works.filter((w) => {
      if (categoryFilter !== 'All' && w.category !== categoryFilter) return false;
      if (statusFilter === 'published' && !w.published) return false;
      if (statusFilter === 'draft' && w.published) return false;
      if (!q) return true;
      return (
        w.title.toLowerCase().includes(q) ||
        w.subtitle.toLowerCase().includes(q) ||
        w.medium.toLowerCase().includes(q)
      );
    });
  }, [works, search, categoryFilter, statusFilter]);

  const openCreateModal = () => {
    setEditingId(null);
    setForm(createEmptyWorkForm(works.length + 1));
    setFormErrors([]);
    setUploadMeta(null);
    setUploadError(null);
    setModalOpen(true);
  };

  const openEditModal = (work: ManagedCreativeWorkItem) => {
    setEditingId(work.id);
    const existingImg = work.featureImage ?? '';
    setForm({
      id: work.id,
      index: work.index,
      title: work.title,
      handle: work.handle,
      category: work.category,
      subtitle: work.subtitle,
      shortDescription: work.shortDescription,
      masonrySize: work.masonrySize,
      theme: work.theme,
      medium: work.medium,
      year: work.year,
      brief: work.brief,
      promptApproach: work.promptApproach,
      paletteText: work.palette.join(', '),
      featureImage: existingImg,
      published: work.published,
      sortOrder: work.sortOrder,
    });
    setFormErrors([]);
    setUploadError(null);
    setUploadMeta(
      existingImg.startsWith('data:image/')
        ? `Uploaded image · ${formatFileSize(estimateDataUrlBytes(existingImg))}`
        : existingImg
          ? 'External image URL'
          : null
    );
    setModalOpen(true);
  };

  const processSelectedFile = async (file: File | null | undefined) => {
    if (!file) return;
    setUploadError(null);
    setUploadingImage(true);
    try {
      const optimized = await compressImageFileToDataUrl(file);
      setForm((prev) => ({ ...prev, featureImage: optimized.dataUrl }));
      setUploadMeta(
        `${optimized.width} × ${optimized.height} · ${formatFileSize(optimized.approxBytes)} · ${optimized.formatLabel}`
      );
    } catch (error) {
      setUploadError(
        error instanceof Error ? error.message : 'Unable to process the selected image.'
      );
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleFileInputChange = (ev: React.ChangeEvent<HTMLInputElement>) => {
    const file = ev.target.files?.[0];
    void processSelectedFile(file);
  };

  const handleDropFile = (ev: React.DragEvent<HTMLDivElement>) => {
    ev.preventDefault();
    setDragOver(false);
    const file = ev.dataTransfer.files?.[0];
    void processSelectedFile(file);
  };

  const handleRemoveImage = () => {
    setForm((prev) => ({ ...prev, featureImage: '' }));
    setUploadMeta(null);
    setUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSave = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setFormErrors([]);

    const resolvedId = editingId ?? (form.id.trim() || slugifyDocId(form.title, 'work'));
    const palette = form.paletteText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const validated = validateCreativeWorkPayload({
      id: resolvedId,
      index: form.index,
      title: form.title,
      handle: form.handle,
      category: form.category,
      subtitle: form.subtitle,
      shortDescription: form.shortDescription,
      masonrySize: form.masonrySize,
      theme: form.theme,
      medium: form.medium,
      year: form.year,
      brief: form.brief,
      promptApproach: form.promptApproach,
      palette,
      featureImage: form.featureImage,
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
      const ref = doc(db, 'creative_works', clean.id);
      const baseFields = {
        index: clean.index,
        title: clean.title,
        handle: clean.handle,
        category: clean.category,
        subtitle: clean.subtitle,
        shortDescription: clean.shortDescription,
        masonrySize: clean.masonrySize,
        theme: clean.theme,
        medium: clean.medium,
        year: clean.year,
        brief: clean.brief,
        promptApproach: clean.promptApproach,
        palette: clean.palette,
        featureImage: clean.featureImage ?? '',
        published: clean.published,
        sortOrder: clean.sortOrder,
        updatedBy: actorUid,
        updatedAt: serverTimestamp(),
      };

      if (editingId) {
        await updateDoc(ref, baseFields);
        await recordAuditLog({
          action: 'update',
          resourceType: 'creative_works',
          resourceId: clean.id,
          summary: `Updated visual work "${clean.title}" (${clean.category}${clean.featureImage ? ' · with feature image' : ''})`,
        });
        onNotify(`Updated visual work "${clean.title}".`);
      } else {
        await setDoc(ref, {
          ...baseFields,
          createdAt: serverTimestamp(),
        });
        await recordAuditLog({
          action: 'create',
          resourceType: 'creative_works',
          resourceId: clean.id,
          summary: `Created visual work "${clean.title}" (${clean.category}${clean.featureImage ? ' · with feature image' : ''})`,
        });
        onNotify(`Created visual work "${clean.title}".`);
      }
      setModalOpen(false);
    } catch (error) {
      try {
        handleFirestoreError(
          error,
          editingId ? OperationType.UPDATE : OperationType.CREATE,
          `creative_works/${clean.id}`
        );
      } catch (e) {
        onNotify(e instanceof Error ? e.message : 'Failed to save visual work.', 'error');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePublished = async (work: ManagedCreativeWorkItem) => {
    setBusyId(work.id);
    const nextState = !work.published;
    try {
      await updateDoc(doc(db, 'creative_works', work.id), {
        published: nextState,
        updatedBy: actorUid,
        updatedAt: serverTimestamp(),
      });
      await recordAuditLog({
        action: 'publish_toggle',
        resourceType: 'creative_works',
        resourceId: work.id,
        summary: `${nextState ? 'Published' : 'Unpublished'} visual work "${work.title}"`,
      });
      onNotify(`"${work.title}" is now ${nextState ? 'Published' : 'Draft'}.`);
    } catch (error) {
      onNotify(
        error instanceof Error ? error.message : 'Unable to update visibility.',
        'error'
      );
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (work: ManagedCreativeWorkItem) => {
    setBusyId(work.id);
    try {
      await deleteDoc(doc(db, 'creative_works', work.id));
      await recordAuditLog({
        action: 'delete',
        resourceType: 'creative_works',
        resourceId: work.id,
        summary: `Deleted visual work "${work.title}"`,
      });
      setConfirmDeleteId(null);
      onNotify(`Deleted "${work.title}".`);
    } catch (error) {
      onNotify(error instanceof Error ? error.message : 'Failed to delete visual work.', 'error');
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
              placeholder="Search visual works..."
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-400"
            />
          </div>

          <select
            aria-label="Filter by category"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as 'All' | CreativeCategory)}
            className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm text-slate-700"
          >
            <option value="All">All categories</option>
            {ALLOWED_CREATIVE_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <select
            aria-label="Filter by publish status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | 'published' | 'draft')}
            className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm text-slate-700"
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
          <span>New Visual Work</span>
        </button>
      </div>

      {/* Table */}
      <div className="rounded-xl bg-white border border-slate-200 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-10 text-center">
            <Palette className="w-8 h-8 text-slate-300 mx-auto mb-2.5" aria-hidden="true" />
            <p className="text-sm font-medium text-slate-900 m-0">No matching visual works in Firestore</p>
            <p className="text-xs text-slate-500 mt-1 mb-0">
              Add a new visual work or initialize default data from Overview.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-4">Preview &amp; Work</th>
                  <th className="py-3 px-4">Category &amp; Layout</th>
                  <th className="py-3 px-4">Palette</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filtered.map((work) => {
                  const isBusy = busyId === work.id;
                  const confirming = confirmDeleteId === work.id;
                  const hasCustomImg = Boolean(work.featureImage);
                  return (
                    <tr key={work.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3 min-w-[220px]">
                          {hasCustomImg ? (
                            <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-slate-200 shrink-0 bg-slate-900">
                              <img
                                src={work.featureImage}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                              <span className="absolute bottom-0.5 right-0.5 px-1 rounded bg-slate-950/75 font-mono-tech text-[9px] font-bold text-white">
                                {work.index}
                              </span>
                            </div>
                          ) : (
                            <span
                              className="w-12 h-12 rounded-lg flex items-center justify-center font-mono-tech text-xs font-bold text-white shrink-0"
                              style={{ backgroundColor: THEME_SWATCH[work.theme] ?? '#2563eb' }}
                            >
                              {work.index}
                            </span>
                          )}
                          <div className="min-w-0">
                            <div className="font-semibold text-slate-900 truncate flex items-center gap-2">
                              <span>{work.title}</span>
                              {hasCustomImg && (
                                <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-mono-tech text-[10px] font-medium">
                                  Image
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-500 truncate max-w-[230px]">
                              {work.subtitle}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="text-xs font-medium text-slate-800">{work.category}</div>
                        <div className="text-xs text-slate-500 capitalize">
                          {work.theme} · {work.masonrySize}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1">
                          {work.palette.slice(0, 5).map((hex, i) => (
                            <span
                              key={`${work.id}-pal-${i}`}
                              className="w-4 h-4 rounded-full border border-slate-200"
                              style={{ backgroundColor: hex }}
                              title={hex}
                            />
                          ))}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${
                            work.published
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              work.published ? 'bg-emerald-500' : 'bg-amber-500'
                            }`}
                          />
                          {work.published ? 'Published' : 'Draft'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        {confirming ? (
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => handleDelete(work)}
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
                              onClick={() => handleTogglePublished(work)}
                              title={work.published ? 'Unpublish to draft' : 'Publish live'}
                              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 cursor-pointer transition-colors"
                            >
                              {work.published ? (
                                <EyeOff className="w-4 h-4" aria-hidden="true" />
                              ) : (
                                <Eye className="w-4 h-4" aria-hidden="true" />
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => openEditModal(work)}
                              title="Edit visual work"
                              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 cursor-pointer transition-colors"
                            >
                              <Pencil className="w-4 h-4" aria-hidden="true" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(work.id)}
                              title="Delete visual work"
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
          aria-labelledby="work-form-title"
        >
          <div className="w-full max-w-2xl max-h-[90vh] rounded-2xl bg-white border border-slate-200 shadow-2xl flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h2 id="work-form-title" className="text-base font-semibold text-slate-900 m-0">
                {editingId ? `Edit Visual Work · ${editingId}` : 'Create Visual Work'}
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

              {/* Feature Image Upload Dropzone */}
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <ImagePlus className="w-4 h-4 text-slate-700" aria-hidden="true" />
                    <span className="text-xs font-semibold text-slate-800">
                      Feature Image (Optional)
                    </span>
                  </div>
                  {uploadMeta && (
                    <span className="font-mono-tech text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                      {uploadMeta}
                    </span>
                  )}
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  onChange={handleFileInputChange}
                  className="hidden"
                  aria-label="Upload feature image"
                />

                {form.featureImage ? (
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <div className="w-full sm:w-44 h-28 rounded-lg overflow-hidden border border-slate-200 bg-slate-900 shrink-0">
                      <img
                        src={form.featureImage}
                        alt="Feature image preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 space-y-2.5">
                      <p className="text-xs text-slate-600 m-0 leading-relaxed">
                        This image will appear directly on the Creative Works gallery card and full Lightbox view.
                      </p>
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          disabled={uploadingImage}
                          onClick={() => fileInputRef.current?.click()}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-100 cursor-pointer"
                        >
                          <Upload className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>Replace Image</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleRemoveImage}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 bg-white text-xs font-medium text-red-600 hover:bg-red-50 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>Remove</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div
                    onDragOver={(ev) => {
                      ev.preventDefault();
                      setDragOver(true);
                    }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDropFile}
                    onClick={() => fileInputRef.current?.click()}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(ev) => {
                      if (ev.key === 'Enter' || ev.key === ' ') {
                        ev.preventDefault();
                        fileInputRef.current?.click();
                      }
                    }}
                    className={`rounded-xl border-2 border-dashed p-5 text-center cursor-pointer transition-colors ${
                      dragOver
                        ? 'border-blue-500 bg-blue-50/70'
                        : 'border-slate-300 bg-white hover:border-slate-400 hover:bg-slate-50/60'
                    }`}
                  >
                    {uploadingImage ? (
                      <div className="flex flex-col items-center gap-2 text-slate-600">
                        <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
                        <span className="text-xs font-medium">Optimizing image for fast web delivery...</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-1.5">
                        <div className="w-9 h-9 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700">
                          <Upload className="w-4 h-4" aria-hidden="true" />
                        </div>
                        <div className="text-xs font-semibold text-slate-800">
                          Click to upload or drag &amp; drop feature image
                        </div>
                        <div className="text-[11px] text-slate-500">
                          PNG, JPG, WebP, or GIF (up to 10 MB · auto-optimized to fast WebP)
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {uploadError && (
                  <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">
                    {uploadError}
                  </div>
                )}

                {/* Optional external HTTPS URL paste */}
                <label className="block space-y-1">
                  <span className="text-[11px] font-medium text-slate-500">
                    Or paste an external HTTPS image URL
                  </span>
                  <input
                    type="text"
                    value={form.featureImage.startsWith('data:image/') ? '' : form.featureImage}
                    onChange={(e) => {
                      setUploadError(null);
                      const val = e.target.value;
                      setForm((prev) => ({ ...prev, featureImage: val }));
                      setUploadMeta(val.trim() ? 'External image URL' : null);
                    }}
                    placeholder={
                      form.featureImage.startsWith('data:image/')
                        ? 'Uploaded image stored (paste URL here to override)'
                        : 'https://example.com/artwork.jpg'
                    }
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-mono-tech text-xs text-slate-900 placeholder:text-slate-400"
                  />
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <label className="block space-y-1 sm:col-span-2">
                  <span className="text-xs font-medium text-slate-700">Title *</span>
                  <input
                    type="text"
                    required
                    maxLength={60}
                    value={form.title}
                    onChange={(e) => {
                      const title = e.target.value;
                      setForm((prev) => ({
                        ...prev,
                        title,
                        id: editingId ? prev.id : slugifyDocId(title, 'work'),
                      }));
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-900"
                    placeholder="PORTRAITS"
                  />
                </label>

                <label className="block space-y-1">
                  <span className="text-xs font-medium text-slate-700">Index *</span>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={form.index}
                    onChange={(e) => setForm((prev) => ({ ...prev, index: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 font-mono-tech text-slate-900"
                    placeholder="01"
                  />
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="block space-y-1">
                  <span className="text-xs font-medium text-slate-700">Document ID *</span>
                  <input
                    type="text"
                    required
                    disabled={Boolean(editingId)}
                    value={form.id}
                    onChange={(e) => setForm((prev) => ({ ...prev, id: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 font-mono-tech text-xs text-slate-900 disabled:bg-slate-100"
                  />
                </label>

                <label className="block space-y-1">
                  <span className="text-xs font-medium text-slate-700">Handle / Credit *</span>
                  <input
                    type="text"
                    required
                    maxLength={60}
                    value={form.handle}
                    onChange={(e) => setForm((prev) => ({ ...prev, handle: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-900"
                  />
                </label>

                <label className="block space-y-1">
                  <span className="text-xs font-medium text-slate-700">Category *</span>
                  <select
                    value={form.category}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        category: e.target.value as CreativeCategory,
                      }))
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-900"
                  >
                    {ALLOWED_CREATIVE_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <label className="block space-y-1">
                    <span className="text-xs font-medium text-slate-700">Card Height *</span>
                    <select
                      value={form.masonrySize}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          masonrySize: e.target.value as MasonrySize,
                        }))
                      }
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-900"
                    >
                      {ALLOWED_MASONRY_SIZES.map((sz) => (
                        <option key={sz} value={sz}>
                          {sz}
                        </option>
                      ))}
                    </select>
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
              </div>

              {/* Glass Theme selector (fallback visual when no feature image is uploaded) */}
              <div className="space-y-1.5">
                <span className="text-xs font-medium text-slate-700">
                  Fallback Glass Orb Theme *
                </span>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {ALLOWED_GLASS_THEMES.map((t) => {
                    const active = form.theme === t;
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setForm((prev) => ({ ...prev, theme: t }))}
                        className={`flex items-center gap-2 px-2.5 py-2 rounded-lg border text-xs capitalize cursor-pointer transition-all ${
                          active
                            ? 'border-slate-900 bg-slate-900 text-white'
                            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: THEME_SWATCH[t] }}
                        />
                        <span>{t}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <label className="block space-y-1 sm:col-span-2">
                  <span className="text-xs font-medium text-slate-700">Subtitle *</span>
                  <input
                    type="text"
                    required
                    maxLength={100}
                    value={form.subtitle}
                    onChange={(e) => setForm((prev) => ({ ...prev, subtitle: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-900"
                  />
                </label>

                <label className="block space-y-1">
                  <span className="text-xs font-medium text-slate-700">Year *</span>
                  <input
                    type="text"
                    required
                    maxLength={20}
                    value={form.year}
                    onChange={(e) => setForm((prev) => ({ ...prev, year: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-900"
                  />
                </label>
              </div>

              <label className="block space-y-1">
                <span className="text-xs font-medium text-slate-700">Short Card Description (10–320 chars) *</span>
                <textarea
                  required
                  rows={2}
                  maxLength={320}
                  value={form.shortDescription}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, shortDescription: e.target.value }))
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-900"
                />
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="block space-y-1">
                  <span className="text-xs font-medium text-slate-700">Direction Brief (10–420 chars) *</span>
                  <textarea
                    required
                    rows={3}
                    maxLength={420}
                    value={form.brief}
                    onChange={(e) => setForm((prev) => ({ ...prev, brief: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs text-slate-900"
                  />
                </label>

                <label className="block space-y-1">
                  <span className="text-xs font-medium text-slate-700">Prompt &amp; Lighting Approach (10–420 chars) *</span>
                  <textarea
                    required
                    rows={3}
                    maxLength={420}
                    value={form.promptApproach}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, promptApproach: e.target.value }))
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs text-slate-900"
                  />
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="block space-y-1">
                  <span className="text-xs font-medium text-slate-700">Medium *</span>
                  <input
                    type="text"
                    required
                    maxLength={100}
                    value={form.medium}
                    onChange={(e) => setForm((prev) => ({ ...prev, medium: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-900"
                  />
                </label>

                <label className="block space-y-1">
                  <span className="text-xs font-medium text-slate-700">
                    Hex Palette (3–6 comma-separated) *
                  </span>
                  <input
                    type="text"
                    required
                    value={form.paletteText}
                    onChange={(e) => setForm((prev) => ({ ...prev, paletteText: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 font-mono-tech text-xs text-slate-900"
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
                    Publish immediately to My Visual Works
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
                    disabled={saving || uploadingImage}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 disabled:opacity-60 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                    <span>{saving ? 'Saving...' : editingId ? 'Save Changes' : 'Create Work'}</span>
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
