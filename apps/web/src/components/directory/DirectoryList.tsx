"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { MessageCircle, User as UserIcon, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/auth-store";

interface DirectoryUser {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  role: string;
  isActive: boolean;
}

interface DirectoryListProps {
  endpoint: string;
  title: string;
  description: string;
}

export function DirectoryList({ endpoint, title, description }: DirectoryListProps) {
  const [users, setUsers] = useState<DirectoryUser[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const currentUser = useAuthStore((state) => state.user);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { data } = await apiClient.get(endpoint);
        setUsers(data);
      } catch (err) {
        console.error("Failed to fetch directory", err);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [endpoint]);

  const getDisplayName = (u: DirectoryUser) => {
    if (u.firstName || u.lastName) return `${u.firstName || ''} ${u.lastName || ''}`.trim();
    return u.email;
  };

  const handleMessageClick = (userId: string) => {
    router.push(`/messages?userId=${userId}`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
          {title}
        </h1>
        <p className="text-sm text-gray-500">{description}</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-gray-200 dark:border-gray-800 rounded-xl bg-gray-50 dark:bg-gray-900/50">
          <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-semibold text-gray-900 dark:text-white">No users found</h3>
          <p className="mt-1 text-sm text-gray-500">There are no users to display in this directory.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {users.map((u) => (
            <div key={u.id} className="flex flex-col bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-5 flex items-start gap-4 flex-1">
                <Avatar className="h-12 w-12 border border-gray-100 dark:border-gray-800">
                  <AvatarFallback className="bg-brand-cyan/10 text-brand-cyan">
                    {u.firstName?.[0] || <UserIcon className="h-6 w-6" />}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <Link href={`/profile/${u.id}`} className="block focus:outline-none">
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white truncate hover:text-brand-cyan transition-colors">
                      {getDisplayName(u)}
                    </h3>
                  </Link>
                  <p className="text-sm text-gray-500 truncate capitalize">{u.role.toLowerCase()}</p>
                  
                  <div className="mt-2 flex items-center gap-1.5">
                    <span className={`h-2 w-2 rounded-full ${u.isActive ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                    <span className="text-xs text-gray-500">{u.isActive ? 'Active' : 'Inactive'}</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-900/50 p-3 border-t border-gray-100 dark:border-gray-800 flex justify-end">
                {currentUser?.id !== u.id && (
                  <Button 
                    variant="default" 
                    size="sm" 
                    className="bg-brand-cyan hover:bg-brand-cyan/90 text-white w-full sm:w-auto"
                    onClick={() => handleMessageClick(u.id)}
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Message
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
