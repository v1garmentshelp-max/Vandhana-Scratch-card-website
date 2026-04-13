import React, { useEffect, useMemo, useRef, useState } from "react";
import "./UserFormPopup.css";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "https://jockey-scratch-card-backend.vercel.app";

export default function UserFormPopup({ onClose, onSubmit }) {
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const modalRef = useRef(null);

  const cleanMobile = useMemo(() => mobile.replace(/\D/g, "").slice(0, 10), [mobile]);

  useEffect(() => {
    setError("");
  }, [name, mobile]);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape" && !loading) onClose?.();
      if (e.key === "Enter") return;
      if (e.key === "Tab") {
        const root = modalRef.current;
        if (!root) return;
        const focusables = root.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (!focusables.length) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [loading, onClose]);

  const isValidMobile = (value) => /^[6-9]\d{9}$/.test(value);

  const checkCustomer = async (mb) => {
    const res = await fetch(`${API_BASE_URL}/api/check-customer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mobile: mb }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed");
    return data.exists;
  };

  const saveEntry = async (payload) => {
    const res = await fetch(`${API_BASE_URL}/api/save-entry`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed");
    return data;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const nm = name.trim();
    const mb = cleanMobile;

    if (!nm) return setError("Please enter your name");
    if (!isValidMobile(mb)) return setError("Enter a valid 10-digit mobile number");

    setLoading(true);
    setError("");

    try {
      const exists = await checkCustomer(mb);
      if (exists) {
        setLoading(false);
        return setError("This mobile number is already used");
      }

      await saveEntry({ name: nm, mobile: mb });

      setLoading(false);
      onSubmit?.({ name: nm, mobile: mb });
      onClose?.();
    } catch (err) {
      setLoading(false);
      setError(err.message || "Something went wrong");
    }
  };

  return (
    <div className="uf-overlay" role="dialog" aria-modal="true">
      <div className="uf-backdrop" onClick={loading ? undefined : onClose} />

      <div className="uf-modal" ref={modalRef} onClick={(e) => e.stopPropagation()}>
        <div className="uf-glow uf-glow-a" />
        <div className="uf-glow uf-glow-b" />

        <div className="uf-head">
          <div className="uf-brand">
            <div className="uf-mark">
              <span className="uf-mark-dot" />
            </div>
            <div className="uf-brand-text">
              <div className="uf-brand-title">SLG JOCKEY</div>
              <div className="uf-brand-sub">Rewards Entry</div>
            </div>
          </div>

          <button
            className="uf-close"
            onClick={loading ? undefined : onClose}
            aria-label="Close"
            disabled={loading}
          >
            ✕
          </button>
        </div>

        <div className="uf-hero">
          <h2 className="uf-title">Customer Details</h2>
          <p className="uf-subtitle">Fill your name and mobile number to continue.</p>
        </div>

        <form className="uf-form" onSubmit={handleSubmit}>
          <div className="uf-grid">
            <div className="uf-field">
              <label className="uf-label">Name</label>
              <div className="uf-input-wrap">
                <span className="uf-ic">👤</span>
                <input
                  className="uf-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Full name"
                  autoFocus
                  disabled={loading}
                />
              </div>
            </div>

            <div className="uf-field">
              <label className="uf-label">Mobile</label>
              <div className="uf-input-wrap">
                <span className="uf-ic">📱</span>
                <input
                  className="uf-input"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  placeholder="10-digit mobile"
                  inputMode="numeric"
                  maxLength={10}
                  disabled={loading}
                />
              </div>
              <div className="uf-hint">Only used to prevent duplicate entries.</div>
            </div>
          </div>

          {error ? (
            <div className="uf-error" role="alert">
              <div className="uf-error-dot" />
              <div className="uf-error-text">{error}</div>
            </div>
          ) : null}

          <div className="uf-actions">
            <button
              type="button"
              className="uf-btn uf-btn-ghost"
              onClick={loading ? undefined : onClose}
              disabled={loading}
            >
              Cancel
            </button>

            <button type="submit" className="uf-btn uf-btn-primary" disabled={loading}>
              {loading ? (
                <span className="uf-btn-loading">
                  <span className="uf-mini-loader" />
                  Submitting
                </span>
              ) : (
                "Submit"
              )}
            </button>
          </div>

          <div className="uf-footer">
            Press <span className="uf-kbd">Esc</span> to close
          </div>
        </form>
      </div>
    </div>
  );
}
