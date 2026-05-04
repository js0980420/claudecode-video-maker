import React from "react";
import { spring, useCurrentFrame, useVideoConfig, interpolate, Easing } from "remotion";
import { SceneVisual } from "../../types";
import { Icon } from "../../icons";
import { BLACK, WHITE } from "../../constants";

type Props = Extract<SceneVisual, { type: "phoneCTA" }> & {
  accentColor: string;
};

export const PhoneCTA: React.FC<Props> = ({
  senderName,
  senderInitial,
  messagePreview,
  ctaText,
  accentColor,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // #3 stagger: phone → notif → cta,Back easing
  const phoneP = interpolate(Math.max(0, frame - 8), [0, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.back(1.3)),
  });
  const notifPop = spring({ frame: frame - 24, fps, config: { damping: 10 } });
  const ctaP = interpolate(Math.max(0, frame - 40), [0, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.back(1.3)),
  });

  const pulse = 1 + Math.sin(frame / 6) * 0.04;
  const arrowShift = Math.sin(frame / 5) * 6;

  // #5 CTA 按鈕 glow
  const ctaGlow = 10 + Math.sin(frame / 12) * 5;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 50 }}>
      <div
        style={{
          opacity: phoneP,
          transform: `scale(${phoneP}) translateY(${(1 - phoneP) * 24}px)`,
          position: "relative",
        }}
      >
        <Icon
          ref_={{ kind: "builtin", name: "phone" }}
          color={BLACK}
          accent={accentColor}
          size={180}
        />
        <div
          style={{
            position: "absolute",
            top: 44,
            left: 20,
            right: 20,
            transform: `scale(${notifPop})`,
            transformOrigin: "center top",
            background: WHITE,
            border: `4px solid ${BLACK}`,
            borderRadius: 12,
            padding: "10px 12px",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 14,
              background: accentColor,
              color: WHITE,
              fontSize: 16,
              fontWeight: 900,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "Arial, sans-serif",
            }}
          >
            {senderInitial}
          </div>
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontSize: 12,
                fontWeight: 900,
                color: BLACK,
                letterSpacing: 1,
              }}
            >
              {senderName}
            </div>
            <div style={{ fontSize: 11, color: BLACK, opacity: 0.7 }}>
              {messagePreview}
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          fontSize: 40,
          color: accentColor,
          transform: `translateX(${-arrowShift}px)`,
          fontWeight: 900,
        }}
      >
        ←
      </div>

      <div
        style={{
          transform: `scale(${ctaP * pulse}) translateY(${(1 - ctaP) * 24}px)`,
          opacity: ctaP,
          background: accentColor,
          color: WHITE,
          padding: "22px 40px",
          borderRadius: 16,
          fontSize: 32,
          fontWeight: 900,
          letterSpacing: 2,
          boxShadow: `6px 6px 0 ${BLACK}`,
          filter: `drop-shadow(0 0 ${ctaGlow}px ${accentColor}AA)`,
        }}
      >
        {ctaText}
      </div>
    </div>
  );
};
