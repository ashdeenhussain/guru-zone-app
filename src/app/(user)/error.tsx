"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCcw, LayoutDashboard } from "lucide-react";
import Link from "next/link";

export default function UserError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("User Route Error Boundary:", error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center bg-background/50 backdrop-blur-sm rounded-3xl border border-white/5 my-8 mx-4">
      <div className="mb-6 p-4 bg-yellow-500/10 rounded-full border border-yellow-500/20">
        <AlertTriangle className="w-12 h-12 text-primary" />
      </div>
      
      <h2 className="text-2xl font-bold text-foreground mb-3">
        Dashboard Interrupted
      </h2>
      <p className="text-muted-foreground max-w-sm mb-8">
        We encountered a problem while loading this part of your dashboard. Don't worry, your data is safe.
      </p>

      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-xs sm:max-w-none justify-center">
        <button
          onClick={() => reset()}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:opacity-90 transition-all"
        >
          <RefreshCcw className="w-4 h-4" />
          Try Again
        </button>
        
        <Link
          href="/dashboard"
          className="flex items-center justify-center gap-2 px-6 py-3 bg-muted text-foreground font-semibold rounded-xl hover:bg-muted/80 transition-all border border-white/5"
        >
          <LayoutDashboard className="w-4 h-4" />
          Reset Dashboard
        </Link>
      </div>

      <p className="mt-8 text-[10px] text-muted-foreground/40 font-mono">
        Ref: {error.digest || "USER_DASHBOARD_ERR"}
      </p>
    </div>
  );
}
