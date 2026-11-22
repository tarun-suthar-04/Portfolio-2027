import React, { useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
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

interface CreativeContactSectionProps {
  location: string;
  creativeYears: string;
  onOpenAdmin: () => void;
}

export const CreativeContactSection: React.FC<CreativeContactSectionProps> = ({
  location,
  creativeYears,
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
      source: 'creative',
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
      console.error('Failed to submit creative contact inquiry:', error);
      setSubmitError(
        'Could not send your details right now. Please check your connection and try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      aria-labelledby="creative-contact-heading"
      className="rounded-[28px] bg-white border border-[#141518]/12 shadow-[0_24px_60px_rgba(20,21,24,0.06)] p-6 sm:p-10 lg:p-12"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* Left Column — Creative Editorial Heading & Direct Contact Line */}
        <div className="lg:col-span-5 flex flex-col justify-between lg:min-h-full gap-8">
          <div>
            <h2
              id="creative-contact-heading"
              className="m-0 text-[clamp(36px,4.5vw,56px)] leading-[0.98] tracking-[-0.048em] font-semibold text-[#141518] text-balance"
            >
              Lets Talk &amp;{' '}
              <span className="font-serif-editorial italic font-normal text-[#2563eb] block sm:inline">
                Work Together
              </span>
            </h2>

            <p className="mt-5 mb-0 text-[15px] sm:text-[16px] leading-[1.6] text-[#4b5563]">
              Or just write:{' '}
              <a
                href={`mailto:${CONTACT_DIRECT_EMAIL}`}
                className="font-medium text-[#141518] underline decoration-[#2563eb]/50 decoration-2 underline-offset-4 hover:text-[#2563eb] hover:decoration-[#2563eb] transition-colors break-all"
              >
                {CONTACT_DIRECT_EMAIL}
              </a>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-[#141518]/8 text-sm text-[#6b7280]">
            <span>
              {location} · {creativeYears}
            </span>
            <button
              type="button"
              onClick={onOpenAdmin}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#f8f9fb] border border-[#141518]/14 text-xs font-medium text-[#4b5563] hover:text-[#141518] hover:border-[#141518]/35 cursor-pointer transition-colors"
            >
              <Lock className="w-3 h-3" aria-hidden="true" />
              <span>Admin</span>
            </button>
          </div>
        </div>

        {/* Right Column — Creative-Styled Contact Form */}
        <div className="lg:col-span-7">
          {submittedRecord ? (
            <div
              role="status"
              data-testid="creative-contact-success"
              className="rounded-2xl bg-[#f8f9fb] border border-[#141518]/12 p-6 sm:p-8 space-y-5"
            >
              <div className="flex items-start gap-3.5">
                <CheckCircle2
                  className="w-6 h-6 text-[#2563eb] shrink-0 mt-0.5"
                  aria-hidden="true"
                />
                <div>
                  <h3 className="m-0 text-[21px] font-semibold tracking-[-0.025em] text-[#141518]">
                    Details received — thank you, {submittedRecord.name}.
                  </h3>
                  <p className="mt-1.5 mb-0 text-[14.5px] leading-[1.6] text-[#4b5563]">
                    Your <span className="font-semibold text-[#141518]">{submittedRecord.reason}</span>{' '}
                    note landed safely in my inbox. I&apos;ll reply to{' '}
                    <span className="font-medium text-[#141518]">{submittedRecord.email}</span>{' '}
                    usually the same day.
                  </p>
                </div>
              </div>

              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-[#141518]/10 m-0">
                <div>
                  <dt className="text-[11px] font-semibold uppercase tracking-[0.09em] text-[#6b7280]">
                    Reason
                  </dt>
                  <dd className="m-0 mt-1 text-[14px] font-medium text-[#141518]">
                    {submittedRecord.reason}
                  </dd>
                </div>
                {submittedRecord.phone && (
                  <div>
                    <dt className="text-[11px] font-semibold uppercase tracking-[0.09em] text-[#6b7280]">
                      Phone
                    </dt>
                    <dd className="m-0 mt-1 text-[14px] font-medium text-[#141518]">
                      {submittedRecord.phone}
                    </dd>
                  </div>
                )}
              </dl>

              <div className="pt-1">
                <button
                  type="button"
                  onClick={handleResetForm}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white border border-[#141518]/18 text-xs font-semibold text-[#141518] hover:border-[#2563eb] hover:text-[#2563eb] transition-colors cursor-pointer whitespace-nowrap shrink-0"
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
              data-testid="creative-contact-form"
              className="flex flex-col gap-5"
            >
              {/* Row 1: NAME + EMAIL */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                <div>
                  <label
                    htmlFor="creative-contact-name"
                    className="block text-[11.5px] font-semibold uppercase tracking-[0.1em] text-[#374151] mb-2"
                  >
                    NAME <span className="text-[#2563eb]">*</span>
                  </label>
                  <input
                    id="creative-contact-name"
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
                    aria-describedby={fieldErrors.name ? 'creative-contact-name-error' : undefined}
                    className={`w-full px-4 py-3 rounded-xl bg-[#f8f9fb] text-[15px] text-[#141518] placeholder:text-[#9ca3af] border transition-all focus:outline-none focus:bg-white ${
                      fieldErrors.name
                        ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/15'
                        : 'border-[#141518]/14 focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/15'
                    }`}
                  />
                  {fieldErrors.name && (
                    <p
                      id="creative-contact-name-error"
                      role="alert"
                      className="mt-1.5 mb-0 text-[12px] text-red-600"
                    >
                      {fieldErrors.name}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="creative-contact-email"
                    className="block text-[11.5px] font-semibold uppercase tracking-[0.1em] text-[#374151] mb-2"
                  >
                    EMAIL <span className="text-[#2563eb]">*</span>
                  </label>
                  <input
                    id="creative-contact-email"
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
                    aria-describedby={fieldErrors.email ? 'creative-contact-email-error' : undefined}
                    className={`w-full px-4 py-3 rounded-xl bg-[#f8f9fb] text-[15px] text-[#141518] placeholder:text-[#9ca3af] border transition-all focus:outline-none focus:bg-white ${
                      fieldErrors.email
                        ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/15'
                        : 'border-[#141518]/14 focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/15'
                    }`}
                  />
                  {fieldErrors.email && (
                    <p
                      id="creative-contact-email-error"
                      role="alert"
                      className="mt-1.5 mb-0 text-[12px] text-red-600"
                    >
                      {fieldErrors.email}
                    </p>
                  )}
                </div>
              </div>

              {/* Row 2: PHONE + REASON */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                <div>
                  <label
                    htmlFor="creative-contact-phone"
                    className="block text-[11.5px] font-semibold uppercase tracking-[0.1em] text-[#374151] mb-2"
                  >
                    PHONE
                  </label>
                  <input
                    id="creative-contact-phone"
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
                    aria-describedby={fieldErrors.phone ? 'creative-contact-phone-error' : undefined}
                    className={`w-full px-4 py-3 rounded-xl bg-[#f8f9fb] text-[15px] text-[#141518] placeholder:text-[#9ca3af] border transition-all focus:outline-none focus:bg-white ${
                      fieldErrors.phone
                        ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/15'
                        : 'border-[#141518]/14 focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/15'
                    }`}
                  />
                  {fieldErrors.phone && (
                    <p
                      id="creative-contact-phone-error"
                      role="alert"
                      className="mt-1.5 mb-0 text-[12px] text-red-600"
                    >
                      {fieldErrors.phone}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="creative-contact-reason"
                    className="block text-[11.5px] font-semibold uppercase tracking-[0.1em] text-[#374151] mb-2"
                  >
                    REASON
                  </label>
                  <div className="relative">
                    <select
                      id="creative-contact-reason"
                      name="reason"
                      value={reason}
                      onChange={(e) => {
                        setReason(e.target.value as ContactReasonOption);
                        if (fieldErrors.reason) {
                          setFieldErrors((prev) => ({ ...prev, reason: undefined }));
                        }
                      }}
                      aria-invalid={Boolean(fieldErrors.reason)}
                      aria-describedby={
                        fieldErrors.reason ? 'creative-contact-reason-error' : undefined
                      }
                      className={`w-full appearance-none px-4 py-3 pr-10 rounded-xl bg-[#f8f9fb] text-[15px] text-[#141518] border transition-all focus:outline-none focus:bg-white cursor-pointer ${
                        fieldErrors.reason
                          ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/15'
                          : 'border-[#141518]/14 focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/15'
                      }`}
                    >
                      {CONTACT_REASON_OPTIONS.map((option) => (
                        <option key={option} value={option} className="bg-white text-[#141518]">
                          {option}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      className="w-4 h-4 text-[#6b7280] pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2"
                      aria-hidden="true"
                    />
                  </div>
                  {fieldErrors.reason && (
                    <p
                      id="creative-contact-reason-error"
                      role="alert"
                      className="mt-1.5 mb-0 text-[12px] text-red-600"
                    >
                      {fieldErrors.reason}
                    </p>
                  )}
                </div>
              </div>

              {/* Row 3: MESSAGE */}
              <div>
                <label
                  htmlFor="creative-contact-message"
                  className="block text-[11.5px] font-semibold uppercase tracking-[0.1em] text-[#374151] mb-2"
                >
                  MESSAGE <span className="text-[#2563eb]">*</span>
                </label>
                <textarea
                  id="creative-contact-message"
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
                  aria-describedby={
                    fieldErrors.message ? 'creative-contact-message-error' : undefined
                  }
                  className={`w-full px-4 py-3 rounded-xl bg-[#f8f9fb] text-[15px] leading-[1.55] text-[#141518] placeholder:text-[#9ca3af] border transition-all resize-y min-h-[112px] focus:outline-none focus:bg-white ${
                    fieldErrors.message
                      ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/15'
                      : 'border-[#141518]/14 focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/15'
                  }`}
                />
                {fieldErrors.message && (
                  <p
                    id="creative-contact-message-error"
                    role="alert"
                    className="mt-1.5 mb-0 text-[12px] text-red-600"
                  >
                    {fieldErrors.message}
                  </p>
                )}
              </div>

              {submitError && (
                <p
                  role="alert"
                  className="m-0 px-4 py-3 rounded-xl border border-red-200 bg-red-50 text-[13px] text-red-700"
                >
                  {submitError}
                </p>
              )}

              {/* Submit Action + Helper & Privacy Notes */}
              <div className="pt-1 space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-full bg-[#141518] text-white text-[14px] font-medium hover:bg-[#2563eb] active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed transition-all cursor-pointer whitespace-nowrap shrink-0 shadow-[0_10px_24px_rgba(20,21,24,0.16)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563eb] focus-visible:ring-offset-2"
                  >
                    <span>{submitting ? 'Sending...' : 'Send Details'}</span>
                    <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  </button>

                  <p className="m-0 text-[13.5px] leading-[1.5] text-[#4b5563]">
                    No spam. A real reply, usually the same day.
                  </p>
                </div>

                <p className="m-0 text-[12px] text-[#6b7280]">
                  Sent details land in my inbox and nowhere else
                </p>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
