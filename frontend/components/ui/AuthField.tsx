"use client";

interface FieldProps {
  label: string;
  name: string;
  type: string;
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function AuthField({ label, name, type, placeholder, value, onChange }: FieldProps) {
  return (
    <label className="flex flex-col gap-2 text-sm font-medium text-slate-700" htmlFor={name}>
      {label}
      <input
        id={name}
        name={name}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-indigo-500 focus:bg-indigo-50/20 focus:ring-4 focus:ring-indigo-500/10"
      />
    </label>
  );
}
