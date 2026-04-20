"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function Navbar() {
  const pathname = usePathname();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setIsLoggedIn(!!user);
    };

    checkUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session?.user);
    });

    return () => subscription.unsubscribe();
  }, []);

  const linkClass = (path: string) =>
    `rounded-full px-4 py-2 transition ${
      pathname === path
        ? "bg-white/10 text-white"
        : "text-slate-200 hover:bg-white/10 hover:text-white"
    }`;

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/70 backdrop-blur-xl">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-blue-400/20 bg-blue-500/10 text-sm font-bold text-blue-200 shadow-lg shadow-blue-500/10">
            AI
          </div>

          <div>
            <p className="text-lg font-bold tracking-tight text-white">
              AI Study Planner
            </p>
            <p className="text-xs text-slate-400">
              Smarter planning for students
            </p>
          </div>
        </Link>

        <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 p-1 text-sm text-slate-200 backdrop-blur-md">
          <Link href="/" className={linkClass("/")}>
            Home
          </Link>

          {!isLoggedIn && (
            <Link href="/login" className={linkClass("/login")}>
              Login
            </Link>
          )}

          <Link href="/dashboard" className={linkClass("/dashboard")}>
            Dashboard
          </Link>
        </div>
      </nav>
    </header>
  );
}