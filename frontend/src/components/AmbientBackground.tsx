import './AmbientBackground.css';

export function AmbientBackground() {
  return (
    <div className="pk-cyber-bg" aria-hidden="true">
      {/* Focused Top Cyan/Sapphire Ambient Glow */}
      <div className="pk-bg-top-glow" />
      
      {/* High-Tech Cyber Grid */}
      <div className="pk-bg-grid" />
      
      {/* Vignette Overlay for focus & depth */}
      <div className="pk-bg-vignette" />

      {/* Gentle Tech Scanline */}
      <div className="pk-bg-scanline" />
    </div>
  );
}
