import React from "react";
import "./WelcomePopup.css";

export default function WelcomePopup({ show }) {
  if (!show) return null;

  return (
    <div className="jp-popup-overlay">
      <div className="jp-popup-card">
        <div className="jp-popup-glow" />

        <div className="jp-popup-header">
          <h1 className="jp-popup-title">Welcome to Jockey Rewards</h1>
          <p className="jp-popup-subtitle">
            Fill the form, share your feedback, and get a chance to scratch and win exciting rewards.
          </p>
        </div>

        <div className="jp-popup-content">
          <div className="jp-popup-badge">Exclusive In-Store Offer</div>

          <div className="jp-popup-steps">
            <div className="jp-step">
              <div className="jp-step-dot" />
              <div>
                <p className="jp-step-title">Fill Your Details</p>
                <p className="jp-step-desc">Quick form, takes less than a minute.</p>
              </div>
            </div>

            <div className="jp-step">
              <div className="jp-step-dot" />
              <div>
                <p className="jp-step-title">Give Feedback</p>
                <p className="jp-step-desc">Open Google Maps and share your experience.</p>
              </div>
            </div>

            <div className="jp-step">
              <div className="jp-step-dot" />
              <div>
                <p className="jp-step-title">Scratch & Win</p>
                <p className="jp-step-desc">Reveal your reward instantly on the screen.</p>
              </div>
            </div>
          </div>

          <div className="jp-popup-footer">
            <p className="jp-popup-note">
              Your mobile number will be used only to prevent duplicate entries.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
