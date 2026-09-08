export function LogoMark() {
  return (
    <div className="flex items-center justify-center rounded-lg flex-shrink-0" style={{ width: 32, height: 32, background: "#4f46e5" }}>
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <rect x="2" y="2" width="5" height="5" rx="1" fill="white" />
        <rect x="9" y="2" width="5" height="5" rx="1" fill="white" opacity="0.6" />
        <rect x="2" y="9" width="5" height="5" rx="1" fill="white" opacity="0.6" />
        <rect x="9" y="9" width="5" height="5" rx="1" fill="white" />
      </svg>
    </div>
  );
}