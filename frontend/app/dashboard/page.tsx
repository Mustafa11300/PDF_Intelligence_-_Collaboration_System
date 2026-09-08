"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { listPDFs, uploadPDF } from "@/lib/api";
import { IndigoButton } from "@/components/ui/IndigoButton";
import { LogoMark } from "@/components/ui/LogoMark";

interface PDFItem {
  id: number;
  filename: string;
  upload_date: string;
  summary: string | null;
  summary_status: string;
  share_token: string | null;
}

export default function Dashboard() {
  const router = useRouter();
  const [pdfs, setPdfs] = useState<PDFItem[]>([]);
  const [search, setSearch] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchPdfs = async (q?: string) => {
    try {
      const data = await listPDFs(q);
      setPdfs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!localStorage.getItem("token")) {
      router.push("/login");
      return;
    }
    fetchPdfs();
  }, []);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    fetchPdfs(value);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      await uploadPDF(file);
      await fetchPdfs(search);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  return (
    <div style={{ background: "#f8fafc", minHeight: "100vh" }}>
      {/* Top Nav */}
      <header
        className="sticky top-0 z-10"
        style={{ background: "rgba(255,255,255,0.92)", backdropFilter: "blur(12px)", borderBottom: "1px solid #e2e8f0" }}
      >
        <div className="mx-auto flex items-center justify-between" style={{ maxWidth: 1280, padding: "0 32px", height: 64 }}>
          <div className="flex items-center gap-2.5">
            <LogoMark />
            <span style={{ fontWeight: 600, color: "#0f172a", fontSize: 17, letterSpacing: "-0.02em" }}>
              PDF Intelligence
            </span>
          </div>

          <div className="flex items-center gap-3">
            <input ref={fileInputRef} type="file" accept="application/pdf" hidden onChange={handleUpload} />
            <IndigoButton onClick={() => fileInputRef.current?.click()} disabled={uploading}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              {uploading ? "Uploading..." : "Upload PDF"}
            </IndigoButton>

            <button
              className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl border transition-colors"
              style={{ borderColor: "#e2e8f0", background: "#fff" }}
              onClick={handleSignOut}
            >
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-semibold"
                style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
              >
                U
              </div>
              <span style={{ fontSize: 13, fontWeight: 500, color: "#374151" }}>Sign out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Page content */}
      <main style={{ maxWidth: 1280, margin: "0 auto", padding: "40px 32px 64px" }}>
        <div className="mb-8">
          <h1 style={{ fontWeight: 700, color: "#0f172a", fontSize: 28, letterSpacing: "-0.03em", marginBottom: 4 }}>
            My Documents
          </h1>
          <p style={{ color: "#64748b", fontSize: 14 }}>{pdfs.length} document{pdfs.length !== 1 ? "s" : ""}</p>
        </div>

        {/* Search bar */}
        <div
          className="relative mb-8 transition-all duration-150"
          style={{
            border: `1.5px solid ${searchFocused ? "#6366f1" : "#e2e8f0"}`,
            borderRadius: 14,
            background: "#fff",
            boxShadow: searchFocused ? "0 0 0 3px rgba(99,102,241,0.12), 0 4px 16px rgba(0,0,0,0.04)" : "0 1px 4px rgba(0,0,0,0.04)",
          }}
        >
          <div className="absolute left-5 top-1/2 -translate-y-1/2 pointer-events-none">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <circle cx="8" cy="8" r="5.5" stroke={searchFocused ? "#6366f1" : "#94a3b8"} strokeWidth="1.5" />
              <path d="M12.5 12.5L16 16" stroke={searchFocused ? "#6366f1" : "#94a3b8"} strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search documents by filename…"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            style={{ width: "100%", padding: "14px 20px 14px 48px", fontSize: 15, color: "#0f172a", background: "transparent", outline: "none" }}
          />
        </div>

        {/* Document grid */}
        {loading ? (
          <p style={{ color: "#94a3b8", fontSize: 14 }}>Loading...</p>
        ) : pdfs.length > 0 ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 }}>
            {pdfs.map((pdf) => (
              <DocumentCard key={pdf.id} pdf={pdf} onClick={() => router.push(`/pdf/${pdf.id}`)} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24" style={{ color: "#94a3b8" }}>
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" className="mb-4">
              <rect x="10" y="6" width="28" height="36" rx="3" stroke="#e2e8f0" strokeWidth="2" />
              <path d="M18 16h12M18 22h12M18 28h8" stroke="#e2e8f0" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <p style={{ fontSize: 15, fontWeight: 500, color: "#64748b" }}>No documents found</p>
            <p style={{ fontSize: 13, marginTop: 4 }}>Upload a PDF to get started</p>
          </div>
        )}
      </main>
    </div>
  );
}

function DocumentCard({ pdf, onClick }: { pdf: PDFItem; onClick: () => void }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClick}
      style={{
        background: "#fff",
        border: `1.5px solid ${hovered ? "#c7d2fe" : "#e2e8f0"}`,
        borderRadius: 16,
        padding: "24px",
        cursor: "pointer",
        transition: "all 0.18s ease",
        boxShadow: hovered ? "0 4px 24px rgba(99,102,241,0.10), 0 1px 4px rgba(0,0,0,0.04)" : "0 1px 3px rgba(0,0,0,0.04)",
        transform: hovered ? "translateY(-2px)" : "translateY(0)",
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}
    >
      <div
        className="flex-shrink-0 flex items-center justify-center rounded-xl"
        style={{ width: 44, height: 44, background: "#fef2f2", border: "1px solid #fecaca" }}
      >
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <rect x="3" y="1" width="14" height="18" rx="2" fill="#fee2e2" stroke="#fca5a5" strokeWidth="1.2" />
          <path d="M13 1v5h4" stroke="#fca5a5" strokeWidth="1.2" strokeLinecap="round" />
          <path d="M6 9h8M6 12h8M6 15h5" stroke="#ef4444" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      </div>

      <h3 style={{ fontWeight: 700, color: "#0f172a", fontSize: 15, letterSpacing: "-0.02em", lineHeight: 1.35 }}>
        {pdf.filename}
      </h3>

      <p
        style={{
          color: "#64748b",
          fontSize: 13,
          lineHeight: 1.65,
          display: "-webkit-box",
          WebkitLineClamp: 3,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
          minHeight: "3.9em",
        }}
      >
        {pdf.summary_status === "pending" ? "Generating summary..." : pdf.summary || "No summary available."}
      </p>

      <div className="flex items-center justify-between pt-2" style={{ borderTop: "1px solid #f1f5f9" }}>
        <div className="flex items-center gap-1.5">
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <rect x="1" y="2" width="11" height="10" rx="2" stroke="#94a3b8" strokeWidth="1.2" />
            <path d="M4 1v2M9 1v2" stroke="#94a3b8" strokeWidth="1.2" strokeLinecap="round" />
            <path d="M1 5.5h11" stroke="#94a3b8" strokeWidth="1.2" />
          </svg>
          <span style={{ fontSize: 12, color: "#94a3b8", fontWeight: 500 }}>
            {new Date(pdf.upload_date).toLocaleDateString()}
          </span>
        </div>
        {pdf.share_token && (
          <span style={{ fontSize: 11, color: "#6366f1", fontWeight: 600 }}>Shared</span>
        )}
      </div>
    </div>
  );
}