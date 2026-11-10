"use client";

import { useState, Suspense } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { loginAction } from "@/app/actions/auth";
import {
  Lock,
  Mail,
  ShieldCheck,
  GraduationCap,
  ArrowRight,
  School,
  Eye,
  EyeOff,
  CheckCircle2,
  Info,
} from "lucide-react";

function LoginForm() {
  const searchParams = useSearchParams();
  const redirect = searchParams.get("from") || "";

  const [activeTab, setActiveTab] = useState<"teacher" | "admin">("teacher");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCredentialsHelp, setShowCredentialsHelp] = useState(false);

  const handleTabChange = (tab: "teacher" | "admin") => {
    setActiveTab(tab);
    setError(null);
    if (tab === "admin" && !email) {
      setEmail("admin@sbbschool.com");
    } else if (tab === "teacher" && email === "admin@sbbschool.com") {
      setEmail("swati@sbbschool.com");
    }
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData();
    formData.set("email", email.trim().toLowerCase());
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
      setError("An unexpected authentication error occurred. Please verify your credentials.");
      setIsSubmitting(false);
    }
  }

  return (
    <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
      {/* Official School Header */}
      <div className="bg-[#0f2537] px-8 pt-8 pb-6 text-center text-white relative">
        {/* Hologram Emblem Seal */}
        <div className="mx-auto w-24 h-24 relative mb-3 bg-white/10 rounded-full p-2 backdrop-blur-sm border-2 border-[#d4a742]/50 shadow-lg flex items-center justify-center">
          <Image
            src="/images/school-emblem.png"
            alt="S.B.B. Children School Emblem"
            width={84}
            height={84}
            priority
            className="object-contain"
          />
        </div>

        <h1 className="text-xl font-bold tracking-tight text-white uppercase font-serif">
          S.B.B Children School
        </h1>
        <p className="text-xs text-amber-300 font-medium tracking-wide mt-0.5">
          Gandhi Nagar Kunda, Pratapgarh (Estd. 1988)
        </p>
        <p className="text-[11px] text-slate-300 mt-0.5">
          Reg. No. 1774/2004-2005 • Academic Session 2026–2027
        </p>

        <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-slate-200 text-xs font-semibold">
          <School className="w-3.5 h-3.5 text-amber-300" />
          <span>School ERP & Marks Management Portal</span>
        </div>
      </div>

      {/* Role Selection Tabs */}
      <div className="grid grid-cols-2 bg-slate-100 border-b border-slate-200 p-1.5 gap-1.5 text-xs font-semibold">
        <button
          type="button"
          onClick={() => handleTabChange("teacher")}
          className={`py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition ${
            activeTab === "teacher"
              ? "bg-white text-[#0f2537] shadow-xs font-bold border border-slate-200"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <GraduationCap className="w-3.5 h-3.5 text-sky-600" />
          <span>Class Teacher Portal</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange("admin")}
          className={`py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition ${
            activeTab === "admin"
              ? "bg-white text-[#0f2537] shadow-xs font-bold border border-slate-200"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
          <span>Administrative Portal</span>
        </button>
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
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              {activeTab === "admin" ? "Administrator Username / Email" : "Class Teacher Username / Email"}
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
                placeholder={activeTab === "admin" ? "admin@sbbschool.com" : "teacher@sbbschool.com"}
                className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0f2537] focus:bg-white transition"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Password
              </label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-[11px] text-slate-500 hover:text-slate-800 flex items-center gap-1"
              >
                {showPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                <span>{showPassword ? "Hide" : "Show"}</span>
              </button>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0f2537] focus:bg-white transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-2 py-3 px-4 bg-[#0f2537] hover:bg-[#183e60] text-white font-semibold text-xs rounded-xl shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {isSubmitting ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <span>Secure Sign In</span>
                <ArrowRight className="w-4 h-4 text-amber-300" />
              </>
            )}
          </button>
        </form>

        {/* Discreet Credentials Reference Toggle */}
        <div className="mt-6 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={() => setShowCredentialsHelp(!showCredentialsHelp)}
            className="w-full text-center text-[11px] text-slate-500 hover:text-slate-800 flex items-center justify-center gap-1 transition"
          >
            <Info className="w-3.5 h-3.5 text-amber-600" />
            <span>Need login credentials or authorized accounts reference?</span>
          </button>

          {showCredentialsHelp && (
            <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-600 text-[11px] space-y-2 animate-in fade-in duration-150">
              <div className="font-bold text-slate-800 border-b border-slate-200 pb-1">
                Authorized School Logins:
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div
                  onClick={() => {
                    setEmail("admin@sbbschool.com");
                    setPassword("admin123");
                    setActiveTab("admin");
                  }}
                  className="p-2 bg-white rounded-lg border border-slate-200 cursor-pointer hover:border-amber-400 transition"
                >
                  <p className="font-bold text-[#0f2537]">Principal (Admin)</p>
                  <p className="font-mono text-[10px] text-slate-500">admin@sbbschool.com</p>
                  <p className="text-[10px] text-amber-700 font-semibold">Pass: admin123</p>
                </div>
                <div
                  onClick={() => {
                    setEmail("swati@sbbschool.com");
                    setPassword("teacher123");
                    setActiveTab("teacher");
                  }}
                  className="p-2 bg-white rounded-lg border border-slate-200 cursor-pointer hover:border-sky-400 transition"
                >
                  <p className="font-bold text-[#0f2537]">Class Teacher (Swati)</p>
                  <p className="font-mono text-[10px] text-slate-500">swati@sbbschool.com</p>
                  <p className="text-[10px] text-sky-700 font-semibold">Pass: teacher123</p>
                </div>
              </div>
              <p className="text-[10px] text-slate-400 italic">
                All 12 class teachers log in with their email and password <code className="text-slate-600 font-semibold">teacher123</code>. Passwords can be changed by the admin anytime in Teacher Management.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Official Footnote */}
      <div className="bg-slate-50 px-8 py-3.5 text-center border-t border-slate-100">
        <p className="text-[11px] text-slate-500 font-medium">
          Official School Administration System • S.B.B. Children School
        </p>
        <p className="text-[10px] text-slate-400 mt-0.5">
          For technical support or faculty credentials assistance: 9451275030
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a1926] via-[#0f2537] to-[#153856] flex flex-col justify-center items-center p-4">
      <Suspense fallback={<div className="text-white text-xs">Loading official portal...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
