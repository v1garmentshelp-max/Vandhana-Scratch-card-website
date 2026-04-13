import React from 'react';
import './TaraLoader.css';

export default function TaraLoader() {
  return (
    <div className="tara-overlay">
      <div className="loader-card">
        <img src="/images/sample-logo.jpg" alt="Manhar" className="loader-logo" />
        <div className="logo-glow"></div>
        <div className="loading-wave">
          <div className="loading-bar"></div>
          <div className="loading-bar"></div>
          <div className="loading-bar"></div>
          <div className="loading-bar"></div>
        </div>
        <div className="pulse-ring"></div>
      </div>

      <div className="sparkles">
        {Array.from({ length: 36 }).map((_, i) => (
          <i key={i} style={{ '--i': i + 1 }} />
        ))}
      </div>

      <div className="confetti">
        {Array.from({ length: 24 }).map((_, i) => (
          <span key={i} style={{ '--c': i + 1 }} />
        ))}
      </div>
    </div>
  );
}
