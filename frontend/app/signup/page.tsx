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
  const handleSubmit = async (e: React.FormEvent) => { e.preventDefault(); setError(null); setLoading(true); try { await signup(form.name, form.email, form.password); await login(form.email, form.password); router.push("/dashboard"); } catch (err: any) { setError(err.message || "Signup failed"); } finally { setLoading(false); } };

  return (
    <main className="min-h-screen bg-white lg:flex">
      <section className="relative hidden min-h-screen overflow-hidden bg-[#f6f9ff] px-10 py-10 lg:flex lg:w-1/2 lg:flex-col xl:px-16">
        <LogoMark />
        <div className="relative z-10 mt-auto max-w-xl pb-16 pt-20"><p className="mb-7 text-[11px] font-semibold uppercase tracking-[0.32em] text-slate-500">A smarter document workspace</p><h2 className="max-w-lg text-6xl font-bold leading-[0.98] tracking-[-0.065em] text-slate-950 xl:text-7xl">From PDFs<br /><span className="text-blue-600">to progress.</span></h2><p className="mt-7 max-w-md text-xl font-semibold leading-8 text-slate-600">Everything your team needs to move faster.</p><p className="mt-4 max-w-md text-base leading-7 text-slate-500">Bring your documents, insights, and conversations together in one focused workspace.</p><div className="mt-10 flex flex-col gap-6">{[{ title: "Instant understanding", text: "Summarize and explore any PDF." }, { title: "Answers you can trust", text: "Ask questions with grounded context." }, { title: "Built for your team", text: "Collaborate securely in one place." }].map((item) => <div key={item.title} className="flex items-center gap-4"><span className="flex size-14 items-center justify-center rounded-2xl bg-blue-100/70 text-xl text-blue-600">✦</span><div><p className="font-semibold text-slate-900">{item.title}</p><p className="mt-1 text-sm text-slate-500">{item.text}</p></div></div>)}</div></div>
        <div className="pointer-events-none absolute -bottom-48 -right-36 size-[620px] rounded-full border border-blue-200/80" />
      </section>
      <section className="flex min-h-screen w-full flex-col px-5 py-7 sm:px-10 lg:w-1/2 lg:px-16 lg:py-10 xl:px-24">
        <div className="flex justify-end text-sm text-slate-500">Already have an account? <Link href="/login" className="ml-2 font-semibold text-blue-600 hover:text-blue-700">Sign in</Link></div>
        <div className="mx-auto flex w-full max-w-[530px] flex-1 items-center py-10"><div className="w-full rounded-[20px] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/[0.04] sm:p-10"><div className="mb-8 lg:hidden"><LogoMark /></div><div className="mb-8"><h1 className="text-3xl font-bold tracking-[-0.045em] text-slate-950">Create your account</h1><p className="mt-3 text-base text-slate-500">Start turning dense PDFs into clear decisions.</p></div><form className="flex flex-col gap-5" onSubmit={handleSubmit}><AuthField label="Full name" name="name" type="text" placeholder="Jane Doe" value={form.name} onChange={handleChange} /><AuthField label="Work email" name="email" type="email" placeholder="you@company.com" value={form.email} onChange={handleChange} /><AuthField label="Password" name="password" type="password" placeholder="Create a password" value={form.password} onChange={handleChange} />{error && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}<IndigoButton type="submit" disabled={loading} className="mt-1 w-full">{loading ? "Creating account..." : <>Create account <span aria-hidden="true" className="text-lg">→</span></>}</IndigoButton></form><p className="mt-7 text-center text-xs leading-5 text-slate-400">By creating an account, you agree to our terms and privacy policy.</p></div></div>
      </section>
    </main>
  );
}
