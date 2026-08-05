"use client";

import { useEffect, useState } from "react";
import { Database, RefreshCw, Server, CheckCircle2, User, Key, CreditCard, ShieldCheck, Calendar } from "lucide-react";

type DatabaseData = {
  databaseName: string;
  provider: string;
  guests: any[];
  reservations: any[];
  verifications: any[];
  payments: any[];
  keys: any[];
};

export default function DatabasePage() {
  const [data, setData] = useState<DatabaseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"reservations" | "guests" | "verifications" | "payments" | "keys">("reservations");

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/database", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load PostgreSQL data");
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err?.message || "Could not connect to PostgreSQL database");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-6 md:p-10 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <div className="flex items-center gap-2 text-blue-400 font-semibold text-sm mb-1">
              <Server className="h-4 w-4" /> PostgreSQL 17 Database Inspector
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
              InnKeeper Database Tables
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Live PostgreSQL database record browser for database &apos;{data?.databaseName || "innkeeper"}&apos;
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="h-3.5 w-3.5" /> PostgreSQL Connected
            </span>
            <button
              onClick={loadData}
              disabled={loading}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 p-4 text-sm">
            {error}
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-800 overflow-x-auto pb-2">
          {[
            { id: "reservations", label: `Reservations (${data?.reservations?.length || 0})`, icon: Calendar },
            { id: "guests", label: `Guests (${data?.guests?.length || 0})`, icon: User },
            { id: "verifications", label: `ID Verifications (${data?.verifications?.length || 0})`, icon: ShieldCheck },
            { id: "payments", label: `Payments (${data?.payments?.length || 0})`, icon: CreditCard },
            { id: "keys", label: `Digital Keys (${data?.keys?.length || 0})`, icon: Key },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap ${
                  active
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                }`}
              >
                <Icon className="h-3.5 w-3.5" /> {tab.label}
              </button>
            );
          })}
        </div>

        {/* Data Display */}
        <div className="bg-slate-950 rounded-2xl border border-slate-800 p-6 overflow-x-auto shadow-2xl">
          {loading ? (
            <div className="py-16 text-center text-slate-500 flex flex-col items-center gap-3">
              <RefreshCw className="h-6 w-6 animate-spin text-blue-500" />
              <p className="text-sm">Querying PostgreSQL database tables...</p>
            </div>
          ) : (
            <div>
              {activeTab === "reservations" && (
                <Table
                  headers={["ID", "Confirmation", "Guest", "Room", "Dates", "Status", "Total"]}
                  rows={data?.reservations?.map((r) => [
                    r.id,
                    r.confirmationNumber,
                    r.guest?.fullName || r.guestId,
                    `Room ${r.roomNumber || "Unassigned"} (${r.roomType})`,
                    `${new Date(r.checkInDate).toLocaleDateString()} - ${new Date(r.checkOutDate).toLocaleDateString()}`,
                    r.checkInStatus,
                    `$${(Number(r.roomRate) + Number(r.taxes) + Number(r.incidentalHold)).toFixed(2)}`,
                  ])}
                />
              )}

              {activeTab === "guests" && (
                <Table
                  headers={["ID", "Full Name", "Email", "Phone", "Created At"]}
                  rows={data?.guests?.map((g) => [
                    g.id,
                    g.fullName,
                    g.email || "—",
                    g.phone,
                    new Date(g.createdAt).toLocaleString(),
                  ])}
                />
              )}

              {activeTab === "verifications" && (
                <Table
                  headers={["ID", "Reservation ID", "Status", "ID Doc URL", "Selfie URL", "Created At"]}
                  rows={data?.verifications?.map((v) => [
                    v.id,
                    v.reservationId,
                    v.status,
                    v.idDocumentUrl,
                    v.selfieUrl,
                    new Date(v.createdAt).toLocaleString(),
                  ])}
                />
              )}

              {activeTab === "payments" && (
                <Table
                  headers={["ID", "Reservation ID", "Amount", "Processor Token", "Status", "Created At"]}
                  rows={data?.payments?.map((p) => [
                    p.id,
                    p.reservationId,
                    `$${Number(p.amount).toFixed(2)}`,
                    p.processorToken,
                    p.status,
                    new Date(p.createdAt).toLocaleString(),
                  ])}
                />
              )}

              {activeTab === "keys" && (
                <Table
                  headers={["ID", "Reservation ID", "Lock Device ID", "Valid From", "Valid Until"]}
                  rows={data?.keys?.map((k) => [
                    k.id,
                    k.reservationId,
                    k.lockDeviceId,
                    new Date(k.validFrom).toLocaleString(),
                    new Date(k.validUntil).toLocaleString(),
                  ])}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Table({ headers, rows }: { headers: string[]; rows?: any[][] }) {
  if (!rows || rows.length === 0) {
    return (
      <div className="py-12 text-center text-slate-500 text-sm">
        No records found in this PostgreSQL table.
      </div>
    );
  }

  return (
    <table className="w-full text-left text-xs text-slate-300">
      <thead>
        <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
          {headers.map((h, i) => (
            <th key={i} className="pb-3 px-3">
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-800/60 font-mono">
        {rows.map((row, rIdx) => (
          <tr key={rIdx} className="hover:bg-slate-900/60 transition-colors">
            {row.map((cell, cIdx) => (
              <td key={cIdx} className="py-3 px-3">
                {typeof cell === "string" && cell.startsWith("http") ? (
                  <a href={cell} target="_blank" rel="noreferrer" className="text-blue-400 underline">
                    {cell}
                  </a>
                ) : (
                  String(cell)
                )}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
