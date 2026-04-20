"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loadingAction, setLoadingAction] = useState<
    "login" | "signup" | "reset" | null
  >(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        router.replace("/dashboard");
      }
    };

    checkUser();
  }, [router]);

  const clearMessages = () => {
    setErrorMessage("");
    setSuccessMessage("");
  };

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    clearMessages();
    setLoadingAction("login");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErrorMessage(error.message);
      setLoadingAction(null);
      return;
    }

    setSuccessMessage("Login successful. Redirecting to your dashboard...");
    setLoadingAction(null);
    router.push("/dashboard");
  };

  const handleCreateAccount = async () => {
    clearMessages();

    if (!email || !password) {
      setErrorMessage("Please enter both email and password first.");
      return;
    }

    setLoadingAction("signup");

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setErrorMessage(error.message);
      setLoadingAction(null);
      return;
    }

    setSuccessMessage(
      "Account created successfully. Check your email if confirmation is required, then log in."
    );
    setLoadingAction(null);
  };

  const handleForgotPassword = async () => {
    clearMessages();

    if (!email) {
      setErrorMessage("Enter your email first to reset your password.");
      return;
    }

    setLoadingAction("reset");

    const redirectTo = `${window.location.origin}/reset-password`;

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    if (error) {
      setErrorMessage(error.message);
      setLoadingAction(null);
      return;
    }

    setSuccessMessage(
      "Password reset email sent. Check your inbox and open the reset link."
    );
    setLoadingAction(null);
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 px-6 py-16 text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-80px] top-[-60px] h-72 w-72 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="absolute bottom-[-100px] right-[-60px] h-80 w-80 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="absolute left-1/2 top-1/3 h-56 w-56 -translate-x-1/2 rounded-full bg-cyan-400/10 blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-[80vh] max-w-6xl items-center justify-center">
        <div className="grid w-full max-w-5xl gap-10 lg:grid-cols-2 lg:items-center">
          <section className="hidden lg:block">
            <div className="max-w-xl">
              <div className="mb-5 inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-blue-200 backdrop-blur-md">
                Smart planning for better study days
              </div>

              <h1 className="mb-5 text-4xl font-bold leading-tight text-white xl:text-5xl">
                Study smarter with a planner that actually feels modern
              </h1>

              <p className="mb-8 max-w-lg text-lg leading-8 text-slate-300">
                Organize deadlines, manage subjects, and keep your study flow clear
                with a clean workspace built for focused students.
              </p>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-md">
                  <p className="mb-2 text-sm font-semibold text-blue-200">Focused workflow</p>
                  <p className="text-sm leading-6 text-slate-300">
                    Track pending and completed tasks without a cluttered dashboard.
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-md">
                  <p className="mb-2 text-sm font-semibold text-blue-200">Built for your data</p>
                  <p className="text-sm leading-6 text-slate-300">
                    Your tasks stay connected to your account and remain available every time you return.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="mx-auto w-full max-w-md">
            <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-8 shadow-2xl shadow-black/30 backdrop-blur-xl sm:p-10">
              <div className="mb-8">
                <div className="mb-4 inline-flex rounded-full border border-blue-400/20 bg-blue-500/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-blue-200">
                  AI Study Planner
                </div>

                <h2 className="mb-2 text-3xl font-bold tracking-tight text-white">
                  Welcome back
                </h2>

                <p className="text-sm leading-6 text-slate-300">
                  Log in to manage your study tasks, deadlines, and progress in one place.
                </p>
              </div>

              <form onSubmit={handleLogin} className="space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-200">
                    Email
                  </label>
                  <input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-slate-400 focus:border-blue-400/60 focus:bg-white/10 focus:ring-2 focus:ring-blue-500/30"
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-200">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 pr-20 text-white outline-none transition placeholder:text-slate-400 focus:border-blue-400/60 focus:bg-white/10 focus:ring-2 focus:ring-blue-500/30"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg px-3 py-1 text-sm font-medium text-slate-300 transition hover:bg-white/10 hover:text-white"
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    disabled={loadingAction !== null}
                    className="text-sm font-medium text-blue-300 transition hover:text-blue-200 disabled:opacity-60"
                  >
                    {loadingAction === "reset" ? "Sending reset email..." : "Forgot Password?"}
                  </button>
                </div>

                {errorMessage && (
                  <p className="text-sm font-medium text-red-400">{errorMessage}</p>
                )}

                {successMessage && (
                  <p className="text-sm font-medium text-emerald-400">{successMessage}</p>
                )}

                <button
                  type="submit"
                  disabled={loadingAction !== null}
                  className="w-full rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 font-semibold text-white transition hover:scale-[1.01] hover:from-blue-500 hover:to-indigo-500 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {loadingAction === "login" ? "Logging in..." : "Log In"}
                </button>

                <button
                  type="button"
                  onClick={handleCreateAccount}
                  disabled={loadingAction !== null}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 font-semibold text-slate-100 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {loadingAction === "signup" ? "Creating account..." : "Create Account"}
                </button>
              </form>

              <div className="mt-8 border-t border-white/10 pt-6">
                <p className="text-sm text-slate-400">
                  Want to go back first?{" "}
                  <Link href="/" className="font-medium text-blue-300 transition hover:text-blue-200">
                    Return home
                  </Link>
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}