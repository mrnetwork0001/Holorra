/**
 * Holorra mark: a camera viewfinder (the director) framing a single
 * gaussian splat (the world). Wordmark set in IBM Plex Sans.
 */
export function LogoMark({ size = 22, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      aria-hidden="true"
      className={`shrink-0 ${className}`}
    >
      <path
        d="M2.5 7.5v-5h5M16.5 2.5h5v5M21.5 16.5v5h-5M7.5 21.5h-5v-5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="square"
      />
      <ellipse cx="12" cy="12" rx="6.2" ry="3.1" transform="rotate(-28 12 12)" fill="var(--color-accent, #FF6A2B)" />
    </svg>
  );
}

export function Logo({ size = 22, className = "", wordmark = true }: { size?: number; className?: string; wordmark?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-2 text-ink ${className}`}>
      <LogoMark size={size} />
      {wordmark && <span className="text-[15px] font-semibold tracking-[-0.01em]">Holorra</span>}
    </span>
  );
}

export default Logo;
