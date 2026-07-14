import type { CSSProperties } from "react";
import { ELEVATION, FONT_BODY, SURFACE, WAVE_OVERLAY } from "@/lib/ad/ad-design-system";
import { getPrimaryScreenshotForPillar } from "@/lib/ad/product-screenshots";
import {
  VISUAL_PANEL_CONFIG,
  getVisualStyle,
  type LayoutVariant,
  type VisualStyle,
} from "@/lib/ad/visual-config";
import { BRAND_TOKENS as T } from "@/lib/tokens";
import { ProductScene } from "@/components/ad-card/ProductScene";

interface VisualPanelProps {
  pillarId?: string;
  layoutVariant?: LayoutVariant;
  variant: "square" | "vertical";
}

function RadiatingLines() {
  return (
    <svg
      viewBox="0 0 560 800"
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.35 }}
      preserveAspectRatio="xMidYMid slice"
    >
      {[...Array(12)].map((_, i) => {
        const angle = -60 + i * 12;
        return (
          <line
            key={i}
            x1="280"
            y1="400"
            x2={280 + Math.cos((angle * Math.PI) / 180) * 600}
            y2={400 + Math.sin((angle * Math.PI) / 180) * 600}
            stroke="rgba(34, 81, 255, 0.12)"
            strokeWidth="1"
          />
        );
      })}
    </svg>
  );
}

function DiagonalChartOverlay({ variant }: { variant: "square" | "vertical" }) {
  const panelClip =
    variant === "vertical"
      ? "polygon(0 10%, 100% 0, 100% 100%, 0 100%)"
      : "polygon(0 6%, 100% 0, 100% 100%, 0 100%)";

  const chartPath =
    variant === "vertical"
      ? "M24,680 L140,620 L260,540 L380,440 L500,320 L620,180"
      : "M20,480 L100,440 L180,390 L260,320 L340,240 L420,160 L500,90";

  const chartPoints: [number, number][] =
    variant === "vertical"
      ? [
          [24, 680],
          [140, 620],
          [260, 540],
          [380, 440],
          [500, 320],
          [620, 180],
        ]
      : [
          [20, 480],
          [100, 440],
          [180, 390],
          [260, 320],
          [340, 240],
          [420, 160],
          [500, 90],
        ];

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(180deg, ${T.navy} 0%, #0a2540 55%, #061828 100%)`,
          clipPath: panelClip,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          clipPath: panelClip,
          background:
            "linear-gradient(160deg, rgba(34,81,255,0.12) 0%, transparent 40%), radial-gradient(ellipse 80% 50% at 70% 85%, rgba(15,111,222,0.15) 0%, transparent 70%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          clipPath: panelClip,
          opacity: 0.2,
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />
      <svg
        viewBox={variant === "vertical" ? "0 0 640 720" : "0 0 560 520"}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id="diagChartLine" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0%" stopColor={T.blue} stopOpacity="0.45" />
            <stop offset="100%" stopColor={T.blue} />
          </linearGradient>
        </defs>
        <path
          d={chartPath}
          fill="none"
          stroke="url(#diagChartLine)"
          strokeWidth={variant === "vertical" ? 5 : 4}
          strokeLinecap="round"
        />
        {chartPoints.map(([cx, cy], i) => (
          <circle key={i} cx={cx} cy={cy} r={variant === "vertical" ? 9 : 8} fill={T.blue} opacity={0.9} />
        ))}
      </svg>
      <div
        style={{
          position: "absolute",
          right: variant === "vertical" ? 48 : 24,
          bottom: variant === "vertical" ? 64 : 40,
          width: variant === "vertical" ? 240 : 180,
          height: variant === "vertical" ? 240 : 180,
          borderRadius: "50%",
          border: "2px solid rgba(34, 81, 255, 0.25)",
          opacity: 0.4,
          clipPath: panelClip,
        }}
      />
      <div
        style={{
          position: "absolute",
          right: variant === "vertical" ? 72 : 48,
          bottom: variant === "vertical" ? 88 : 64,
          width: variant === "vertical" ? 192 : 132,
          height: variant === "vertical" ? 192 : 132,
          borderRadius: "50%",
          border: "3px solid rgba(255,255,255,0.08)",
          opacity: 0.5,
          clipPath: panelClip,
        }}
      />
    </div>
  );
}

function OfficeBackground({ style }: { style?: CSSProperties }) {
  return (
    <div style={{ position: "absolute", inset: 0, ...style }}>
      <div style={{ position: "absolute", inset: 0, background: SURFACE.officeWarm }} />
      <div
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          width: "75%",
          height: "45%",
          background: SURFACE.officeWindow,
          opacity: 0.35,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: WAVE_OVERLAY,
          backgroundRepeat: "no-repeat",
          backgroundPosition: "right bottom",
          backgroundSize: "320px",
          opacity: 0.5,
          transform: "scaleX(-1)",
        }}
      />
    </div>
  );
}

function DeviceFrame({
  device,
  screenshotPath,
  screenshotTitle,
  frame,
}: {
  device: "laptop" | "monitor";
  screenshotPath?: string;
  screenshotTitle?: string;
  frame: (typeof VISUAL_PANEL_CONFIG)[VisualStyle];
}) {
  const isLaptop = device === "laptop";
  const screenWidth = isLaptop ? "92%" : "88%";
  const screenHeight = isLaptop ? "78%" : "82%";
  const screenTop = isLaptop ? "6%" : "4%";

  return (
    <div
      style={{
        position: "absolute",
        inset: "8% 4% 12% 0",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        perspective: 1400,
      }}
    >
      <div
        style={{
          position: "relative",
          width: isLaptop ? "94%" : "90%",
          height: isLaptop ? "88%" : "92%",
          transform: `rotateY(${frame.rotateY}deg) rotateX(${frame.rotateX}deg) scale(${frame.scale}) translate(${frame.offsetX}px, ${frame.offsetY}px)`,
          transformOrigin: "left center",
        }}
      >
        {/* Screen bezel */}
        <div
          style={{
            position: "absolute",
            top: screenTop,
            left: "50%",
            transform: "translateX(-50%)",
            width: screenWidth,
            height: screenHeight,
            background: "#1a1a1a",
            borderRadius: isLaptop ? 8 : 4,
            padding: isLaptop ? 8 : 10,
            boxShadow: ELEVATION.product,
          }}
        >
          <div
            style={{
              width: "100%",
              height: "100%",
              overflow: "hidden",
              background: "#eef0f4",
              borderRadius: isLaptop ? 4 : 2,
            }}
          >
            {screenshotPath ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={screenshotPath}
                alt={screenshotTitle ?? "AdvisorPilot product"}
                style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top left" }}
              />
            ) : (
              <ProductScene pillarId={undefined} variant="square" useScreenshot={false} />
            )}
          </div>
        </div>

        {/* Laptop base or monitor stand */}
        {isLaptop ? (
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: "50%",
              transform: "translateX(-50%)",
              width: "100%",
              height: "14%",
              background: "linear-gradient(180deg, #c8cdd4 0%, #aeb6c0 100%)",
              borderRadius: "0 0 12px 12px",
              boxShadow: ELEVATION.raised,
            }}
          />
        ) : (
          <>
            <div
              style={{
                position: "absolute",
                bottom: "2%",
                left: "50%",
                transform: "translateX(-50%)",
                width: "28%",
                height: "8%",
                background: "#aeb6c0",
                borderRadius: "0 0 4px 4px",
              }}
            />
            <div
              style={{
                position: "absolute",
                bottom: 0,
                left: "50%",
                transform: "translateX(-50%)",
                width: "42%",
                height: "3%",
                background: "#9aa3ad",
                borderRadius: 4,
              }}
            />
          </>
        )}
      </div>
    </div>
  );
}

function DashboardPanel({ pillarId, variant, frame }: { pillarId?: string; variant: "square" | "vertical"; frame: (typeof VISUAL_PANEL_CONFIG)[VisualStyle] }) {
  return (
    <div style={{ position: "absolute", inset: 0, background: "#F4F6F9" }}>
      <RadiatingLines />
      <div
        style={{
          position: "absolute",
          inset: "6% 4% 8% 2%",
          transform: `rotateY(${frame.rotateY}deg) rotateX(${frame.rotateX}deg) scale(${frame.scale})`,
          transformOrigin: "center center",
          perspective: 1200,
        }}
      >
        <ProductScene pillarId={pillarId} variant={variant} useScreenshot={false} />
      </div>
    </div>
  );
}

function OfficePanel({
  pillarId,
  frame,
  deviceStyle,
}: {
  pillarId?: string;
  frame: (typeof VISUAL_PANEL_CONFIG)[VisualStyle];
  deviceStyle: VisualStyle;
}) {
  const shot = getPrimaryScreenshotForPillar(pillarId);
  const device = frame.device === "none" ? "laptop" : frame.device;

  return (
    <div style={{ position: "absolute", inset: 0, fontFamily: FONT_BODY }}>
      <OfficeBackground />
      <DeviceFrame
        device={deviceStyle === "office-monitor" ? "monitor" : device}
        screenshotPath={shot?.path}
        screenshotTitle={shot?.title}
        frame={frame}
      />
    </div>
  );
}

export function VisualPanel({ pillarId, layoutVariant = "split-office", variant }: VisualPanelProps) {
  const visualStyle = getVisualStyle(pillarId, layoutVariant);
  const frame = VISUAL_PANEL_CONFIG[visualStyle];

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        overflow: "hidden",
        fontFamily: FONT_BODY,
      }}
    >
      {visualStyle === "diagonal" && <DiagonalChartOverlay variant={variant} />}
      {visualStyle === "dashboard" && (
        <DashboardPanel pillarId={pillarId} variant={variant} frame={frame} />
      )}
      {(visualStyle === "office-laptop" || visualStyle === "office-monitor") && (
        <OfficePanel pillarId={pillarId} frame={frame} deviceStyle={visualStyle} />
      )}
    </div>
  );
}
