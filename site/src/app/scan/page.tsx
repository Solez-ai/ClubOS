'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import { QrCode, Camera, Flashlight, ArrowLeft, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Stamp } from '@/components/ui/Stamp';

export default function ScanPage() {
  const [manualCode, setManualCode] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSimulateScan = (codeToTest: string) => {
    setIsProcessing(true);
    setErrorMessage(null);

    setTimeout(() => {
      setIsProcessing(false);
      if (codeToTest.includes('live') || codeToTest.includes('TC2026')) {
        setScanResult({
          kind: 'event',
          title: 'AI Web Development Contest',
          xpGained: 150,
          stampId: 'stamp-scan-new',
          message: 'Checked in! +150 XP earned',
        });
      } else if (codeToTest.includes('fest')) {
        setScanResult({
          kind: 'fest',
          title: '9th DRMC International Tech Carnival 2026',
          xpGained: 25,
          stampId: 'stamp-fest-new',
          message: 'Fest Entry Stamp collected! +25 XP',
        });
      } else {
        setErrorMessage('Invalid QR code or expired venue token');
      }
    }, 600);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0D0C0A] text-[#F3EFE6]">
      <Navbar />

      <main className="max-w-[700px] mx-auto w-full px-4 sm:px-6 py-8 flex flex-col gap-6 flex-1 items-center justify-center">
        <div className="flex items-center justify-between w-full">
          <Link href="/passport" className="inline-flex items-center gap-1.5 font-mono text-xs text-[var(--muted)] hover:text-[var(--text)]">
            <ArrowLeft size={14} />
            <span>Passport</span>
          </Link>
          <span className="font-mono text-xs text-[var(--accent)] uppercase tracking-wider">
            QR SCANNER
          </span>
        </div>

        {/* CAMERA SCANNER VIEWPORT */}
        <div className="relative w-full aspect-square max-w-sm bg-black border border-[var(--border-strong)] rounded-[10px] overflow-hidden flex flex-col items-center justify-center p-6 shadow-2xl">
          {/* Thin Brass Corner Brackets */}
          <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-[var(--accent)] pointer-events-none" />
          <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-[var(--accent)] pointer-events-none" />
          <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-[var(--accent)] pointer-events-none" />
          <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-[var(--accent)] pointer-events-none" />

          {/* Sweeping Brass Scan Line */}
          <motion.div
            className="absolute left-0 right-0 h-[1.5px] bg-[var(--accent)] shadow-[0_0_8px_var(--accent)]"
            animate={{ top: ['10%', '90%', '10%'] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          />

          <Camera size={40} className="text-[var(--muted)] opacity-40 mb-3" />
          <p className="font-mono text-xs text-[var(--muted)] text-center max-w-[200px]">
            Align Event Venue QR or Participant Passport QR within frame
          </p>

          {/* Demo Scanner Trigger */}
          <button
            onClick={() => handleSimulateScan('token_ai_web_dev_live')}
            className="mt-6 px-3 py-1.5 bg-[var(--surface)] border border-[var(--border)] rounded text-xs font-mono text-[var(--accent)] hover:border-[var(--accent)] transition-colors cursor-pointer"
          >
            Demo Scan Live Venue QR
          </button>
        </div>

        {/* MANUAL CODE ENTRY */}
        <Card className="w-full max-w-sm flex flex-col gap-4 p-5">
          <span className="font-mono text-xs uppercase text-[var(--muted)]">ENTER CODE MANUALLY</span>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (manualCode) handleSimulateScan(manualCode);
            }}
            className="flex gap-2"
          >
            <Input
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              placeholder="e.g. TC2026-WEB1"
              className="font-mono text-xs"
            />
            <Button type="submit" isLoading={isProcessing} size="sm">
              Verify
            </Button>
          </form>
        </Card>

        {/* SCAN RESULT MODAL */}
        <AnimatePresence>
          {scanResult && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="w-full max-w-md bg-[#0D0C0A] border border-[var(--accent)] rounded-[10px] p-6 flex flex-col items-center text-center gap-6 shadow-2xl relative"
              >
                <button
                  onClick={() => setScanResult(null)}
                  className="absolute top-4 right-4 text-[var(--muted)] hover:text-[var(--text)]"
                >
                  <X size={18} />
                </button>

                <Stamp id={scanResult.stampId} title={scanResult.title} kind={scanResult.kind} animate={true} />

                <div className="flex flex-col gap-1">
                  <h3 className="font-serif text-2xl text-[var(--text)]">{scanResult.title}</h3>
                  <span className="font-mono text-sm text-[var(--accent)] font-medium">
                    +{scanResult.xpGained} XP GAINED
                  </span>
                </div>

                <p className="text-xs text-[var(--muted)] font-mono">{scanResult.message}</p>

                <Button onClick={() => setScanResult(null)} className="w-full">
                  Done
                </Button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>

      <Footer />
    </div>
  );
}
