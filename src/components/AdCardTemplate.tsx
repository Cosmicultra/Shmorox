"use client";

import { forwardRef, type CSSProperties, type ReactNode } from "react";
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
import { AdIcon, FeatureIconCircle } from "@/components/ad-card/AdIcons";
import { AssetCompositor } from "@/components/ad-card/AssetCompositor";
import { AD_TEMPLATE_REGISTRY, getPlatformTweak, getTemplateIdForPillar, type AdTemplateId } from "@/lib/ad/ad-template-registry";
import { resolveSupportingLine } from "@/lib/ad/ad-creative-content";
import { computeLogoSizing, type LogoSizingResult } from "@/lib/ad/logo-sizing";
import type { SocialPlatform } from "@/lib/types";
import {
  FOOTER_TRUST,
  getFeaturesForPillar,
  getStepsForPillar,
  getSupportingLine,
  usesStepList,
  type LayoutVariant,
} from "@/lib/ad/visual-config";

export interface AdCardProps {
  headline: string;
  subhead: string;
  cta: string;
  disclaimer: string;
  aspectRatio: AspectRatio;
  contentPillarId?: string;
  layoutVariant?: LayoutVariant | string;
  templateId?: AdTemplateId;
  platform?: SocialPlatform;
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
          bottom: LAYOUT.footerHeight,
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

function Logo({ sizing }: { sizing: LogoSizingResult }) {
  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src={ADVISORPILOT_KNOWLEDGE.logoPath}
      alt={ADVISORPILOT_KNOWLEDGE.brandMark}
      width={sizing.maxWidth}
      style={{
        height: "auto",
        display: "block",
        maxWidth: sizing.maxWidth,
        maxHeight: sizing.maxHeight,
        width: "100%",
        objectFit: "contain",
        objectPosition: "left top",
        background: "transparent",
      }}
    />
  );
}

function buildLogoSizing({
  aspectRatio,
  headline,
  subhead,
  supporting,
  hasAccentBar,
  hasStepList,
  qrDataUrl,
}: {
  aspectRatio: AspectRatio;
  headline: string;
  subhead: string;
  supporting: string;
  hasAccentBar?: boolean;
  hasStepList?: boolean;
  qrDataUrl?: string;
}): LogoSizingResult {
  return computeLogoSizing({
    aspectRatio,
    headlineLineCount: headline.split("\n").filter(Boolean).length,
    subheadLength: subhead.length,
    supportingLength: supporting.length,
    hasFeatureIcons: !hasStepList,
    hasStepList,
    hasAccentBar,
    qrPresent: Boolean(qrDataUrl),
  });
}

function QrCta({
  qrDataUrl,
  compact,
  qrSize,
}: {
  qrDataUrl?: string;
  compact?: boolean;
  qrSize?: number;
}) {
  if (!qrDataUrl) return null;

  const size = qrSize ?? (compact ? Math.round(LAYOUT.qrSize * 0.85) : LAYOUT.qrSize);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        gap: SPACE.sm,
        flexShrink: 0,
      }}
    >
      <div
        style={{
          background: T.white,
          padding: 6,
          border: `1px solid ${T.border}`,
          boxShadow: ELEVATION.raised,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={qrDataUrl}
          alt="Scan to request a demo"
          width={size}
          height={size}
          style={{ display: "block" }}
        />
      </div>
      <span
        style={{
          fontSize: TYPE.label.size,
          fontWeight: TYPE.label.weight,
          letterSpacing: TYPE.label.tracking,
          textTransform: "uppercase",
          color: T.slate,
        }}
      >
        Request a demo
      </span>
    </div>
  );
}

function EditorialHeadline({
  lines,
  highlightWord,
  size,
  fontSizePx,
}: {
  lines: string[];
  highlightWord?: string;
  size: "square" | "vertical";
  fontSizePx?: number;
}) {
  const spec = size === "vertical" ? TYPE.displayLg : TYPE.displayMd;
  const fontSize = fontSizePx ?? spec.size;

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
            fontSize: `${fontSize}px`,
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

function FeatureIconRow({
  pillarId,
  layout = "row",
}: {
  pillarId?: string;
  layout?: "row" | "grid";
}) {
  const features = getFeaturesForPillar(pillarId);
  const align = layout === "grid" ? "left" : "left";

  if (layout === "grid") {
    return (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 120px)",
          gap: SPACE.md,
          marginTop: SPACE.lg,
          justifyContent: "start",
        }}
      >
        {features.map((feature) => (
          <FeatureIconCircle
            key={feature.label}
            icon={feature.icon}
            label={feature.label}
            align={align}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "flex-start",
        gap: SPACE.md,
        marginTop: SPACE.lg,
        maxWidth: LAYOUT.copyColumn,
      }}
    >
      {features.map((feature) => (
        <FeatureIconCircle
          key={feature.label}
          icon={feature.icon}
          label={feature.label}
          align={align}
        />
      ))}
    </div>
  );
}

function StepList({ pillarId }: { pillarId?: string }) {
  const steps = getStepsForPillar(pillarId);
  if (!steps?.length) return null;

  return (
    <div style={{ marginTop: SPACE.lg, display: "flex", flexDirection: "column", gap: SPACE.md }}>
      {steps.map((step) => (
        <div key={step.title} style={{ display: "flex", gap: SPACE.md, alignItems: "flex-start" }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: "rgba(34, 81, 255, 0.08)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <AdIcon icon={step.icon} size={20} color={T.blue} />
          </div>
          <div>
            <div
              style={{
                fontSize: TYPE.stepTitle.size,
                fontWeight: TYPE.stepTitle.weight,
                lineHeight: TYPE.stepTitle.lineHeight,
                color: T.navy,
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

function FeatureBlock({
  pillarId,
  iconLayout = "row",
}: {
  pillarId?: string;
  iconLayout?: "row" | "grid";
}) {
  if (usesStepList(pillarId)) {
    return <StepList pillarId={pillarId} />;
  }
  return <FeatureIconRow pillarId={pillarId} layout={iconLayout} />;
}

function TrustFooter({ style }: { style?: CSSProperties }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: SPACE.xl,
        background: SURFACE.trustBar,
        height: LAYOUT.footerHeight,
        padding: `0 ${SPACE.xl}px`,
        zIndex: 30,
        ...style,
      }}
    >
      {FOOTER_TRUST.map((item, i) => (
        <div key={item.label} style={{ display: "flex", alignItems: "center", gap: SPACE.sm }}>
          {i > 0 && (
            <div
              style={{
                width: 1,
                height: 20,
                background: "rgba(255,255,255,0.2)",
                marginRight: SPACE.md,
              }}
            />
          )}
          <AdIcon icon={item.icon} size={16} color={T.blue} />
          <span
            style={{
              fontSize: TYPE.trust.size,
              fontWeight: TYPE.trust.weight,
              color: "#E8EDF2",
              whiteSpace: "nowrap",
            }}
          >
            {item.label}
          </span>
        </div>
      ))}
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
      }}
    >
      {text}
    </p>
  );
}

function LeftCopyStack({
  contentPillarId,
  headline,
  subhead,
  supporting,
  qrDataUrl,
  accentBar,
  headlineSize = "square",
  logoSizing,
  platform,
  templateId,
  iconLayout = "row",
}: {
  contentPillarId?: string;
  headline: string;
  subhead: string;
  supporting: string;
  qrDataUrl?: string;
  accentBar?: boolean;
  headlineSize?: "square" | "vertical";
  logoSizing: LogoSizingResult;
  platform?: SocialPlatform;
  templateId?: AdTemplateId;
  iconLayout?: "row" | "grid";
}) {
  const pillar = contentPillarId ? getPillarById(contentPillarId) : undefined;
  const lines = headline.split("\n").filter(Boolean);
  const sparseHeader = logoSizing.contentDensity < 0.55;
  const platformTweak =
    platform && templateId
      ? getPlatformTweak(AD_TEMPLATE_REGISTRY[templateId], platform)
      : {};
  const headlineScale = platformTweak.headlineScale ?? 1;
  const displaySpec =
    headlineSize === "vertical" ? TYPE.displayLg : TYPE.displayMd;
  const scaledHeadlineSize = Math.round(displaySpec.size * headlineScale);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        paddingRight: SPACE.md,
        zIndex: 20,
      }}
    >
      <div
        style={{
          ...(sparseHeader ? { minHeight: logoSizing.headerMinHeight } : {}),
          marginBottom: SPACE.md,
        }}
      >
        <Logo sizing={logoSizing} />
      </div>

      {accentBar && (
        <div
          style={{
            width: 48,
            height: 3,
            background: T.blue,
            marginBottom: SPACE.lg,
          }}
        />
      )}

      <EditorialHeadline
        lines={lines}
        highlightWord={pillar?.highlightWord}
        size={headlineSize}
        fontSizePx={scaledHeadlineSize}
      />

      <p
        style={{
          marginTop: SPACE.lg,
          fontSize: headlineSize === "vertical" ? TYPE.bodyLg.size : TYPE.bodyMd.size,
          lineHeight: headlineSize === "vertical" ? TYPE.bodyLg.lineHeight : TYPE.bodyMd.lineHeight,
          color: T.slate,
        }}
      >
        {subhead}
      </p>

      <FeatureBlock pillarId={contentPillarId} iconLayout={iconLayout} />

      {supporting ? (
        <p
          style={{
            marginTop: SPACE.lg,
            fontSize: TYPE.bodySm.size,
            lineHeight: TYPE.bodySm.lineHeight,
            color: T.slate,
            fontWeight: 500,
          }}
        >
          {supporting}
        </p>
      ) : null}

      <div
        style={{
          marginTop: SPACE.xl,
          paddingBottom: SPACE.xxl,
          marginBottom: headlineSize === "vertical" ? SPACE.lg : 0,
        }}
      >
        <QrCta
          qrDataUrl={qrDataUrl}
          compact={headlineSize === "vertical" || platformTweak.compactFooter}
          qrSize={platformTweak.qrSize}
        />
      </div>
    </div>
  );
}

function SplitLayoutCard({
  headline: h,
  subhead: s,
  disclaimer: d,
  contentPillarId,
  qrDataUrl,
  variant,
  templateId,
  platform,
}: {
  headline: string;
  subhead: string;
  disclaimer: string;
  contentPillarId?: string;
  qrDataUrl?: string;
  variant: LayoutVariant;
  templateId: AdTemplateId;
  platform?: SocialPlatform;
}) {
  const headline = sanitizeNoEmDash(h);
  const subhead = sanitizeNoEmDash(s);
  const disclaimer = sanitizeNoEmDash(d);
  const templateDef = AD_TEMPLATE_REGISTRY[templateId];
  const rawSupporting = getSupportingLine(contentPillarId);
  const supporting = resolveSupportingLine(subhead, rawSupporting, {
    aspectRatio: "1:1",
    proofType: templateDef.copySchema.proofType,
  });
  const accentBar = templateDef?.copySchema.accentBar ?? variant === "split-clarity";
  const stepList = usesStepList(contentPillarId);
  const logoSizing = buildLogoSizing({
    aspectRatio: "1:1",
    headline,
    subhead,
    supporting,
    hasAccentBar: accentBar,
    hasStepList: stepList,
    qrDataUrl,
  });

  return (
    <Canvas>
      <div
        style={{
          width: LAYOUT.squareWidth,
          height: LAYOUT.squareHeight,
          display: "grid",
          gridTemplateRows: `1fr ${LAYOUT.footerHeight}px auto`,
          gridTemplateColumns: `${LAYOUT.copyColumn}px 1fr`,
          columnGap: SPACE.md,
          padding: `${SPACE.xl}px ${SPACE.xl}px 0`,
          boxSizing: "border-box",
        }}
      >
        <div style={{ gridColumn: 1, gridRow: 1, minHeight: 0 }}>
          <LeftCopyStack
            contentPillarId={contentPillarId}
            headline={headline}
            subhead={subhead}
            supporting={supporting}
            qrDataUrl={qrDataUrl}
            accentBar={accentBar}
            logoSizing={logoSizing}
            templateId={templateId}
            platform={platform}
          />
        </div>

        <div
          style={{
            gridColumn: 2,
            gridRow: 1,
            position: "relative",
            minHeight: 0,
            zIndex: 10,
            marginRight: -LAYOUT.productBleed / 2,
          }}
        >
          <AssetCompositor
            templateId={templateId}
            pillarId={contentPillarId}
            variant="square"
          />
        </div>

        <TrustFooter style={{ gridColumn: "1 / -1", gridRow: 2 }} />

        <div
          style={{
            gridColumn: 1,
            gridRow: 3,
            padding: `${SPACE.sm}px 0 ${SPACE.md}px`,
            zIndex: 20,
          }}
        >
          <LegalLine text={disclaimer} />
        </div>
      </div>
    </Canvas>
  );
}

function DiagonalGrowthCard({
  headline: h,
  subhead: s,
  disclaimer: d,
  contentPillarId,
  qrDataUrl,
  templateId,
  platform,
}: {
  headline: string;
  subhead: string;
  disclaimer: string;
  contentPillarId?: string;
  qrDataUrl?: string;
  templateId: AdTemplateId;
  platform?: SocialPlatform;
}) {
  const headline = sanitizeNoEmDash(h);
  const subhead = sanitizeNoEmDash(s);
  const disclaimer = sanitizeNoEmDash(d);
  const templateDef = AD_TEMPLATE_REGISTRY[templateId];
  const rawSupporting = getSupportingLine(contentPillarId);
  const supporting = resolveSupportingLine(subhead, rawSupporting, {
    aspectRatio: "1:1",
    proofType: templateDef.copySchema.proofType,
  });
  const stepList = usesStepList(contentPillarId);
  const logoSizing = buildLogoSizing({
    aspectRatio: "1:1",
    headline,
    subhead,
    supporting,
    hasStepList: stepList,
    qrDataUrl,
  });

  return (
    <Canvas>
      <div
        style={{
          width: LAYOUT.squareWidth,
          height: LAYOUT.squareHeight,
          display: "grid",
          gridTemplateRows: `1fr ${LAYOUT.footerHeight}px auto`,
          gridTemplateColumns: `${LAYOUT.copyColumn}px 1fr`,
          columnGap: 0,
          padding: `${SPACE.xl}px ${SPACE.xl}px 0`,
          boxSizing: "border-box",
        }}
      >
        <div style={{ gridColumn: 1, gridRow: 1, minHeight: 0, zIndex: 20 }}>
          <LeftCopyStack
            contentPillarId={contentPillarId}
            headline={headline}
            subhead={subhead}
            supporting={supporting}
            qrDataUrl={qrDataUrl}
            logoSizing={logoSizing}
            templateId={templateId}
            platform={platform}
          />
        </div>

        <div
          style={{
            gridColumn: 2,
            gridRow: 1,
            position: "relative",
            minHeight: 0,
            zIndex: 10,
          }}
        >
          <AssetCompositor
            templateId={templateId}
            pillarId={contentPillarId}
            variant="square"
          />
        </div>

        <TrustFooter style={{ gridColumn: "1 / -1", gridRow: 2 }} />

        <div
          style={{
            gridColumn: 1,
            gridRow: 3,
            padding: `${SPACE.sm}px 0 ${SPACE.md}px`,
            zIndex: 20,
          }}
        >
          <LegalLine text={disclaimer} />
        </div>
      </div>
    </Canvas>
  );
}

function SquareCard({
  headline: h,
  subhead: s,
  disclaimer: d,
  contentPillarId,
  layoutVariant,
  templateId: propTemplateId,
  platform,
  qrDataUrl,
}: Omit<AdCardProps, "aspectRatio" | "showQR" | "cta">) {
  const headline = sanitizeNoEmDash(h);
  const subhead = sanitizeNoEmDash(s);
  const disclaimer = sanitizeNoEmDash(d);
  const variant = (layoutVariant as LayoutVariant) ?? "split-office";
  const templateId = propTemplateId ?? getTemplateIdForPillar(contentPillarId);

  if (variant === "diagonal-growth" || templateId === "diagonal-growth") {
    return (
      <DiagonalGrowthCard
        headline={headline}
        subhead={subhead}
        disclaimer={disclaimer}
        contentPillarId={contentPillarId}
        qrDataUrl={qrDataUrl}
        templateId={templateId}
        platform={platform}
      />
    );
  }

  return (
    <SplitLayoutCard
      headline={headline}
      subhead={subhead}
      disclaimer={disclaimer}
      contentPillarId={contentPillarId}
      qrDataUrl={qrDataUrl}
      variant={variant}
      templateId={templateId}
      platform={platform}
    />
  );
}

function VerticalCard({
  headline: h,
  subhead: s,
  disclaimer: d,
  contentPillarId,
  layoutVariant,
  templateId: propTemplateId,
  platform,
  qrDataUrl,
}: Omit<AdCardProps, "aspectRatio" | "showQR" | "cta">) {
  const headline = sanitizeNoEmDash(h);
  const subhead = sanitizeNoEmDash(s);
  const disclaimer = sanitizeNoEmDash(d);
  const variant = (layoutVariant as LayoutVariant) ?? "split-office";
  const templateId = propTemplateId ?? getTemplateIdForPillar(contentPillarId);
  const templateDef = AD_TEMPLATE_REGISTRY[templateId];
  const rawSupporting = getSupportingLine(contentPillarId);
  const supporting = resolveSupportingLine(subhead, rawSupporting, {
    aspectRatio: "9:16",
    proofType: templateDef.copySchema.proofType,
  });
  const stepList = usesStepList(contentPillarId);
  const logoSizing = buildLogoSizing({
    aspectRatio: "9:16",
    headline,
    subhead,
    supporting,
    hasStepList: stepList,
    qrDataUrl,
  });
  const instagramSafe = platform === "instagram";

  return (
    <Canvas>
      <div
        style={{
          width: LAYOUT.verticalWidth,
          height: LAYOUT.verticalHeight,
          display: "grid",
          gridTemplateRows: `auto minmax(520px, 1fr) ${LAYOUT.footerHeight}px auto`,
          padding: `0 ${SPACE.xxl}px 0`,
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            zIndex: 20,
            maxWidth: LAYOUT.copyColumn,
            paddingTop: instagramSafe ? 120 : SPACE.xl,
            paddingBottom: 40,
          }}
        >
          <LeftCopyStack
            contentPillarId={contentPillarId}
            headline={headline}
            subhead={subhead}
            supporting={supporting}
            qrDataUrl={qrDataUrl}
            accentBar={templateDef?.copySchema.accentBar ?? variant === "split-clarity"}
            headlineSize="vertical"
            logoSizing={logoSizing}
            templateId={templateId}
            platform={platform}
            iconLayout="grid"
          />
        </div>

        <div
          style={{
            position: "relative",
            minHeight: 520,
            overflow: "hidden",
            marginTop: SPACE.md,
            zIndex: 10,
          }}
        >
          <AssetCompositor
            templateId={templateId}
            pillarId={contentPillarId}
            variant="vertical"
          />
        </div>

        <TrustFooter />

        <div style={{ padding: `${SPACE.sm}px 0 ${SPACE.lg}px`, zIndex: 20 }}>
          <LegalLine text={disclaimer} />
        </div>
      </div>
    </Canvas>
  );
}

export const AdCardTemplate = forwardRef<HTMLDivElement, AdCardProps>(function AdCardTemplate(
  { aspectRatio, qrDataUrl, layoutVariant, templateId, platform, ...props },
  ref
) {
  return (
    <div ref={ref}>
      {aspectRatio === "9:16" ? (
        <VerticalCard
          {...props}
          layoutVariant={layoutVariant}
          templateId={templateId}
          platform={platform}
          qrDataUrl={qrDataUrl}
        />
      ) : (
        <SquareCard
          {...props}
          layoutVariant={layoutVariant}
          templateId={templateId}
          platform={platform}
          qrDataUrl={qrDataUrl}
        />
      )}
    </div>
  );
});
