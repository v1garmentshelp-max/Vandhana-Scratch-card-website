import React, { useEffect, useState } from "react";
import ScratchCanvas from "./ScratchCanvas";
import { useNavigate } from "react-router-dom";
import { usePopup } from "../PopupProvider";
import "./ScratchCardPage.css";

const rewards = [
  {
    id: 1,
    type: "image",
    title: "Premium Pen Gift",
    subtitle: "A stylish complimentary gift for you",
    description: "You have unlocked a premium pen from Vandhana Shopping Mall. Please collect it at the billing counter with your reward confirmation.",
    image: "/images/pen.jpg",
    toast: "You won a premium pen gift"
  },
  {
    id: 2,
    type: "image",
    title: "Key Chain Gift",
    subtitle: "A special surprise for your visit",
    description: "You have unlocked a beautiful key chain gift. Show this reward at the counter and claim your gift today.",
    image: "/images/key-chain.jpg",
    toast: "You won a key chain gift"
  },
  {
    id: 3,
    type: "text",
    title: "10% Discount Reward",
    subtitle: "Claim on your next purchase",
    description: "You won 10% discount on your next purchase at Vandhana Shopping Mall. Keep this reward safe and redeem it during your next shopping visit for extra savings.",
    badge: "Next Purchase Offer",
    toast: "You won 10% discount for your next purchase"
  },
  {
    id: 4,
    type: "text",
    title: "5% Instant Discount",
    subtitle: "Valid on this purchase",
    description: "You got 5% instant discount on this purchase. Please show this reward to the billing team and enjoy your savings right away.",
    badge: "Instant Savings",
    toast: "You won 5% instant discount"
  }
];

export default function ScratchCardPage() {
  const [reward, setReward] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [showPrizePopup, setShowPrizePopup] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const { triggerPopup } = usePopup();
  const navigate = useNavigate();

  useEffect(() => {
    const randomReward = rewards[Math.floor(Math.random() * rewards.length)];
    setReward(randomReward);
  }, []);

  const onComplete = () => {
    setRevealed(true);
    setShowPrizePopup(true);
    setTimeout(() => setShowPrizePopup(false), 2800);
  };

  const handleClaim = async () => {
    setClaiming(true);
    await new Promise((resolve) => setTimeout(resolve, 900));
    await triggerPopup();
    localStorage.removeItem("vandhana_user_form");
    localStorage.setItem("vandhana_reset", "1");
    navigate("/");
    setClaiming(false);
  };

  return (
    <div className="sc-wrap">
      <div className="sc-glow sc-glow-a" />
      <div className="sc-glow sc-glow-b" />

      <div className="sc-shell">
        <div className="sc-header">
          <div className="sc-logo-wrap">
            <div className="sc-logo-badge">V</div>
          </div>
          <div className="sc-title-wrap">
            <h1 className="sc-title">Vandhana Shopping Mall</h1>
            <p className="sc-subtitle">Scratch to reveal your surprise reward</p>
          </div>
        </div>

        <div className="sc-top-note">
          <span className="sc-note-chip">Lucky Reward Card</span>
          <p>Scratch the card below and reveal one surprise gift or discount offer.</p>
        </div>

        <div className={`sc-card ${revealed ? "done" : ""}`}>
          <div className="sc-card-frame" />
          <div className="sc-card-inner">
            <ScratchCanvas
              width={320}
              height={320}
              coverImage="/images/qr4.jpg"
              brushSize={26}
              finishPercent={40}
              onComplete={onComplete}
            >
              <div className="sc-reveal-layer">
                {reward ? (
                  <div className="sc-reward">
                    {reward.type === "image" ? (
                      <>
                        <div className="sc-reward-badge">Gift Unlocked</div>
                        <div className="sc-reward-image-wrap">
                          <img src={reward.image} alt={reward.title} className="sc-reward-image" />
                        </div>
                        <div className="sc-reward-title">{reward.title}</div>
                        <div className="sc-reward-subtitle">{reward.subtitle}</div>
                        <div className="sc-reward-text">{reward.description}</div>
                      </>
                    ) : (
                      <>
                        <div className="sc-reward-badge">{reward.badge}</div>
                        <div className="sc-reward-value">{reward.title}</div>
                        <div className="sc-reward-subtitle">{reward.subtitle}</div>
                        <div className="sc-reward-text">{reward.description}</div>
                      </>
                    )}
                  </div>
                ) : null}
              </div>
            </ScratchCanvas>

            {!revealed ? (
              <div className="sc-hint">
                <div className="sc-hint-title">Scratch here</div>
                <div className="sc-hint-text">Your gift or discount is waiting inside</div>
              </div>
            ) : null}
          </div>
        </div>

        {showPrizePopup && reward ? (
          <div className="sc-toast">🎉 {reward.toast}</div>
        ) : null}

        {revealed ? (
          <div className="sc-actions">
            <button
              className={`sc-cta ${claiming ? "loading" : ""}`}
              onClick={handleClaim}
              disabled={claiming}
            >
              {claiming ? "Submitting..." : "Claim Reward"}
            </button>
            <p className="sc-note">
              Please show this reward at the counter to redeem your gift or discount.
            </p>
          </div>
        ) : (
          <div className="sc-footer">
            <p className="sc-footer-text">Powered by Vandhana Shopping Mall Rewards</p>
          </div>
        )}
      </div>
    </div>
  );
}