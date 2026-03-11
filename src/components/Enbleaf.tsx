// ENB Brand Leaf — used consistently across all pages, PWA icons, and splash screen
// Single source of truth for the ENB leaf icon

interface ENBLeafProps {
  size?: number;
  color?: string;
  className?: string;
}

export default function ENBLeaf({ size = 24, color = 'currentColor', className = '' }: ENBLeafProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Outer leaf shape — teardrop pointing up-right, classic single leaf */}
      <path
        d="M50 8 
           C50 8, 88 18, 90 55 
           C92 78, 72 92, 50 92 
           C50 92, 50 55, 50 8 Z"
        fill={color}
        opacity="1"
      />
      {/* Left lobe of leaf */}
      <path
        d="M50 8 
           C50 8, 12 18, 10 55 
           C8 78, 28 92, 50 92 
           C50 92, 50 55, 50 8 Z"
        fill={color}
        opacity="0.75"
      />
      {/* Central vein */}
      <line
        x1="50" y1="14"
        x2="50" y2="88"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
        opacity="0.6"
      />
      {/* Right lateral veins */}
      <line x1="50" y1="38" x2="72" y2="30" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
      <line x1="50" y1="52" x2="76" y2="48" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
      <line x1="50" y1="66" x2="72" y2="65" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
      {/* Left lateral veins */}
      <line x1="50" y1="38" x2="28" y2="30" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
      <line x1="50" y1="52" x2="24" y2="48" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
      <line x1="50" y1="66" x2="28" y2="65" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
    </svg>
  );
}

// For use as an img src — returns a data URI of the SVG
export function ENBLeafDataURI(color = '%231A6B3C'): string {
  return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cpath d='M50 8 C50 8 88 18 90 55 C92 78 72 92 50 92 C50 92 50 55 50 8 Z' fill='${color}'/%3E%3Cpath d='M50 8 C50 8 12 18 10 55 C8 78 28 92 50 92 C50 92 50 55 50 8 Z' fill='${color}' opacity='0.75'/%3E%3Cline x1='50' y1='14' x2='50' y2='88' stroke='white' stroke-width='2.5' stroke-linecap='round' opacity='0.6'/%3E%3C/svg%3E`;
}
