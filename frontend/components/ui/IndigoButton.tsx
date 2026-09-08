"use client";

import { useState } from "react";

export function IndigoButton({
  children,
  type = "button",
  onClick,
  disabled,
  className = "",
}: {
  children: React.ReactNode;
  type?: "button" | "submit";
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm text-white transition-all duration-150 disabled:opacity-60 ${className}`}
      style={{
        fontWeight: 600,
        background: hovered && !disabled
          ? "linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)"
          : "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
        boxShadow: hovered && !disabled
          ? "0 1px 2px rgba(79,70,229,0.25), 0 6px 16px rgba(79,70,229,0.4)"
          : "0 1px 2px rgba(79,70,229,0.2), 0 4px 12px rgba(79,70,229,0.3)",
        transform: hovered && !disabled ? "translateY(-1px)" : "translateY(0)",
        letterSpacing: "-0.01em",
      }}
    >
      {children}
    </button>
  );
}