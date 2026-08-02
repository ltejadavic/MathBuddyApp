"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';

export default function Home() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    if (user?.role) {
      router.replace(`/${user.role.toLowerCase()}`);
    } else {
      router.replace('/login');
    }
  }, [user, router]);

  return (
    <div className="flex h-screen w-screen items-center justify-center">
      <div className="animate-pulse flex flex-col items-center">
        <div className="h-8 w-8 border-4 border-brand-cyan border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-gray-500">Loading...</p>
      </div>
    </div>
  );
}
