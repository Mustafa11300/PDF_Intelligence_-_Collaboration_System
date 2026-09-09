"use client";

/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/set-state-in-effect */

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getPDF, listComments, addComment, sharePDF, sendChatMessage } from "@/lib/api";
import { LogoMark } from "@/components/ui/LogoMark";
import { ChatMarkdown } from "@/components/ui/ChatMarkdown";

interface PDFDetail {
  id: number;
  filename: string;
  upload_date: string;
  summary: string | null;
  summary_status: string;
  share_token: string | null;
  file_url: string | null;
}

interface Comment {
  id: number;
  author_name: string;
  content: string;
  created_at: string;
}

interface ChatMsg {
  role: "user" | "assistant";
  content: string;
}

export default function PDFViewerPage() {
  const params = useParams();
  const router = useRouter();
  const pdfId = Number(params.id);

  const [pdf, setPdf] = useState<PDFDetail | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [sideTab, setSideTab] = useState<"chat" | "comments">("comments");
  const [commentInput, setCommentInput] = useState("");
  const [posting, setPosting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([
    { role: "assistant", content: "Hello! I've analyzed this document. Ask me anything about its contents." },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  const loadData = async () => {
    try {
      const [pdfData, commentData] = await Promise.all([
        getPDF(pdfId),
        listComments(pdfId),
      ]);
      setPdf(pdfData);
      setComments(commentData);
    } catch (err: any) {
      setNotice(err.message || "Unable to open this document.");
      router.push("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!localStorage.getItem("token")) {
      router.push("/login");
      return;
    }
    loadData();

    const interval = setInterval(async () => {
      try {
        const commentData = await listComments(pdfId);
        setComments(commentData);
      } catch {
        // silent fail on background poll
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [pdfId]);

  const handlePostComment = async () => {
    if (!commentInput.trim()) return;
    setPosting(true);
    try {
      const newComment = await addComment(pdfId, commentInput.trim());
      setComments((prev) => [...prev, newComment]);
      setCommentInput("");
    } catch (err: any) {
      setNotice(err.message || "Unable to post comment.");
      window.setTimeout(() => setNotice(null), 3500);
    } finally {
      setPosting(false);
    }
  };

  const handleShare = async () => {
    try {
      const updated = await sharePDF(pdfId);
      const url = `${window.location.origin}/shared/${updated.share_token}`;
      await navigator.clipboard.writeText(url);
      setNotice("Share link copied to clipboard");
      window.setTimeout(() => setNotice(null), 3500);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleSendChat = async () => {
    if (!chatInput.trim() || chatLoading) return;
    const userMessage = chatInput.trim();
    const newHistory = [...chatMessages, { role: "user" as const, content: userMessage }];
    setChatMessages(newHistory);
    setChatInput("");
    setChatLoading(true);
    try {
      const res = await sendChatMessage(pdfId, userMessage, chatMessages);
      setChatMessages((prev) => [...prev, { role: "assistant", content: res.reply }]);
    } catch {
      setChatMessages((prev) => [...prev, { role: "assistant", content: "Sorry, something went wrong answering that." }]);
    } finally {
      setChatLoading(false);
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white px-6 text-slate-900">
        <div className="flex w-full max-w-sm flex-col items-center text-center">
          <div className="mb-8 flex size-16 items-center justify-center rounded-2xl bg-blue-50 text-2xl text-blue-600 shadow-sm">PDF</div>
          <div className="mb-6 h-1.5 w-full overflow-hidden rounded-full bg-blue-50"><div className="h-full w-3/5 rounded-full bg-blue-600" /></div>
          <h1 className="text-2xl font-semibold tracking-tight">Opening your document</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">We&apos;re preparing your PDF workspace.</p>
        </div>
      </main>
    );
  }
  if (!pdf) return null;

  return (
    <div className="h-screen bg-slate-50 text-slate-900" style={{ display: "flex", flexDirection: "column" }}>
      {notice && (
        <div role="status" className="fixed right-5 top-5 z-50 flex items-center gap-3 rounded-2xl border border-emerald-100 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-xl">
          <span className="flex size-7 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">✓</span>
          {notice}
          <button onClick={() => setNotice(null)} className="ml-2 text-slate-400" aria-label="Dismiss notification">×</button>
        </div>
      )}
      {/* Top bar */}
      <header style={{ height: 52, background: "#fff", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", padding: "0 16px", gap: 12, flexShrink: 0 }}>
        <button
          onClick={() => router.push("/dashboard")}
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5"
          style={{ color: "#64748b", fontSize: 13, fontWeight: 500 }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M9 2L4 7L9 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Documents
        </button>
        <div style={{ width: 1, height: 20, background: "#e2e8f0" }} />
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <LogoMark />
          <span style={{ fontWeight: 600, color: "#0f172a", fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {pdf.filename}
          </span>
        </div>
        <button
          onClick={handleShare}
          className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm"
          style={{ borderColor: "#e2e8f0", color: "#374151", fontWeight: 500, background: "#fff" }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="11" cy="2.5" r="1.5" stroke="currentColor" strokeWidth="1.2" />
            <circle cx="11" cy="11.5" r="1.5" stroke="currentColor" strokeWidth="1.2" />
            <circle cx="3" cy="7" r="1.5" stroke="currentColor" strokeWidth="1.2" />
            <path d="M4.5 6.1L9.5 3.4M4.5 7.9L9.5 10.6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
          Share Link
        </button>
      </header>

      {/* Split body */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* Left: PDF viewer */}
        <div style={{ flex: "0 0 65%", borderRight: "1px solid #e2e8f0", overflow: "hidden" }}>
          {pdf.file_url ? (
            <iframe src={pdf.file_url} style={{ width: "100%", height: "100%", border: "none" }} title={pdf.filename} />
          ) : (
            <div className="flex items-center justify-center h-full" style={{ color: "#94a3b8" }}>
              PDF preview unavailable
            </div>
          )}
        </div>

        {/* Right: Chat / Comments */}
        <div style={{ flex: "0 0 35%", display: "flex", flexDirection: "column", background: "#fff" }}>
          {/* Summary block */}
          <div style={{ padding: 16, borderBottom: "1px solid #e2e8f0" }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: "#94a3b8", marginBottom: 6 }}>SUMMARY</p>
            <p style={{ fontSize: 13, color: "#475569", lineHeight: 1.6 }}>
              {pdf.summary_status === "pending" ? "Generating summary..." : pdf.summary || "No summary available."}
            </p>
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", borderBottom: "1px solid #e2e8f0" }}>
            <button
              onClick={() => setSideTab("chat")}
              style={{
                flex: 1, padding: "12px 0", fontSize: 13, fontWeight: 600,
                color: sideTab === "chat" ? "#4f46e5" : "#94a3b8",
                borderBottom: sideTab === "chat" ? "2px solid #6366f1" : "2px solid transparent",
              }}
            >
              AI Chat
            </button>
            <button
              onClick={() => setSideTab("comments")}
              style={{
                flex: 1, padding: "12px 0", fontSize: 13, fontWeight: 600,
                color: sideTab === "comments" ? "#4f46e5" : "#94a3b8",
                borderBottom: sideTab === "comments" ? "2px solid #6366f1" : "2px solid transparent",
              }}
            >
              Comments ({comments.length})
            </button>
          </div>

          {sideTab === "comments" ? (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
              <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
                {comments.length === 0 ? (
                  <p style={{ fontSize: 13, color: "#94a3b8" }}>No comments yet.</p>
                ) : (
                  comments.map((c) => (
                    <div key={c.id} style={{ marginBottom: 16, paddingBottom: 16, borderBottom: "1px solid #f1f5f9" }}>
                      <div className="flex items-center gap-2 mb-1">
                        <div
                          className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-semibold"
                          style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
                        >
                          {c.author_name.charAt(0).toUpperCase()}
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>{c.author_name}</span>
                        <span style={{ fontSize: 11, color: "#94a3b8" }}>
                          {new Date(c.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p style={{ fontSize: 13, color: "#475569", lineHeight: 1.5 }}>{c.content}</p>
                    </div>
                  ))
                )}
              </div>
              <div style={{ padding: 12, borderTop: "1px solid #e2e8f0", display: "flex", gap: 8 }}>
                <input
                  type="text"
                  placeholder="Add a comment..."
                  value={commentInput}
                  onChange={(e) => setCommentInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handlePostComment()}
                  style={{ flex: 1, padding: "8px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13, outline: "none" }}
                />
                <button
                  onClick={handlePostComment}
                  disabled={posting}
                  style={{ padding: "8px 14px", borderRadius: 8, background: "#6366f1", color: "#fff", fontSize: 13, fontWeight: 600 }}
                >
                  Post
                </button>
              </div>
            </div>
          ) : (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
              <div style={{ flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
                {chatMessages.map((msg, i) => (
                  <div
                    key={i}
                    style={{
                      alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
                      maxWidth: "85%",
                      background: msg.role === "user" ? "#6366f1" : "#f1f5f9",
                      color: msg.role === "user" ? "#fff" : "#0f172a",
                      padding: "10px 14px",
                      borderRadius: 12,
                      fontSize: 13,
                      lineHeight: 1.5,
                    }}
                  >
                    {msg.role === "assistant" ? <ChatMarkdown content={msg.content} /> : msg.content}
                  </div>
                ))}
                {chatLoading && (
                  <div style={{ alignSelf: "flex-start", color: "#94a3b8", fontSize: 12, padding: "0 4px" }}>
                    Thinking...
                  </div>
                )}
              </div>
              <div style={{ padding: 12, borderTop: "1px solid #e2e8f0", display: "flex", gap: 8 }}>
                <input
                  type="text"
                  placeholder="Ask a question..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendChat()}
                  disabled={chatLoading}
                  style={{ flex: 1, padding: "8px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13, outline: "none" }}
                />
                <button
                  onClick={handleSendChat}
                  disabled={chatLoading}
                  style={{ padding: "8px 14px", borderRadius: 8, background: "#6366f1", color: "#fff", fontSize: 13, fontWeight: 600 }}
                >
                  Send
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
