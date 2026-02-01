"use client";

import React, { useState } from "react";
import { loginAction } from "@/app/actions/auth";
import { Loader2, AlertCircle } from "lucide-react";
import Image from "next/image";

export default function LoginPage() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    console.log('[LOGIN PAGE] Form submitted')

    const formData = new FormData(e.currentTarget);
    const res = await loginAction(formData);

    console.log('[LOGIN PAGE] loginAction response:', res)

    if (res && 'error' in res && res.error) {
      console.log('[LOGIN PAGE] Error received:', res.error)
      setError(res.error);
      setLoading(false);
    } else if (res?.success && res?.redirectUrl) {
      console.log('[LOGIN PAGE] Success! Redirecting to:', res.redirectUrl)
      // Hard browser reload to ensure cookies are properly read
      window.location.href = res.redirectUrl;
    } else {
      console.log('[LOGIN PAGE] Unexpected response:', res)
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fdfaf7]">
      <div className="w-full max-w-[400px] p-8">
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <Image
            src="/SwipyEat_Logo_Clean.png"
            alt="SwipyEat Logo"
            width={120}
            height={80}
            className="object-contain"
            priority
          />
        </div>

        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome Back!</h1>
          <p className="text-gray-500 text-sm">Please enter your details</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-900">Email</label>
            <input
              name="email"
              type="email"
              placeholder="Enter your email"
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-[#f97316] focus:border-transparent transition-all placeholder:text-gray-400 font-medium"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-900">Password</label>
            <input
              name="password"
              type="password"
              placeholder="Enter your password"
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-[#f97316] focus:border-transparent transition-all placeholder:text-gray-400 font-medium"
            />
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-100 flex items-center gap-2 text-sm text-red-600 font-bold">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#f97316] hover:bg-[#ea580c] text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-orange-500/20 flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}
