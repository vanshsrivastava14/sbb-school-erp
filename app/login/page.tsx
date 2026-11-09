"use client";

import { useState, Suspense } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { loginAction } from "@/app/actions/auth";
import { Lock, Mail, ShieldCheck, UserCheck, ArrowRight, School } from "lucide-react";

function LoginForm() {
  const searchParams = useSearchParams();
  const redirect = searchParams.get("from") || "";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const setCredentials = (role: "admin" | "teacher") => {
    if (role === "admin") {
      setEmail("admin@sbbschool.com");
      setPassword("Admin@1988");
    } else {
      setEmail("swati@sbbschool.com");
      setPassword("Teacher@1988");
    }
    setError(null);
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData();
    formData.set("email", email);
    formData.set("password", password);
    if (redirect) {
      formData.set("redirect", redirect);
    }

    try {
      const res = await loginAction(undefined, formData);
      if (res?.error) {
        setError(res.error);
        setIsSubmitting(false);
      }
    } catch (err: any) {
      if (err?.message?.includes("NEXT_REDIRECT")) {
        return;
      }
      setError("An unexpected error occurred. Please try again.");
      setIsSubmitting(false);
    }
  }

  return (
    <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-amber-500/20">
      {/* Header with Emblem */}
      <div className="bg-[#0f2537] px-8 pt-8 pb-6 text-center text-white relative">
        <div className="mx-auto w-24 h-24 relative mb-3 bg-white/10 rounded-full p-1.5 backdrop-blur-sm border border-amber-400/40 shadow-inner flex items-center justify-center">
          <Image
            src="/images/school-emblem.png"
            alt="S.B.B. Children School Emblem"
            width={88}
            height={88}
            priority
            className="object-contain"
          />
        </div>
        <h1 className="text-xl font-bold tracking-tight text-white uppercase font-serif">
          S.B.B Children School
        </h1>
        <p className="text-xs text-amber-300 font-medium tracking-wide">
          Gandhi Nagar Kunda, Pratapgarh (Estd. 1988)
        </p>
        <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-400/15 border border-amber-400/30 text-amber-200 text-xs">
          <School className="w-3.5 h-3.5" /> School ERP & Marks Portal
        </div>
      </div>

      {/* Form Body */}
      <div className="p-8">
        {error && (
          <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
            <span className="font-semibold">Error:</span> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                name="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@sbbschool.com"
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#153856] focus:border-transparent transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type="password"
                name="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#153856] focus:border-transparent transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-2 py-3 px-4 bg-[#0f2537] hover:bg-[#183e60] text-white font-medium text-sm rounded-xl shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {isSubmitting ? (
              <span>Signing In...</span>
            ) : (
              <>
                <span>Sign In to Portal</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Fill Buttons */}
        <div className="mt-6 pt-5 border-t border-slate-100">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider text-center mb-3">
            One-Click Role Demonstration
          </p>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => setCredentials("admin")}
              className="py-2 px-3 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
              Admin (Principal)
            </button>
            <button
              type="button"
              onClick={() => setCredentials("teacher")}
              className="py-2 px-3 bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-900 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition"
            >
              <UserCheck className="w-3.5 h-3.5 text-sky-700" />
              Teacher (Swati)
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-slate-50 px-8 py-3 text-center border-t border-slate-100">
        <p className="text-[11px] text-slate-400">
          Official School Record Portal • Secure Authentication
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f2537] via-[#153856] to-[#0f2537] flex flex-col justify-center items-center p-4">
      <Suspense fallback={<div className="text-white text-xs">Loading login portal...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
