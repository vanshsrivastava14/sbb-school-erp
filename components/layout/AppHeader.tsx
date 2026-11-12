"use client";

import Image from "next/image";
import Link from "next/link";
import { logoutAction } from "@/app/actions/auth";
import { LogOut, User, Menu, X, Shield, GraduationCap, School } from "lucide-react";

interface AppHeaderProps {
  user: {
    fullName: string;
    email: string;
    role: "admin" | "teacher";
  };
  currentSessionName?: string;
  onMobileMenuToggle?: () => void;
  isMobileMenuOpen?: boolean;
}

export default function AppHeader({
  user,
  currentSessionName = "2025-2026",
  onMobileMenuToggle,
  isMobileMenuOpen,
}: AppHeaderProps) {
  return (
    <header className="no-print print:hidden bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="px-4 sm:px-6 py-2.5 flex items-center justify-between">
        {/* Left: Mobile Toggle & Brand */}
        <div className="flex items-center gap-3">
          {onMobileMenuToggle && (
            <button
              onClick={onMobileMenuToggle}
              className="md:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
              aria-label="Toggle navigation menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          )}

          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 relative flex-shrink-0">
              <Image
                src="/images/school-emblem.png"
                alt="S.B.B. Emblem"
                width={36}
                height={36}
                className="object-contain"
              />
            </div>
            <div>
              <span className="text-sm font-bold text-[#0f2537] tracking-tight uppercase font-serif hidden sm:inline-block">
                S.B.B Children School
              </span>
              <span className="text-xs font-bold text-[#0f2537] sm:hidden">
                S.B.B. ERP
              </span>
              <p className="text-[10px] text-slate-400 leading-none">Gandhi Nagar Kunda PBH</p>
            </div>
          </div>
        </div>

        {/* Right: Academic Session Badge & User Profile & Logout */}
        <div className="flex items-center gap-2.5 sm:gap-4">
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 border border-amber-200 text-amber-900 rounded-full text-xs font-medium">
            <School className="w-3.5 h-3.5 text-amber-700" />
            <span>Session: <strong>{currentSessionName}</strong></span>
          </div>

          <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
            <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700">
              {user.role === "admin" ? (
                <Shield className="w-4 h-4 text-amber-700" />
              ) : (
                <GraduationCap className="w-4 h-4 text-sky-700" />
              )}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-xs font-semibold text-slate-800 leading-tight">{user.fullName}</p>
              <p className="text-[10px] text-slate-500 capitalize">{user.role}</p>
            </div>
          </div>

          <form action={logoutAction}>
            <button
              type="submit"
              title="Sign Out"
              className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
