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

  const [event, setEvent] = useState<any>(null);
  const [registration, setRegistration] = useState<any>(null);
  const [segments, setSegments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
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

      // Fetch event
      const { data: eventData } = await supabase
        .from('events')
        .select('*, segments(*)')
        .eq('slug', slug)
        .single();

      if (!eventData) {
        setError('Event not found');
        setLoading(false);
        return;
      }

      setEvent(eventData);

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
      const paidSegments = eventData.segments?.filter((s: any) => !s.is_free);
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

  const handleSubmitPayment = async () => {
    if (!supabase || !registration || !selectedPaymentMethod) return;

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

    setSubmitting(true);
    setError('');

    try {
      const { error: updateErr } = await supabase
        .from('registrations')
        .update({
          payment_method: selectedPaymentMethod,
          transaction_id: transactionId,
          transaction_mobile: transactionMobile,
          payment_status: 'paid',
          payment_screenshot_url: screenshotUrl,
        })
        .eq('id', registration.id);

      if (updateErr) {
        setError(updateErr.message);
        setSubmitting(false);
        return;
      }

      // Update registration segments
      for (const seg of segments) {
        if (!seg.segment?.is_free) {
          await supabase
            .from('registration_segments')
            .update({ status: 'paid' })
            .eq('registration_id', registration.id)
            .eq('segment_id', seg.segment_id);
        }
      }

      setSuccess('Payment submitted successfully! Organizers will verify your payment and confirm your registration.');
      setSubmitting(false);

      setTimeout(() => {
        router.push(`/events/${slug}`);
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to submit payment');
      setSubmitting(false);
    }
  };

  const totalPrice = segments
    .filter((s: any) => s.segment && !s.segment.is_free)
    .reduce((sum: number, s: any) => sum + (parseFloat(s.price_paid) || 0), 0);

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
          {/* Left: Payment Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Selected Segments */}
            <Card className="p-6">
              <h2 className="font-medium mb-4">Selected Segments</h2>
              <div className="flex flex-col gap-3">
                {segments.map((seg: any, idx: number) => (
                  <div
                    key={seg.id}
                    className="flex items-center justify-between p-3 bg-[var(--surface)] rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-sm">{seg.segment?.title || `Segment ${idx + 1}`}</p>
                      {seg.segment?.is_free && (
                        <span className="text-xs text-green-500">Free</span>
                      )}
                    </div>
                    {!seg.segment?.is_free && (
                      <span className="font-mono font-medium">
                        BDT {parseFloat(seg.price_paid || 0).toLocaleString()}
                      </span>
                    )}
                  </div>
                ))}
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
                      ? 'border-pink-500 bg-pink-500/10 shadow-lg shadow-pink-500/20'
                      : 'border-[var(--border)] bg-[var(--surface)] hover:border-[var(--border-strong)]'
                  }`}
                >
                  {/* BKash Logo SVG - Pink theme */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      selectedPaymentMethod?.startsWith('bkash') ? 'bg-pink-500 text-white' : 'bg-pink-50 text-pink-600'
                    }`}>
                      {/* BKash Logo - B with pink circle */}
                      <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                        <circle cx="12" cy="12" r="10" fill="currentColor" />
                        <text x="12" y="16" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">B</text>
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium">BKash</p>
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
                  <div className={`p-2 rounded-lg ${selectedPaymentMethod?.startsWith('bkash') ? 'bg-pink-500/20' : 'bg-[var(--surface-2)]'}`}>
                    <p className={`text-xs font-mono ${selectedPaymentMethod?.startsWith('bkash') ? 'text-pink-600' : 'text-[var(--muted)]'}`}>
                      {isSendMoney ? `Number: ${paymentInfo.number}` : 'Bill No: Provided after registration'}
                    </p>
                  </div>
                </button>

                {/* Nagad Buttons */}
                <button
                  onClick={() => setSelectedPaymentMethod('nagad_send_money')}
                  className={`relative p-4 rounded-xl border-2 text-left transition-all ${
                    selectedPaymentMethod?.startsWith('nagad')
                      ? 'border-orange-400 bg-orange-400/10 shadow-lg shadow-orange-400/20'
                      : 'border-[var(--border)] bg-[var(--surface)] hover:border-[var(--border-strong)]'
                  }`}
                >
                  {/* Nagad Logo SVG - Orange/Yellow theme */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      selectedPaymentMethod?.startsWith('nagad') ? 'bg-orange-400 text-white' : 'bg-orange-50 text-orange-600'
                    }`}>
                      {/* Nagad Logo - N with orange circle */}
                      <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                        <circle cx="12" cy="12" r="10" fill="currentColor" />
                        <text x="12" y="16" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">N</text>
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
                  <div className={`p-2 rounded-lg ${selectedPaymentMethod?.startsWith('nagad') ? 'bg-orange-400/20' : 'bg-[var(--surface-2)]'}`}>
                    <p className={`text-xs font-mono ${selectedPaymentMethod?.startsWith('nagad') ? 'text-orange-600' : 'text-[var(--muted)]'}`}>
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
                Payment Details
              </h2>

              <form onSubmit={(e) => { e.preventDefault(); handleSubmitPayment(); }} className="space-y-4">
                <div className="grid gap-4">
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
                </div>

                <Button
                  type="submit"
                  isLoading={submitting}
                  disabled={!transactionId || !transactionMobile || !screenshotUrl || !selectedPaymentMethod}
                  className="w-full gap-2"
                >
                  {isBkash ? (
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
                  {segments.map((seg: any) => (
                    seg.segment && !seg.segment.is_free && (
                      <div key={seg.id} className="flex items-center justify-between text-sm">
                        <span className="text-[var(--muted)]">{seg.segment.title}</span>
                        <span className="font-mono">BDT {parseFloat(seg.price_paid || 0).toLocaleString()}</span>
                      </div>
                    )
                  ))}
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
