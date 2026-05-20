// src/components/layout/TestEnvironmentBanner.tsx
// ── ENB DOCTRINE: Amber banner on EVERY test environment screen — no exceptions
// Z-index 9999 — above all other elements including navigation
// Height 36px, full width, white bold text on #F59E0B amber background
// Only renders when isTestEnvironment === true

import { useEnvironment } from '@/contexts/EnvironmentContext';

export default function TestEnvironmentBanner() {
  const { isTestEnvironment } = useEnvironment();

  if (!isTestEnvironment) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '36px',
        backgroundColor: '#F59E0B',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
      }}
    >
      <span style={{ fontSize: '13px', color: '#fff', fontWeight: 700, letterSpacing: '0.01em' }}>
        🧪 TEST ENVIRONMENT — All data is for development and testing purposes only
      </span>
    </div>
  );
}
