import React from 'react';

export const AmbientBackground = () => {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 bg-[#FAFBFD]">
      {/* ── Top-Left Sky Blue Ambient Glow (Screenshot Style) ──────── */}
      <div 
        className="absolute -top-28 -left-28 w-[520px] h-[520px] rounded-full opacity-60 filter blur-[110px] animate-orb-1"
        style={{
          background: 'radial-gradient(circle, rgba(96, 165, 250, 0.65) 0%, rgba(147, 197, 253, 0.35) 60%, transparent 75%)',
        }}
      />

      {/* ── Right-Center Purple / Violet Ambient Glow (Screenshot Style) ─ */}
      <div 
        className="absolute top-1/4 -right-32 w-[580px] h-[580px] rounded-full opacity-55 filter blur-[125px] animate-orb-2"
        style={{
          background: 'radial-gradient(circle, rgba(192, 132, 252, 0.6) 0%, rgba(216, 180, 254, 0.3) 60%, transparent 75%)',
        }}
      />

      {/* ── Bottom-Left Warm Pink / Rose Ambient Glow (Screenshot Style) ── */}
      <div 
        className="absolute -bottom-32 left-[10%] w-[540px] h-[540px] rounded-full opacity-50 filter blur-[120px] animate-orb-3"
        style={{
          background: 'radial-gradient(circle, rgba(244, 114, 182, 0.55) 0%, rgba(251, 207, 232, 0.3) 60%, transparent 75%)',
        }}
      />

      {/* ── Subtle Center-Top Soft Indigo Light ────────────────────────── */}
      <div 
        className="absolute top-10 right-1/3 w-[380px] h-[380px] rounded-full opacity-35 filter blur-[100px] animate-orb-1"
        style={{
          background: 'radial-gradient(circle, rgba(129, 140, 248, 0.4) 0%, transparent 70%)',
        }}
      />
    </div>
  );
};
