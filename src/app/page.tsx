"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function Home() {
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

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 px-6 py-16 text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-80px] top-[-60px] h-72 w-72 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="absolute bottom-[-100px] right-[-60px] h-80 w-80 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="absolute left-1/2 top-1/3 h-56 w-56 -translate-x-1/2 rounded-full bg-cyan-400/10 blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-[85vh] max-w-6xl items-center">
        <div className="grid w-full gap-12 lg:grid-cols-2 lg:items-center">
          <section>
            <div className="mb-5 inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-blue-200 backdrop-blur-md">
              AI-powered planning for focused students
            </div>

            <h1 className="mb-6 max-w-3xl text-5xl font-bold leading-tight text-white sm:text-6xl">
              Plan your study life with clarity, structure, and momentum
            </h1>

            <p className="mb-8 max-w-2xl text-lg leading-8 text-slate-300">
              AI Study Planner helps you organize tasks, track deadlines, and stay
              on top of your academic workload with a cleaner, smarter workspace.
            </p>
<div className="flex flex-col gap-4 sm:flex-row">
  <Link
    href={isLoggedIn ? "/dashboard" : "/login"}
    className="rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-7 py-3 text-center font-semibold text-white transition hover:scale-[1.01] hover:from-blue-500 hover:to-indigo-500"
  >
    {isLoggedIn ? "Go to Dashboard" : "Get Started"}
  </Link>

  {!isLoggedIn && (
    <Link
      href="/dashboard"
      className="rounded-2xl border border-white/10 bg-white/5 px-7 py-3 text-center font-semibold text-slate-100 transition hover:bg-white/10"
    >
      View Dashboard
    </Link>
  )}
</div>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-md">
                <p className="mb-2 text-sm font-semibold text-blue-200">Task tracking</p>
                <p className="text-sm leading-6 text-slate-300">
                  Keep all your academic tasks in one organized place.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-md">
                <p className="mb-2 text-sm font-semibold text-blue-200">Deadline clarity</p>
                <p className="text-sm leading-6 text-slate-300">
                  Stay aware of what is due next without feeling overwhelmed.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-md">
                <p className="mb-2 text-sm font-semibold text-blue-200">Smarter workflow</p>
                <p className="text-sm leading-6 text-slate-300">
                  Build better study habits with a cleaner daily system.
                </p>
              </div>
            </div>
          </section>

          <section className="mx-auto w-full max-w-xl">
            <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-6 shadow-2xl shadow-black/30 backdrop-blur-xl sm:p-8">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium uppercase tracking-[0.2em] text-blue-200">
                    Preview
                  </p>
                  <h2 className="mt-2 text-2xl font-bold text-white">
                    Your smarter study workspace
                  </h2>
                </div>

                <div className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-sm font-medium text-emerald-300">
                  Active
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="mb-3 flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-semibold text-white">Finish calculus review</h3>
                      <p className="mt-1 text-sm text-slate-400">Subject: Math</p>
                    </div>
                    <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-300">
                      Pending
                    </span>
                  </div>
                  <p className="text-sm text-slate-300">Deadline: Tomorrow</p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="mb-3 flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-semibold text-white">Prepare biology notes</h3>
                      <p className="mt-1 text-sm text-slate-400">Subject: Biology</p>
                    </div>
                    <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">
                      Completed
                    </span>
                  </div>
                  <p className="text-sm text-slate-300">Deadline: This week</p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="mb-3 flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-semibold text-white">Draft history outline</h3>
                      <p className="mt-1 text-sm text-slate-400">Subject: History</p>
                    </div>
                    <span className="rounded-full bg-violet-500/10 px-3 py-1 text-xs font-medium text-violet-300">
                      AI Plan Ready
                    </span>
                  </div>
                  <p className="text-sm text-slate-300">Deadline: Friday</p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}