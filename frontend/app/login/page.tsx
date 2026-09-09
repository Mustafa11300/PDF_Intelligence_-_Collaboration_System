"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { login } from "@/lib/api";
import { AuthField } from "@/components/ui/AuthField";
import { IndigoButton } from "@/components/ui/IndigoButton";
import { LogoMark } from "@/components/ui/LogoMark";

function ProductStory() {
  return (
    <section className="relative hidden min-h-screen overflow-hidden bg-[#f6f9ff] px-10 py-10 lg:flex lg:w-1/2 lg:flex-col xl:px-16">
      <div className="relative z-10"><LogoMark /></div>
      <div className="relative z-10 mt-auto max-w-xl pb-16 pt-20">
        <p className="mb-7 text-[11px] font-semibold uppercase tracking-[0.32em] text-slate-500">Legal documents, simplified</p>
        <h2 className="max-w-lg text-6xl font-bold leading-[0.98] tracking-[-0.065em] text-slate-950 xl:text-7xl">Contracts,<br /><span className="text-blue-600">understood.</span></h2>
        <p className="mt-7 max-w-md text-xl font-semibold leading-8 text-slate-600">Turn your PDFs into actionable intelligence.</p>
        <p className="mt-4 max-w-md text-base leading-7 text-slate-500">Upload documents, get instant AI summaries, ask questions, and collaborate with your team — all in one place.</p>
        <div className="mt-10 flex flex-col gap-6">
          {[{ title: "AI-powered summaries", text: "Understand lengthy documents in seconds.", icon: "▤" }, { title: "Ask your documents", text: "Get grounded answers directly from your PDFs.", icon: "▱" }, { title: "Collaborate securely", text: "Share documents and discuss them with your team.", icon: "♧" }].map((item) => (
            <div key={item.title} className="flex items-center gap-4">
              <span className="flex size-14 items-center justify-center rounded-2xl bg-blue-100/70 text-2xl text-blue-600">{item.icon}</span>
              <div><p className="font-semibold text-slate-900">{item.title}</p><p className="mt-1 text-sm text-slate-500">{item.text}</p></div>
            </div>
          ))}
        </div>
      </div>
      <div className="pointer-events-none absolute -bottom-48 -right-36 size-[620px] rounded-full border border-blue-200/80" />
      <div className="pointer-events-none absolute bottom-[-110px] right-[-20px] h-[470px] w-[300px] rotate-[14deg] rounded-[24px] border border-white bg-white/70 shadow-2xl shadow-blue-200/50" />
    </section>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  const handleSubmit = async (e: React.FormEvent) => { e.preventDefault(); setError(null); setLoading(true); try { await login(form.email, form.password); router.push("/dashboard"); } catch (err: any) { setError(err.message || "Login failed"); } finally { setLoading(false); } };

  return (
    <main className="min-h-screen bg-white lg:flex">
      <ProductStory />
      <section className="flex min-h-screen w-full flex-col px-5 py-7 sm:px-10 lg:w-1/2 lg:px-16 lg:py-10 xl:px-24">
        <div className="flex justify-end text-sm text-slate-500">Don&apos;t have an account? <Link href="/signup" className="ml-2 font-semibold text-blue-600 hover:text-blue-700">Sign up</Link></div>
        <div className="mx-auto flex w-full max-w-[530px] flex-1 items-center py-10">
          <div className="w-full rounded-[20px] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/[0.04] sm:p-10">
            <div className="mb-8 lg:hidden"><LogoMark /></div>
            <div className="mb-8"><h1 className="text-3xl font-bold tracking-[-0.045em] text-slate-950">Welcome back</h1><p className="mt-3 text-base text-slate-500">Sign in to continue to your workspace.</p></div>
            <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
              <AuthField label="Work email" name="email" type="email" placeholder="you@company.com" value={form.email} onChange={handleChange} />
              <div><AuthField label="Password" name="password" type="password" placeholder="Enter your password" value={form.password} onChange={handleChange} /><div className="mt-2 text-right"><button type="button" className="text-sm font-medium text-blue-600 underline underline-offset-2">Forgot password?</button></div></div>
              {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
              <IndigoButton type="submit" disabled={loading} className="mt-1 w-full">{loading ? "Signing in..." : <>Sign in <span aria-hidden="true" className="text-lg">→</span></>}</IndigoButton>
            </form>
            <div className="my-7 flex items-center gap-4 text-xs font-medium text-slate-400"><span className="h-px flex-1 bg-slate-200" />OR<span className="h-px flex-1 bg-slate-200" /></div>
            <button type="button" className="flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 hover:bg-slate-50"><span className="text-lg font-bold text-blue-600">G</span> Sign in with Google</button>
          </div>
        </div>
      </section>
    </main>
  );
}
