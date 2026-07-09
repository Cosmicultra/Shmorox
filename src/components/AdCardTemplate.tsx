"use client";

import { forwardRef, type ReactNode } from "react";
import { ADVISORPILOT_KNOWLEDGE, getPillarById } from "@/lib/knowledge/advisorpilot";
import type { AspectRatio } from "@/lib/types";
import { BRAND_TOKENS as T } from "@/lib/tokens";
import { sanitizeNoEmDash } from "@/lib/ad/content-guardrails";
import {
  ELEVATION,
  FONT_BODY,
  FONT_DISPLAY,
  LAYOUT,
  SPACE,
  SURFACE,
  TYPE,
  WAVE_OVERLAY,
} from "@/lib/ad/ad-design-system";
import { ProductScene } from "@/components/ad-card/ProductScene";

export interface AdCardProps {
  headline: string;
  subhead: string;
  cta: string;
  disclaimer: string;
  aspectRatio: AspectRatio;
  contentPillarId?: string;
  layoutVariant?: string;
  showQR?: boolean;
  qrDataUrl?: string;
}

function Canvas({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        position: "relative",
        overflow: "hidden",
        fontFamily: FONT_BODY,
        background: SURFACE.canvas,
        boxSizing: "border-box",
      }}
    >
      <div style={{ position: "absolute", inset: 0, background: SURFACE.ambient, pointerEvents: "none" }} />
      <div style={{ position: "absolute", inset: 0, background: SURFACE.ambientWarm, pointerEvents: "none" }} />
      <div
        style={{
          position: "absolute",
          left: 0,
          bottom: 0,
          width: 400,
          height: 400,
          backgroundImage: WAVE_OVERLAY,
          backgroundRepeat: "no-repeat",
          backgroundPosition: "left bottom",
          pointerEvents: "none",
          opacity: 0.9,
        }}
      />
      {children}
    </div>
  );
}

function Logo() {
  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src={ADVISORPILOT_KNOWLEDGE.logoPath}
      alt={ADVISORPILOT_KNOWLEDGE.brandMark}
      width={220}
      style={{ height: "auto", display: "block", maxHeight: 96, objectFit: "contain", objectPosition: "left top" }}
    />
  );
}

function EditorialHeadline({
  lines,
  highlightWord,
  size,
}: {
  lines: string[];
  highlightWord?: string;
  size: "square" | "vertical";
}) {
  const spec = size === "vertical" ? TYPE.displayLg : TYPE.displayMd;

  function renderLine(line: string) {
    if (!highlightWord) return line;
    const idx = line.toLowerCase().indexOf(highlightWord.toLowerCase());
    if (idx === -1) return line;
    const before = line.slice(0, idx);
    const match = line.slice(idx, idx + highlightWord.length);
    const after = line.slice(idx + highlightWord.length);
    return (
      <>
        {before}
        <span style={{ color: T.blue }}>{match}</span>
        {after}
      </>
    );
  }

  return (
    <h1 style={{ margin: 0 }}>
      {lines.map((line, i) => (
        <span
          key={i}
          style={{
            display: "block",
            fontFamily: FONT_DISPLAY,
            fontSize: spec.size,
            lineHeight: spec.lineHeight,
            fontWeight: spec.weight,
            letterSpacing: spec.tracking,
            color: T.navy,
          }}
        >
          {renderLine(line)}
        </span>
      ))}
    </h1>
  );
}

function WorkflowSteps({ steps }: { steps: { title: string; description: string }[] }) {
  const icons = ["↑", "◎", "✓"] as const;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: SPACE.md, marginTop: SPACE.lg }}>
      {steps.map((step, i) => (
        <div key={step.title} style={{ display: "flex", alignItems: "flex-start", gap: SPACE.md }}>
          <div
            style={{
              width: 36,
              height: 36,
              flexShrink: 0,
              background: "rgba(34, 81, 255, 0.08)",
              border: `1px solid rgba(34, 81, 255, 0.12)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 14,
              color: T.blue,
              fontWeight: 600,
            }}
          >
            {icons[i] ?? "•"}
          </div>
          <div>
            <div
              style={{
                fontSize: TYPE.stepTitle.size,
                lineHeight: TYPE.stepTitle.lineHeight,
                fontWeight: TYPE.stepTitle.weight,
                color: T.navy,
                letterSpacing: TYPE.stepTitle.tracking,
              }}
            >
              {step.title}
            </div>
            <div
              style={{
                marginTop: 2,
                fontSize: TYPE.stepDesc.size,
                lineHeight: TYPE.stepDesc.lineHeight,
                color: T.slate,
              }}
            >
              {step.description}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function CtaRow({ cta, qrDataUrl }: { cta: string; qrDataUrl?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: SPACE.lg, marginTop: SPACE.xl }}>
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: SPACE.sm,
          background: T.blue,
          color: T.white,
          padding: `${SPACE.md}px ${SPACE.xl}px`,
          fontSize: TYPE.cta.size,
          fontWeight: TYPE.cta.weight,
          letterSpacing: TYPE.cta.tracking,
          boxShadow: ELEVATION.cta,
        }}
      >
        <span>{cta}</span>
        <span style={{ fontSize: 18, lineHeight: 1 }}>→</span>
      </div>
      {qrDataUrl && (
        <div style={{ display: "flex", alignItems: "center", gap: SPACE.sm, opacity: 0.85 }}>
          <div
            style={{
              background: T.white,
              padding: 4,
              border: `1px solid ${T.border}`,
              boxShadow: ELEVATION.soft,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrDataUrl} alt="Scan to request a demo" width={56} height={56} style={{ display: "block" }} />
          </div>
        </div>
      )}
    </div>
  );
}

function TrustBanner() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: SPACE.md,
        background: SURFACE.trustBar,
        padding: `${SPACE.md}px ${SPACE.lg}px`,
        maxWidth: 520,
      }}
    >
      <div
        style={{
          width: 28,
          height: 28,
          flexShrink: 0,
          border: `1.5px solid rgba(255,255,255,0.35)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 14,
          color: T.white,
        }}
      >
        ◆
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: TYPE.trust.size,
            lineHeight: TYPE.trust.lineHeight,
            color: "#E8EDF2",
            fontWeight: TYPE.trust.weight,
          }}
        >
          {ADVISORPILOT_KNOWLEDGE.trustBanner}
        </div>
      </div>
      <div
        style={{
          fontSize: 9,
          fontWeight: 600,
          letterSpacing: "0.14em",
          color: "rgba(255,255,255,0.55)",
          whiteSpace: "nowrap",
        }}
      >
        ANALYZE. INSIGHT. ADVISE.{" "}
        <span style={{ color: T.blue }}>GROW.</span>
      </div>
    </div>
  );
}

function LegalLine({ text }: { text: string }) {
  return (
    <p
      style={{
        margin: 0,
        fontSize: TYPE.legal.size,
        lineHeight: TYPE.legal.lineHeight,
        color: T.slateLight,
        opacity: 0.55,
        maxWidth: 400,
      }}
    >
      {text}
    </p>
  );
}

function SquareCard({
  headline: h,
  subhead: s,
  cta,
  disclaimer: d,
  contentPillarId,
  qrDataUrl,
}: Omit<AdCardProps, "aspectRatio" | "layoutVariant" | "showQR">) {
  const pillar = contentPillarId ? getPillarById(contentPillarId) : undefined;
  const headline = sanitizeNoEmDash(h);
  const subhead = sanitizeNoEmDash(s);
  const disclaimer = sanitizeNoEmDash(d);
  const ctaText = sanitizeNoEmDash(cta);
  const lines = headline.split("\n").filter(Boolean);
  const steps = pillar?.workflowSteps ?? ADVISORPILOT_KNOWLEDGE.defaultWorkflowSteps;

  return (
    <Canvas>
      <div
        style={{
          width: LAYOUT.squareWidth,
          height: LAYOUT.squareHeight,
          padding: SPACE.hero,
          display: "grid",
          gridTemplateRows: "auto 1fr auto",
          gridTemplateColumns: `${LAYOUT.copyColumn}px 1fr`,
          columnGap: SPACE.lg,
          boxSizing: "border-box",
        }}
      >
        <div style={{ gridColumn: "1 / -1", marginBottom: SPACE.lg }}>
          <Logo />
        </div>

        <div
          style={{
            gridColumn: 1,
            gridRow: 2,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            zIndex: 20,
            paddingRight: SPACE.sm,
          }}
        >
          <EditorialHeadline lines={lines} highlightWord={pillar?.highlightWord} size="square" />
          <p
            style={{
              marginTop: SPACE.lg,
              fontSize: TYPE.bodyMd.size,
              lineHeight: TYPE.bodyMd.lineHeight,
              color: T.slate,
              maxWidth: 400,
            }}
          >
            {subhead}
          </p>
          <WorkflowSteps steps={steps} />
          <CtaRow cta={ctaText} qrDataUrl={qrDataUrl} />
        </div>

        <div
          style={{
            gridColumn: 2,
            gridRow: 2,
            position: "relative",
            minHeight: 0,
            zIndex: 10,
          }}
        >
          <div
            style={{
              position: "absolute",
              top: -SPACE.md,
              left: -SPACE.sm,
              right: -LAYOUT.productBleed,
              bottom: -SPACE.lg,
            }}
          >
            <ProductScene pillarId={contentPillarId} variant="square" />
          </div>
        </div>

        <div
          style={{
            gridColumn: 1,
            gridRow: 3,
            alignSelf: "end",
            paddingTop: SPACE.lg,
            zIndex: 20,
          }}
        >
          <LegalLine text={disclaimer} />
        </div>
        <div
          style={{
            gridColumn: 2,
            gridRow: 3,
            display: "flex",
            justifyContent: "flex-end",
            alignSelf: "end",
            paddingTop: SPACE.lg,
            zIndex: 20,
          }}
        >
          <TrustBanner />
        </div>
      </div>
    </Canvas>
  );
}

function VerticalCard({
  headline: h,
  subhead: s,
  cta,
  disclaimer: d,
  contentPillarId,
  qrDataUrl,
}: Omit<AdCardProps, "aspectRatio" | "layoutVariant" | "showQR">) {
  const pillar = contentPillarId ? getPillarById(contentPillarId) : undefined;
  const headline = sanitizeNoEmDash(h);
  const subhead = sanitizeNoEmDash(s);
  const disclaimer = sanitizeNoEmDash(d);
  const ctaText = sanitizeNoEmDash(cta);
  const lines = headline.split("\n").filter(Boolean);
  const steps = pillar?.workflowSteps ?? ADVISORPILOT_KNOWLEDGE.defaultWorkflowSteps;

  return (
    <Canvas>
      <div
        style={{
          width: LAYOUT.verticalWidth,
          height: LAYOUT.verticalHeight,
          padding: `${SPACE.canvas}px ${SPACE.hero}px ${SPACE.hero}px`,
          display: "grid",
          gridTemplateRows: "auto auto auto 1fr auto auto",
          boxSizing: "border-box",
        }}
      >
        <Logo />

        <div style={{ marginTop: SPACE.xxxl, maxWidth: 880, zIndex: 20 }}>
          <EditorialHeadline lines={lines} highlightWord={pillar?.highlightWord} size="vertical" />
          <p
            style={{
              marginTop: SPACE.xl,
              fontSize: TYPE.bodyLg.size,
              lineHeight: TYPE.bodyLg.lineHeight,
              color: T.slate,
              maxWidth: 720,
            }}
          >
            {subhead}
          </p>
        </div>

        <div style={{ marginTop: SPACE.xl, zIndex: 20 }}>
          <WorkflowSteps steps={steps} />
          <CtaRow cta={ctaText} qrDataUrl={qrDataUrl} />
        </div>

        <div style={{ position: "relative", marginTop: SPACE.xl, minHeight: 0 }}>
          <div style={{ position: "absolute", inset: 0, top: 0, bottom: -SPACE.md }}>
            <ProductScene pillarId={contentPillarId} variant="vertical" />
          </div>
        </div>

        <div style={{ marginTop: SPACE.xl, zIndex: 20 }}>
          <TrustBanner />
        </div>

        <div style={{ marginTop: SPACE.lg, zIndex: 20 }}>
          <LegalLine text={disclaimer} />
        </div>
      </div>
    </Canvas>
  );
}

export const AdCardTemplate = forwardRef<HTMLDivElement, AdCardProps>(function AdCardTemplate(
  { aspectRatio, qrDataUrl, ...props },
  ref
) {
  return (
    <div ref={ref}>
      {aspectRatio === "9:16" ? (
        <VerticalCard {...props} qrDataUrl={qrDataUrl} />
      ) : (
        <SquareCard {...props} qrDataUrl={qrDataUrl} />
      )}
    </div>
  );
});
