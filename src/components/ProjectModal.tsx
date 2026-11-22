import React, { useEffect, useMemo, useState } from 'react';
import { ArrowUpRight, Eye, Layers, Lock, Plus, Search, X } from 'lucide-react';
import { ProjectItem } from '../data/portfolio';
import { resolveProjectPreviewMode } from '../lib/techPortfolio';

export type ProjectModalTab = 'preview' | 'architecture';

interface ProjectModalProps {
  project: ProjectItem | null;
  initialTab?: ProjectModalTab;
  onClose: () => void;
}

interface DemoOrder {
  id: string;
  item: string;
  amount: number;
  status: 'Synced' | 'Offline';
}

interface DemoEmployee {
  id: string;
  name: string;
  role: string;
  dept: string;
}

const INITIAL_DEMO_ORDERS: DemoOrder[] = [
  { id: '#1042', item: 'Hardware Kit · 4 units', amount: 1480, status: 'Synced' },
  { id: '#1043', item: 'Cable Spool · 2 units', amount: 620, status: 'Synced' },
  { id: '#1044', item: 'Display Stand · 1 unit', amount: 890, status: 'Offline' },
];

const INITIAL_DEMO_EMPLOYEES: DemoEmployee[] = [
  { id: 'EMP-101', name: 'Aarav Sharma', role: 'Backend Dev', dept: 'Engineering' },
  { id: 'EMP-102', name: 'Meera Nair', role: 'QA Analyst', dept: 'Quality' },
  { id: 'EMP-103', name: 'Rohan Verma', role: 'SQL Admin', dept: 'Data' },
  { id: 'EMP-104', name: 'Priya Joshi', role: 'Ops Lead', dept: 'Operations' },
];

function computeSimpleHexDigest(input: string): string {
  let h1 = 0x811c9dc5;
  let h2 = 0x9e3779b9;
  for (let i = 0; i < input.length; i += 1) {
    const c = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 0x01000193) >>> 0;
    h2 = Math.imul(h2 ^ (c + i), 0x85ebca6b) >>> 0;
  }
  return `${h1.toString(16).padStart(8, '0')}${h2.toString(16).padStart(8, '0')}`;
}

export const InteractiveProjectWorkbench: React.FC<{
  projectId: string;
  idPrefix?: string;
}> = ({ projectId, idPrefix = 'modal' }) => {
  // Order Analyzer interactive demo state
  const [orders, setOrders] = useState<DemoOrder[]>(INITIAL_DEMO_ORDERS);
  const [orderFilter, setOrderFilter] = useState<'All' | 'Synced' | 'Offline'>('All');

  // Pixault interactive demo state
  const [secretText, setSecretText] = useState('Shop ledger backup key #42');
  const [embedded, setEmbedded] = useState(true);

  // Employee Management interactive demo state
  const [empQuery, setEmpQuery] = useState('');
  const [selectedEmpId, setSelectedEmpId] = useState<string>('EMP-101');

  const visibleOrders = useMemo(
    () => (orderFilter === 'All' ? orders : orders.filter((o) => o.status === orderFilter)),
    [orders, orderFilter]
  );

  const filteredEmployees = useMemo(() => {
    const q = empQuery.trim().toLowerCase();
    if (!q) return INITIAL_DEMO_EMPLOYEES;
    return INITIAL_DEMO_EMPLOYEES.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        e.dept.toLowerCase().includes(q) ||
        e.role.toLowerCase().includes(q)
    );
  }, [empQuery]);

  if (projectId === 'order-analyzer') {
    const totalAmount = visibleOrders.reduce((sum, o) => sum + o.amount, 0);
    return (
      <div className="border border-[#111111] bg-[#f9faf9] p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="font-mono-tech text-[11px] font-bold text-[#0f5c3f]">
              Interactive Workflow Preview · SQLite + Firestore
            </div>
            <div className="font-mono-tech text-xs text-[#4b4f55] mt-0.5 tabular-nums">
              {visibleOrders.length} orders · Total ₹{totalAmount.toLocaleString('en-IN')}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {(['All', 'Synced', 'Offline'] as const).map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setOrderFilter(status)}
                aria-pressed={orderFilter === status}
                className={`font-mono-tech text-[10.5px] font-bold px-2.5 py-1 border border-[#111111] cursor-pointer transition-colors ${
                  orderFilter === status
                    ? 'bg-[#111111] text-[#ffc400]'
                    : 'bg-white text-[#111111] hover:bg-[#ffc400]/30'
                }`}
              >
                {status}
              </button>
            ))}
            <button
              type="button"
              onClick={() => {
                const nextNum = 1042 + orders.length;
                setOrders((prev) => [
                  {
                    id: `#${nextNum}`,
                    item: `Walk-in Order · ${prev.length + 1} items`,
                    amount: 540 + (prev.length % 4) * 185,
                    status: 'Offline',
                  },
                  ...prev,
                ]);
              }}
              className="inline-flex items-center gap-1 font-mono-tech text-[10.5px] font-bold px-2.5 py-1 border border-[#111111] bg-[#ffc400] text-[#111111] cursor-pointer hover:bg-[#ffd23f]"
            >
              <Plus className="w-3 h-3" aria-hidden="true" />
              <span>Log Offline Order</span>
            </button>
          </div>
        </div>

        <div className="border border-[#111111]/20 bg-white divide-y divide-[#111111]/10">
          {visibleOrders.map((order) => (
            <div
              key={order.id}
              className="flex items-center justify-between gap-3 px-3 py-2 text-[12.5px]"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="font-mono-tech font-bold text-[#111111]">{order.id}</span>
                <span className="text-[#33373d] truncate">{order.item}</span>
              </div>
              <div className="flex items-center gap-3 shrink-0 font-mono-tech text-[11.5px] tabular-nums">
                <span className="font-bold text-[#111111]">₹{order.amount}</span>
                <span
                  className={
                    order.status === 'Synced' ? 'text-[#0f5c3f] font-bold' : 'text-[#b45309] font-bold'
                  }
                >
                  {order.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (projectId === 'pixault') {
    const digest = computeSimpleHexDigest(secretText || 'empty');
    const byteCount = new TextEncoder().encode(secretText).length;
    return (
      <div className="border border-[#111111] bg-[#f9faf9] p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="font-mono-tech text-[11px] font-bold text-[#111111] flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-[#0f5c3f]" aria-hidden="true" />
            <span>Interactive Pipeline Preview · AES-256 + LSB</span>
          </div>
          <span className="font-mono-tech text-[11px] text-[#4b4f55] tabular-nums">
            {byteCount} bytes payload
          </span>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <label htmlFor={`${idPrefix}-pixault-demo-input`} className="sr-only">
            Sample payload text
          </label>
          <input
            id={`${idPrefix}-pixault-demo-input`}
            type="text"
            value={secretText}
            onChange={(ev) => {
              setSecretText(ev.target.value);
              setEmbedded(false);
            }}
            placeholder="Type sample text to preview pipeline..."
            className="flex-1 min-w-0 border border-[#111111] bg-white px-3 py-2 text-[13px] text-[#111111] focus:outline-none focus:ring-2 focus:ring-[#ffc400]"
          />
          <button
            type="button"
            onClick={() => setEmbedded(true)}
            className="font-mono-tech text-[11px] font-bold uppercase px-3.5 py-2 border border-[#111111] bg-[#ffc400] text-[#111111] shadow-[2px_2px_0_#111111] cursor-pointer whitespace-nowrap"
          >
            Simulate Embed
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 font-mono-tech text-[11.5px]">
          <div className="border border-[#111111]/20 bg-white px-3 py-2">
            <div className="text-[10px] text-[#4b4f55]">Integrity Digest (Preview)</div>
            <div className="font-bold text-[#111111] mt-0.5 truncate">{digest}...</div>
          </div>
          <div className="border border-[#111111]/20 bg-white px-3 py-2">
            <div className="text-[10px] text-[#4b4f55]">Carrier PNG Status</div>
            <div
              className={`font-bold mt-0.5 ${
                embedded ? 'text-[#0f5c3f]' : 'text-[#b45309]'
              }`}
            >
              {embedded ? 'Ready · Pixels Verified' : 'Edited · Click Simulate Embed'}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="border border-[#111111] bg-[#f9faf9] p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="font-mono-tech text-[11px] font-bold text-[#2563eb]">
          Interactive Directory Preview · MySQL CRUD
        </div>
        <div className="relative">
          <Search
            className="w-3.5 h-3.5 text-[#4b4f55] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
            aria-hidden="true"
          />
          <label htmlFor={`${idPrefix}-emp-demo-search`} className="sr-only">
            Filter sample employees
          </label>
          <input
            id={`${idPrefix}-emp-demo-search`}
            type="search"
            value={empQuery}
            onChange={(ev) => setEmpQuery(ev.target.value)}
            placeholder="Filter name or dept..."
            className="border border-[#111111] bg-white pl-8 pr-2.5 py-1 text-[12px] text-[#111111] w-48 focus:outline-none focus:ring-2 focus:ring-[#ffc400]"
          />
        </div>
      </div>

      <div className="border border-[#111111]/20 bg-white divide-y divide-[#111111]/10">
        {filteredEmployees.length > 0 ? (
          filteredEmployees.map((emp) => {
            const active = selectedEmpId === emp.id;
            return (
              <button
                key={emp.id}
                type="button"
                onClick={() => setSelectedEmpId(emp.id)}
                className={`w-full text-left flex items-center justify-between gap-3 px-3 py-2 text-[12.5px] cursor-pointer transition-colors ${
                  active ? 'bg-[#ffc400]/30' : 'hover:bg-[#f4f4f1]'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="font-mono-tech text-[11px] font-bold text-[#4b4f55]">
                    {emp.id}
                  </span>
                  <span className="font-semibold text-[#111111] truncate">{emp.name}</span>
                </div>
                <span className="font-mono-tech text-[11px] text-[#33373d] shrink-0">
                  {emp.role} · {emp.dept}
                </span>
              </button>
            );
          })
        ) : (
          <div className="px-3 py-3 text-xs text-[#4b4f55] font-mono-tech">
            No matching records in sample directory.
          </div>
        )}
      </div>
    </div>
  );
};

export const ProjectModal: React.FC<ProjectModalProps> = ({
  project,
  initialTab = 'preview',
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<ProjectModalTab>(initialTab);
  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => {
    setActiveTab(initialTab);
    setImgFailed(false);
  }, [project, initialTab]);

  useEffect(() => {
    if (!project) return;
    const onKeyDown = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') {
        ev.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, [project, onClose]);

  if (!project) return null;

  const previewMode = resolveProjectPreviewMode(project);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-3 sm:p-5"
      role="dialog"
      aria-modal="true"
      aria-labelledby="project-modal-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl max-h-[92dvh] overflow-y-auto bg-[#f9faf9] text-[#111111] border-2 border-[#111111] shadow-[6px_7px_0_#111111]"
        onClick={(ev) => ev.stopPropagation()}
      >
        {/* File Inspector Top Window Bar */}
        <div className="sticky top-0 z-20 flex items-center justify-between gap-3 px-5 py-3 bg-[#111111] text-white border-b border-[#111111]">
          <div className="flex items-center gap-2.5 min-w-0">
            <span
              className="w-2.5 h-2.5 shrink-0 border border-white/40"
              style={{ backgroundColor: project.fileAccent === '#111111' ? '#ffc400' : project.fileAccent }}
              aria-hidden="true"
            />
            <span className="font-mono-tech text-xs font-bold tracking-[0.04em] truncate">
              {project.fileName}
            </span>
            <span className="font-mono-tech text-[11px] text-white/65 hidden sm:inline">
              · {project.platform}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label={`Close ${project.title} file inspector`}
            className="shrink-0 w-8 h-8 grid place-items-center border border-white/30 bg-white/10 text-white hover:bg-[#ffc400] hover:text-[#111111] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 sm:p-7">
          {/* Header + Mode Tabs */}
          <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#111111]/15 pb-4">
            <div>
              <h2
                id="project-modal-title"
                className="text-2xl sm:text-3xl font-bold tracking-[-0.03em] leading-tight"
              >
                {project.title}
              </h2>
              <p className="mt-1 text-[14px] text-[#33373d] max-w-xl">{project.summary}</p>
            </div>

            <div
              className="inline-flex border border-[#111111] bg-white p-0.5 shrink-0"
              role="tablist"
              aria-label="Project inspection view"
            >
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'preview'}
                onClick={() => setActiveTab('preview')}
                className={`inline-flex items-center gap-1.5 font-mono-tech text-[11px] font-bold uppercase px-3 py-1.5 cursor-pointer transition-colors whitespace-nowrap ${
                  activeTab === 'preview'
                    ? 'bg-[#111111] text-[#ffc400]'
                    : 'text-[#111111] hover:bg-[#f4f4f1]'
                }`}
              >
                <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Live Preview</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'architecture'}
                onClick={() => setActiveTab('architecture')}
                className={`inline-flex items-center gap-1.5 font-mono-tech text-[11px] font-bold uppercase px-3 py-1.5 cursor-pointer transition-colors whitespace-nowrap ${
                  activeTab === 'architecture'
                    ? 'bg-[#111111] text-[#ffc400]'
                    : 'text-[#111111] hover:bg-[#f4f4f1]'
                }`}
              >
                <Layers className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Architecture</span>
              </button>
            </div>
          </div>

          {activeTab === 'preview' ? (
            <div className="mt-4 space-y-4">
              {/* Large Visual Preview Frame */}
              <div className="border border-[#111111] bg-[#16181d] overflow-hidden h-[220px] sm:h-[280px]">
                {!imgFailed ? (
                  <img
                    src={project.previewImage}
                    alt={project.previewAlt}
                    referrerPolicy="no-referrer"
                    onError={() => setImgFailed(true)}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div
                    className="w-full h-full flex flex-col items-center justify-center p-6 text-white"
                    style={{ background: project.fallbackGradient }}
                  >
                    <span className="font-mono-tech text-xs text-[#ffc400]">{project.fileName}</span>
                    <span className="mt-1 text-xl font-bold">{project.title}</span>
                  </div>
                )}
              </div>

              {/* Interactive In-Browser Demo Workbench */}
              <InteractiveProjectWorkbench projectId={project.id} />
            </div>
          ) : (
            <div className="mt-5 space-y-5">
              {/* Data Flow Strip */}
              <div className="border border-[#111111] bg-[#ffc400]/25 p-3.5">
                <div className="font-mono-tech text-[10px] font-bold uppercase tracking-[0.14em] text-[#111111]">
                  System Data Flow
                </div>
                <div className="mt-1.5 font-mono-tech text-xs sm:text-[13px] font-medium text-[#111111] leading-relaxed">
                  {project.architecture.dataFlow}
                </div>
              </div>

              {/* Layers */}
              <div>
                <div className="font-mono-tech text-[10px] font-bold uppercase tracking-[0.14em] text-[#4b4f55] mb-2.5">
                  Component Layers
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {project.architecture.layers.map((layer, index) => (
                    <div
                      key={layer.name}
                      className="border border-[#111111] bg-white p-3.5 shadow-[2px_2px_0_#111111]"
                    >
                      <div className="font-mono-tech text-[10.5px] text-[#0f5c3f] font-bold">
                        0{index + 1} · {layer.name}
                      </div>
                      <p className="mt-1 text-[13px] leading-snug text-[#33373d]">{layer.role}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Engineering Notes */}
              <div>
                <div className="font-mono-tech text-[10px] font-bold uppercase tracking-[0.14em] text-[#4b4f55] mb-2">
                  Implementation Notes
                </div>
                <ul className="list-disc pl-5 space-y-1.5 text-[13.5px] text-[#33373d]">
                  {project.architecture.engineeringNotes.map((note) => (
                    <li key={note}>{note}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Footer actions */}
          <div className="mt-6 pt-4 border-t border-[#111111]/15 flex flex-wrap items-center justify-between gap-3">
            <div className="font-mono-tech text-[11.5px] text-[#4b4f55]">
              {project.stack.join(' · ')}
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {previewMode === 'external' && project.liveUrl && (
                <a
                  href={project.liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 font-mono-tech text-xs font-bold uppercase px-4 py-2 border border-[#111111] bg-white text-[#111111] shadow-[2px_2px_0_#111111] hover:bg-[#f4f4f1]"
                >
                  <span>Open Live Site</span>
                  <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
                </a>
              )}
              <a
                href={project.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 font-mono-tech text-xs font-bold uppercase px-4 py-2 border border-[#111111] bg-[#ffc400] text-[#111111] shadow-[3px_3px_0_#111111] hover:-translate-x-px hover:-translate-y-px transition-transform"
              >
                <span>GitHub Source</span>
                <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
