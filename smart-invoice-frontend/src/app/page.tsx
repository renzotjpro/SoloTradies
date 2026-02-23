"use client";

import { Building2, HandCoins, CheckCircle2, PiggyBank, Plus } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from "recharts";

const cashflowData = [
  { name: "Jan", flow: 15000 },
  { name: "Feb", flow: 22000 },
  { name: "Mar", flow: 8000 },
  { name: "Apr", flow: 16000 },
  { name: "May", flow: 5000 },
  { name: "Jun", flow: 18000 },
];

const invoiceAmountData = [
  { name: "Draft", value: 4500, color: "#d1fae5" }, // light green
  { name: "Sent", value: 6800, color: "#a7f3d0" }, // medium light green
  { name: "Paid", value: 43250, color: "#059669" }, // dark green
  { name: "Overdue", value: 1100, color: "#fee2e2" }, // light red
];

const recentInvoices = [
  { id: "INV-562", client: "Robert Fox", issueDate: "Dec 20, 2024", dueDate: "Jan 5, 2025", amount: "$778.35", status: "Overdue" },
  { id: "INV-308", client: "Marvin McKinney", issueDate: "Dec 19, 2024", dueDate: "Jan 4, 2025", amount: "$293.01", status: "Overdue", selected: true },
  { id: "INV-442", client: "Savannah Nguyen", issueDate: "Dec 18, 2024", dueDate: "Jan 3, 2025", amount: "$473.85", status: "Sent" },
];

export default function Dashboard() {
  return (
    <div className="flex flex-col gap-8 pb-10">

      {/* Header Area */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Welcome Jhon!</h1>
        <button className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-6 py-2.5 rounded-full font-medium transition-colors shadow-sm shadow-brand-200">
          <Plus className="w-5 h-5" />
          Create Invoice
        </button>
      </div>

      {/* Overview Cards */}
      <div className="bg-gradient-to-r from-brand-50 to-brand-100 rounded-3xl p-6 shadow-sm border border-brand-100/50">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold text-gray-800">Overview</h2>
          <button className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 14a2 2 0 100-4 2 2 0 000 4zm-6 0a2 2 0 100-4 2 2 0 000 4zm12 0a2 2 0 100-4 2 2 0 000 4z" /></svg>
          </button>
        </div>

        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl shadow-sm">
            <div className="w-10 h-10 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center mb-4">
              <Building2 className="w-5 h-5" />
            </div>
            <p className="text-sm text-gray-500 font-medium mb-1">Total Invoice</p>
            <h3 className="text-3xl font-bold text-gray-900">922</h3>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-sm">
            <div className="w-10 h-10 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center mb-4">
              <HandCoins className="w-5 h-5" />
            </div>
            <p className="text-sm text-gray-500 font-medium mb-1">Outstanding Amounts</p>
            <h3 className="text-3xl font-bold text-gray-900">$ 3,077.74</h3>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-sm">
            <div className="w-10 h-10 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center mb-4">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <p className="text-sm text-gray-500 font-medium mb-1">Paid this month</p>
            <h3 className="text-3xl font-bold text-gray-900">$ 2,718.55</h3>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-sm">
            <div className="w-10 h-10 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center mb-4">
              <PiggyBank className="w-5 h-5" />
            </div>
            <p className="text-sm text-gray-500 font-medium mb-1">Upcoming Payments</p>
            <h3 className="text-3xl font-bold text-gray-900">177</h3>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-2 gap-8">

        {/* Cashflow Summary Area Chart */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-gray-900">Cashflow summary</h3>
            <p className="text-sm text-gray-400">Last 6 Month</p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={cashflowData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorFlow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} tickFormatter={(val) => `$${val / 1000}K`} />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
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
            <p className="text-sm text-gray-400">Last 6 Month</p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={invoiceAmountData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }} barSize={50}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} tickFormatter={(val) => `$${val / 1000}K`} />
                <Tooltip
                  cursor={{ fill: 'transparent' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="value" radius={[8, 8, 8, 8]}>
                  {invoiceAmountData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Invoice Table Section */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50/50 text-gray-500 text-sm font-medium">
            <tr>
              <th className="py-4 px-6 w-12 text-center"></th>
              <th className="py-4 px-6">Invoice#</th>
              <th className="py-4 px-6">Client</th>
              <th className="py-4 px-6">Issue Date</th>
              <th className="py-4 px-6">Due Date</th>
              <th className="py-4 px-6">Amount($)</th>
              <th className="py-4 px-6 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {recentInvoices.map((inv) => (
              <tr key={inv.id} className="hover:bg-gray-50/50 text-sm transition-colors">
                <td className="py-4 px-6 text-center">
                  <div className={`w-5 h-5 rounded flex items-center justify-center cursor-pointer ${inv.selected ? 'bg-brand-500' : 'bg-gray-100 border border-gray-200'}`}>
                    {inv.selected && <CheckCircle2 className="w-4 h-4 text-white" />}
                  </div>
                </td>
                <td className="py-4 px-6 font-medium text-gray-900">{inv.id}</td>
                <td className="py-4 px-6 text-gray-600 font-medium">{inv.client}</td>
                <td className="py-4 px-6 text-gray-500">{inv.issueDate}</td>
                <td className="py-4 px-6 text-gray-500">{inv.dueDate}</td>
                <td className="py-4 px-6 font-medium text-gray-900">{inv.amount}</td>
                <td className="py-4 px-6 text-right">
                  <span className={`inline-flex px-3 py-1 rounded-md text-xs font-semibold ${inv.status === 'Overdue'
                      ? 'bg-gray-100 text-gray-600' // The design shows overdue in a gray pill
                      : 'bg-green-50 text-green-600' // Sent in a lighter green pill
                    }`}>
                    {inv.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}
