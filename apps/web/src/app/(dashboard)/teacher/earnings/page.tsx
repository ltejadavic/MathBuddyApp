"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Wallet, TrendingUp, DollarSign } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function TeacherEarningsPage() {
  const earningsData = [
    { name: "Apr", earnings: 450 },
    { name: "May", earnings: 620 },
    { name: "Jun", earnings: 800 },
    { name: "Jul", earnings: 750 },
    { name: "Aug", earnings: 320 }, // Current month partial
  ];

  const recentTransactions = [
    { id: 1, date: "Aug 1, 2026", description: "Class: SAT Math Prep (Alice Smith)", hours: 1.5, rate: 25, total: 37.5, status: "ACCRUED" },
    { id: 2, date: "Jul 28, 2026", description: "Class: IB Physics (Bob Johnson)", hours: 1.0, rate: 30, total: 30.0, status: "ACCRUED" },
    { id: 3, date: "Jul 15, 2026", description: "Bi-Weekly Payout (Bank Transfer)", hours: "-", rate: "-", total: -650.0, status: "PAID" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
          Earnings & Financials
        </h2>
        <p className="text-muted-foreground mt-1 text-sm sm:text-base">
          Track your accrued balances and historical payouts.
        </p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="rounded-xl shadow-sm border-gray-100 dark:border-gray-800">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Current Balance</p>
              <h3 className="text-3xl font-bold mt-1 text-brand-cyan">$320.50</h3>
            </div>
            <div className="p-3 rounded-full bg-brand-cyan/10 text-brand-cyan">
              <Wallet className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-xl shadow-sm border-gray-100 dark:border-gray-800">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">This Month (Aug)</p>
              <h3 className="text-3xl font-bold mt-1">$320.00</h3>
            </div>
            <div className="p-3 rounded-full bg-green-100 text-green-600 dark:bg-green-900/30">
              <TrendingUp className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-xl shadow-sm border-gray-100 dark:border-gray-800">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Lifetime Earned</p>
              <h3 className="text-3xl font-bold mt-1">$2,940.00</h3>
            </div>
            <div className="p-3 rounded-full bg-purple-100 text-purple-600 dark:bg-purple-900/30">
              <DollarSign className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart & Table Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1 rounded-xl shadow-sm border-gray-100 dark:border-gray-800">
          <CardHeader>
            <CardTitle>Earnings Trend</CardTitle>
            <CardDescription>Monthly accrued earnings.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={earningsData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6b7280'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#6b7280'}} tickFormatter={(value) => `$${value}`} />
                <Tooltip 
                  cursor={{fill: 'transparent'}}
                  contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                />
                <Bar dataKey="earnings" fill="#00B9EE" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 rounded-xl shadow-sm border-gray-100 dark:border-gray-800">
          <CardHeader>
            <CardTitle>Transaction History</CardTitle>
            <CardDescription>Recent accrued earnings and payouts.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Hours x Rate</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentTransactions.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell className="font-medium">{tx.date}</TableCell>
                      <TableCell>{tx.description}</TableCell>
                      <TableCell>{tx.hours !== "-" ? `${tx.hours}h @ $${tx.rate}/h` : "-"}</TableCell>
                      <TableCell className={`text-right font-semibold ${tx.total < 0 ? 'text-red-500' : 'text-green-600 dark:text-green-400'}`}>
                        {tx.total < 0 ? `-$${Math.abs(tx.total).toFixed(2)}` : `+$${tx.total.toFixed(2)}`}
                      </TableCell>
                      <TableCell>
                        {tx.status === 'ACCRUED' ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                            Accrued
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-brand-cyan/10 text-brand-cyan">
                            Paid Out
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
