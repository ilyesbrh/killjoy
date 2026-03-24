export default function AppLogo({ size = 40, className = "" }: { size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} className={className} fill="none">
      {/* Shield shape */}
      <path
        d="M24 3 L43 13 L43 28 Q43 41 24 46 Q5 41 5 28 L5 13 Z"
        fill="currentColor"
      />
      {/* Lightning bolt */}
      <path
        d="M27.5 11 L17 27 H23.5 L19.5 37 L33 23 H26.5 Z"
        fill="white"
      />
    </svg>
  );
}
