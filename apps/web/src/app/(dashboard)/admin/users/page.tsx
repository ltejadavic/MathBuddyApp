"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus, Edit, Trash2, ShieldAlert } from "lucide-react";

export default function AdminUsersPage() {
  const [activeTab, setActiveTab] = useState<"STUDENT" | "TEACHER" | "ADMIN">("STUDENT");

  const users = [
    { id: 1, name: "Alice Smith", email: "student@mathbuddy.com", role: "STUDENT", status: "ACTIVE" },
    { id: 2, name: "Bob Johnson", email: "bob@example.com", role: "STUDENT", status: "ACTIVE" },
    { id: 3, name: "Mr. Davis", email: "teacher@mathbuddy.com", role: "TEACHER", status: "ACTIVE" },
    { id: 4, name: "Super Admin", email: "admin@mathbuddy.com", role: "ADMIN", status: "ACTIVE" },
  ];

  const filteredUsers = users.filter((u) => u.role === activeTab);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            User Management
          </h2>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            Create, edit, and deactivate users across the platform.
          </p>
        </div>
        <Dialog>
          <DialogTrigger render={<Button className="bg-brand-cyan hover:bg-brand-cyan/90 text-white" />}>
            <UserPlus className="w-4 h-4 mr-2" />
            Add New User
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New User</DialogTitle>
              <DialogDescription>Add a new student, teacher, or admin to the platform.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input placeholder="John Doe" />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" placeholder="john@example.com" />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <select className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-cyan dark:border-gray-700 dark:bg-gray-800">
                  <option value="STUDENT">Student</option>
                  <option value="TEACHER">Teacher</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
            </div>
            <DialogFooter>
              <Button className="bg-brand-cyan hover:bg-brand-cyan/90 text-white">Create User</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="rounded-xl shadow-sm border-gray-100 dark:border-gray-800">
        <CardHeader>
          <CardTitle>Platform Users</CardTitle>
          <CardDescription>View and manage all registered accounts.</CardDescription>
          
          <div className="flex space-x-2 mt-4 border-b border-gray-200 dark:border-gray-800 pb-2">
            <Button 
              variant={activeTab === "STUDENT" ? "default" : "ghost"} 
              size="sm"
              onClick={() => setActiveTab("STUDENT")}
              className={activeTab === "STUDENT" ? "bg-brand-cyan hover:bg-brand-cyan/90 text-white" : ""}
            >
              Students
            </Button>
            <Button 
              variant={activeTab === "TEACHER" ? "default" : "ghost"} 
              size="sm"
              onClick={() => setActiveTab("TEACHER")}
              className={activeTab === "TEACHER" ? "bg-brand-cyan hover:bg-brand-cyan/90 text-white" : ""}
            >
              Teachers
            </Button>
            <Button 
              variant={activeTab === "ADMIN" ? "default" : "ghost"} 
              size="sm"
              onClick={() => setActiveTab("ADMIN")}
              className={activeTab === "ADMIN" ? "bg-brand-cyan hover:bg-brand-cyan/90 text-white" : ""}
            >
              Admins
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.name}</TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>{u.role}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                        {u.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right flex justify-end gap-2">
                      <Button variant="ghost" size="icon" className="text-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20">
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
                      <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
                        {u.role === 'ADMIN' ? <ShieldAlert className="h-4 w-4" /> : <Trash2 className="h-4 w-4" />}
                        <span className="sr-only">Delete</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            {filteredUsers.length === 0 && (
              <div className="text-center py-6 text-muted-foreground">
                No users found for this role.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
