"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { requestOtp, OTPResponse } from "@/lib/api";
import { ShieldCheck, ArrowRight, ArrowLeft, KeyRound, User as UserIcon, Sparkles } from "lucide-react";

interface LoginViewProps {
  onSuccess?: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onSuccess }) => {
  const { login, register } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [identifier, setIdentifier] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"identifier" | "otp">("identifier");
  const [otpInfo, setOtpInfo] = useState<OTPResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Register fields
  const [regUsername, setRegUsername] = useState("");
  const [regDisplayName, setRegDisplayName] = useState("");
  const [regPhone, setRegPhone] = useState("");

  const handleRequestOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const id = (isRegister ? regUsername : identifier).trim();
    if (!id) {
      setError("Please enter a username or phone number");
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const res = await requestOtp(id);
      setOtpInfo(res);
      setOtp(res.otp); // pre-populate with backend provided mock OTP for frictionless evaluation
      setStep("otp");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to request verification code";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!otp.trim()) {
      setError("Please enter the verification code");
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      if (isRegister) {
        await register({
          username: regUsername.trim().toLowerCase(),
          display_name: regDisplayName.trim(),
          phone: regPhone.trim() || undefined,
          otp: otp.trim(),
        });
      } else {
        await login(identifier.trim(), otp.trim());
      }
      onSuccess?.();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Authentication failed";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Quick switch demo button handler
  const handleQuickLogin = async (demoUsername: string) => {
    setIsRegister(false);
    setIdentifier(demoUsername);
    setError(null);
    setIsLoading(true);
    try {
      const res = await requestOtp(demoUsername);
      setOtpInfo(res);
      await login(demoUsername, res.otp);
      onSuccess?.();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Quick login failed";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen flex flex-col items-center justify-center p-4 bg-zinc-50 dark:bg-[#121212] select-none text-zinc-900 dark:text-zinc-100">
      <div className="w-full max-w-md bg-white dark:bg-[#1a1a1a] rounded-3xl shadow-xl border border-zinc-200 dark:border-[#282828] p-8 relative overflow-hidden">
        {/* Top Decorative Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-[#2C6BED] text-white flex items-center justify-center shadow-lg shadow-[#2C6BED]/20 mb-3">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
            Signal Web
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-xs">
            Fast, simple, and private messaging. Verify your account to continue.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-medium">
            {error}
          </div>
        )}

        {/* Demo OTP Banner if requested */}
        {otpInfo && step === "otp" && (
          <div className="mb-5 p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-[#2C6BED]/30 text-[#2C6BED] dark:text-blue-300 text-xs flex items-center gap-2">
            <KeyRound className="w-4 h-4 flex-shrink-0" />
            <div>
              <p className="font-semibold">Evaluation Mode Code: {otpInfo.otp}</p>
              <p className="text-[11px] opacity-80">{otpInfo.message}</p>
            </div>
          </div>
        )}

        {/* Step 1: Identifier Input Form */}
        {step === "identifier" && (
          <form onSubmit={handleRequestOtp} className="space-y-4">
            {!isRegister ? (
              <div>
                <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-300 mb-1.5">
                  Phone Number or Username
                </label>
                <div className="relative flex items-center">
                  <UserIcon className="w-4 h-4 text-zinc-400 absolute left-3.5" />
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="e.g. rahul or +12025550101"
                    className="w-full bg-zinc-100 dark:bg-[#242424] text-zinc-900 dark:text-zinc-100 pl-10 pr-4 py-2.5 rounded-xl text-sm border border-transparent focus:border-[#2C6BED] focus:bg-white dark:focus:bg-[#202020] focus:outline-none transition-all"
                    required
                    autoFocus
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-300 mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value)}
                    placeholder="e.g. priya_tech"
                    className="w-full bg-zinc-100 dark:bg-[#242424] text-zinc-900 dark:text-zinc-100 px-3.5 py-2 rounded-xl text-sm border border-transparent focus:border-[#2C6BED] focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-300 mb-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={regDisplayName}
                    onChange={(e) => setRegDisplayName(e.target.value)}
                    placeholder="e.g. Priya Sharma"
                    className="w-full bg-zinc-100 dark:bg-[#242424] text-zinc-900 dark:text-zinc-100 px-3.5 py-2 rounded-xl text-sm border border-transparent focus:border-[#2C6BED] focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-300 mb-1">
                    Phone Number (optional)
                  </label>
                  <input
                    type="text"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="e.g. +12025550199"
                    className="w-full bg-zinc-100 dark:bg-[#242424] text-zinc-900 dark:text-zinc-100 px-3.5 py-2 rounded-xl text-sm border border-transparent focus:border-[#2C6BED] focus:outline-none"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 bg-[#2C6BED] hover:bg-[#2055c4] active:bg-[#1a46a6] text-white py-2.5 px-4 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 shadow-md transition-all disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (
                "Requesting..."
              ) : (
                <>
                  <span>Continue</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => {
                  setIsRegister(!isRegister);
                  setError(null);
                }}
                className="text-xs text-[#2C6BED] hover:underline font-medium"
              >
                {isRegister
                  ? "Already have an account? Log in"
                  : "Need a new account? Register"}
              </button>
            </div>
          </form>
        )}

        {/* Step 2: OTP Verification Form */}
        {step === "otp" && (
          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                  Verification Code
                </label>
                <button
                  type="button"
                  onClick={() => setStep("identifier")}
                  className="text-xs text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 flex items-center gap-1"
                >
                  <ArrowLeft className="w-3 h-3" /> Change
                </button>
              </div>
              <div className="relative flex items-center">
                <KeyRound className="w-4 h-4 text-zinc-400 absolute left-3.5" />
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter 6-digit code (123456)"
                  maxLength={6}
                  className="w-full tracking-widest text-center font-mono font-bold bg-zinc-100 dark:bg-[#242424] text-zinc-900 dark:text-zinc-100 py-2.5 rounded-xl text-base border border-transparent focus:border-[#2C6BED] focus:bg-white dark:focus:bg-[#202020] focus:outline-none transition-all"
                  required
                  autoFocus
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#2C6BED] hover:bg-[#2055c4] active:bg-[#1a46a6] text-white py-2.5 px-4 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 shadow-md transition-all disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? "Verifying..." : "Verify & Start Chatting"}
            </button>
          </form>
        )}

        {/* Quick Demo Switcher for fast evaluation & 2-browser testing */}
        <div className="mt-8 pt-5 border-t border-zinc-100 dark:border-[#282828]">
          <div className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-2.5">
            <Sparkles className="w-3 h-3 text-[#2C6BED]" />
            <span>Fast Evaluation Profiles</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: "rahul", label: "Rahul" },
              { id: "ananya", label: "Ananya" },
              { id: "vikram", label: "Vikram" },
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => handleQuickLogin(p.id)}
                disabled={isLoading}
                className="px-2.5 py-1.5 text-xs font-medium rounded-lg bg-zinc-100 dark:bg-[#242424] hover:bg-zinc-200 dark:hover:bg-[#2e2e2e] text-zinc-700 dark:text-zinc-300 transition-colors border border-zinc-200/50 dark:border-zinc-800"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
