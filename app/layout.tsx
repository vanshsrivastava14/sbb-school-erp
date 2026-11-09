import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "S.B.B Children School — ERP & Report Card System",
  description: "Official School ERP and Report Card Management System for S.B.B Children School, Gandhi Nagar Kunda, Pratapgarh",
  icons: {
    icon: "/images/school-emblem.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-800 antialiased font-sans">
        {children}
      </body>
    </html>
  );
}
