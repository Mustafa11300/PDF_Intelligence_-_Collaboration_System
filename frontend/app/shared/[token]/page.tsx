"use client";

/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/set-state-in-effect */

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getSharedPDF, listSharedComments, addSharedComment, sendSharedChatMessage } from "@/lib/api";
import { LogoMark } from "@/components/ui/LogoMark";

interface SharedPDF {
  id: number;
  filename: string;
  summary: string | null;
  summary_status: string;
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

export default function SharedPDFPage() {
  const params = useParams();
  const token = params.token as string;

  const [pdf, setPdf] = useState<SharedPDF | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [sideTab, setSideTab] = useState<"chat" | "comments">("comments");
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [authorName, setAuthorName] = useState("");
  const [commentInput, setCommentInput] = useState("");
  const [posting, setPosting] = useState(false);

  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([
    { role: "assistant", content: "Hello! I've analyzed this document. Ask me anything about its contents." },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [pdfData, commentData] = await Promise.all([
          getSharedPDF(token),
          listSharedComments(token),
        ]);
        setPdf(pdfData);
        setComments(commentData);
      } catch (err) {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    load();

    const interval = setInterval(async () => {
      try {
        const commentData = await listSharedComments(token);
        setComments(commentData);
      } catch {
        // silent fail on background poll
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [token]);

  const handlePostComment = async () => {
    if (!commentInput.trim() || !authorName.trim()) return;
    setPosting(true);
    try {
      const newComment = await addSharedComment(token, commentInput.trim(), authorName.trim());
      setComments((prev) => [...prev, newComment]);
      setCommentInput("");
    } catch (err: any) {
      alert(err.message);
    } finally {
      setPosting(false);
    }
  };

  const handleSendChat = async () => {
    if (!chatInput.trim() || chatLoading) return;
    const userMessage = chatInput.trim();
    const historySnapshot = chatMessages;
    setChatMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setChatInput("");
    setChatLoading(true);
    try {
      const res = await sendSharedChatMessage(token, userMessage, historySnapshot);
      setChatMessages((prev) => [...prev, { role: "assistant", content: res.reply }]);
    } catch (err: any) {
      setChatMessages((prev) => [...prev, { role: "assistant", content: "Sorry, something went wrong answering that." }]);
    } finally {
      setChatLoading(false);
    }
  };

  if (loading) {
    return <div style={{ padding: 40, color: "#64748b" }}>Loading...</div>;
  }
  if (notFound || !pdf) {
    return (
      <div className="flex items-center justify-center" style={{ height: "100vh", color: "#64748b" }}>
        This shared link is invalid or has expired.
      </div>
    );
  }

  return (
    <div className="h-screen bg-slate-50 text-slate-900" style={{ display: "flex", flexDirection: "column" }}>
      {/* Top bar */}
      <header style={{ height: 52, background: "#fff", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", padding: "0 16px", gap: 12, flexShrink: 0 }}>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <LogoMark />
          <span style={{ fontWeight: 600, color: "#0f172a", fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {pdf.filename}
          </span>
        </div>
        <span
          className="px-2.5 py-1 rounded-full text-xs font-semibold"
          style={{ background: "#eef2ff", color: "#4f46e5" }}
        >
          Shared view
        </span>
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
          <div style={{ padding: 16, borderBottom: "1px solid #e2e8f0" }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: "#94a3b8", marginBottom: 6 }}>SUMMARY</p>
            <p style={{ fontSize: 13, color: "#475569", lineHeight: 1.6 }}>
              {pdf.summary_status === "pending" ? "Generating summary..." : pdf.summary || "No summary available."}
            </p>
          </div>

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
              <div style={{ padding: 12, borderTop: "1px solid #e2e8f0", display: "flex", flexDirection: "column", gap: 8 }}>
                <input
                  type="text"
                  placeholder="Your name"
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13, outline: "none" }}
                />
                <div style={{ display: "flex", gap: 8 }}>
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
                    disabled={posting || !authorName.trim()}
                    style={{ padding: "8px 14px", borderRadius: 8, background: "#6366f1", color: "#fff", fontSize: 13, fontWeight: 600 }}
                  >
                    Post
                  </button>
                </div>
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
                    {msg.content}
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
