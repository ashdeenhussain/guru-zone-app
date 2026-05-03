"use client";

import { useEffect } from "react";
import { AlertCircle, RefreshCcw, Home } from "lucide-react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Global Error Boundary caught:", error);
  }, [error]);

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-4 text-center">
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
        <div className="relative bg-card border border-white/5 p-6 rounded-2xl shadow-2xl backdrop-blur-xl">
          <AlertCircle className="w-16 h-16 text-primary mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-foreground mb-2">Oops!</h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            Something went wrong rendering this component. Our team has been notified.
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <button
          onClick={() => reset()}
          className="flex items-center gap-2 px-8 py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:scale-105 transition-all shadow-[0_0_20px_rgba(255,215,0,0.3)]"
        >
          <RefreshCcw className="w-5 h-5" />
          Try Again
        </button>
        
        <Link
          href="/"
          className="flex items-center gap-2 px-8 py-3 bg-muted text-foreground font-semibold rounded-xl hover:bg-muted/80 transition-all border border-white/5"
        >
          <Home className="w-5 h-5" />
          Back to Home
        </Link>
      </div>

      <div className="mt-12 text-xs text-muted-foreground font-mono opacity-50">
        Error ID: {error.digest || "N/A"}
      </div>
    </div>
  );
}
