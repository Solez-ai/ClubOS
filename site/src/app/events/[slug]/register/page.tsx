'use client';

import React, { useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { QRCodeSVG } from 'qrcode.react';
import { ArrowLeft, CheckCircle2, QrCode, Calendar, ShieldCheck, Ticket } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { MOCK_EVENTS, MOCK_PROFILES } from '@/lib/mockData';

export default function RegisterPage(props: { params: Promise<{ slug: string }> }) {
  const params = use(props.params);
  const router = useRouter();
  const event = MOCK_EVENTS.find((e) => e.slug === params.slug) || MOCK_EVENTS[0];
  const user = MOCK_PROFILES[1]; // Demo participant

  const [fullName, setFullName] = useState(user.full_name);
  const [email, setEmail] = useState(user.email);
  const [phone, setPhone] = useState(user.phone || '');
  const [institution, setInstitution] = useState(user.institution || '');
  const [studentId, setStudentId] = useState(user.student_id || '');
  const [teamName, setTeamName] = useState('');
  const [customAnswers, setCustomAnswers] = useState<Record<string, string>>({});

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [ticketCode, setTicketCode] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    setTimeout(() => {
      const generatedTicket = `TC2026-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
      setTicketCode(generatedTicket);
      setIsSubmitting(false);
      setSubmitted(true);
    }, 600);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg)] text-[var(--text)]">
      <Navbar />

      <main className="max-w-[800px] mx-auto w-full px-4 sm:px-6 py-12 flex flex-col gap-8 flex-1">
        <Link
          href={`/events/${event.slug}`}
          className="inline-flex items-center gap-2 text-xs font-mono text-[var(--muted)] hover:text-[var(--text)] transition-colors w-fit"
        >
          <ArrowLeft size={14} />
          <span>Back to {event.title}</span>
        </Link>

        {!submitted ? (
          <Card className="flex flex-col gap-8 p-6 sm:p-8">
            <div className="flex flex-col gap-2 border-b border-[var(--border)] pb-6">
              <Eyebrow>REGISTRATION FORM</Eyebrow>
              <h1 className="font-serif text-3xl text-[var(--text)] font-normal">
                {event.title}
              </h1>
              <span className="font-mono text-xs text-[var(--accent)]">
                {event.fest?.title}
              </span>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              <div className="flex flex-col gap-4">
                <span className="font-mono text-xs uppercase text-[var(--muted)]">1. PROFILE DETAILS</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input label="Full Name" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
                  <Input label="Email Address" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                  <Input label="Phone Number" value={phone} onChange={(e) => setPhone(e.target.value)} required />
                  <Input label="Institution" value={institution} onChange={(e) => setInstitution(e.target.value)} required />
                </div>
              </div>

              {event.is_team_event && (
                <div className="flex flex-col gap-4 pt-4 border-t border-[var(--border)]">
                  <span className="font-mono text-xs uppercase text-[var(--muted)]">2. TEAM DETAILS</span>
                  <Input
                    label="Team Name"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    placeholder="e.g. CodeCraft Leaders"
                    required
                  />
                </div>
              )}

              {event.custom_fields && event.custom_fields.length > 0 && (
                <div className="flex flex-col gap-4 pt-4 border-t border-[var(--border)]">
                  <span className="font-mono text-xs uppercase text-[var(--muted)]">3. EVENT CUSTOM QUESTIONS</span>
                  {event.custom_fields.map((field) => (
                    <Input
                      key={field.key}
                      label={field.label}
                      placeholder={field.type === 'select' ? field.options?.join(', ') : ''}
                      onChange={(e) => setCustomAnswers({ ...customAnswers, [field.key]: e.target.value })}
                      required={field.required}
                    />
                  ))}
                </div>
              )}

              <div className="pt-4 border-t border-[var(--border)]">
                <Button type="submit" isLoading={isSubmitting} className="w-full">
                  Confirm Registration & Get Ticket
                </Button>
              </div>
            </form>
          </Card>
        ) : (
          /* SUCCESS CONFIRMATION MOMENT */
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col items-center gap-8 py-8"
          >
            {/* Animated Brass Check */}
            <div className="flex flex-col items-center gap-3 text-center">
              <svg className="w-16 h-16 text-[var(--accent)]" viewBox="0 0 52 52">
                <circle cx="26" cy="26" r="24" fill="none" stroke="currentColor" strokeWidth="2" />
                <motion.path
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  d="M14 27l7 7 16-16"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.6, ease: 'easeInOut' }}
                />
              </svg>
              <h1 className="font-serif text-3xl text-[var(--text)]">You're on the list.</h1>
              <p className="text-sm text-[var(--muted)]">
                Your ticket has been verified and registered in your digital passport.
              </p>
            </div>

            {/* Ticket Card with QR */}
            <Card className="w-full max-w-md bg-[#0D0C0A] border border-[var(--accent)]/40 p-6 flex flex-col gap-6 shadow-2xl relative overflow-hidden">
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
                <div className="flex flex-col">
                  <span className="font-serif text-lg text-[var(--text)] font-normal">{event.title}</span>
                  <span className="font-mono text-xs text-[var(--accent)]">TICKET CODE: {ticketCode}</span>
                </div>
                <Ticket size={24} className="text-[var(--accent)]" />
              </div>

              <div className="flex items-center justify-center p-4 bg-white rounded-md w-fit mx-auto">
                <QRCodeSVG value={ticketCode} size={140} level="M" />
              </div>

              <div className="flex flex-col gap-2 font-mono text-xs text-[var(--muted)] border-t border-[var(--border)] pt-4">
                <div className="flex justify-between">
                  <span>NAME:</span>
                  <span className="text-[var(--text)]">{fullName}</span>
                </div>
                <div className="flex justify-between">
                  <span>EVENT VENUE:</span>
                  <span className="text-[var(--text)]">{event.venue}</span>
                </div>
                <div className="flex justify-between">
                  <span>STATUS:</span>
                  <span className="text-[var(--success)] font-medium">CONFIRMED</span>
                </div>
              </div>
            </Card>

            <div className="flex gap-4">
              <Link href="/passport">
                <Button>View in Passport</Button>
              </Link>
              <Link href="/events">
                <Button variant="secondary">Browse More Events</Button>
              </Link>
            </div>
          </motion.div>
        )}
      </main>

      <Footer />
    </div>
  );
}
