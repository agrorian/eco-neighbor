// ENB Brand Leaf — single source of truth for the ENB logo
// Uses the real ENB logo image everywhere

interface ENBLeafProps {
  size?: number;
  className?: string;
}

export default function ENBLeaf({ size = 24, className = '' }: ENBLeafProps) {
  return (
    <img
      src="/enb-logo.png"
      alt="ENB"
      width={size}
      height={size}
      className={className}
      style={{ objectFit: 'contain' }}
    />
  );
}

// For use as an img src string
export function ENBLogoSrc(): string {
  return '/enb-logo.png';
}
