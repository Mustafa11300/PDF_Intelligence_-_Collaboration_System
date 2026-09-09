"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { listPDFs, uploadPDF } from "@/lib/api";
import { IndigoButton } from "@/components/ui/IndigoButton";
import { LogoMark } from "@/components/ui/LogoMark";

interface PDFItem { id: number; filename: string; upload_date: string; summary: string | null; summary_status: string; share_token: string | null; }

export default function Dashboard() {
  const router = useRouter(); const [pdfs, setPdfs] = useState<PDFItem[]>([]); const [search, setSearch] = useState(""); const [uploading, setUploading] = useState(false); const [loading, setLoading] = useState(true); const fileInputRef = useRef<HTMLInputElement>(null);
  const fetchPdfs = async (q?: string) => { try { setPdfs(await listPDFs(q)); } catch (err) { console.error(err); } finally { setLoading(false); } };
  useEffect(() => {
    if (!localStorage.getItem("token")) { router.push("/login"); return; }
    const timer = window.setTimeout(() => { void fetchPdfs(); }, 0);
    return () => window.clearTimeout(timer);
  }, [router]);
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; if (!file) return; setUploading(true); try { await uploadPDF(file); await fetchPdfs(search); } catch (err: any) { alert(err.message); } finally { setUploading(false); if (fileInputRef.current) fileInputRef.current.value = ""; } };
  const handleSignOut = () => { localStorage.removeItem("token"); router.push("/login"); };
  return (
    <main className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur-xl"><div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8"><div className="flex items-center gap-3"><LogoMark /><span className="text-[15px] font-semibold tracking-tight text-slate-900">PDF Intelligence</span></div><div className="flex items-center gap-3"><input ref={fileInputRef} type="file" accept="application/pdf" hidden onChange={handleUpload} /><IndigoButton onClick={() => fileInputRef.current?.click()} disabled={uploading}><span className="text-lg leading-none">+</span>{uploading ? "Uploading..." : "Upload PDF"}</IndigoButton><button onClick={handleSignOut} className="hidden rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 sm:block">Sign out</button></div></div></header>
      <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-14"><div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600">Workspace</p><h1 className="text-3xl font-semibold tracking-tight text-slate-950">My documents</h1><p className="mt-2 text-sm text-slate-500">{pdfs.length} document{pdfs.length !== 1 ? "s" : ""} in your library</p></div><button onClick={handleSignOut} className="text-left text-sm font-medium text-slate-500 hover:text-slate-900 sm:hidden">Sign out</button></div>
        <div className="mb-8 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm shadow-slate-900/[0.03]"><svg className="size-5 shrink-0 text-slate-400" viewBox="0 0 20 20" fill="none"><circle cx="8.5" cy="8.5" r="5.5" stroke="currentColor" strokeWidth="1.5"/><path d="m13 13 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg><input className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400" placeholder="Search documents by filename" value={search} onChange={(e) => { setSearch(e.target.value); fetchPdfs(e.target.value); }} /></div>
        {loading ? <div className="rounded-2xl border border-slate-200 bg-white p-10 text-sm text-slate-500">Loading your documents...</div> : pdfs.length > 0 ? <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{pdfs.map((pdf) => <DocumentCard key={pdf.id} pdf={pdf} onClick={() => router.push(`/pdf/${pdf.id}`)} />)}</div> : <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-20 text-center"><div className="mb-5 flex size-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600"><svg className="size-7" viewBox="0 0 24 24" fill="none"><path d="M6 3h8l4 4v14H6V3Z" stroke="currentColor" strokeWidth="1.5"/><path d="M14 3v5h5M9 13h6M9 17h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg></div><h2 className="text-base font-semibold text-slate-900">Your library is ready</h2><p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">Upload a PDF to generate an AI summary, ask questions, and collaborate with your team.</p><IndigoButton onClick={() => fileInputRef.current?.click()} className="mt-6">Upload your first PDF</IndigoButton></div>}
      </div>
    </main>
  );
}

function DocumentCard({ pdf, onClick }: { pdf: PDFItem; onClick: () => void }) { return <button onClick={onClick} className="group flex min-h-64 flex-col rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm shadow-slate-900/[0.03] hover:-translate-y-1 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-900/[0.08]"><div className="mb-5 flex items-start justify-between"><div className="flex size-11 items-center justify-center rounded-xl bg-red-50 text-red-500"><svg className="size-6" viewBox="0 0 24 24" fill="none"><path d="M6 3h8l4 4v14H6V3Z" stroke="currentColor" strokeWidth="1.5"/><path d="M14 3v5h5M9 13h6M9 17h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg></div>{pdf.share_token && <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold text-indigo-600">Shared</span>}</div><h3 className="line-clamp-2 text-[15px] font-semibold leading-6 text-slate-900">{pdf.filename}</h3><p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-500">{pdf.summary_status === "pending" ? "Generating summary..." : pdf.summary || "No summary available."}</p><div className="mt-auto flex items-center gap-2 border-t border-slate-100 pt-4 text-xs font-medium text-slate-400"><svg className="size-4" viewBox="0 0 16 16" fill="none"><rect x="2" y="3" width="12" height="11" rx="2" stroke="currentColor"/><path d="M5 2v3M11 2v3M2 7h12" stroke="currentColor" strokeLinecap="round"/></svg>{new Date(pdf.upload_date).toLocaleDateString()}</div></button>; }
