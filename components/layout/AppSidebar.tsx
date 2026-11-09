"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  Layers,
  FileSpreadsheet,
  FileText,
  History,
  Settings,
  ChevronRight,
  ClipboardEdit,
  Send,
  X,
} from "lucide-react";

interface AppSidebarProps {
  role: "admin" | "teacher";
  isOpen?: boolean;
  onClose?: () => void;
}

export default function AppSidebar({ role, isOpen, onClose }: AppSidebarProps) {
  const pathname = usePathname();

  const adminLinks = [
    { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { label: "Students (410+)", href: "/admin/students", icon: Users },
    { label: "Teachers & Staff", href: "/admin/teachers", icon: GraduationCap },
    { label: "Classes & Subjects", href: "/admin/classes", icon: Layers },
    { label: "Marks Management", href: "/admin/marks", icon: FileSpreadsheet },
    { label: "Report Cards", href: "/admin/reports", icon: FileText },
    { label: "Audit Logs", href: "/admin/audit", icon: History },
  ];

  const teacherLinks = [
    { label: "Teacher Dashboard", href: "/teacher", icon: LayoutDashboard },
    { label: "My Classes & Students", href: "/teacher/classes", icon: Users },
    { label: "Marks Entry", href: "/teacher/marks", icon: ClipboardEdit },
    { label: "My Submissions", href: "/teacher/submissions", icon: Send },
    { label: "Report Cards Preview", href: "/teacher/reports", icon: FileText },
  ];

  const links = role === "admin" ? adminLinks : teacherLinks;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 md:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 w-64 bg-[#0f2537] text-slate-200 z-50 flex flex-col transition-transform duration-300 md:static md:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Mobile Header in Drawer */}
        <div className="p-4 flex items-center justify-between border-b border-white/10 md:hidden">
          <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">
            Navigation Menu
          </span>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Section */}
        <div className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            {role === "admin" ? "Administration Menu" : "Teacher Marks Menu"}
          </div>

          {links.map((link) => {
            const Icon = link.icon;
            const isActive =
              link.href === "/admin" || link.href === "/teacher"
                ? pathname === link.href
                : pathname.startsWith(link.href);

            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={onClose}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition ${
                  isActive
                    ? "bg-amber-400/20 text-amber-300 border border-amber-400/30 font-semibold"
                    : "text-slate-300 hover:bg-white/5 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 ${
                      isActive ? "text-amber-400" : "text-slate-400"
                    }`}
                  />
                  <span>{link.label}</span>
                </div>
                {isActive && <ChevronRight className="w-3.5 h-3.5 text-amber-300" />}
              </Link>
            );
          })}
        </div>

        {/* Bottom Role Info Card */}
        <div className="p-4 border-t border-white/10 bg-black/20">
          <div className="flex items-center gap-2 text-xs">
            <span
              className={`w-2 h-2 rounded-full ${
                role === "admin" ? "bg-amber-400" : "bg-sky-400"
              }`}
            />
            <span className="font-semibold capitalize text-slate-200">
              {role === "admin" ? "Admin Access" : "Teacher Access"}
            </span>
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">
            S.B.B. ERP Version 1.0
          </p>
        </div>
      </aside>
    </>
  );
}
