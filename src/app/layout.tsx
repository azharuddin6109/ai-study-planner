import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";

export const metadata: Metadata = {
  title: "AI Study Planner",
  description: "A simple study planner app built with Next.js",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-slate-950 text-white">
        <nav className="w-full border-b border-slate-800 bg-slate-900">
          <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
            <Link href="/" className="text-xl font-bold">
              AI Study Planner
            </Link>

            <div className="flex gap-6 text-sm">
              <Link href="/" className="hover:text-blue-400">
                Home
              </Link>
              <Link href="/login" className="hover:text-blue-400">
                Login
              </Link>
              <Link href="/dashboard" className="hover:text-blue-400">
                Dashboard
              </Link>
            </div>
          </div>
        </nav>

        {children}
      </body>
    </html>
  );
}