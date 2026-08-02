"use client";

import { useAuthStore } from "@/store/auth-store";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import { LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Navbar() {
  const { user, clearAuth } = useAuthStore();
  const router = useRouter();

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
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-6">
      <div className="flex flex-1 items-center">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white capitalize">
          {user.role.toLowerCase()} Portal
        </h1>
      </div>
      <div className="flex items-center space-x-4">
        <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
          <User className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline-block">{user.email}</span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleLogout}
          className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Log out
        </Button>
      </div>
    </header>
  );
}
