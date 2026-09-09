export function LogoMark({ showName = true, compact = false }: { showName?: boolean; compact?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div className={`relative flex shrink-0 items-center justify-center ${compact ? "size-9" : "size-11"}`} aria-hidden="true">
        <span className="absolute left-1 top-1 h-7 w-7 -skew-x-[22deg] rounded-[7px] bg-blue-400 shadow-sm" />
        <span className="absolute bottom-1 right-1 h-7 w-7 -skew-x-[22deg] rounded-[7px] bg-blue-700 shadow-sm" />
      </div>
      {showName && (
        <div className="leading-none">
          <p className="text-[25px] font-bold tracking-[-0.06em] text-slate-950">Clause<span className="text-blue-600">AI</span></p>
        </div>
      )}
    </div>
  );
}
