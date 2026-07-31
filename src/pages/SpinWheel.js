import React, { useEffect, useMemo, useRef, useState } from "react";
import "./SpinWheel.css";

const segmentColors = [
  "#ffd60a",
  "#ff9f1c",
  "#f72585",
  "#7209b7",
  "#2ec4b6",
  "#3a86ff",
  "#fb5607",
  "#8ac926"
];

const getNormalizedRotation = (rotation) =>
  ((rotation % 360) + 360) % 360;

export default function SpinWheel({
  segments,
  landedRewardCode,
  canSpin,
  onSpinRequest,
  onSpinComplete,
  onSpinStateChange
}) {
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [animate, setAnimate] = useState(false);
  const pendingResultRef = useRef(null);
  const spinStartedRef = useRef(false);
  const initialAlignmentRef = useRef(false);

  const segmentAngle = segments.length > 0 ? 360 / segments.length : 360;

  const wheelBackground = useMemo(() => {
    if (!segments.length) {
      return "#242424";
    }

    return `conic-gradient(${segments
      .map((_, index) => {
        const start = index * segmentAngle;
        const end = (index + 1) * segmentAngle;
        return `${segmentColors[index % segmentColors.length]} ${start}deg ${end}deg`;
      })
      .join(", ")})`;
  }, [segments, segmentAngle]);

  useEffect(() => {
    if (
      !landedRewardCode ||
      !segments.length ||
      spinning ||
      spinStartedRef.current ||
      initialAlignmentRef.current
    ) {
      return;
    }

    const rewardIndex = segments.findIndex(
      (segment) => segment.rewardCode === landedRewardCode
    );

    if (rewardIndex < 0) {
      return;
    }

    const centerAngle = rewardIndex * segmentAngle + segmentAngle / 2;
    const targetRotation = (360 - centerAngle) % 360;

    initialAlignmentRef.current = true;
    setAnimate(false);
    setRotation(targetRotation);
  }, [landedRewardCode, segments, segmentAngle, spinning]);

  const handleSpin = async () => {
    if (!canSpin || spinning || !segments.length) {
      return;
    }

    try {
      setSpinning(true);
      setAnimate(true);
      spinStartedRef.current = true;
      onSpinStateChange?.(true);

      const result = await onSpinRequest();

      const rewardIndex = segments.findIndex(
        (segment) => segment.rewardCode === result.rewardCode
      );

      if (rewardIndex < 0) {
        throw new Error("The selected reward is not available on the wheel");
      }

      pendingResultRef.current = result;

      const centerAngle = rewardIndex * segmentAngle + segmentAngle / 2;
      const targetRotation = (360 - centerAngle) % 360;

      setRotation((previousRotation) => {
        const currentRotation = getNormalizedRotation(previousRotation);
        const adjustment =
          (targetRotation - currentRotation + 360) % 360;

        return previousRotation + 2160 + adjustment;
      });
    } catch (error) {
      pendingResultRef.current = null;
      setSpinning(false);
      setAnimate(false);
      onSpinStateChange?.(false);
      throw error;
    }
  };

  const handleTransitionEnd = () => {
    if (!spinning || !pendingResultRef.current) {
      return;
    }

    const completedResult = pendingResultRef.current;

    pendingResultRef.current = null;
    setSpinning(false);
    onSpinStateChange?.(false);
    onSpinComplete?.(completedResult);
  };

  return (
    <div className="sw-container">
      <div className="sw-stage">
        <div className="sw-pointer">
          <span />
        </div>

        <div
          className={`sw-wheel ${spinning ? "sw-wheel-spinning" : ""}`}
          style={{
            background: wheelBackground,
            transform: `rotate(${rotation}deg)`,
            transition: animate
              ? "transform 5.2s cubic-bezier(0.12, 0.72, 0.08, 1)"
              : "none"
          }}
          onTransitionEnd={handleTransitionEnd}
        >
          <div className="sw-wheel-border" />

          {segments.map((segment, index) => {
            const centerAngle = index * segmentAngle + segmentAngle / 2;
            const isLightSegment = index % 2 === 0;

            return (
              <div
                className={`sw-segment-label ${
                  isLightSegment
                    ? "sw-segment-label-dark"
                    : "sw-segment-label-light"
                }`}
                key={segment.id || segment.rewardCode}
                style={{
                  "--label-angle": `${centerAngle}deg`
                }}
              >
                <span>{segment.rewardLabel}</span>
              </div>
            );
          })}
        </div>

        <button
          type="button"
          className={`sw-spin-button ${spinning ? "sw-spin-button-loading" : ""}`}
          onClick={handleSpin}
          disabled={!canSpin || spinning || !segments.length}
        >
          <span>{spinning ? "WAIT" : "SPIN"}</span>
        </button>
      </div>

      <p className="sw-instruction">
        Tap the centre button once and wait for the wheel to stop.
      </p>
    </div>
  );
}