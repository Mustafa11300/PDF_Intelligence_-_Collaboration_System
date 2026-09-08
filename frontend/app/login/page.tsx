"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { login } from "@/lib/api";
import { AuthField } from "@/components/ui/AuthField";
import { IndigoButton } from "@/components/ui/IndigoButton";
import { LogoMark } from "@/components/ui/LogoMark";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(form.email, form.password);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center relative"
      style={{ background: "linear-gradient(135deg, #f1f5f9 0%, #e8eef5 50%, #f0f4f8 100%)" }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, rgba(99,102,241,0.04) 1px, transparent 0)",
          backgroundSize: "32px 32px",
        }}
      />
      <div className="relative w-full max-w-md mx-auto px-4">
        <div className="flex justify-center mb-10">
          <div className="flex items-center gap-2.5">
            <LogoMark />
            <span style={{ fontWeight: 600, color: "#1e293b", fontSize: 18, letterSpacing: "-0.02em" }}>
              PDF Intelligence
            </span>
          </div>
        </div>

        <div
          className="rounded-2xl bg-white px-10 py-10"
          style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.06), 0 24px 48px rgba(0,0,0,0.07)" }}
        >
          <div className="mb-8">
            <h1 style={{ fontWeight: 700, color: "#0f172a", fontSize: 24, letterSpacing: "-0.03em", marginBottom: 6 }}>
              Welcome back
            </h1>
            <p style={{ color: "#64748b", fontSize: 14 }}>Sign in to continue to your workspace.</p>
          </div>

          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            <AuthField label="Email" name="email" type="email" placeholder="you@example.com" value={form.email} onChange={handleChange} />
            <AuthField label="Password" name="password" type="password" placeholder="••••••••••••" value={form.password} onChange={handleChange} />

            {error && (
              <p style={{ color: "#ef4444", fontSize: 13 }}>{error}</p>
            )}

            <IndigoButton type="submit" disabled={loading} className="mt-2">
              {loading ? "Signing in..." : "Sign in"}
            </IndigoButton>
          </form>

          <p className="text-center mt-6" style={{ color: "#94a3b8", fontSize: 14 }}>
            Don't have an account?{" "}
            <Link href="/signup" style={{ color: "#6366f1", fontWeight: 600 }}>
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}