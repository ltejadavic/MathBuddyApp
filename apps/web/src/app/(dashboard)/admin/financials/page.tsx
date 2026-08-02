"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CreditCard, History } from "lucide-react";

export default function AdminFinancialsPage() {
  const transactions = [
    { id: 1, date: "Aug 1, 2026", type: "PAYMENT", user: "Alice Smith (Student)", amount: 200, status: "VERIFIED", details: "Bank Transfer - 10 hours" },
    { id: 2, date: "Jul 28, 2026", type: "EARNING", user: "Mr. Davis (Teacher)", amount: 37.5, status: "ACCRUED", details: "Class: SAT Math (1.5h)" },
    { id: 3, date: "Jul 15, 2026", type: "PAYOUT", user: "Mr. Davis (Teacher)", amount: -650, status: "COMPLETED", details: "Bi-Weekly Bank Transfer" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            Financial & Payment Management
          </h2>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            Global ledger of all payments, hours, and earnings.
          </p>
        </div>
        
        <Dialog>
          <DialogTrigger render={<Button className="bg-brand-cyan hover:bg-brand-cyan/90 text-white" />}>
            <CreditCard className="w-4 h-4 mr-2" />
            Register Payment
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Register Manual Payment</DialogTitle>
              <DialogDescription>
                Record a bank transfer to automatically grant hour packages to a student.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Student Email</Label>
                <Input placeholder="student@mathbuddy.com" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Amount Paid ($)</Label>
                  <Input type="number" placeholder="200" />
                </div>
                <div className="space-y-2">
                  <Label>Hours to Grant</Label>
                  <Input type="number" placeholder="10" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Reference / Concept</Label>
                <Input placeholder="Transfer #123456" />
              </div>
            </div>
            <DialogFooter>
              <Button className="bg-brand-cyan hover:bg-brand-cyan/90 text-white">Verify & Grant Hours</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="rounded-xl shadow-sm border-gray-100 dark:border-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center">
            <History className="w-5 h-5 mr-2 text-brand-cyan" />
            Global Ledger
          </CardTitle>
          <CardDescription>All transactions across the platform.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell className="font-medium">{tx.date}</TableCell>
                    <TableCell>
                      <span className={`text-xs px-2 py-1 rounded-md font-medium ${
                        tx.type === 'PAYMENT' ? 'bg-green-100 text-green-700' :
                        tx.type === 'EARNING' ? 'bg-blue-100 text-blue-700' :
                        'bg-purple-100 text-purple-700'
                      }`}>
                        {tx.type}
                      </span>
                    </TableCell>
                    <TableCell>{tx.user}</TableCell>
                    <TableCell className="text-muted-foreground">{tx.details}</TableCell>
                    <TableCell className={`text-right font-semibold ${tx.amount < 0 ? 'text-red-500' : 'text-green-600 dark:text-green-400'}`}>
                      {tx.amount < 0 ? `-$${Math.abs(tx.amount).toFixed(2)}` : `+$${tx.amount.toFixed(2)}`}
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-muted-foreground">{tx.status}</span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
