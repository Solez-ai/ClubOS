'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { StatusPill } from '@/components/ui/StatusPill';
import { MOCK_EVENTS, MOCK_REGISTRATIONS, MOCK_PROFILES } from '@/lib/mockData';
import { Download, Search, CheckCircle2, XCircle, ArrowLeft } from 'lucide-react';

export default function ParticipantsTablePage() {
  const event = MOCK_EVENTS[0];
  const [search, setSearch] = useState('');
  const [registrations, setRegistrations] = useState(MOCK_REGISTRATIONS);

  const filtered = registrations.filter((r) =>
    r.profile?.full_name.toLowerCase().includes(search.toLowerCase()) ||
    r.ticket_code.toLowerCase().includes(search.toLowerCase())
  );

  const handleExportCSV = () => {
    const csvHeader = '\uFEFFTicket Code,Full Name,Handle,Institution,Status,Created At\n';
    const csvRows = filtered
      .map(
        (r) =>
          `"${r.ticket_code}","${r.profile?.full_name}","${r.profile?.handle}","${r.profile?.institution}","${r.status}","${r.created_at}"`
      )
      .join('\n');
    const blob = new Blob([csvHeader + csvRows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${event.slug}-participants.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg)] text-[var(--text)]">
      <Navbar />

      <main className="max-w-[1200px] mx-auto w-full px-4 sm:px-6 py-12 flex flex-col gap-8">
        <Link href="/organizer" className="font-mono text-xs text-[var(--accent)] hover:underline flex items-center gap-1">
          <ArrowLeft size={14} />
          <span>Back to Organizer Dashboard</span>
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border)] pb-6">
          <div className="flex flex-col gap-1">
            <Eyebrow>PARTICIPANTS MANAGEMENT</Eyebrow>
            <h1 className="font-serif text-3xl font-light text-[var(--text)]">
              {event.title}
            </h1>
            <span className="font-mono text-xs text-[var(--muted)]">
              Total registered: {filtered.length}
            </span>
          </div>

          <Button onClick={handleExportCSV} variant="secondary" className="gap-2 font-mono text-xs">
            <Download size={14} />
            <span>Export CSV (UTF-8)</span>
          </Button>
        </div>

        {/* Filter Input */}
        <div className="w-full max-w-md">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by participant name, ticket code, handle..."
          />
        </div>

        {/* Table */}
        <Card className="p-0 overflow-hidden">
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left font-sans text-sm">
              <thead className="bg-[var(--surface-2)] font-mono text-xs text-[var(--muted)] uppercase hairline-b">
                <tr>
                  <th className="py-3.5 px-4 font-normal">TICKET</th>
                  <th className="py-3.5 px-4 font-normal">NAME & HANDLE</th>
                  <th className="py-3.5 px-4 font-normal">INSTITUTION</th>
                  <th className="py-3.5 px-4 font-normal">STATUS</th>
                  <th className="py-3.5 px-4 font-normal text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-[var(--surface-2)] transition-colors">
                    <td className="py-4 px-4 font-mono text-xs font-medium text-[var(--accent)]">
                      {r.ticket_code}
                    </td>
                    <td className="py-4 px-4 font-medium text-[var(--text)]">
                      {r.profile?.full_name} <span className="font-mono text-xs text-[var(--muted)]">(@{r.profile?.handle})</span>
                    </td>
                    <td className="py-4 px-4 text-xs text-[var(--muted)]">{r.profile?.institution}</td>
                    <td className="py-4 px-4">
                      <StatusPill status={r.status} />
                    </td>
                    <td className="py-4 px-4 text-right font-mono text-xs">
                      <button
                        onClick={() => {
                          setRegistrations((prev) =>
                            prev.map((item) => (item.id === r.id ? { ...item, status: 'checked_in' } : item))
                          );
                        }}
                        className="text-[var(--accent)] hover:underline cursor-pointer"
                      >
                        Check In
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </main>

      <Footer />
    </div>
  );
}
