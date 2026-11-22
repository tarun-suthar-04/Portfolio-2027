import React, { useState } from 'react';
import { Archive, CheckCircle2, Inbox, Trash2 } from 'lucide-react';
import { deleteDoc, doc, updateDoc, type Timestamp } from 'firebase/firestore';
import { db, recordAuditLog } from '../../lib/firebase';
import type { ContactSource, InquiryStatus } from '../../lib/contactInquiry';

export interface ProjectInquiryRecord {
  id: string;
  name: string;
  email: string;
  phone: string;
  reason: string;
  message: string;
  source: ContactSource;
  status: InquiryStatus;
  createdAt: Timestamp | null;
}

interface AdminInquiriesTabProps {
  inquiries: ProjectInquiryRecord[];
  onNotify: (msg: string, tone?: 'success' | 'error') => void;
}

export const AdminInquiriesTab: React.FC<AdminInquiriesTabProps> = ({ inquiries, onNotify }) => {
  const [filter, setFilter] = useState<'all' | InquiryStatus>('all');
  const [busyId, setBusyId] = useState<string | null>(null);

  const visible =
    filter === 'all' ? inquiries : inquiries.filter((item) => item.status === filter);

  const handleStatusChange = async (inquiry: ProjectInquiryRecord, nextStatus: InquiryStatus) => {
    setBusyId(inquiry.id);
    try {
      await updateDoc(doc(db, 'project_inquiries', inquiry.id), { status: nextStatus });
      await recordAuditLog({
        action: 'update',
        resourceType: 'project_inquiries',
        resourceId: inquiry.id,
        summary: `Marked inquiry from ${inquiry.name} as ${nextStatus}`,
      });
      onNotify(`Inquiry marked as ${nextStatus}.`);
    } catch (error) {
      console.error('Failed to update inquiry status:', error);
      onNotify('Failed to update inquiry status.', 'error');
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (inquiry: ProjectInquiryRecord) => {
    setBusyId(inquiry.id);
    try {
      await deleteDoc(doc(db, 'project_inquiries', inquiry.id));
      await recordAuditLog({
        action: 'delete',
        resourceType: 'project_inquiries',
        resourceId: inquiry.id,
        summary: `Deleted contact inquiry from ${inquiry.name}`,
      });
      onNotify('Inquiry deleted.');
    } catch (error) {
      console.error('Failed to delete inquiry:', error);
      onNotify('Failed to delete inquiry.', 'error');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 m-0">Contact Inquiries</h2>
          <p className="text-xs text-slate-500 mt-1 mb-0">
            Submissions from the Technical &amp; Creative contact forms ({inquiries.length} total).
          </p>
        </div>

        <div className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
          {(['all', 'new', 'reviewed', 'archived'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setFilter(tab)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md capitalize cursor-pointer border-0 transition-colors whitespace-nowrap shrink-0 ${
                filter === tab
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'bg-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="rounded-xl bg-white border border-slate-200 p-10 text-center space-y-2">
          <Inbox className="w-7 h-7 text-slate-400 mx-auto" aria-hidden="true" />
          <p className="text-sm font-medium text-slate-700 m-0">No inquiries in this view</p>
          <p className="text-xs text-slate-500 m-0">
            Messages sent via the Technical or Creative contact forms will appear here automatically.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map((item) => {
            const busy = busyId === item.id;
            const createdLabel = item.createdAt?.toDate
              ? item.createdAt.toDate().toLocaleString()
              : 'Just now';

            return (
              <article
                key={item.id}
                className="rounded-xl bg-white border border-slate-200 p-5 space-y-3.5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-semibold text-slate-900 m-0">{item.name}</h3>
                      <span className="text-xs text-slate-400" aria-hidden="true">
                        ·
                      </span>
                      <a
                        href={`mailto:${item.email}`}
                        className="font-mono-tech text-xs text-slate-700 hover:text-blue-600 no-underline"
                      >
                        {item.email}
                      </a>
                      {item.phone && (
                        <>
                          <span className="text-xs text-slate-400" aria-hidden="true">
                            ·
                          </span>
                          <span className="font-mono-tech text-xs text-slate-600">
                            {item.phone}
                          </span>
                        </>
                      )}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <span className="capitalize font-medium text-slate-700">{item.status}</span>
                      <span aria-hidden="true">·</span>
                      <span className="capitalize font-medium text-slate-700">{item.source}</span>
                      {item.reason && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span>{item.reason}</span>
                        </>
                      )}
                      <span aria-hidden="true">·</span>
                      <span>{createdLabel}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {item.status !== 'reviewed' && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => handleStatusChange(item, 'reviewed')}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-medium text-slate-700 cursor-pointer disabled:opacity-50"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
                        <span>Mark Reviewed</span>
                      </button>
                    )}
                    {item.status !== 'archived' && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => handleStatusChange(item, 'archived')}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-medium text-slate-700 cursor-pointer disabled:opacity-50"
                      >
                        <Archive className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
                        <span>Archive</span>
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => handleDelete(item)}
                      aria-label={`Delete inquiry from ${item.name}`}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-red-200 bg-white hover:bg-red-50 text-xs font-medium text-red-700 cursor-pointer disabled:opacity-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>

                <p className="m-0 text-sm leading-relaxed text-slate-700 whitespace-pre-wrap border-t border-slate-100 pt-3">
                  {item.message}
                </p>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};
