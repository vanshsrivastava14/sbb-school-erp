"use client";

import { useState } from "react";
import AppHeader from "./AppHeader";
import AppSidebar from "./AppSidebar";

interface TeacherShellProps {
  user: {
    fullName: string;
    email: string;
    role: "admin" | "teacher";
  };
  currentSessionName: string;
  children: React.ReactNode;
}

export default function TeacherShell({ user, currentSessionName, children }: TeacherShellProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <AppHeader
        user={user}
        currentSessionName={currentSessionName}
        onMobileMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        isMobileMenuOpen={isMobileMenuOpen}
      />
      <div className="flex-1 flex flex-row">
        <AppSidebar
          role="teacher"
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
        />
        <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl mx-auto w-full overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
