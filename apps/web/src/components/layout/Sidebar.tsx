"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";
import { 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  Calendar,
  Calculator,
  Wallet,
  CalendarDays,
  History,
  FolderOpen,
  UserCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

export function SidebarContent() {
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);

  if (!user) return null;

  const adminLinks = [
    { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { name: "Users", href: "/admin/users", icon: Users },
    { name: "Academic Setup", href: "/admin/academic", icon: BookOpen },
    { name: "Schedule", href: "/admin/schedule", icon: Calendar },
    { name: "Financials", href: "/admin/financials", icon: Wallet },
  ];

  const teacherLinks = [
    { name: "Dashboard", href: "/teacher", icon: LayoutDashboard },
    { name: "Schedule", href: "/teacher/schedule", icon: CalendarDays },
    { name: "Classes", href: "/teacher/classes", icon: BookOpen },
    { name: "Resources", href: "/teacher/resources", icon: FolderOpen },
    { name: "Earnings", href: "/teacher/earnings", icon: Wallet },
  ];

  const studentLinks = [
    { name: "Dashboard", href: "/student", icon: LayoutDashboard },
    { name: "Book Classes", href: "/student/schedule", icon: CalendarDays },
    { name: "Class History", href: "/student/history", icon: History },
    { name: "Resources", href: "/student/resources", icon: FolderOpen },
    { name: "Profile", href: "/student/profile", icon: UserCircle },
  ];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let links: any[] = [];
  if (user.role === "ADMIN") links = adminLinks;
  else if (user.role === "TEACHER") links = teacherLinks;
  else if (user.role === "STUDENT") links = studentLinks;

  return (
    <>
      <div className="flex h-16 items-center px-6 border-b border-gray-200 dark:border-gray-800 shrink-0">
        <Calculator className="h-6 w-6 text-brand-cyan" />
        <span className="ml-3 text-lg font-bold text-gray-900 dark:text-white">
          MathBuddy
        </span>
      </div>
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href || pathname.startsWith(link.href + "/");
          return (
            <Link
              key={link.name}
              href={link.href}
              className={cn(
                "group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                isActive
                  ? "bg-brand-cyan/10 text-brand-cyan"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              )}
            >
              <Icon
                className={cn(
                  "flex-shrink-0 mr-3 h-5 w-5",
                  isActive ? "text-brand-cyan" : "text-gray-400 group-hover:text-gray-500"
                )}
              />
              {link.name}
            </Link>
          );
        })}
      </div>
    </>
  );
}

export function Sidebar() {
  return (
    <div className="hidden md:flex h-full w-64 flex-col bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800">
      <SidebarContent />
    </div>
  );
}
