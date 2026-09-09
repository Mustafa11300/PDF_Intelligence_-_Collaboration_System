"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signup, login } from "@/lib/api";
import { AuthField } from "@/components/ui/AuthField";
import { IndigoButton } from "@/components/ui/IndigoButton";
import { LogoMark } from "@/components/ui/LogoMark";

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(null); setLoading(true);
    try { await signup(form.name, form.email, form.password); await login(form.email, form.password); router.push("/dashboard"); }
    catch (err: any) { setError(err.message || "Signup failed"); }
    finally { setLoading(false); }
  };
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center gap-3"><LogoMark /><div className="text-center"><p className="text-base font-semibold tracking-tight text-slate-900">PDF Intelligence</p><p className="mt-1 text-sm text-slate-500">Your documents, understood.</p></div></div>
        <section className="rounded-2xl border border-slate-200 bg-white p-7 shadow-xl shadow-slate-900/5 sm:p-9">
          <div className="mb-7"><h1 className="text-2xl font-semibold tracking-tight text-slate-950">Create your account</h1><p className="mt-2 text-sm leading-6 text-slate-500">Start turning dense PDFs into clear decisions.</p></div>
          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            <AuthField label="Full name" name="name" type="text" placeholder="Jane Doe" value={form.name} onChange={handleChange} />
            <AuthField label="Email" name="email" type="email" placeholder="you@example.com" value={form.email} onChange={handleChange} />
            <AuthField label="Password" name="password" type="password" placeholder="Create a password" value={form.password} onChange={handleChange} />
            {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
            <IndigoButton type="submit" disabled={loading} className="mt-2 w-full">{loading ? "Creating account..." : "Create account"}</IndigoButton>
          </form>
          <p className="mt-7 text-center text-sm text-slate-500">Already have an account? <Link href="/login" className="font-semibold text-indigo-600 hover:text-indigo-700">Sign in</Link></p>
        </section>
      </div>
    </main>
  );
}
