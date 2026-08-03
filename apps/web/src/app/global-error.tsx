"use client";

import { useEffect } from 'react';
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Global Error Boundary caught:', error);
  }, [error]);

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased bg-gray-50 dark:bg-gray-950`}>
        <div className="min-h-screen flex flex-col items-center justify-center px-4">
          <div className="max-w-md w-full bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 p-8 text-center flex flex-col items-center">
            
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Critical System Error
            </h2>
            
            <div className="bg-gray-100 dark:bg-gray-950 p-4 rounded-lg w-full mb-6 text-left overflow-hidden">
              <p className="text-sm font-mono text-gray-700 dark:text-gray-300 break-words">
                {error.message || 'An unexpected error occurred while loading the application.'}
              </p>
              {error.digest && (
                <p className="text-xs text-gray-500 mt-2">Error ID: {error.digest}</p>
              )}
            </div>

            <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
              Please check the browser console for more technical details.
            </p>

            <button 
              onClick={() => window.location.href = '/'}
              className="flex items-center justify-center w-full px-4 py-2 bg-[#06b6d4] hover:bg-[#06b6d4]/90 text-white rounded-md font-medium transition-colors"
            >
              Return to Home
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
