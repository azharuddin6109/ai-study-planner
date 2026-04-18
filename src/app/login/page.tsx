"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "info" | "">("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSignUp = async () => {
    setMessage("Creating account...");
    setMessageType("info");

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setMessage(error.message);
      setMessageType("error");
    } else {
      setMessage("Account created successfully.");
      setMessageType("success");
    }
  };

  const handleSignIn = async () => {
    setMessage("Logging in...");
    setMessageType("info");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage("Invalid email or password.");
      setMessageType("error");
    } else {
      setMessage("Login successful.");
      setMessageType("success");
      router.push("/dashboard");
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-6">
      <div className="w-full max-w-md bg-slate-900 p-8 rounded-2xl shadow-lg">
        <h1 className="text-3xl font-bold mb-2 text-center">Log In</h1>
        <p className="text-sm text-slate-400 text-center mb-6">
          Existing user? Log in below. New here? Create an account.
        </p>

        <div className="space-y-4">
          <div>
            <label className="block mb-2 text-sm text-slate-300">Email</label>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-slate-700 text-white outline-none"
            />
          </div>

          <div>
            <label className="block mb-2 text-sm text-slate-300">Password</label>

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 pr-20 rounded-lg bg-slate-800 border border-slate-700 text-white outline-none"
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-300 hover:text-white"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSignIn}
            className="w-full bg-blue-600 hover:bg-blue-700 py-3 rounded-lg font-medium"
          >
            Log In
          </button>

          <button
            type="button"
            onClick={handleSignUp}
            className="w-full bg-green-600 hover:bg-green-700 py-3 rounded-lg font-medium"
          >
            Create Account
          </button>

          {message && (
            <p
              className={`text-sm mt-2 ${
                messageType === "error"
                  ? "text-red-400"
                  : messageType === "success"
                  ? "text-green-400"
                  : "text-slate-300"
              }`}
            >
              {message}
            </p>
          )}
        </div>
      </div>
    </main>
  );
}