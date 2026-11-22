import React, { useState } from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  ChevronDown,
  FileText,
  Lock,
  RotateCcw,
} from 'lucide-react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import {
  CONTACT_DIRECT_EMAIL,
  CONTACT_REASON_OPTIONS,
  DEFAULT_CONTACT_REASON,
  validateContactInquiry,
  type ContactInquiryFieldErrors,
  type ContactReasonOption,
  type SanitizedContactInquiry,
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
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [reason, setReason] = useState<ContactReasonOption>(DEFAULT_CONTACT_REASON);
  const [message, setMessage] = useState('');

  const [fieldErrors, setFieldErrors] = useState<ContactInquiryFieldErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submittedRecord, setSubmittedRecord] = useState<SanitizedContactInquiry | null>(null);

  const handleResetForm = () => {
    setName('');
    setEmail('');
    setPhone('');
    setReason(DEFAULT_CONTACT_REASON);
    setMessage('');
    setFieldErrors({});
    setSubmitError(null);
    setSubmittedRecord(null);
  };

  const handleSubmit = async (ev: React.FormEvent<HTMLFormElement>) => {
    ev.preventDefault();
    if (submitting) return;

    setSubmitError(null);
    const result = validateContactInquiry({
      name,
      email,
      phone,
      reason,
      message,
      source: 'technical',
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
      console.error('Failed to submit contact inquiry:', error);
      setSubmitError(
        'Could not send your details right now. Please check your connection and try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <footer
      id="tech-contact"
      aria-labelledby="tech-contact-heading"
      className="mt-8 bg-[#111111] text-white border-2 border-[#111111] shadow-[5px_6px_0_#ffc400]"
    >
      <div className="p-6 sm:p-10 lg:p-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Left Column — Editorial Heading & Direct Email Line */}
          <div className="lg:col-span-5">
            <h2
              id="tech-contact-heading"
              className="m-0 text-[36px] sm:text-[46px] lg:text-[52px] font-extrabold tracking-[-0.048em] leading-[0.98] text-white text-balance"
            >
              Lets Talk &amp;{' '}
              <span className="inline-block bg-[#ffc400] text-[#111111] px-2.5 py-0.5 mt-1 leading-[0.98]">
                Work Together
              </span>
            </h2>

            <p className="mt-6 mb-0 text-[15px] sm:text-[16px] leading-[1.6] text-white/75">
              Or just write:{' '}
              <a
                href={`mailto:${CONTACT_DIRECT_EMAIL}`}
                className="font-mono-tech text-[14px] sm:text-[15px] text-white underline decoration-[#ffc400] decoration-2 underline-offset-4 hover:text-[#ffc400] transition-colors break-all"
              >
                {CONTACT_DIRECT_EMAIL}
              </a>
            </p>
          </div>

          {/* Right Column — Contact Form */}
          <div className="lg:col-span-7">
            {submittedRecord ? (
              <div
                role="status"
                data-testid="tech-contact-success"
                className="border border-white/25 bg-white/[0.04] p-6 sm:p-8 space-y-5"
              >
                <div className="flex items-start gap-3.5">
                  <CheckCircle2
                    className="w-6 h-6 text-[#ffc400] shrink-0 mt-0.5"
                    aria-hidden="true"
                  />
                  <div>
                    <h3 className="m-0 text-[22px] font-bold tracking-[-0.03em] text-white">
                      Details received — thank you, {submittedRecord.name}.
                    </h3>
                    <p className="mt-1.5 mb-0 text-[14.5px] leading-[1.55] text-white/75">
                      Your <span className="text-white font-semibold">{submittedRecord.reason}</span>{' '}
                      note is in my inbox. I&apos;ll reply to{' '}
                      <span className="font-mono-tech text-white">{submittedRecord.email}</span>{' '}
                      usually the same day.
                    </p>
                  </div>
                </div>

                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-white/15 m-0">
                  <div>
                    <dt className="font-mono-tech text-[10.5px] uppercase tracking-[0.12em] text-white/55">
                      Reason
                    </dt>
                    <dd className="m-0 mt-1 text-[13.5px] text-white/90">
                      {submittedRecord.reason}
                    </dd>
                  </div>
                  {submittedRecord.phone && (
                    <div>
                      <dt className="font-mono-tech text-[10.5px] uppercase tracking-[0.12em] text-white/55">
                        Phone
                      </dt>
                      <dd className="m-0 mt-1 font-mono-tech text-[13.5px] text-white/90">
                        {submittedRecord.phone}
                      </dd>
                    </div>
                  )}
                </dl>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleResetForm}
                    className="inline-flex items-center gap-2 font-mono-tech text-[12px] font-bold uppercase tracking-[0.08em] px-4 py-2.5 border border-white/30 bg-transparent text-white hover:border-[#ffc400] hover:text-[#ffc400] transition-colors cursor-pointer whitespace-nowrap shrink-0"
                  >
                    <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Send another message</span>
                  </button>
                </div>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                noValidate
                data-testid="tech-contact-form"
                className="flex flex-col gap-5"
              >
                {/* Row 1: NAME + EMAIL */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label
                      htmlFor="tech-contact-name"
                      className="block font-mono-tech text-[11px] font-bold uppercase tracking-[0.13em] text-white/85 mb-2"
                    >
                      NAME <span className="text-[#ffc400]">*</span>
                    </label>
                    <input
                      id="tech-contact-name"
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
                      placeholder="Your full name"
                      aria-invalid={Boolean(fieldErrors.name)}
                      aria-describedby={fieldErrors.name ? 'tech-contact-name-error' : undefined}
                      className={`w-full px-3.5 py-3 bg-[#1a1c20] text-[15px] text-white placeholder:text-white/40 border transition-colors focus:outline-none ${
                        fieldErrors.name
                          ? 'border-[#f87171] focus:border-[#f87171]'
                          : 'border-white/22 focus:border-[#ffc400]'
                      }`}
                    />
                    {fieldErrors.name && (
                      <p
                        id="tech-contact-name-error"
                        role="alert"
                        className="mt-1.5 mb-0 font-mono-tech text-[11px] text-[#fca5a5]"
                      >
                        {fieldErrors.name}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="tech-contact-email"
                      className="block font-mono-tech text-[11px] font-bold uppercase tracking-[0.13em] text-white/85 mb-2"
                    >
                      EMAIL <span className="text-[#ffc400]">*</span>
                    </label>
                    <input
                      id="tech-contact-email"
                      name="email"
                      type="email"
                      required
                      autoComplete="email"
                      maxLength={120}
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (fieldErrors.email) {
                          setFieldErrors((prev) => ({ ...prev, email: undefined }));
                        }
                      }}
                      placeholder="name@company.com"
                      aria-invalid={Boolean(fieldErrors.email)}
                      aria-describedby={fieldErrors.email ? 'tech-contact-email-error' : undefined}
                      className={`w-full px-3.5 py-3 bg-[#1a1c20] text-[15px] text-white placeholder:text-white/40 border transition-colors focus:outline-none ${
                        fieldErrors.email
                          ? 'border-[#f87171] focus:border-[#f87171]'
                          : 'border-white/22 focus:border-[#ffc400]'
                      }`}
                    />
                    {fieldErrors.email && (
                      <p
                        id="tech-contact-email-error"
                        role="alert"
                        className="mt-1.5 mb-0 font-mono-tech text-[11px] text-[#fca5a5]"
                      >
                        {fieldErrors.email}
                      </p>
                    )}
                  </div>
                </div>

                {/* Row 2: PHONE + REASON */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label
                      htmlFor="tech-contact-phone"
                      className="block font-mono-tech text-[11px] font-bold uppercase tracking-[0.13em] text-white/85 mb-2"
                    >
                      PHONE
                    </label>
                    <input
                      id="tech-contact-phone"
                      name="phone"
                      type="tel"
                      autoComplete="tel"
                      maxLength={24}
                      value={phone}
                      onChange={(e) => {
                        setPhone(e.target.value);
                        if (fieldErrors.phone) {
                          setFieldErrors((prev) => ({ ...prev, phone: undefined }));
                        }
                      }}
                      placeholder="+91"
                      aria-invalid={Boolean(fieldErrors.phone)}
                      aria-describedby={fieldErrors.phone ? 'tech-contact-phone-error' : undefined}
                      className={`w-full px-3.5 py-3 bg-[#1a1c20] text-[15px] text-white placeholder:text-white/40 border transition-colors focus:outline-none ${
                        fieldErrors.phone
                          ? 'border-[#f87171] focus:border-[#f87171]'
                          : 'border-white/22 focus:border-[#ffc400]'
                      }`}
                    />
                    {fieldErrors.phone && (
                      <p
                        id="tech-contact-phone-error"
                        role="alert"
                        className="mt-1.5 mb-0 font-mono-tech text-[11px] text-[#fca5a5]"
                      >
                        {fieldErrors.phone}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="tech-contact-reason"
                      className="block font-mono-tech text-[11px] font-bold uppercase tracking-[0.13em] text-white/85 mb-2"
                    >
                      REASON
                    </label>
                    <div className="relative">
                      <select
                        id="tech-contact-reason"
                        name="reason"
                        value={reason}
                        onChange={(e) => {
                          setReason(e.target.value as ContactReasonOption);
                          if (fieldErrors.reason) {
                            setFieldErrors((prev) => ({ ...prev, reason: undefined }));
                          }
                        }}
                        aria-invalid={Boolean(fieldErrors.reason)}
                        aria-describedby={fieldErrors.reason ? 'tech-contact-reason-error' : undefined}
                        className={`w-full appearance-none px-3.5 py-3 pr-10 bg-[#1a1c20] text-[15px] text-white border transition-colors focus:outline-none cursor-pointer ${
                          fieldErrors.reason
                            ? 'border-[#f87171] focus:border-[#f87171]'
                            : 'border-white/22 focus:border-[#ffc400]'
                        }`}
                      >
                        {CONTACT_REASON_OPTIONS.map((option) => (
                          <option
                            key={option}
                            value={option}
                            className="bg-[#1a1c20] text-white"
                          >
                            {option}
                          </option>
                        ))}
                      </select>
                      <ChevronDown
                        className="w-4 h-4 text-white/65 pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2"
                        aria-hidden="true"
                      />
                    </div>
                    {fieldErrors.reason && (
                      <p
                        id="tech-contact-reason-error"
                        role="alert"
                        className="mt-1.5 mb-0 font-mono-tech text-[11px] text-[#fca5a5]"
                      >
                        {fieldErrors.reason}
                      </p>
                    )}
                  </div>
                </div>

                {/* Row 3: MESSAGE */}
                <div>
                  <label
                    htmlFor="tech-contact-message"
                    className="block font-mono-tech text-[11px] font-bold uppercase tracking-[0.13em] text-white/85 mb-2"
                  >
                    MESSAGE <span className="text-[#ffc400]">*</span>
                  </label>
                  <textarea
                    id="tech-contact-message"
                    name="message"
                    required
                    rows={4}
                    maxLength={2000}
                    value={message}
                    onChange={(e) => {
                      setMessage(e.target.value);
                      if (fieldErrors.message) {
                        setFieldErrors((prev) => ({ ...prev, message: undefined }));
                      }
                    }}
                    placeholder="A few words"
                    aria-invalid={Boolean(fieldErrors.message)}
                    aria-describedby={fieldErrors.message ? 'tech-contact-message-error' : undefined}
                    className={`w-full px-3.5 py-3 bg-[#1a1c20] text-[15px] leading-[1.55] text-white placeholder:text-white/40 border transition-colors resize-y min-h-[112px] focus:outline-none ${
                      fieldErrors.message
                        ? 'border-[#f87171] focus:border-[#f87171]'
                        : 'border-white/22 focus:border-[#ffc400]'
                    }`}
                  />
                  {fieldErrors.message && (
                    <p
                      id="tech-contact-message-error"
                      role="alert"
                      className="mt-1.5 mb-0 font-mono-tech text-[11px] text-[#fca5a5]"
                    >
                      {fieldErrors.message}
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

                {/* Submit Action + Helper & Privacy Notes */}
                <div className="pt-1 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="inline-flex items-center justify-center gap-2.5 font-mono-tech text-[13px] font-bold uppercase tracking-[0.09em] px-7 py-3.5 bg-[#ffc400] text-[#111111] border border-[#ffc400] shadow-[3px_3px_0_rgba(255,255,255,0.28)] hover:-translate-x-px hover:-translate-y-px hover:shadow-[4px_4px_0_rgba(255,255,255,0.36)] active:translate-x-px active:translate-y-px disabled:opacity-60 disabled:cursor-not-allowed transition-all cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#111111]"
                    >
                      <span>{submitting ? 'Sending...' : 'Send Details'}</span>
                      <ArrowRight className="w-4 h-4" aria-hidden="true" />
                    </button>

                    <p className="m-0 text-[13.5px] leading-[1.5] text-white/75">
                      No spam. A real reply, usually the same day.
                    </p>
                  </div>

                  <p className="m-0 font-mono-tech text-[11.5px] text-white/50">
                    Sent details land in my inbox and nowhere else
                  </p>
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
