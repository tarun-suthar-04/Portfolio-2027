import React, { useEffect, useState } from 'react';
import { CheckCircle2, Globe, Save, User } from 'lucide-react';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import type { LiveProfileData } from '../../context/PortfolioDataContext';
import { validateSiteConfig, type SiteConfigInput } from '../../lib/adminValidation';
import { db, handleFirestoreError, OperationType, recordAuditLog } from '../../lib/firebase';

interface AdminProfileTabProps {
  profile: LiveProfileData;
  actorUid: string;
  onNotify: (msg: string, tone?: 'success' | 'error') => void;
}

export const AdminProfileTab: React.FC<AdminProfileTabProps> = ({
  profile,
  actorUid,
  onNotify,
}) => {
  const [form, setForm] = useState<SiteConfigInput>({
    firstName: profile.firstName,
    lastName: profile.lastName,
    fullName: profile.fullName,
    location: profile.location,
    contactEmail: profile.contactEmail,
    techRole: profile.techRole,
    techBio: profile.techBio,
    creativeRole: profile.creativeRole,
    creativeHeadline: profile.creativeHeadline,
    creativeSubline: profile.creativeSubline,
    creativeYears: profile.creativeYears,
    linkedinUrl: profile.linkedinUrl,
    githubUrl: profile.githubUrl,
    instagramUrl: profile.instagramUrl,
    fiverrUrl: profile.fiverrUrl,
  });
  const [errors, setErrors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm({
      firstName: profile.firstName,
      lastName: profile.lastName,
      fullName: profile.fullName,
      location: profile.location,
      contactEmail: profile.contactEmail,
      techRole: profile.techRole,
      techBio: profile.techBio,
      creativeRole: profile.creativeRole,
      creativeHeadline: profile.creativeHeadline,
      creativeSubline: profile.creativeSubline,
      creativeYears: profile.creativeYears,
      linkedinUrl: profile.linkedinUrl,
      githubUrl: profile.githubUrl,
      instagramUrl: profile.instagramUrl,
      fiverrUrl: profile.fiverrUrl,
    });
  }, [profile]);

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setErrors([]);

    const validated = validateSiteConfig(form);
    if (!validated.ok || !validated.data) {
      setErrors(validated.errors);
      return;
    }

    setSaving(true);
    try {
      await setDoc(doc(db, 'site_config', 'profile'), {
        ...validated.data,
        updatedBy: actorUid,
        updatedAt: serverTimestamp(),
      });
      await recordAuditLog({
        action: 'update',
        resourceType: 'site_config',
        resourceId: 'profile',
        summary: `Updated live portfolio profile & platform links for ${validated.data.fullName}`,
      });
      onNotify('Live portfolio profile updated.');
    } catch (error) {
      try {
        handleFirestoreError(error, OperationType.WRITE, 'site_config/profile');
      } catch (e) {
        onNotify(e instanceof Error ? e.message : 'Failed to save profile.', 'error');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
      {errors.length > 0 && (
        <div
          role="alert"
          className="rounded-xl bg-red-50 border border-red-200 p-4 text-xs text-red-700 space-y-1"
        >
          {errors.map((err) => (
            <div key={err}>• {err}</div>
          ))}
        </div>
      )}

      {/* Identity & Contact */}
      <section className="rounded-xl bg-white border border-slate-200 p-6 space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
          <User className="w-4 h-4 text-slate-600" aria-hidden="true" />
          <h2 className="text-sm font-semibold text-slate-900 m-0">Identity &amp; Contact</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          <label className="block space-y-1">
            <span className="text-xs font-medium text-slate-700">First Name *</span>
            <input
              type="text"
              required
              maxLength={40}
              value={form.firstName}
              onChange={(e) => setForm((p) => ({ ...p, firstName: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-900"
            />
          </label>
          <label className="block space-y-1">
            <span className="text-xs font-medium text-slate-700">Last Name *</span>
            <input
              type="text"
              required
              maxLength={40}
              value={form.lastName}
              onChange={(e) => setForm((p) => ({ ...p, lastName: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-900"
            />
          </label>
          <label className="block space-y-1">
            <span className="text-xs font-medium text-slate-700">Full Display Name *</span>
            <input
              type="text"
              required
              maxLength={80}
              value={form.fullName}
              onChange={(e) => setForm((p) => ({ ...p, fullName: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-900"
            />
          </label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <label className="block space-y-1">
            <span className="text-xs font-medium text-slate-700">Location *</span>
            <input
              type="text"
              required
              maxLength={80}
              value={form.location}
              onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-900"
            />
          </label>
          <label className="block space-y-1">
            <span className="text-xs font-medium text-slate-700">Public Contact Email *</span>
            <input
              type="email"
              required
              maxLength={120}
              value={form.contactEmail}
              onChange={(e) => setForm((p) => ({ ...p, contactEmail: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 font-mono-tech text-xs text-slate-900"
            />
          </label>
        </div>
      </section>

      {/* Persona Copy */}
      <section className="rounded-xl bg-white border border-slate-200 p-6 space-y-4 text-sm">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
          <CheckCircle2 className="w-4 h-4 text-slate-600" aria-hidden="true" />
          <h2 className="text-sm font-semibold text-slate-900 m-0">Persona Copy &amp; Headlines</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="block space-y-1">
            <span className="text-xs font-medium text-slate-700">Technical Role *</span>
            <input
              type="text"
              required
              maxLength={120}
              value={form.techRole}
              onChange={(e) => setForm((p) => ({ ...p, techRole: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-900"
            />
          </label>
          <label className="block space-y-1">
            <span className="text-xs font-medium text-slate-700">Creative Role *</span>
            <input
              type="text"
              required
              maxLength={120}
              value={form.creativeRole}
              onChange={(e) => setForm((p) => ({ ...p, creativeRole: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-900"
            />
          </label>
        </div>

        <label className="block space-y-1">
          <span className="text-xs font-medium text-slate-700">Technical Bio (10–600 chars) *</span>
          <textarea
            required
            rows={3}
            maxLength={600}
            value={form.techBio}
            onChange={(e) => setForm((p) => ({ ...p, techBio: e.target.value }))}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-900"
          />
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <label className="block space-y-1">
            <span className="text-xs font-medium text-slate-700">Creative Headline *</span>
            <input
              type="text"
              required
              maxLength={100}
              value={form.creativeHeadline}
              onChange={(e) => setForm((p) => ({ ...p, creativeHeadline: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-900"
            />
          </label>
          <label className="block space-y-1">
            <span className="text-xs font-medium text-slate-700">Creative Subline *</span>
            <input
              type="text"
              required
              maxLength={120}
              value={form.creativeSubline}
              onChange={(e) => setForm((p) => ({ ...p, creativeSubline: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-900"
            />
          </label>
          <label className="block space-y-1">
            <span className="text-xs font-medium text-slate-700">Active Years *</span>
            <input
              type="text"
              required
              maxLength={24}
              value={form.creativeYears}
              onChange={(e) => setForm((p) => ({ ...p, creativeYears: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-900"
            />
          </label>
        </div>
      </section>

      {/* External Platform Links */}
      <section className="rounded-xl bg-white border border-slate-200 p-6 space-y-4 text-sm">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <Globe className="w-4 h-4 text-slate-600" aria-hidden="true" />
            <h2 className="text-sm font-semibold text-slate-900 m-0">External Platform Links</h2>
          </div>
          <span className="font-mono-tech text-[11px] text-slate-500">HTTPS enforced</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="block space-y-1">
            <span className="text-xs font-medium text-slate-700">GitHub URL *</span>
            <input
              type="url"
              required
              value={form.githubUrl}
              onChange={(e) => setForm((p) => ({ ...p, githubUrl: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 font-mono-tech text-xs text-slate-900"
            />
          </label>
          <label className="block space-y-1">
            <span className="text-xs font-medium text-slate-700">LinkedIn URL *</span>
            <input
              type="url"
              required
              value={form.linkedinUrl}
              onChange={(e) => setForm((p) => ({ ...p, linkedinUrl: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 font-mono-tech text-xs text-slate-900"
            />
          </label>
          <label className="block space-y-1">
            <span className="text-xs font-medium text-slate-700">Instagram URL *</span>
            <input
              type="url"
              required
              value={form.instagramUrl}
              onChange={(e) => setForm((p) => ({ ...p, instagramUrl: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 font-mono-tech text-xs text-slate-900"
            />
          </label>
          <label className="block space-y-1">
            <span className="text-xs font-medium text-slate-700">Fiverr URL *</span>
            <input
              type="url"
              required
              value={form.fiverrUrl}
              onChange={(e) => setForm((p) => ({ ...p, fiverrUrl: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 font-mono-tech text-xs text-slate-900"
            />
          </label>
        </div>
      </section>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 disabled:opacity-60 cursor-pointer transition-colors"
        >
          <Save className="w-4 h-4" aria-hidden="true" />
          <span>{saving ? 'Saving Profile...' : 'Save Live Profile'}</span>
        </button>
      </div>
    </form>
  );
};
