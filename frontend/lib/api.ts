const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

function authHeaders() {
  const token = localStorage.getItem("token");
  return { Authorization: `Bearer ${token}` };
}

export async function signup(name: string, email: string, password: string) {
  const res = await fetch(`${API_URL}/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password }),
  });
  if (!res.ok) throw new Error((await res.json()).detail || "Signup failed");
  return res.json();
}

export async function login(email: string, password: string) {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error((await res.json()).detail || "Login failed");
  const data = await res.json();
  localStorage.setItem("token", data.access_token);
  return data;
}

export async function listPDFs(search?: string) {
  const url = new URL(`${API_URL}/pdfs`);
  if (search) url.searchParams.set("search", search);
  const res = await fetch(url.toString(), { headers: authHeaders() });
  if (!res.ok) throw new Error("Failed to fetch PDFs");
  return res.json();
}

export async function uploadPDF(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${API_URL}/pdfs/upload`, {
    method: "POST",
    headers: authHeaders(),
    body: formData,
  });
  if (!res.ok) throw new Error((await res.json()).detail || "Upload failed");
  return res.json();
}

export async function getPDF(id: number) {
  const res = await fetch(`${API_URL}/pdfs/${id}`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Failed to fetch PDF");
  return res.json();
}

export async function sharePDF(id: number) {
  const res = await fetch(`${API_URL}/pdfs/${id}/share`, {
    method: "POST",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Failed to generate share link");
  return res.json();
}

export async function getSharedPDF(token: string) {
  const res = await fetch(`${API_URL}/pdfs/shared/${token}`);
  if (!res.ok) throw new Error("Shared PDF not found");
  return res.json();
}

export async function listComments(pdfId: number) {
  const res = await fetch(`${API_URL}/pdfs/${pdfId}/comments`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Failed to fetch comments");
  return res.json();
}

export async function addComment(pdfId: number, content: string) {
  const res = await fetch(`${API_URL}/pdfs/${pdfId}/comments`, {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
  });
  if (!res.ok) throw new Error("Failed to add comment");
  return res.json();
}

export async function sendChatMessage(pdfId: number, message: string, history: { role: string; content: string }[]) {
  const res = await fetch(`${API_URL}/pdfs/${pdfId}/chat`, {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ message, history }),
  });
  if (!res.ok) throw new Error("Failed to get chat response");
  return res.json();
}

export async function listSharedComments(token: string) {
  const res = await fetch(`${API_URL}/pdfs/shared/${token}/comments`);
  if (!res.ok) throw new Error("Failed to fetch comments");
  return res.json();
}

export async function addSharedComment(token: string, content: string, authorName: string) {
  const res = await fetch(`${API_URL}/pdfs/shared/${token}/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content, author_name: authorName }),
  });
  if (!res.ok) throw new Error((await res.json()).detail || "Failed to add comment");
  return res.json();
}

export async function sendSharedChatMessage(token: string, message: string, history: { role: string; content: string }[]) {
  const res = await fetch(`${API_URL}/pdfs/shared/${token}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, history }),
  });
  if (!res.ok) throw new Error("Failed to get chat response");
  return res.json();
}