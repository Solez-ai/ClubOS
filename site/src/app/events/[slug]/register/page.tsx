'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import {
  ArrowLeft, Check, Upload, FileText, Camera, AlertCircle, Lock,
  Loader2, Smartphone, CreditCard
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

// BKash pink color: #F74C3C or #E91E63
// Nagad orange/yellow: #F59E0B or #FF9800

const PAYMENT_INFO: Record<string, { number: string; type: string; label: string; instructions: string }> = {
  'bkash_send_money': {
    number: '01700000000',
    type: 'send_money',
    label: 'BKash - Send Money',
    instructions: 'Send money to the number above using BKash app or USSD *247#'
  },
  'bkash_pay_bill': {
    number: 'BKash Bill',
    type: 'pay_bill',
    label: 'BKash - Pay Bill',
    instructions: 'Pay the bill number provided after registration using BKash app'
  },
  'nagad_send_money': {
    number: '01800000000',
    type: 'send_money',
    label: 'Nagad - Send Money',
    instructions: 'Send money to the number above using Nagad app or USSD *167#'
  },
  'nagad_pay_bill': {
    number: 'Nagad Bill',
    type: 'pay_bill',
    label: 'Nagad - Pay Bill',
    instructions: 'Pay the bill number provided after registration using Nagad app'
  },
};

export default function EventRegistrationPaymentPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [event, setEvent] = useState<{ id: string; title: string; segments?: { id: string; title: string; is_free: boolean; price: number; payment_method?: string | null }[] | null } | null>(null);
  const [registration, setRegistration] = useState<{ id: string; ticket_code: string; registration_segments?: { id: string; segment_id: string; price_paid: string | number; segment?: { title: string; is_free: boolean } | null }[] | null } | null>(null);
  const [segments, setSegments] = useState<{ id: string; segment_id: string; price_paid: string | number; segment?: { title: string; is_free: boolean } | null }[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [userProfile, setUserProfile] = useState<{ id: string; full_name: string; email: string; phone?: string | null } | null>(null);
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactMobile, setContactMobile] = useState('');
  const [selectedSegmentIds, setSelectedSegmentIds] = useState<string[]>([]);
  const [transactionId, setTransactionId] = useState('');
  const [transactionMobile, setTransactionMobile] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('');
  const [screenshotUrl, setScreenshotUrl] = useState('');

  const supabase = useMemo(() => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.warn('Supabase credentials not configured');
      return null;
    }
    return createClient();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (!supabase) return;

      // Check auth
      const { data: authData } = await supabase.auth.getUser();
      if (!authData?.user) {
        router.push('/login');
        return;
      }

      setUser(authData.user);

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single();
      setUserProfile(profile);
      if (profile) {
        setContactName(profile.full_name || '');
        setContactEmail(profile.email || '');
        setContactMobile(profile.phone || '');
      }

      // Fetch event
      const { data: eventData } = await supabase
        .from('events')
        .select('*, segments(*)')
        // Resolve by slug OR id so dashboard links (ids) work too.
        .or(`slug.eq.${slug},id.eq.${slug}`)
        .single();

      if (!eventData) {
        setError('Event not found');
        setLoading(false);
        return;
      }

      setEvent(eventData);
      // Default to selecting every segment; the participant can deselect below
      setSelectedSegmentIds((eventData.segments ?? []).map((s: { id: string }) => s.id));

      // Fetch registration
      const { data: regData } = await supabase
        .from('registrations')
        .select('*, registration_segments(segments(*))')
        .eq('event_id', eventData.id)
        .eq('user_id', authData.user.id)
        .eq('status', 'pending')
        .single();

      if (!regData) {
        setError('No pending registration found. Please register first.');
        setLoading(false);
        return;
      }

      setRegistration(regData);
      setSegments(regData.registration_segments || []);

      // Determine payment method from segments
      const paidSegments = (eventData.segments ?? []).filter((s: { is_free: boolean; payment_method?: string | null }) => !s.is_free);
      if (paidSegments && paidSegments.length > 0) {
        setSelectedPaymentMethod(paidSegments[0].payment_method);
      }

      setLoading(false);
    };

    fetchData();
  }, [supabase, slug, router]);

  const handleScreeshotUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !supabase || !registration) return;

    const fileExt = file.name.split('.').pop();
    const fileName = `payment_${registration.id}_${Date.now()}.${fileExt}`;

    const { data: uploadData, error: uploadErr } = await supabase.storage
      .from('payments')
      .upload(fileName, file);

    if (uploadErr) {
      setError(uploadErr.message);
      return;
    }

    const { data: urlData } = supabase.storage
      .from('payments')
      .getPublicUrl(fileName);

    setScreenshotUrl(urlData.publicUrl);

    // Update registration with screenshot
    await supabase
      .from('registrations')
      .update({ payment_screenshot_url: urlData.publicUrl })
      .eq('id', registration.id);
  };

  const toggleSegment = (segId: string) => {
    setSelectedSegmentIds((prev) =>
      prev.includes(segId) ? prev.filter((id) => id !== segId) : [...prev, segId]
    );
  };

  const handleSubmitPayment = async () => {
    if (!supabase || !registration) return;

    if (!contactName.trim() || !contactEmail.includes('@') || !contactMobile.trim()) {
      setError('Please fill in your full name, a valid email, and your mobile number.');
      return;
    }

    if (selectedSegmentIds.length === 0) {
      setError('Please select at least one segment.');
      return;
    }

    if (totalPrice > 0) {
      if (!selectedPaymentMethod) {
        setError('Please choose a payment method');
        return;
      }
      if (!transactionId.trim()) {
        setError('Please enter your transaction ID');
        return;
      }

      if (!transactionMobile.trim()) {
        setError('Please enter the mobile number you paid from');
        return;
      }

      if (!screenshotUrl) {
        setError('Please upload a payment screenshot');
        return;
      }
    }

    setSubmitting(true);
    setError('');

    try {
      // Save the participant-provided details to their profile
      if (user) {
        await supabase
          .from('profiles')
          .update({ full_name: contactName.trim(), phone: contactMobile.trim() })
          .eq('id', user.id);
      }

      // Sync the segment selection onto the registration
      const toRemove = segments
        .filter((r) => !selectedSegmentIds.includes(r.segment_id))
        .map((r) => r.segment_id);
      if (toRemove.length > 0) {
        await supabase
          .from('registration_segments')
          .delete()
          .eq('registration_id', registration.id)
          .in('segment_id', toRemove);
      }
      const toAdd = selectedSegmentIds.filter((id) => !segments.some((r) => r.segment_id === id));
      for (const segId of toAdd) {
        const seg = (event?.segments ?? []).find((s) => s.id === segId);
        const paid = Boolean(seg && !seg.is_free);
        await supabase.from('registration_segments').insert({
          registration_id: registration.id,
          segment_id: segId,
          price_paid: paid ? Number(seg?.price) || 0 : 0,
          status: paid ? 'paid' : 'selected',
        });
      }

      const { error: updateErr } = await supabase
        .from('registrations')
        .update({
          payment_method: selectedPaymentMethod || null,
          transaction_id: transactionId || null,
          transaction_mobile: transactionMobile || null,
          payment_status: totalPrice > 0 ? 'paid' : 'pending',
          payment_screenshot_url: screenshotUrl || null,
          total_price: totalPrice,
        })
        .eq('id', registration.id);

      if (updateErr) {
        setError(updateErr.message);
        setSubmitting(false);
        return;
      }

      // Mark the selected paid segments as paid
      for (const seg of selectedSegments) {
        if (!seg.is_free) {
          await supabase
            .from('registration_segments')
            .update({ status: 'paid' })
            .eq('registration_id', registration.id)
            .eq('segment_id', seg.id);
        }
      }

      setSuccess('Payment submitted successfully! Organizers will verify your payment and confirm your registration.');
      setSubmitting(false);

      setTimeout(() => {
        router.push(`/events/${slug}`);
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit payment');
      setSubmitting(false);
    }
  };

  const selectedSegments = (event?.segments ?? []).filter((s) => selectedSegmentIds.includes(s.id));

  const totalPrice = selectedSegments.reduce(
    (sum: number, s) => sum + (s.is_free ? 0 : Number(s.price) || 0),
    0
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] text-[var(--text)]">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-[var(--muted)]">Loading...</p>
        </div>
      </div>
    );
  }

  if (!event || !registration || error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] text-[var(--text)]">
        <div className="text-center max-w-md px-4">
          {error && (
            <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-500">
              {error}
            </div>
          )}
          <h1 className="font-serif text-2xl mb-4">Payment Required</h1>
          <p className="text-[var(--muted)] mb-6">
            {totalPrice > 0
              ? `Complete your payment of BDT ${totalPrice.toLocaleString()} to confirm your registration.`
              : 'Complete your registration by filling out the details below.'}
          </p>
          <button
            onClick={() => router.push(`/events/${slug}`)}
            className="text-[var(--accent)] hover:underline"
          >
            Back to Event
          </button>
        </div>
      </div>
    );
  }

  const paymentInfo = PAYMENT_INFO[selectedPaymentMethod] || PAYMENT_INFO['bkash_send_money'];
  const isBkash = selectedPaymentMethod?.startsWith('bkash');
  const isNagad = selectedPaymentMethod?.startsWith('nagad');
  const isSendMoney = selectedPaymentMethod?.includes('send_money');

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg)] text-[var(--text)]">
      <Navbar />

      <main className="max-w-4xl mx-auto w-full px-4 py-12 flex flex-col gap-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push(`/events/${slug}`)}
            className="p-2 rounded-lg hover:bg-[var(--surface)] transition-colors"
          >
            <ArrowLeft size={20} className="text-[var(--muted)]" />
          </button>
          <div>
            <h1 className="font-serif text-2xl">Complete Your Registration</h1>
            <p className="text-sm text-[var(--muted)]">{event.title}</p>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-500 text-sm flex items-center gap-2">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {success && (
          <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg text-green-500 text-sm flex items-center gap-2">
            <Check size={16} />
            {success}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Details + Payment Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Your Details */}
            <Card className="p-6">
              <h2 className="font-medium mb-4">Your Details</h2>
              <div className="grid gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Full Name *</label>
                  <input
                    type="text"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="Your full name"
                    className="w-full px-4 py-3 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--accent)] transition-colors"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Email Address *</label>
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full px-4 py-3 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--accent)] transition-colors"
                    required
                  />
                  <p className="text-xs text-[var(--muted)] mt-1">
                    Confirmation and verification emails go to this address (your account email).
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Mobile Number *</label>
                  <input
                    type="tel"
                    value={contactMobile}
                    onChange={(e) => setContactMobile(e.target.value)}
                    placeholder="+880 1XXX-XXXXXX"
                    className="w-full px-4 py-3 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--accent)] transition-colors"
                    required
                  />
                </div>
              </div>
            </Card>

            {/* Segment Picker */}
            <Card className="p-6">
              <h2 className="font-medium mb-1">Choose Your Segments</h2>
              <p className="text-xs text-[var(--muted)] mb-4">
                Pick which segments you want to join — the total updates automatically.
              </p>
              <div className="flex flex-col gap-2">
                {(event?.segments ?? []).map((seg) => {
                  const checked = selectedSegmentIds.includes(seg.id);
                  return (
                    <label
                      key={seg.id}
                      className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                        checked
                          ? 'border-[var(--accent)] bg-[var(--accent)]/10'
                          : 'border-[var(--border)] bg-[var(--surface)] hover:border-[var(--border-strong)]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleSegment(seg.id)}
                          className="w-4 h-4 rounded border-[var(--border)] accent-[var(--accent)]"
                        />
                        <div>
                          <p className="font-medium text-sm">{seg.title}</p>
                          {seg.is_free && <span className="text-xs text-green-500">Free</span>}
                        </div>
                      </div>
                      {!seg.is_free && (
                        <span className="font-mono font-medium text-sm">
                          BDT {(Number(seg.price) || 0).toLocaleString()}
                        </span>
                      )}
                    </label>
                  );
                })}
                {selectedSegments.length === 0 && (
                  <p className="text-xs text-red-500">Select at least one segment to continue.</p>
                )}
                <div className="flex items-center justify-between p-3 bg-[var(--accent)]/10 rounded-lg border border-[var(--accent)]/30">
                  <span className="font-medium">Total</span>
                  <span className="text-xl font-bold text-[var(--accent)]">
                    BDT {totalPrice.toLocaleString()}
                  </span>
                </div>
              </div>
            </Card>

            {/* Payment Method Selection */}
            <Card className="p-6">
              <h2 className="font-medium mb-4">Payment Method</h2>
              <div className="grid grid-cols-2 gap-4">
                {/* BKash Buttons */}
                <button
                  onClick={() => setSelectedPaymentMethod('bkash_send_money')}
                  className={`relative p-4 rounded-xl border-2 text-left transition-all ${
                    selectedPaymentMethod?.startsWith('bkash')
                      ? 'border-[#e2136e] bg-[#e2136e]/10 shadow-lg shadow-[#e2136e]/20'
                      : 'border-[var(--border)] bg-[var(--surface)] hover:border-[var(--border-strong)]'
                  }`}
                >
                  {/* BKash Logo SVG - Pink theme */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      selectedPaymentMethod?.startsWith('bkash') ? 'bg-[#e2136e]' : 'bg-[#e2136e]/10'
                    }`}>
                      {/* BKash Logo - B with pink circle */}
                      <svg viewBox="0 0 24 24" className="w-6 h-6">
                        <circle cx="12" cy="12" r="10" fill={selectedPaymentMethod?.startsWith('bkash') ? 'white' : '#e2136e'} />
                        <text x="12" y="16.5" textAnchor="middle" fill={selectedPaymentMethod?.startsWith('bkash') ? '#e2136e' : 'white'} fontSize="14" fontWeight="900" fontFamily="sans-serif">b</text>
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium">bKash</p>
                      <p className="text-xs text-[var(--muted)]">
                        {isSendMoney ? 'Send Money' : 'Pay Bill'}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-[var(--muted)] mb-2">
                    {isSendMoney
                      ? 'Send BDT to the number below'
                      : 'Pay using Bill number'
                    }
                  </p>
                  <div className={`p-2 rounded-lg ${selectedPaymentMethod?.startsWith('bkash') ? 'bg-[#e2136e]/20' : 'bg-[var(--surface-2)]'}`}>
                    <p className={`text-xs font-mono ${selectedPaymentMethod?.startsWith('bkash') ? 'text-[#e2136e]' : 'text-[var(--muted)]'}`}>
                      {isSendMoney ? `Number: ${paymentInfo.number}` : 'Bill No: Provided after registration'}
                    </p>
                  </div>
                </button>

                {/* Nagad Buttons */}
                <button
                  onClick={() => setSelectedPaymentMethod('nagad_send_money')}
                  className={`relative p-4 rounded-xl border-2 text-left transition-all ${
                    selectedPaymentMethod?.startsWith('nagad')
                      ? 'border-[#f37021] bg-[#f37021]/10 shadow-lg shadow-[#f37021]/20'
                      : 'border-[var(--border)] bg-[var(--surface)] hover:border-[var(--border-strong)]'
                  }`}
                >
                  {/* Nagad Logo SVG - Orange/Yellow theme */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      selectedPaymentMethod?.startsWith('nagad') ? 'bg-gradient-to-r from-[#f37021] to-[#f9a825]' : 'bg-[#f37021]/10'
                    }`}>
                      {/* Nagad Logo */}
                      <svg viewBox="0 0 24 24" className="w-6 h-6">
                        <circle cx="12" cy="12" r="10" fill={selectedPaymentMethod?.startsWith('nagad') ? 'white' : '#f37021'} />
                        <path d="M9 8h2v6.5l3-4.5h2.5l-3.5 4.5 4 4.5h-2.5l-3-3.5v3.5H9V8z" fill={selectedPaymentMethod?.startsWith('nagad') ? '#f37021' : 'white'} />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium">Nagad</p>
                      <p className="text-xs text-[var(--muted)]">
                        {isSendMoney ? 'Send Money' : 'Pay Bill'}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-[var(--muted)] mb-2">
                    {isSendMoney
                      ? 'Send BDT to the number below'
                      : 'Pay using Bill number'
                    }
                  </p>
                  <div className={`p-2 rounded-lg ${selectedPaymentMethod?.startsWith('nagad') ? 'bg-[#f37021]/20' : 'bg-[var(--surface-2)]'}`}>
                    <p className={`text-xs font-mono ${selectedPaymentMethod?.startsWith('nagad') ? 'text-[#f37021]' : 'text-[var(--muted)]'}`}>
                      {isSendMoney ? `Number: ${paymentInfo.number}` : 'Bill No: Provided after registration'}
                    </p>
                  </div>
                </button>
              </div>

              <div className="mt-4 p-3 bg-[var(--surface-2)] rounded-lg">
                <p className="text-xs text-[var(--muted)]">
                  <strong className="text-[var(--text)]">Instructions:</strong> {paymentInfo.instructions}
                </p>
              </div>
            </Card>

            {/* Payment Details Form */}
            <Card className="p-6">
              <h2 className="font-medium mb-4 flex items-center gap-2">
                <Lock size={18} className="text-[var(--accent)]" />
                {totalPrice > 0 ? 'Payment Details' : 'Confirm Registration'}
              </h2>

              <form onSubmit={(e) => { e.preventDefault(); handleSubmitPayment(); }} className="space-y-4">
                {totalPrice === 0 && (
                  <p className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-green-500 text-sm">
                    This registration is completely free — just confirm below and you&apos;re in. The organizer will verify your spot.
                  </p>
                )}
                <div className="grid gap-4">
                  {totalPrice > 0 && (
                  <>
                  <div className="relative">
                    <label className="block text-sm font-medium mb-1.5">Transaction ID *</label>
                    <input
                      type="text"
                      value={transactionId}
                      onChange={(e) => setTransactionId(e.target.value)}
                      placeholder="Enter your transaction ID"
                      className="w-full px-4 py-3 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--accent)] transition-colors"
                      required
                    />
                    <p className="text-xs text-[var(--muted)] mt-1">
                      The transaction/reference ID from your payment
                    </p>
                  </div>

                  <div className="relative">
                    <label className="block text-sm font-medium mb-1.5">Mobile Number Paid From *</label>
                    <div className="relative">
                      <Smartphone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
                      <input
                        type="tel"
                        value={transactionMobile}
                        onChange={(e) => setTransactionMobile(e.target.value)}
                        placeholder="+880 1XXX-XXXXXX"
                        className="w-full pl-10 pr-4 py-3 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--accent)] transition-colors"
                        required
                      />
                    </div>
                    <p className="text-xs text-[var(--muted)] mt-1">
                      The mobile number you used for the payment
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1.5 flex items-center gap-2">
                      <Camera size={14} className="text-[var(--muted)]" />
                      Payment Screenshot *
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleScreeshotUpload}
                      className="block w-full text-sm text-[var(--muted)] file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-[var(--surface-2)] file:text-[var(--text)] hover:file:bg-[var(--surface)] cursor-pointer"
                      required
                    />
                    <p className="text-xs text-[var(--muted)] mt-1">
                      Upload a screenshot of your payment confirmation
                    </p>
                    {screenshotUrl && (
                      <div className="mt-2 relative">
                        <img
                          src={screenshotUrl}
                          alt="Payment screenshot"
                          className="w-full max-h-48 object-contain rounded-lg border border-[var(--border)]"
                        />
                        <button
                          type="button"
                          onClick={() => setScreenshotUrl('')}
                          className="absolute top-2 right-2 p-1 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
                        >
                          <AlertCircle size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                  </>
                  )}
                </div>

                <Button
                  type="submit"
                  isLoading={submitting}
                  disabled={totalPrice > 0 && (!transactionId || !transactionMobile || !screenshotUrl || !selectedPaymentMethod)}
                  className="w-full gap-2"
                >
                  {totalPrice === 0 ? (
                    <>
                      <Check size={16} />
                      Confirm Registration (Free)
                    </>
                  ) : isBkash ? (
                    <>
                      <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                        <circle cx="12" cy="12" r="10" fill="currentColor" />
                      </svg>
                      Pay with BKash
                    </>
                  ) : isNagad ? (
                    <>
                      <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                        <circle cx="12" cy="12" r="10" fill="currentColor" />
                      </svg>
                      Pay with Nagad
                    </>
                  ) : (
                    <>
                      <Lock size={16} />
                      Submit Payment
                    </>
                  )}
                </Button>

                <p className="text-xs text-center text-[var(--muted)]">
                  Your payment will be verified by the event organizers.
                  {totalPrice === 0 && ' This is a free event.'}
                </p>
              </form>
            </Card>
          </div>

          {/* Right: Order Summary */}
          <div className="space-y-6">
            <Card className="p-6">
              <h2 className="font-medium mb-4">Order Summary</h2>

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[var(--surface-2)] flex items-center justify-center">
                    <FileText size={16} className="text-[var(--muted)]" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{event.title}</p>
                    <p className="text-xs text-[var(--muted)]">Registration ID: {registration.ticket_code.slice(0, 8)}...</p>
                  </div>
                </div>

                <div className="border-t border-[var(--border)] pt-3 space-y-2">
                  {segments
                    .filter((seg) => seg.segment && selectedSegmentIds.includes(seg.segment_id))
                    .map((seg) =>
                      seg.segment && !seg.segment.is_free && (
                        <div key={seg.id} className="flex items-center justify-between text-sm">
                          <span className="text-[var(--muted)]">{seg.segment.title}</span>
                          <span className="font-mono">BDT {parseFloat(String(seg.price_paid ?? 0)).toLocaleString()}</span>
                        </div>
                      )
                    )}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-[var(--border)]">
                  <span className="font-medium">Total Amount</span>
                  <span className="text-xl font-bold text-[var(--accent)]">
                    BDT {totalPrice.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="mt-6 p-3 bg-[var(--surface-2)] rounded-lg">
                <h3 className="text-sm font-medium mb-2">Payment Info</h3>
                <div className="text-xs text-[var(--muted)] space-y-1">
                  <p><strong>Pay to:</strong> {paymentInfo.number}</p>
                  <p><strong>Method:</strong> {paymentInfo.label}</p>
                </div>
              </div>

              <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <p className="text-xs text-blue-500">
                  <strong className="block mb-1">Need help?</strong>
                  Contact the event organizer if you have issues with payment.
                </p>
              </div>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
