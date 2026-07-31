import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import SpinWheel from "./SpinWheel";
import "./ScratchCardPage.css";

const API_BASE_URL = "https://vandhana-scratch-card-backend.vercel.app";

const readSavedCustomer = () => {
  try {
    return JSON.parse(localStorage.getItem("vandhana_user_form") || "null");
  } catch {
    return null;
  }
};

const updateSavedCustomer = (updates) => {
  const savedData = readSavedCustomer();

  if (!savedData) {
    return;
  }

  localStorage.setItem(
    "vandhana_user_form",
    JSON.stringify({
      ...savedData,
      ...updates
    })
  );
};

const requestSpinAccess = async (savedData) => {
  const mobileNumber = savedData?.formData?.mobileNumber;
  const dateOfBirth = savedData?.formData?.dateOfBirth;

  if (!mobileNumber || !dateOfBirth) {
    throw new Error("Customer spin access is missing");
  }

  const response = await fetch(`${API_BASE_URL}/api/customers/spin-access`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      mobileNumber,
      dateOfBirth
    })
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Unable to create spin access");
  }

  if (!data.spinToken) {
    throw new Error("Spin token was not returned by the server");
  }

  updateSavedCustomer({
    customerId: data.customerId || savedData.customerId || "",
    spinToken: data.spinToken
  });

  return data.spinToken;
};

const getRewardDescription = (reward) => {
  if (!reward) {
    return "";
  }

  if (reward.rewardType === "discount") {
    return `You have won ${reward.rewardLabel}. Show this result at the billing counter to claim your discount.`;
  }

  if (reward.rewardType === "prize") {
    return `You have won ${reward.rewardLabel}. Show this result at the billing counter to collect your gift.`;
  }

  return "Thank you for participating. Better luck next time.";
};

export default function ScratchCardPage() {
  const navigate = useNavigate();

  const [campaign, setCampaign] = useState(null);
  const [segments, setSegments] = useState([]);
  const [spinToken, setSpinToken] = useState("");
  const [reward, setReward] = useState(null);
  const [loading, setLoading] = useState(true);
  const [wheelSpinning, setWheelSpinning] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [error, setError] = useState("");
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    let active = true;

    const loadPage = async () => {
      try {
        const savedData = readSavedCustomer();

        if (!savedData?.formData?.mobileNumber) {
          navigate("/", { replace: true });
          return;
        }

        let currentToken = savedData.spinToken || "";

        if (!currentToken) {
          currentToken = await requestSpinAccess(savedData);
        }

        const wheelResponse = await fetch(`${API_BASE_URL}/api/wheel`);
        const wheelData = await wheelResponse.json().catch(() => ({}));

        if (!wheelResponse.ok) {
          throw new Error(
            wheelData.message || "Unable to load wheel configuration"
          );
        }

        let resultResponse = await fetch(`${API_BASE_URL}/api/spin-result`, {
          headers: {
            Authorization: `Bearer ${currentToken}`
          }
        });

        if (resultResponse.status === 401) {
          currentToken = await requestSpinAccess(savedData);

          resultResponse = await fetch(`${API_BASE_URL}/api/spin-result`, {
            headers: {
              Authorization: `Bearer ${currentToken}`
            }
          });
        }

        const resultData = await resultResponse.json().catch(() => ({}));

        if (!resultResponse.ok) {
          throw new Error(resultData.message || "Unable to load spin result");
        }

        if (!active) {
          return;
        }

        setCampaign(wheelData.campaign || null);
        setSegments(
          Array.isArray(wheelData.segments) ? wheelData.segments : []
        );
        setSpinToken(currentToken);
        setReward(resultData.hasSpun ? resultData.result : null);
      } catch (loadError) {
        if (active) {
          setError(loadError.message || "Unable to load the spin wheel");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadPage();

    return () => {
      active = false;
    };
  }, [navigate]);

  const getCurrentSpinToken = async () => {
    if (spinToken) {
      return spinToken;
    }

    const savedData = readSavedCustomer();

    if (!savedData) {
      throw new Error("Customer registration data is missing");
    }

    const newToken = await requestSpinAccess(savedData);

    setSpinToken(newToken);

    return newToken;
  };

  const handleSpinRequest = async () => {
    try {
      setError("");

      let currentToken = await getCurrentSpinToken();

      let response = await fetch(`${API_BASE_URL}/api/spin`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${currentToken}`,
          "Content-Type": "application/json"
        }
      });

      if (response.status === 401) {
        const savedData = readSavedCustomer();

        currentToken = await requestSpinAccess(savedData);
        setSpinToken(currentToken);

        response = await fetch(`${API_BASE_URL}/api/spin`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${currentToken}`,
            "Content-Type": "application/json"
          }
        });
      }

      const data = await response.json().catch(() => ({}));

      if (response.status === 409 && data.result) {
        return data.result;
      }

      if (!response.ok) {
        throw new Error(data.message || "Unable to complete the spin");
      }

      if (!data.result) {
        throw new Error("The server did not return a reward");
      }

      return data.result;
    } catch (spinError) {
      setError(spinError.message || "Unable to spin the wheel");
      throw spinError;
    }
  };

  const handleSpinComplete = (completedReward) => {
    setReward(completedReward);
    setShowToast(true);

    window.setTimeout(() => {
      setShowToast(false);
    }, 3200);
  };

  const handleClaim = async () => {
    if (!reward || reward.rewardType === "no_win" || claiming) {
      return;
    }

    try {
      setClaiming(true);
      setError("");

      let currentToken = await getCurrentSpinToken();

      let response = await fetch(`${API_BASE_URL}/api/spin/claim`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${currentToken}`,
          "Content-Type": "application/json"
        }
      });

      if (response.status === 401) {
        const savedData = readSavedCustomer();

        currentToken = await requestSpinAccess(savedData);
        setSpinToken(currentToken);

        response = await fetch(`${API_BASE_URL}/api/spin/claim`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${currentToken}`,
            "Content-Type": "application/json"
          }
        });
      }

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || "Unable to claim reward");
      }

      setReward(data.result);
      setShowToast(true);

      window.setTimeout(() => {
        setShowToast(false);
      }, 2800);
    } catch (claimError) {
      setError(claimError.message || "Unable to claim reward");
    } finally {
      setClaiming(false);
    }
  };

  const handleFinish = () => {
    localStorage.removeItem("vandhana_user_form");
    localStorage.setItem("vandhana_reset", "1");
    navigate("/", { replace: true });
  };

  const claimCompleted =
    reward?.claimStatus === "claimed" ||
    reward?.claimStatus === "redeemed";

  if (loading) {
    return (
      <div className="sc-wrap">
        <div className="sc-loading-card">
          <div className="sc-loader" />
          <h2>Preparing your spin wheel</h2>
          <p>Please wait while we load your rewards.</p>
        </div>
      </div>
    );
  }

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
            <p className="sc-subtitle">
              Spin the wheel and reveal your reward
            </p>
          </div>
        </div>

        <div className="sc-top-note">
          <span className="sc-note-chip">
            {campaign?.wheelTitle || "Spin & Win"}
          </span>

          <p>
            Press the centre button once and wait for the wheel to stop on your
            reward.
          </p>
        </div>

        {error ? <div className="sc-error">{error}</div> : null}

        {segments.length > 0 ? (
          <div className="sc-wheel-card">
            <SpinWheel
              segments={segments}
              landedRewardCode={reward?.rewardCode}
              canSpin={!reward && !wheelSpinning}
              onSpinRequest={handleSpinRequest}
              onSpinComplete={handleSpinComplete}
              onSpinStateChange={setWheelSpinning}
            />
          </div>
        ) : (
          <div className="sc-empty-state">
            No active rewards are available right now.
          </div>
        )}

        {showToast && reward ? (
          <div
            className={`sc-toast ${
              reward.rewardType === "no_win" ? "sc-toast-neutral" : ""
            }`}
          >
            {reward.rewardType === "no_win"
              ? reward.rewardLabel
              : `🎉 ${reward.rewardLabel}`}
          </div>
        ) : null}

        {reward && !wheelSpinning ? (
          <div className={`sc-result-card sc-result-${reward.rewardType}`}>
            <span className="sc-result-badge">
              {reward.rewardType === "discount"
                ? "Discount Unlocked"
                : reward.rewardType === "prize"
                  ? "Gift Unlocked"
                  : "Spin Completed"}
            </span>

            {reward.rewardType === "prize" && reward.imageUrl ? (
              <div className="sc-result-image-wrap">
                <img
                  src={reward.imageUrl}
                  alt={reward.rewardLabel}
                  className="sc-result-image"
                />
              </div>
            ) : null}

            {reward.rewardType === "discount" ? (
              <div className="sc-result-value">
                {reward.discountPercent}% OFF
              </div>
            ) : null}

            <h2 className="sc-result-title">{reward.rewardLabel}</h2>

            <p className="sc-result-description">
              {getRewardDescription(reward)}
            </p>

            <div className="sc-result-meta">
              <span>Spin #{reward.spinNumber}</span>
              <span>
                {reward.claimStatus === "not_applicable"
                  ? "Completed"
                  : reward.claimStatus}
              </span>
            </div>

            <div className="sc-actions">
              {reward.rewardType !== "no_win" && !claimCompleted ? (
                <button
                  type="button"
                  className="sc-cta"
                  onClick={handleClaim}
                  disabled={claiming}
                >
                  {claiming ? "Claiming..." : "Claim Reward"}
                </button>
              ) : null}

              {claimCompleted ? (
                <div className="sc-claimed-message">
                  Reward claim recorded successfully
                </div>
              ) : null}

              <button
                type="button"
                className="sc-secondary-cta"
                onClick={handleFinish}
                disabled={claiming}
              >
                {reward.rewardType === "no_win"
                  ? "Finish"
                  : claimCompleted
                    ? "New Customer Entry"
                    : "Finish Later"}
              </button>

              <p className="sc-note">
                Show this reward result at the billing counter.
              </p>
            </div>
          </div>
        ) : null}

        {!reward ? (
          <div className="sc-footer">
            <p className="sc-footer-text">
              Powered by Vandhana Shopping Mall Rewards
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}