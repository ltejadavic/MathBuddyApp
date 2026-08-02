"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { AlertCircle, Home, RefreshCcw } from 'lucide-react';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    // Log the error to an error reporting service (or browser console)
    console.error('App Error Boundary caught:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 p-8 text-center flex flex-col items-center">
        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center text-red-500 mb-6">
          <AlertCircle className="w-8 h-8" />
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Something went wrong!
        </h2>
        
        <div className="bg-gray-100 dark:bg-gray-950 p-4 rounded-lg w-full mb-6 text-left overflow-hidden">
          <p className="text-sm font-mono text-gray-700 dark:text-gray-300 break-words">
            {error.name}: {error.message || 'An unexpected error occurred.'}
          </p>
          {error.digest && (
             <p className="text-xs text-gray-500 mt-2">Error ID: {error.digest}</p>
          )}
        </div>
        
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
          We have recorded this issue. If you need more details, check the browser console.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 w-full justify-center">
          <Button 
            onClick={() => reset()} 
            variant="outline" 
            className="flex items-center gap-2"
          >
            <RefreshCcw className="w-4 h-4" />
            Try again
          </Button>
          <Button 
            onClick={() => router.push('/')}
            className="flex items-center gap-2 bg-brand-cyan hover:bg-brand-cyan/90 text-white"
          >
            <Home className="w-4 h-4" />
            Go to Home
          </Button>
        </div>
      </div>
    </div>
  );
}
