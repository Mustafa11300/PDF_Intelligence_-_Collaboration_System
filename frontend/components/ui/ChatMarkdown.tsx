"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/**
 * Renders AI chat message content as Markdown (bold, italic, lists, headings,
 * inline code, code blocks, line breaks) instead of raw Markdown syntax.
 * react-markdown does not use dangerouslySetInnerHTML, so this stays XSS-safe.
 */
export function ChatMarkdown({ content }: { content: string }) {
  return (
    <div className="chat-markdown">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => <p style={{ margin: "0 0 8px 0" }}>{children}</p>,
          ul: ({ children }) => <ul style={{ margin: "0 0 8px 0", paddingLeft: 18 }}>{children}</ul>,
          ol: ({ children }) => <ol style={{ margin: "0 0 8px 0", paddingLeft: 18 }}>{children}</ol>,
          li: ({ children }) => <li style={{ margin: "2px 0" }}>{children}</li>,
          h1: ({ children }) => <p style={{ margin: "0 0 8px 0", fontWeight: 700, fontSize: "1.1em" }}>{children}</p>,
          h2: ({ children }) => <p style={{ margin: "0 0 8px 0", fontWeight: 700, fontSize: "1.05em" }}>{children}</p>,
          h3: ({ children }) => <p style={{ margin: "0 0 8px 0", fontWeight: 700 }}>{children}</p>,
          code: ({ children }) => (
            <code
              style={{
                background: "rgba(0,0,0,0.08)",
                borderRadius: 4,
                padding: "1px 5px",
                fontSize: "0.9em",
                fontFamily: "monospace",
              }}
            >
              {children}
            </code>
          ),
          pre: ({ children }) => (
            <pre
              style={{
                background: "rgba(0,0,0,0.08)",
                borderRadius: 8,
                padding: 10,
                overflowX: "auto",
                margin: "0 0 8px 0",
                fontSize: "0.9em",
              }}
            >
              {children}
            </pre>
          ),
          a: ({ children, href }) => (
            <a href={href} target="_blank" rel="noreferrer noopener" style={{ textDecoration: "underline" }}>
              {children}
            </a>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
