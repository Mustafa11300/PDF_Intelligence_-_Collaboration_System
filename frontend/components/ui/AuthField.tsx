"use client";

import { useState } from "react";

interface FieldProps {
  label: string;
  name: string;
  type: string;
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function AuthField({ label, name, type, placeholder, value, onChange }: FieldProps) {
  const [focused, setFocused] = useState(false);
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={name} style={{ fontWeight: 600, color: "#374151", fontSize: 12, letterSpacing: "0.01em" }}>
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all duration-150"
        style={{
          border: `1.5px solid ${focused ? "#6366f1" : "#e2e8f0"}`,
          color: "#0f172a",
          background: focused ? "#fafaff" : "#fff",
          boxShadow: focused ? "0 0 0 3px rgba(99,102,241,0.12)" : "0 1px 2px rgba(0,0,0,0.03)",
        }}
      />
    </div>
  );
}