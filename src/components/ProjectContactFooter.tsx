import React, { useState } from 'react';
import { ArrowRight, ArrowUpRight, CheckCircle2, FileText, Lock, RotateCcw } from 'lucide-react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import {
  PROJECT_BUDGET_OPTIONS,
  PROJECT_NEED_OPTIONS,
  toggleBudgetSelection,
  toggleNeedSelection,
  validateProjectInquiry,
  type ProjectBudgetOption,
  type ProjectInquiryFieldErrors,
  type ProjectNeedOption,
  type SanitizedProjectInquiry,
} from '../lib/contactInquiry';

interface ProjectContactFooterProps {
  fullName: string;
  location: string;
  githubUrl: string;
  linkedinUrl: string;
  onOpenResume: () => void;
  onOpenAdmin: () => void;
}

export const ProjectContactFooter: React.FC<ProjectContactFooterProps> = ({
  fullName,
  location,
  githubUrl,
  linkedinUrl,
  onOpenResume,
  onOpenAdmin,
}) => {
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [needs, setNeeds] = useState<ProjectNeedOption[]>([]);
  const [budget, setBudget] = useState<ProjectBudgetOption | ''>('');
  const [details, setDetails] = useState('');

  const [fieldErrors, setFieldErrors] = useState<ProjectInquiryFieldErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submittedRecord, setSubmittedRecord] = useState<SanitizedProjectInquiry | null>(null);

  const handleToggleNeed = (option: ProjectNeedOption) => {
    setNeeds((prev) => toggleNeedSelection(prev, option));
    if (fieldErrors.needs) {
      setFieldErrors((prev) => ({ ...prev, needs: undefined }));
    }
  };

  const handleToggleBudget = (option: ProjectBudgetOption) => {
    setBudget((prev) => toggleBudgetSelection(prev, option));
    if (fieldErrors.budget) {
      setFieldErrors((prev) => ({ ...prev, budget: undefined }));
    }
  };

  const handleResetForm = () => {
    setName('');
    setContact('');
    setNeeds([]);
    setBudget('');
    setDetails('');
    setFieldErrors({});
    setSubmitError(null);
    setSubmittedRecord(null);
  };

  const handleSubmit = async (ev: React.FormEvent<HTMLFormElement>) => {
    ev.preventDefault();
    if (submitting) return;

    setSubmitError(null);
    const result = validateProjectInquiry({
      name,
      contact,
      needs,
      budget,
      details,
    });

    if (!result.ok || !result.data) {
      setFieldErrors(result.fieldErrors);
      return;
    }

    setFieldErrors({});
    setSubmitting(true);

    try {
      await addDoc(collection(db, 'project_inquiries'), {
        ...result.data,
        createdAt: serverTimestamp(),
      });
      setSubmittedRecord(result.data);
    } catch (error) {
      console.error('Failed to submit project inquiry:', error);
      setSubmitError(
        'Could not deliver your message right now. Please check your connection and try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <footer
      id="tech-contact"
      aria-labelledby="start-project-heading"
      className="mt-8 bg-[#111111] text-white border-2 border-[#111111] shadow-[5px_6px_0_#ffc400]"
    >
      <div className="p-6 sm:p-10 lg:p-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Left Column — Editorial Heading & Intro */}
          <div className="lg:col-span-5">
            <h2
              id="start-project-heading"
              className="m-0 text-[38px] sm:text-[48px] lg:text-[56px] font-extrabold tracking-[-0.048em] leading-[0.96] text-white text-balance"
            >
              Start a{' '}
              <span className="inline-block bg-[#ffc400] text-[#111111] px-2.5 py-0.5 leading-[0.95]">
                project
              </span>
            </h2>

            <p className="mt-5 mb-0 text-[15.5px] sm:text-[16.5px] leading-[1.6] text-white/78 max-w-[36ch]">
              A few lines about the task — and I will come back with questions or an estimate.
            </p>
          </div>

          {/* Right Column — Start a Project Form */}
          <div className="lg:col-span-7">
            {submittedRecord ? (
              <div
                role="status"
                data-testid="contact-form-success"
                className="border border-white/25 bg-white/[0.04] p-6 sm:p-8 space-y-5"
              >
                <div className="flex items-start gap-3.5">
                  <CheckCircle2
                    className="w-6 h-6 text-[#ffc400] shrink-0 mt-0.5"
                    aria-hidden="true"
                  />
                  <div>
                    <h3 className="m-0 text-[22px] font-bold tracking-[-0.03em] text-white">
                      Brief received — thank you, {submittedRecord.name}.
                    </h3>
                    <p className="mt-1.5 mb-0 text-[14.5px] leading-[1.55] text-white/75">
                      I will review your project notes and get back to you at{' '}
                      <span className="font-mono-tech text-white">{submittedRecord.contact}</span>{' '}
                      with questions or an estimate.
                    </p>
                  </div>
                </div>

                {(submittedRecord.needs.length > 0 || submittedRecord.budget) && (
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-white/15 m-0">
                    {submittedRecord.needs.length > 0 && (
                      <div>
                        <dt className="font-mono-tech text-[10.5px] uppercase tracking-[0.12em] text-white/55">
                          What you need
                        </dt>
                        <dd className="m-0 mt-1 text-[13.5px] text-white/90">
                          {submittedRecord.needs.join(' · ')}
                        </dd>
                      </div>
                    )}
                    {submittedRecord.budget && (
                      <div>
                        <dt className="font-mono-tech text-[10.5px] uppercase tracking-[0.12em] text-white/55">
                          Budget
                        </dt>
                        <dd className="m-0 mt-1 text-[13.5px] text-white/90">
                          {submittedRecord.budget}
                        </dd>
                      </div>
                    )}
                  </dl>
                )}

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleResetForm}
                    className="inline-flex items-center gap-2 font-mono-tech text-[12px] font-bold uppercase tracking-[0.08em] px-4 py-2.5 border border-white/30 bg-transparent text-white hover:border-[#ffc400] hover:text-[#ffc400] transition-colors cursor-pointer whitespace-nowrap shrink-0"
                  >
                    <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Send another project brief</span>
                  </button>
                </div>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                noValidate
                data-testid="start-project-form"
                className="flex flex-col gap-6"
              >
                {/* Text Inputs Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label
                      htmlFor="contact-name"
                      className="block font-mono-tech text-[11px] font-bold uppercase tracking-[0.13em] text-white/85 mb-2"
                    >
                      NAME <span className="text-[#ffc400]">*</span>
                    </label>
                    <input
                      id="contact-name"
                      name="name"
                      type="text"
                      required
                      autoComplete="name"
                      maxLength={80}
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        if (fieldErrors.name) {
                          setFieldErrors((prev) => ({ ...prev, name: undefined }));
                        }
                      }}
                      placeholder="How should I call you"
                      aria-invalid={Boolean(fieldErrors.name)}
                      aria-describedby={fieldErrors.name ? 'contact-name-error' : undefined}
                      className={`w-full px-3.5 py-3 bg-[#1a1c20] text-[15px] text-white placeholder:text-white/40 border transition-colors focus:outline-none ${
                        fieldErrors.name
                          ? 'border-[#f87171] focus:border-[#f87171]'
                          : 'border-white/22 focus:border-[#ffc400]'
                      }`}
                    />
                    {fieldErrors.name && (
                      <p
                        id="contact-name-error"
                        role="alert"
                        className="mt-1.5 mb-0 font-mono-tech text-[11px] text-[#fca5a5]"
                      >
                        {fieldErrors.name}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="contact-handle"
                      className="block font-mono-tech text-[11px] font-bold uppercase tracking-[0.13em] text-white/85 mb-2"
                    >
                      EMAIL OR TELEGRAM <span className="text-[#ffc400]">*</span>
                    </label>
                    <input
                      id="contact-handle"
                      name="contact"
                      type="text"
                      required
                      maxLength={120}
                      value={contact}
                      onChange={(e) => {
                        setContact(e.target.value);
                        if (fieldErrors.contact) {
                          setFieldErrors((prev) => ({ ...prev, contact: undefined }));
                        }
                      }}
                      placeholder="name@mail.com or @nickname"
                      aria-invalid={Boolean(fieldErrors.contact)}
                      aria-describedby={fieldErrors.contact ? 'contact-handle-error' : undefined}
                      className={`w-full px-3.5 py-3 bg-[#1a1c20] text-[15px] text-white placeholder:text-white/40 border transition-colors focus:outline-none ${
                        fieldErrors.contact
                          ? 'border-[#f87171] focus:border-[#f87171]'
                          : 'border-white/22 focus:border-[#ffc400]'
                      }`}
                    />
                    {fieldErrors.contact && (
                      <p
                        id="contact-handle-error"
                        role="alert"
                        className="mt-1.5 mb-0 font-mono-tech text-[11px] text-[#fca5a5]"
                      >
                        {fieldErrors.contact}
                      </p>
                    )}
                  </div>
                </div>

                {/* WHAT YOU NEED — Multi-select Options */}
                <fieldset className="border-0 p-0">
                  <legend className="block font-mono-tech text-[11px] font-bold uppercase tracking-[0.13em] text-white/85 mb-2.5 p-0">
                    WHAT YOU NEED
                  </legend>
                  <div className="flex flex-wrap gap-2">
                    {PROJECT_NEED_OPTIONS.map((option) => {
                      const active = needs.includes(option);
                      return (
                        <button
                          key={option}
                          type="button"
                          aria-pressed={active}
                          onClick={() => handleToggleNeed(option)}
                          className={`px-3.5 py-2 font-mono-tech text-[12px] border transition-all cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffc400] focus-visible:ring-offset-2 focus-visible:ring-offset-[#111111] ${
                            active
                              ? 'bg-[#ffc400] text-[#111111] border-[#ffc400] font-bold shadow-[2px_2px_0_rgba(255,255,255,0.28)]'
                              : 'bg-transparent text-white/82 border-white/25 hover:border-white/65 hover:text-white font-medium'
                          }`}
                        >
                          {option}
                        </button>
                      );
                    })}
                  </div>
                </fieldset>

                {/* BUDGET — Single-select Options */}
                <fieldset className="border-0 p-0">
                  <legend className="block font-mono-tech text-[11px] font-bold uppercase tracking-[0.13em] text-white/85 mb-2.5 p-0">
                    BUDGET
                  </legend>
                  <div className="flex flex-wrap gap-2">
                    {PROJECT_BUDGET_OPTIONS.map((option) => {
                      const active = budget === option;
                      return (
                        <button
                          key={option}
                          type="button"
                          aria-pressed={active}
                          onClick={() => handleToggleBudget(option)}
                          className={`px-3.5 py-2 font-mono-tech text-[12px] border transition-all cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffc400] focus-visible:ring-offset-2 focus-visible:ring-offset-[#111111] ${
                            active
                              ? 'bg-[#ffc400] text-[#111111] border-[#ffc400] font-bold shadow-[2px_2px_0_rgba(255,255,255,0.28)]'
                              : 'bg-transparent text-white/82 border-white/25 hover:border-white/65 hover:text-white font-medium'
                          }`}
                        >
                          {option}
                        </button>
                      );
                    })}
                  </div>
                </fieldset>

                {/* ABOUT THE PROJECT Textarea */}
                <div>
                  <label
                    htmlFor="contact-details"
                    className="block font-mono-tech text-[11px] font-bold uppercase tracking-[0.13em] text-white/85 mb-2"
                  >
                    ABOUT THE PROJECT <span className="text-[#ffc400]">*</span>
                  </label>
                  <textarea
                    id="contact-details"
                    name="details"
                    required
                    rows={4}
                    maxLength={2000}
                    value={details}
                    onChange={(e) => {
                      setDetails(e.target.value);
                      if (fieldErrors.details) {
                        setFieldErrors((prev) => ({ ...prev, details: undefined }));
                      }
                    }}
                    placeholder="What we are building, timing, links to designs"
                    aria-invalid={Boolean(fieldErrors.details)}
                    aria-describedby={fieldErrors.details ? 'contact-details-error' : undefined}
                    className={`w-full px-3.5 py-3 bg-[#1a1c20] text-[15px] leading-[1.55] text-white placeholder:text-white/40 border transition-colors resize-y min-h-[116px] focus:outline-none ${
                      fieldErrors.details
                        ? 'border-[#f87171] focus:border-[#f87171]'
                        : 'border-white/22 focus:border-[#ffc400]'
                    }`}
                  />
                  {fieldErrors.details && (
                    <p
                      id="contact-details-error"
                      role="alert"
                      className="mt-1.5 mb-0 font-mono-tech text-[11px] text-[#fca5a5]"
                    >
                      {fieldErrors.details}
                    </p>
                  )}
                </div>

                {submitError && (
                  <p
                    role="alert"
                    className="m-0 px-3.5 py-2.5 border border-[#f87171]/60 bg-[#f87171]/10 font-mono-tech text-[12px] text-[#fca5a5]"
                  >
                    {submitError}
                  </p>
                )}

                {/* Submit Action */}
                <div className="pt-1 flex flex-wrap items-center justify-between gap-4">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center gap-2.5 font-mono-tech text-[13px] font-bold uppercase tracking-[0.1em] px-7 py-3.5 bg-[#ffc400] text-[#111111] border border-[#ffc400] shadow-[3px_3px_0_rgba(255,255,255,0.28)] hover:-translate-x-px hover:-translate-y-px hover:shadow-[4px_4px_0_rgba(255,255,255,0.36)] active:translate-x-px active:translate-y-px disabled:opacity-60 disabled:cursor-not-allowed transition-all cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#111111]"
                  >
                    <span>{submitting ? 'SENDING...' : 'SEND'}</span>
                    <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  </button>

                  <span className="font-mono-tech text-[11px] text-white/50">
                    * Required fields
                  </span>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Bottom Footer Bar (No Email / Copy Email buttons) */}
        <div className="mt-10 pt-6 border-t border-white/15 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <nav
            aria-label="Footer links"
            className="flex flex-wrap items-center gap-x-6 gap-y-3"
          >
            <a
              href={githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 font-mono-tech text-[12px] font-bold uppercase tracking-[0.08em] text-white/90 hover:text-[#ffc400] transition-colors no-underline whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffc400] focus-visible:ring-offset-2 focus-visible:ring-offset-[#111111]"
            >
              <span>GitHub</span>
              <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
            </a>

            <a
              href={linkedinUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 font-mono-tech text-[12px] font-bold uppercase tracking-[0.08em] text-white/90 hover:text-[#ffc400] transition-colors no-underline whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffc400] focus-visible:ring-offset-2 focus-visible:ring-offset-[#111111]"
            >
              <span>LinkedIn</span>
              <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
            </a>

            <button
              type="button"
              onClick={onOpenResume}
              className="inline-flex items-center gap-1.5 font-mono-tech text-[12px] font-bold uppercase tracking-[0.08em] text-white/90 hover:text-[#ffc400] transition-colors cursor-pointer bg-transparent border-0 p-0 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffc400] focus-visible:ring-offset-2 focus-visible:ring-offset-[#111111]"
            >
              <FileText className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Resume PDF</span>
            </button>

            <button
              type="button"
              onClick={onOpenAdmin}
              title="Open Admin Panel"
              className="inline-flex items-center gap-1.5 font-mono-tech text-[12px] font-bold uppercase tracking-[0.08em] text-white/65 hover:text-[#ffc400] transition-colors cursor-pointer bg-transparent border-0 p-0 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffc400] focus-visible:ring-offset-2 focus-visible:ring-offset-[#111111]"
            >
              <Lock className="w-3 h-3" aria-hidden="true" />
              <span>Admin</span>
            </button>
          </nav>

          <p className="m-0 font-mono-tech text-[11px] uppercase tracking-[0.12em] text-white/50">
            © {new Date().getFullYear()} {fullName} · {location}
          </p>
        </div>
      </div>
    </footer>
  );
};
