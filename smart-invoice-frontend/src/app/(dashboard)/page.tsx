"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Building2, HandCoins, CheckCircle2, PiggyBank, Plus } from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell,
} from "recharts";
import {
  fetchOverviewStats,
  fetchCashflow,
  fetchInvoiceStats,
  type OverviewStats,
  type CashflowDataPoint,
  type InvoiceStatusDataPoint,
} from "@/lib/api/dashboard";
import { authFetch } from "@/lib/api/authFetch";

const STATUS_COLORS: Record<string, string> = {
  Draft: "#d1fae5",
  Sent: "#a7f3d0",
  Paid: "#059669",
  Overdue: "#fee2e2",
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatAxisAmount(val: number): string {
  if (val >= 1000) return `$${(val / 1000).toFixed(0)}K`;
  return `$${val}`;
}

interface RecentInvoice {
  id: number;
  invoice_number: string;
  client: { name: string } | null;
  issue_date: string;
  due_date: string | null;
  total_amount: number;
  status: string;
}

function CardSkeleton() {
  return (
    <div className="bg-white p-5 rounded-2xl shadow-sm animate-pulse">
      <div className="w-10 h-10 rounded-full bg-gray-100 mb-4" />
      <div className="h-3 w-24 bg-gray-100 rounded mb-2" />
      <div className="h-8 w-20 bg-gray-100 rounded" />
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm animate-pulse">
      <div className="h-4 w-36 bg-gray-100 rounded mb-2" />
      <div className="h-3 w-20 bg-gray-100 rounded mb-6" />
      <div className="h-64 w-full bg-gray-50 rounded-xl" />
    </div>
  );
}

export default function Dashboard() {
  const [overview, setOverview] = useState<OverviewStats | null>(null);
  const [cashflow, setCashflow] = useState<CashflowDataPoint[]>([]);
  const [invoiceStats, setInvoiceStats] = useState<InvoiceStatusDataPoint[]>([]);
  const [recentInvoices, setRecentInvoices] = useState<RecentInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadAll() {
      try {
        const [overviewData, cashflowData, statsData, invoicesRes] = await Promise.all([
          fetchOverviewStats(),
          fetchCashflow(),
          fetchInvoiceStats(),
          authFetch(`/invoices/?limit=5`),
        ]);

        setOverview(overviewData);
        setCashflow(cashflowData);
        setInvoiceStats(statsData);

        if (invoicesRes.ok) {
          const invoicesData = await invoicesRes.json();
          setRecentInvoices(invoicesData.slice(0, 5));
        }
      } catch {
        setError("Failed to load dashboard data. Is the backend running?");
      } finally {
        setLoading(false);
      }
    }
    loadAll();
  }, []);

  const chartData = cashflow.map((d) => ({ name: d.month, flow: d.amount }));
  const barData = invoiceStats.map((d) => ({
    name: d.status,
    value: d.amount,
    color: STATUS_COLORS[d.status] ?? "#e5e7eb",
  }));

  return (
    <div className="flex flex-col gap-8 pb-10">

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Welcome back!</h1>
        <Link
          href="/invoices/new"
          className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-6 py-2.5 rounded-full font-medium transition-colors shadow-sm shadow-brand-200"
        >
          <Plus className="w-5 h-5" />
          Create Invoice
        </Link>
      </div>

      {/* Error banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl px-5 py-3 text-sm">
          {error}
        </div>
      )}

      {/* Overview Cards */}
      <div className="bg-gradient-to-r from-brand-50 to-brand-100 rounded-3xl p-6 shadow-sm border border-brand-100/50">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold text-gray-800">Overview</h2>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {loading ? (
            <>
              <CardSkeleton />
              <CardSkeleton />
              <CardSkeleton />
              <CardSkeleton />
            </>
          ) : (
            <>
              <div className="bg-white p-5 rounded-2xl shadow-sm">
                <div className="w-10 h-10 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center mb-4">
                  <Building2 className="w-5 h-5" />
                </div>
                <p className="text-sm text-gray-500 font-medium mb-1">Total Invoices</p>
                <h3 className="text-3xl font-bold text-gray-900">{overview?.total_invoices ?? 0}</h3>
              </div>

              <div className="bg-white p-5 rounded-2xl shadow-sm">
                <div className="w-10 h-10 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center mb-4">
                  <HandCoins className="w-5 h-5" />
                </div>
                <p className="text-sm text-gray-500 font-medium mb-1">Outstanding Amount</p>
                <h3 className="text-2xl font-bold text-gray-900">
                  {formatCurrency(overview?.outstanding_amount ?? 0)}
                </h3>
              </div>

              <div className="bg-white p-5 rounded-2xl shadow-sm">
                <div className="w-10 h-10 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <p className="text-sm text-gray-500 font-medium mb-1">Paid This Month</p>
                <h3 className="text-2xl font-bold text-gray-900">
                  {formatCurrency(overview?.paid_this_month ?? 0)}
                </h3>
              </div>

              <div className="bg-white p-5 rounded-2xl shadow-sm">
                <div className="w-10 h-10 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center mb-4">
                  <PiggyBank className="w-5 h-5" />
                </div>
                <p className="text-sm text-gray-500 font-medium mb-1">Upcoming Payments</p>
                <h3 className="text-3xl font-bold text-gray-900">{overview?.upcoming_payments ?? 0}</h3>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {loading ? (
          <>
            <ChartSkeleton />
            <ChartSkeleton />
          </>
        ) : (
          <>
            {/* Cashflow Area Chart */}
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
              <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-900">Cashflow Summary</h3>
                <p className="text-sm text-gray-400">Last 6 months</p>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorFlow" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#9ca3af", fontSize: 12 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: "#9ca3af", fontSize: 12 }} tickFormatter={formatAxisAmount} />
                    <Tooltip
                      contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      formatter={(val: any) => [formatCurrency(val as number), "Cash in"]}
                    />
                    <Area type="monotone" dataKey="flow" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorFlow)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Invoice by Amount Bar Chart */}
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
              <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-900">Invoice by Amount</h3>
                <p className="text-sm text-gray-400">By status</p>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }} barSize={50}>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#9ca3af", fontSize: 12 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: "#9ca3af", fontSize: 12 }} tickFormatter={formatAxisAmount} />
                    <Tooltip
                      cursor={{ fill: "transparent" }}
                      contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      formatter={(val: any) => [formatCurrency(val as number), "Amount"]}
                    />
                    <Bar dataKey="value" radius={[8, 8, 8, 8]}>
                      {barData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Recent Invoices Table */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-50">
          <h3 className="text-lg font-bold text-gray-900">Recent Invoices</h3>
        </div>
        {loading ? (
          <div className="p-6 space-y-3 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 bg-gray-50 rounded-xl" />
            ))}
          </div>
        ) : recentInvoices.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-10">No invoices yet.</p>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-gray-50/50 text-gray-500 text-sm font-medium">
              <tr>
                <th className="py-4 px-6">Invoice #</th>
                <th className="py-4 px-6">Client</th>
                <th className="py-4 px-6 hidden md:table-cell">Issue Date</th>
                <th className="py-4 px-6 hidden md:table-cell">Due Date</th>
                <th className="py-4 px-6">Amount</th>
                <th className="py-4 px-6 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {recentInvoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-gray-50/50 text-sm transition-colors">
                  <td className="py-4 px-6 font-medium text-gray-900">{inv.invoice_number}</td>
                  <td className="py-4 px-6 text-gray-600 font-medium">{inv.client?.name ?? "—"}</td>
                  <td className="py-4 px-6 text-gray-500 hidden md:table-cell">
                    {new Date(inv.issue_date).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })}
                  </td>
                  <td className="py-4 px-6 text-gray-500 hidden md:table-cell">
                    {inv.due_date
                      ? new Date(inv.due_date).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })
                      : "—"}
                  </td>
                  <td className="py-4 px-6 font-medium text-gray-900">{formatCurrency(inv.total_amount)}</td>
                  <td className="py-4 px-6 text-right">
                    <span
                      className={`inline-flex px-3 py-1 rounded-md text-xs font-semibold ${
                        inv.status === "Paid"
                          ? "bg-green-50 text-green-700"
                          : inv.status === "Overdue"
                          ? "bg-red-50 text-red-600"
                          : inv.status === "Sent"
                          ? "bg-blue-50 text-blue-600"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {inv.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

    </div>
  );
}
