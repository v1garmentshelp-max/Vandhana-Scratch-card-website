import React from 'react';
import './Popup.css';

export default function Popup() {
  return (
    <div className="popup-overlay">
      <div className="popup-ambient">
        {Array.from({ length: 36 }).map((_, i) => (
          <i key={i} style={{ '--i': i + 1 }} />
        ))}
      </div>

      <div className="popup-card">
        <div className="popup-glow" />
        <div className="popup-ring popup-ring-one" />
        <div className="popup-ring popup-ring-two" />

        <div className="popup-badge">
          <span className="popup-logo">V</span>
        </div>

        <p className="popup-label">Special Reward</p>
        <h2 className="popup-title">Vandhana Shopping Mall</h2>
        <p className="popup-text">
          Scratch and unlock a special shopping reward on your purchase. Enjoy exciting offers and get up to 10% discount today.
        </p>
        <p className="popup-subtext">
          Your surprise offer is ready. Start scratching now.
        </p>

        <div className="popup-actions">
          <button className="popup-btn">Scratch Now</button>
        </div>

        <div className="popup-shine" />
      </div>
    </div>
  );
}