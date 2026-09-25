export function TarryMark({ size = 24, mood = "happy", className }: { size?: number; mood?: "happy" | "sad"; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true" className={className}>
      <circle cx="16" cy="16" r="14" fill="#eab308" />
      <circle cx="11" cy="14" r="2.5" fill="white" />
      <circle cx="11.5" cy="13.5" r="0.8" fill="white" opacity="0.9" />
      <circle cx="21" cy="14" r="2.5" fill="#7c3aed" />
      <circle cx="21.5" cy="13.5" r="0.8" fill="white" opacity="0.9" />
      {mood === "happy" ? (
        <path d="M11 21c2.5 3 7.5 3 10 0" stroke="white" strokeWidth="2" strokeLinecap="round" />
      ) : (
        <path d="M11 23c2.5-3 7.5-3 10 0" stroke="white" strokeWidth="2" strokeLinecap="round" />
      )}
    </svg>
  );
}
