import React, { useMemo, useState } from 'react';
import {
  History,
  Lock,
  Shield,
  ShieldCheck,
  Trash2,
  UserPlus,
} from 'lucide-react';
import {
  deleteDoc,
  doc,
  serverTimestamp,
  setDoc,
  updateDoc,
  type Timestamp,
} from 'firebase/firestore';
import type { AdminRecord } from '../../context/PortfolioDataContext';
import {
  BOOTSTRAP_ADMIN_EMAILS,
  validateAdminUserPayload,
  type AdminRole,
  type AuditAction,
  type AuditResourceType,
} from '../../lib/adminValidation';
import { db, recordAuditLog } from '../../lib/firebase';

export interface AuditLogItem {
  id: string;
  actorUid: string;
  actorEmail: string;
  action: AuditAction;
  resourceType: AuditResourceType;
  resourceId: string;
  summary: string;
  createdAt?: Timestamp | null;
}

interface AdminSecurityTabProps {
  admins: AdminRecord[];
  auditLogs: AuditLogItem[];
  currentUid: string;
  isSuperAdmin: boolean;
  onNotify: (msg: string, tone?: 'success' | 'error') => void;
}

function formatTimestamp(ts?: Timestamp | null): string {
  if (!ts || typeof ts.toDate !== 'function') return 'Just now';
  return ts.toDate().toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const ACTION_BADGE_STYLE: Record<AuditAction, string> = {
  create: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  update: 'bg-blue-50 text-blue-700 border-blue-200',
  delete: 'bg-red-50 text-red-700 border-red-200',
  publish_toggle: 'bg-amber-50 text-amber-700 border-amber-200',
  role_change: 'bg-violet-50 text-violet-700 border-violet-200',
  seed: 'bg-slate-100 text-slate-700 border-slate-200',
};

export const AdminSecurityTab: React.FC<AdminSecurityTabProps> = ({
  admins,
  auditLogs,
  currentUid,
  isSuperAdmin,
  onNotify,
}) => {
  const [uid, setUid] = useState('');
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState<AdminRole>('admin');
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [busyUid, setBusyUid] = useState<string | null>(null);
  const [confirmDeleteUid, setConfirmDeleteUid] = useState<string | null>(null);
  const [resourceFilter, setResourceFilter] = useState<'all' | AuditResourceType>('all');

  const filteredLogs = useMemo(() => {
    if (resourceFilter === 'all') return auditLogs;
    return auditLogs.filter((l) => l.resourceType === resourceFilter);
  }, [auditLogs, resourceFilter]);

  const handleAddAdmin = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!isSuperAdmin) return;
    setFormErrors([]);

    const validated = validateAdminUserPayload({
      uid,
      email,
      displayName,
      role,
      active: true,
    });

    if (!validated.ok || !validated.data) {
      setFormErrors(validated.errors);
      return;
    }

    const clean = validated.data;
    setSaving(true);
    try {
      await setDoc(doc(db, 'admins', clean.uid), {
        uid: clean.uid,
        email: clean.email,
        displayName: clean.displayName,
        role: clean.role,
        active: clean.active,
        addedBy: currentUid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      await recordAuditLog({
        action: 'role_change',
        resourceType: 'admins',
        resourceId: clean.uid,
        summary: `Authorized ${clean.email} as ${clean.role}`,
      });
      setUid('');
      setEmail('');
      setDisplayName('');
      setRole('admin');
      onNotify(`Authorized ${clean.email} (${clean.role}).`);
    } catch (error) {
      onNotify(
        error instanceof Error ? error.message : 'Unable to add administrator.',
        'error'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (admin: AdminRecord) => {
    if (!isSuperAdmin || admin.uid === currentUid) return;
    setBusyUid(admin.uid);
    const nextActive = !admin.active;
    try {
      await updateDoc(doc(db, 'admins', admin.uid), {
        active: nextActive,
        addedBy: currentUid,
        updatedAt: serverTimestamp(),
      });
      await recordAuditLog({
        action: 'role_change',
        resourceType: 'admins',
        resourceId: admin.uid,
        summary: `${nextActive ? 'Re-enabled' : 'Suspended'} admin ${admin.email}`,
      });
      onNotify(`${admin.email} is now ${nextActive ? 'Active' : 'Suspended'}.`);
    } catch (error) {
      onNotify(
        error instanceof Error ? error.message : 'Failed to update admin status.',
        'error'
      );
    } finally {
      setBusyUid(null);
    }
  };

  const handleRevoke = async (admin: AdminRecord) => {
    if (!isSuperAdmin || admin.uid === currentUid) return;
    setBusyUid(admin.uid);
    try {
      await deleteDoc(doc(db, 'admins', admin.uid));
      await recordAuditLog({
        action: 'delete',
        resourceType: 'admins',
        resourceId: admin.uid,
        summary: `Revoked admin access for ${admin.email}`,
      });
      setConfirmDeleteUid(null);
      onNotify(`Revoked access for ${admin.email}.`);
    } catch (error) {
      onNotify(error instanceof Error ? error.message : 'Failed to revoke admin.', 'error');
    } finally {
      setBusyUid(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* RBAC Admin Roster */}
      <section className="rounded-xl bg-white border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <Shield className="w-4 h-4 text-slate-700" aria-hidden="true" />
            <h2 className="text-sm font-semibold text-slate-900 m-0">
              Authorized Administrators (Database RBAC)
            </h2>
          </div>
          <span className="font-mono-tech text-[11px] text-slate-500">
            Verified Google OAuth required
          </span>
        </div>

        <div className="p-6 space-y-5">
          {/* Protected Bootstrapped Super Admins */}
          <div className="space-y-2.5">
            {BOOTSTRAP_ADMIN_EMAILS.map((ownerEmail) => (
              <div
                key={ownerEmail}
                className="rounded-xl bg-slate-50 border border-slate-200 p-4 flex flex-wrap items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-slate-900 text-white flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-4 h-4" aria-hidden="true" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-900">Protected Super Admin</div>
                    <div className="font-mono-tech text-xs text-slate-600">{ownerEmail}</div>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-md bg-slate-900 text-white font-mono-tech text-[11px] font-medium">
                  super_admin · Protected
                </span>
              </div>
            ))}
          </div>

          {/* Registered Secondary Admins */}
          {admins.length > 0 && (
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
                    <th className="py-2.5 px-4">Administrator</th>
                    <th className="py-2.5 px-4">Role</th>
                    <th className="py-2.5 px-4">Status</th>
                    <th className="py-2.5 px-4 text-right">Controls</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {admins.map((admin) => {
                    const isSelf = admin.uid === currentUid;
                    const busy = busyUid === admin.uid;
                    const confirming = confirmDeleteUid === admin.uid;
                    return (
                      <tr key={admin.uid}>
                        <td className="py-3 px-4">
                          <div className="font-medium text-slate-900">{admin.displayName}</div>
                          <div className="font-mono-tech text-xs text-slate-500">
                            {admin.email} · {admin.uid.slice(0, 12)}…
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-mono-tech text-xs px-2 py-0.5 rounded border border-slate-200 bg-slate-50 text-slate-700">
                            {admin.role}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-medium border ${
                              admin.active
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-red-50 text-red-700 border-red-200'
                            }`}
                          >
                            {admin.active ? 'Active' : 'Suspended'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          {!isSuperAdmin || isSelf ? (
                            <span className="text-xs text-slate-400">
                              {isSelf ? 'Current session' : 'Super Admin only'}
                            </span>
                          ) : confirming ? (
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() => handleRevoke(admin)}
                                className="px-2.5 py-1 rounded-md bg-red-600 text-white text-xs font-medium cursor-pointer"
                              >
                                Revoke
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteUid(null)}
                                className="px-2.5 py-1 rounded-md border border-slate-200 text-xs text-slate-700 cursor-pointer"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <div className="inline-flex items-center gap-2">
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() => handleToggleActive(admin)}
                                className="px-2.5 py-1 rounded-md border border-slate-200 bg-white text-xs text-slate-700 hover:bg-slate-50 cursor-pointer"
                              >
                                {admin.active ? 'Suspend' : 'Enable'}
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteUid(admin.uid)}
                                className="p-1.5 rounded-md text-slate-500 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                                title="Revoke admin access"
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

          {/* Add Admin Form (Super Admin Only) */}
          {isSuperAdmin ? (
            <form
              onSubmit={handleAddAdmin}
              className="rounded-xl border border-slate-200 p-4 space-y-3 bg-slate-50/50"
            >
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-800">
                <UserPlus className="w-4 h-4" aria-hidden="true" />
                <span>Authorize New Administrator</span>
              </div>

              {formErrors.length > 0 && (
                <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-xs text-red-700 space-y-1">
                  {formErrors.map((err) => (
                    <div key={err}>• {err}</div>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                <input
                  type="text"
                  required
                  value={uid}
                  onChange={(e) => setUid(e.target.value)}
                  placeholder="Firebase Auth UID"
                  className="px-3 py-2 rounded-lg border border-slate-200 bg-white font-mono-tech text-xs text-slate-900"
                />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Google email address"
                  className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs text-slate-900"
                />
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Display name"
                  className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs text-slate-900"
                />
                <div className="flex gap-2">
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as AdminRole)}
                    className="flex-1 px-2.5 py-2 rounded-lg border border-slate-200 bg-white text-xs text-slate-900"
                  >
                    <option value="admin">admin</option>
                    <option value="super_admin">super_admin</option>
                  </select>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-3.5 py-2 rounded-lg bg-slate-900 text-white text-xs font-medium hover:bg-slate-800 disabled:opacity-60 cursor-pointer shrink-0"
                  >
                    {saving ? 'Adding...' : 'Authorize'}
                  </button>
                </div>
              </div>
              <p className="text-[11px] text-slate-500 m-0">
                Ask the collaborator to sign in once at <span className="font-mono-tech">#admin</span> — the Access Denied card provides a one-click Copy button for their exact Firebase UID.
              </p>
            </form>
          ) : (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-xs text-slate-600 flex items-center gap-2">
              <Lock className="w-4 h-4 text-slate-500 shrink-0" aria-hidden="true" />
              <span>Only Super Admins can add, suspend, or revoke administrator accounts.</span>
            </div>
          )}
        </div>
      </section>

      {/* Immutable Audit Log */}
      <section className="rounded-xl bg-white border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <History className="w-4 h-4 text-slate-700" aria-hidden="true" />
            <h2 className="text-sm font-semibold text-slate-900 m-0">
              Immutable Security Audit Log
            </h2>
          </div>

          <div className="flex items-center gap-2.5">
            <span className="font-mono-tech text-[11px] text-slate-500">
              Append-only · Edits &amp; deletes denied
            </span>
            <select
              aria-label="Filter audit logs by resource"
              value={resourceFilter}
              onChange={(e) => setResourceFilter(e.target.value as 'all' | AuditResourceType)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-700"
            >
              <option value="all">All resources</option>
              <option value="projects">projects</option>
              <option value="creative_works">creative_works</option>
              <option value="site_config">site_config</option>
              <option value="admins">admins</option>
            </select>
          </div>
        </div>

        {filteredLogs.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            No administrative audit events recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
                  <th className="py-2.5 px-4">Time</th>
                  <th className="py-2.5 px-4">Actor</th>
                  <th className="py-2.5 px-4">Action</th>
                  <th className="py-2.5 px-4">Resource</th>
                  <th className="py-2.5 px-4">Summary</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/60">
                    <td className="py-3 px-4 font-mono-tech text-slate-500 whitespace-nowrap tabular-nums">
                      {formatTimestamp(log.createdAt)}
                    </td>
                    <td className="py-3 px-4 font-mono-tech text-slate-700 whitespace-nowrap">
                      {log.actorEmail}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`inline-block px-2 py-0.5 rounded border font-mono-tech text-[11px] ${
                          ACTION_BADGE_STYLE[log.action] ?? ACTION_BADGE_STYLE.update
                        }`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono-tech text-slate-600 whitespace-nowrap">
                      {log.resourceType}/{log.resourceId}
                    </td>
                    <td className="py-3 px-4 text-slate-800">{log.summary}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};
