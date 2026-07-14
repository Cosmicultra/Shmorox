import type { CSSProperties } from "react";
import { BRAND_TOKENS as T } from "@/lib/tokens";
import { ELEVATION, SURFACE } from "@/lib/ad/ad-design-system";
import { AD_TEMPLATE_REGISTRY, type AdTemplateId } from "@/lib/ad/ad-template-registry";
import {
  getBackgroundLayer,
  getScreenshotForTemplate,
  type BackgroundLayerSpec,
} from "@/lib/ad/asset-pack";

interface AssetCompositorProps {
  templateId: AdTemplateId;
  pillarId?: string;
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

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
      <svg
        viewBox={variant === "vertical" ? "0 0 640 720" : "0 0 560 520"}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", zIndex: 3 }}
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id="assetDiagChartLine" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0%" stopColor={T.blue} stopOpacity="0.55" />
            <stop offset="100%" stopColor={T.blue} />
          </linearGradient>
        </defs>
        <path
          d={chartPath}
          fill="none"
          stroke="url(#assetDiagChartLine)"
          strokeWidth={variant === "vertical" ? 5 : 4}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          clipPath: panelClip,
          opacity: 0.15,
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
          zIndex: 2,
        }}
      />
    </div>
  );
}

function PanelBlendGradient({ variant }: { variant: "square" | "vertical" }) {
  if (variant === "vertical") return null;

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        bottom: 0,
        width: "12%",
        background: "linear-gradient(to right, #F8F9FB 0%, transparent 100%)",
        zIndex: 4,
        pointerEvents: "none",
      }}
    />
  );
}

function PhotoBackground({
  spec,
  variant,
}: {
  spec: BackgroundLayerSpec;
  variant: "square" | "vertical";
}) {
  if (spec.type === "gradient") {
    return (
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(135deg, ${SURFACE.canvas} 0%, #f0f4f8 100%)`,
        }}
      >
        {spec.useRadiatingLines && <RadiatingLines />}
      </div>
    );
  }

  if (spec.type === "diagonal" && spec.assetPath) {
    return (
      <>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={spec.assetPath}
          alt=""
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: variant === "vertical" ? "center top" : "right center",
          }}
        />
        <DiagonalChartOverlay variant={variant} />
      </>
    );
  }

  if (spec.type === "photo" && spec.assetPath) {
    const clip = spec.clipRect;
    const containerStyle: CSSProperties = {
      position: "absolute",
      inset: 0,
      overflow: "hidden",
      clipPath: clip?.clipPath,
    };

    const imgStyle: CSSProperties = clip
      ? {
          position: "absolute",
          top: 0,
          right: 0,
          width: clip.imgWidth,
          height: clip.imgHeight,
          objectFit: "cover",
          objectPosition: clip.objectPosition,
        }
      : {
          position: "absolute",
          top: 0,
          right: 0,
          height: "100%",
          width: "115%",
          objectFit: "cover",
          objectPosition: "right center",
        };

    return (
      <div style={containerStyle}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={spec.assetPath} alt="" style={imgStyle} />
      </div>
    );
  }

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: SURFACE.officeWarm,
      }}
    />
  );
}

function ScreenInset({
  templateId,
  pillarId,
  variant,
}: {
  templateId: AdTemplateId;
  pillarId?: string;
  variant: "square" | "vertical";
}) {
  const aspectRatio = variant === "vertical" ? "9:16" : "1:1";
  const screen = getScreenshotForTemplate(templateId, pillarId, aspectRatio);
  if (!screen) return null;

  const { anchor } = screen;
  const isDashboard = templateId === "split-dashboard";
  const rotateY = anchor.rotateY ?? 0;
  const rotateX = anchor.rotateX ?? 0;
  const scale = anchor.scale ?? 1;

  return (
    <div
      style={{
        position: "absolute",
        top: anchor.top,
        left: anchor.left,
        width: anchor.width,
        transform: `
          perspective(1200px)
          rotateY(${rotateY}deg)
          rotateX(${rotateX}deg)
          scale(${scale})
        `,
        transformOrigin: "center center",
        zIndex: 5,
      }}
    >
      <div
        style={{
          borderRadius: isDashboard ? 12 : 6,
          overflow: "hidden",
          boxShadow: ELEVATION.float,
          border: `1px solid rgba(0,0,0,0.08)`,
          background: T.navy,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={screen.screenshotPath}
          alt={screen.screenshotTitle}
          style={{
            display: "block",
            width: "100%",
            height: "auto",
          }}
        />
      </div>
    </div>
  );
}

export function AssetCompositor({ templateId, pillarId, variant }: AssetCompositorProps) {
  const template = AD_TEMPLATE_REGISTRY[templateId];
  const aspectRatio = variant === "vertical" ? "9:16" : "1:1";
  const bgSpec = getBackgroundLayer(templateId, aspectRatio);

  const panelStyle: CSSProperties = {
    position: "relative",
    width: "100%",
    height: "100%",
    overflow: "hidden",
    borderRadius: variant === "vertical" ? "12px 12px 0 0" : "0 0 0 8px",
  };

  return (
    <div style={panelStyle}>
      <PhotoBackground spec={bgSpec} variant={variant} />
      {template.visual.mode !== "diagonal" && (
        <ScreenInset templateId={templateId} pillarId={pillarId} variant={variant} />
      )}
      <PanelBlendGradient variant={variant} />
    </div>
  );
}
