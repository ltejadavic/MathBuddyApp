"use client";

import { useAuthStore } from "@/store/auth-store";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import { LogOut, User, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { SidebarContent } from "./Sidebar";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";

export function Navbar() {
  const { user, clearAuth } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Close the sheet when path changes
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    try {
      await apiClient.post("/auth/logout");
    } catch (error) {
      console.error("Logout error", error);
    } finally {
      clearAuth();
      router.push("/login");
    }
  };

  if (!user) return null;

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 md:px-6">
      <div className="flex items-center gap-4 flex-1">
        <Sheet open={open} onOpenChange={setOpen}>
          <Button variant="ghost" size="icon" className="md:hidden shrink-0" onClick={() => setOpen(true)}>
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle menu</span>
          </Button>
          <SheetContent side="left" className="p-0 w-64">
            <div className="flex flex-col h-full bg-white dark:bg-gray-900">
              <SidebarContent />
            </div>
          </SheetContent>
        </Sheet>
        
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white capitalize truncate">
          {user.role.toLowerCase()} Portal
        </h1>
      </div>
      
      <div className="flex items-center space-x-2 md:space-x-4">
        <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
          <User className="h-4 w-4 md:mr-2" />
          <span className="hidden sm:inline-block truncate max-w-[120px] md:max-w-[200px]">{user.email}</span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleLogout}
          className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
        >
          <LogOut className="h-4 w-4 md:mr-2" />
          <span className="hidden md:inline-block">Log out</span>
        </Button>
      </div>
    </header>
  );
}
