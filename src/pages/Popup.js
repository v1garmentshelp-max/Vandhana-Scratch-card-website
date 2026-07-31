import React from "react";
import "./Popup.css";

export default function Popup() {
  return (
    <div className="popup-overlay">
      <div className="popup-ambient">
        {Array.from({ length: 36 }).map((_, index) => (
          <i key={index} style={{ "--i": index + 1 }} />
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
          Register, spin the wheel and unlock a shopping discount or exciting
          gift from Vandhana Shopping Mall.
        </p>

        <p className="popup-subtext">
          Your surprise reward is ready. Complete your details to continue.
        </p>

        <div className="popup-actions">
          <button type="button" className="popup-btn">
            Spin & Win
          </button>
        </div>

        <div className="popup-shine" />
      </div>
    </div>
  );
}