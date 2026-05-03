"use client";

import { useEffect } from "react";
import { ShieldAlert, RefreshCcw, ShieldCheck } from "lucide-react";
import Link from "next/link";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Admin Route Error Boundary:", error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-8 text-center bg-[#050505] rounded-3xl border border-purple-500/20 shadow-[0_0_50px_rgba(168,85,247,0.1)]">
      <div className="mb-6 p-5 bg-purple-500/10 rounded-2xl border border-purple-500/30 animate-pulse">
        <ShieldAlert className="w-14 h-14 text-purple-400" />
      </div>
      
      <h2 className="text-3xl font-extrabold text-white mb-4 tracking-tight">
        Admin Module Exception
      </h2>
      <p className="text-slate-400 max-w-md mb-10 leading-relaxed">
        A critical error occurred within the administrative interface. System logs have been updated with the stack trace.
      </p>

      <div className="flex flex-col sm:flex-row gap-5">
        <button
          onClick={() => reset()}
          className="flex items-center justify-center gap-3 px-8 py-4 bg-purple-600 text-white font-bold rounded-2xl hover:bg-purple-500 transition-all shadow-[0_0_25px_rgba(168,85,247,0.4)]"
        >
          <RefreshCcw className="w-5 h-5" />
          Relaunch Component
        </button>
        
        <Link
          href="/admin/dashboard"
          className="flex items-center justify-center gap-3 px-8 py-4 bg-white/5 text-slate-300 font-bold rounded-2xl hover:bg-white/10 transition-all border border-white/10"
        >
          <ShieldCheck className="w-5 h-5" />
          Admin Dashboard
        </Link>
      </div>

      <div className="mt-12 p-4 bg-black/40 rounded-xl border border-white/5 text-left max-w-lg w-full">
        <p className="text-[10px] text-purple-400/60 font-mono uppercase tracking-widest mb-2">Technical Details</p>
        <p className="text-xs text-slate-500 font-mono break-all leading-tight">
          {error.message || "Unknown administrative runtime error"}
          <br />
          <span className="mt-1 block opacity-50">ID: {error.digest || "ADMIN_SEC_ERR"}</span>
        </p>
      </div>
    </div>
  );
}
