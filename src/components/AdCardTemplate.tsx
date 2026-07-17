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
import { AD_TEMPLATE_REGISTRY, getPlatformTweak, getTemplateIdForPillar, type AdLayoutStyle, type AdTemplateId, type CanvasStyle } from "@/lib/ad/ad-template-registry";
import { resolveAdLayoutModes } from "@/lib/ad/ad-creative-content";
import type { AdLayoutSpec } from "@/lib/ad/ad-creative-content";
import { computeLogoSizing, type LogoSizingResult } from "@/lib/ad/logo-sizing";
import type { SocialPlatform } from "@/lib/types";
import { getScreenshotForTemplate } from "@/lib/ad/asset-pack";
import {
  getProductClarityForPillar,
  resolveWhatWeDoCopy,
  TRUST_BADGE,
} from "@/lib/ad/product-clarity";
import {
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
  layoutStyle?: AdLayoutStyle;
  templateId?: AdTemplateId;
  platform?: SocialPlatform;
  canvasStyle?: CanvasStyle;
  showQR?: boolean;
  qrDataUrl?: string;
}

function Canvas({
  children,
  canvasStyle = "gradient",
}: {
  children: ReactNode;
  canvasStyle?: CanvasStyle;
}) {
  const isClean = canvasStyle === "clean";

  return (
    <div
      style={{
        position: "relative",
        overflow: "hidden",
        fontFamily: FONT_BODY,
        background: isClean ? SURFACE.panel : SURFACE.canvas,
        boxSizing: "border-box",
      }}
    >
      {!isClean && (
        <>
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
        </>
      )}
      {children}
    </div>
  );
}

function Logo({ sizing, centered = false }: { sizing: LogoSizingResult; centered?: boolean }) {
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
        width: centered ? sizing.maxWidth : "100%",
        margin: centered ? "0 auto" : undefined,
        objectFit: "contain",
        objectPosition: centered ? "center top" : "left top",
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
  hasValueProps,
  hasFeatureIcons,
  qrDataUrl,
}: {
  aspectRatio: AspectRatio;
  headline: string;
  subhead: string;
  supporting: string;
  hasAccentBar?: boolean;
  hasStepList?: boolean;
  hasValueProps?: boolean;
  hasFeatureIcons?: boolean;
  qrDataUrl?: string;
}): LogoSizingResult {
  return computeLogoSizing({
    aspectRatio,
    headlineLineCount: headline.split("\n").filter(Boolean).length,
    subheadLength: subhead.length,
    supportingLength: supporting.length,
    hasFeatureIcons,
    hasValueProps,
    hasStepList,
    hasAccentBar,
    qrPresent: Boolean(qrDataUrl),
  });
}

function QrCta({
  qrDataUrl,
  cta = "Request a demo",
  compact,
  qrSize,
  centered = false,
  ctaFontSize,
}: {
  qrDataUrl?: string;
  cta?: string;
  compact?: boolean;
  qrSize?: number;
  centered?: boolean;
  ctaFontSize?: number;
}) {
  if (!qrDataUrl) return null;

  const size = qrSize ?? (compact ? Math.round(LAYOUT.qrSize * 0.85) : LAYOUT.qrSize);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: centered ? "center" : "flex-start",
        gap: SPACE.lg,
        flexShrink: 0,
        width: centered ? "100%" : undefined,
      }}
    >
      <div
        style={{
          background: T.white,
          padding: 6,
          border: `1px solid ${T.border}`,
          boxShadow: ELEVATION.raised,
          flexShrink: 0,
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
          fontSize: ctaFontSize ?? TYPE.cta.size,
          fontWeight: TYPE.cta.weight,
          letterSpacing: TYPE.cta.tracking,
          color: T.navy,
          lineHeight: TYPE.cta.lineHeight,
        }}
      >
        {cta}
      </span>
    </div>
  );
}

function EditorialHeadline({
  lines,
  highlightWord,
  size,
  fontSizePx,
  textAlign = "left",
}: {
  lines: string[];
  highlightWord?: string;
  size: "square" | "vertical";
  fontSizePx?: number;
  textAlign?: "left" | "center";
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
    <h1 style={{ margin: 0, textAlign }}>
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
  compact = false,
}: {
  pillarId?: string;
  layout?: "row" | "grid";
  compact?: boolean;
}) {
  const features = getFeaturesForPillar(pillarId);
  const align = layout === "grid" ? "left" : "left";
  const iconSize = compact ? 40 : 52;
  const labelSize = compact ? 10 : 11;
  const cellWidth = compact ? 88 : layout === "grid" ? 120 : 120;

  if (layout === "grid") {
    return (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: compact ? "repeat(4, 88px)" : "repeat(2, 120px)",
          gap: compact ? SPACE.sm : SPACE.md,
          marginTop: compact ? SPACE.md : SPACE.lg,
          justifyContent: "start",
        }}
      >
        {features.map((feature) => (
          <FeatureIconCircle
            key={feature.label}
            icon={feature.icon}
            label={feature.label}
            align={align}
            size={iconSize}
            labelSize={labelSize}
            width={cellWidth}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexWrap: compact ? "nowrap" : "wrap",
        justifyContent: "flex-start",
        gap: compact ? SPACE.sm : SPACE.md,
        marginTop: compact ? SPACE.md : SPACE.lg,
        maxWidth: LAYOUT.copyColumn,
      }}
    >
      {features.map((feature) => (
        <FeatureIconCircle
          key={feature.label}
          icon={feature.icon}
          label={feature.label}
          align={align}
          size={iconSize}
          labelSize={labelSize}
          width={cellWidth}
        />
      ))}
    </div>
  );
}

function StepList({
  pillarId,
  compact = false,
}: {
  pillarId?: string;
  compact?: boolean;
}) {
  const steps = getStepsForPillar(pillarId);
  if (!steps?.length) return null;

  const descSize = compact ? TYPE.bodySm.size : TYPE.stepDesc.size;
  const descLineHeight = compact ? TYPE.bodySm.lineHeight : TYPE.stepDesc.lineHeight;

  return (
    <div
      style={{
        marginTop: compact ? SPACE.md : SPACE.lg,
        display: "flex",
        flexDirection: "column",
        gap: compact ? SPACE.sm : SPACE.md,
      }}
    >
      {steps.map((step) => (
        <div key={step.title} style={{ display: "flex", gap: SPACE.md, alignItems: "flex-start" }}>
          <div
            style={{
              width: compact ? 36 : 40,
              height: compact ? 36 : 40,
              borderRadius: 10,
              background: "rgba(34, 81, 255, 0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <AdIcon icon={step.icon} size={compact ? 18 : 20} color={T.blue} />
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
                fontSize: descSize,
                lineHeight: descLineHeight,
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

function CapabilityValueBand({
  pillarId,
  compact = false,
  layout = "bullets",
  centered = false,
  fontSize: fontSizeOverride,
}: {
  pillarId?: string;
  compact?: boolean;
  layout?: "horizontal" | "bullets";
  centered?: boolean;
  fontSize?: number;
}) {
  const clarity = getProductClarityForPillar(pillarId);
  const fontSize = fontSizeOverride ?? (compact ? TYPE.valueProp.size - 1 : TYPE.valueProp.size);
  const items = [clarity.whoItsFor, clarity.whyDifferent, TRUST_BADGE];

  if (layout === "bullets") {
    return (
      <ul
        style={{
          listStyle: "none",
          margin: `${compact ? SPACE.md : SPACE.lg}px 0 0`,
          padding: 0,
          display: "flex",
          flexDirection: "column",
          gap: compact ? SPACE.sm : SPACE.md,
          alignItems: centered ? "center" : "flex-start",
        }}
      >
        {items.map((item) => (
          <li
            key={item}
            style={{
              display: "flex",
              alignItems: "center",
              gap: SPACE.sm,
              fontSize,
              fontWeight: TYPE.valueProp.weight,
              lineHeight: TYPE.valueProp.lineHeight,
              letterSpacing: TYPE.valueProp.tracking,
              color: T.navy,
            }}
          >
            <span
              aria-hidden
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: T.blue,
                flexShrink: 0,
              }}
            />
            {item}
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: SPACE.sm,
        marginTop: compact ? SPACE.md : SPACE.lg,
        rowGap: SPACE.xs,
      }}
    >
      {items.map((item, index) => (
        <span
          key={item}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: SPACE.sm,
            fontSize,
            fontWeight: TYPE.valueProp.weight,
            lineHeight: TYPE.valueProp.lineHeight,
            letterSpacing: TYPE.valueProp.tracking,
            color: T.navy,
          }}
        >
          {index > 0 ? (
            <span style={{ color: T.slateLight, fontWeight: 400 }} aria-hidden>
              |
            </span>
          ) : null}
          {item}
        </span>
      ))}
    </div>
  );
}

function ValuePropRow({
  pillarId,
  compact = false,
}: {
  pillarId?: string;
  compact?: boolean;
}) {
  return <CapabilityValueBand pillarId={pillarId} compact={compact} />;
}

function FeatureBlock({
  pillarId,
  proofType,
  iconLayout = "row",
  compactSteps = false,
  compactIcons = false,
}: {
  pillarId?: string;
  proofType: "steps" | "icons" | "none";
  iconLayout?: "row" | "grid";
  compactSteps?: boolean;
  compactIcons?: boolean;
}) {
  if (proofType === "steps" && usesStepList(pillarId)) {
    return <StepList pillarId={pillarId} compact={compactSteps} />;
  }
  if (proofType === "icons") {
    return (
      <FeatureIconRow pillarId={pillarId} layout={iconLayout} compact={compactIcons} />
    );
  }
  return <CapabilityValueBand pillarId={pillarId} compact={compactSteps || compactIcons} />;
}

function FooterAccentBar({ style }: { style?: CSSProperties }) {
  return (
    <div
      style={{
        background: SURFACE.trustBar,
        height: LAYOUT.footerHeight,
        zIndex: 30,
        ...style,
      }}
    />
  );
}

function LegalLine({ text, centered = false }: { text: string; centered?: boolean }) {
  return (
    <p
      style={{
        margin: 0,
        fontSize: TYPE.legal.size,
        lineHeight: TYPE.legal.lineHeight,
        color: T.slateLight,
        opacity: 0.55,
        textAlign: centered ? "center" : "left",
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
  cta,
  qrDataUrl,
  accentBar,
  headlineSize = "square",
  logoSizing,
  platform,
  templateId,
  proofType = "none",
  iconLayout = "row",
  pinQrBottom = false,
  compactIcons = false,
  copyMaxWidth,
  textOnlyMode = false,
}: {
  contentPillarId?: string;
  headline: string;
  subhead: string;
  supporting: string;
  cta: string;
  qrDataUrl?: string;
  accentBar?: boolean;
  headlineSize?: "square" | "vertical";
  logoSizing: LogoSizingResult;
  platform?: SocialPlatform;
  templateId?: AdTemplateId;
  proofType?: "steps" | "icons" | "none";
  iconLayout?: "row" | "grid";
  pinQrBottom?: boolean;
  compactIcons?: boolean;
  copyMaxWidth?: number;
  textOnlyMode?: boolean;
}) {
  const pillar = contentPillarId ? getPillarById(contentPillarId) : undefined;
  const clarity = getProductClarityForPillar(contentPillarId);
  const whatWeDo = resolveWhatWeDoCopy(contentPillarId, subhead);
  const lines = headline.split("\n").filter(Boolean);
  const sparseHeader = logoSizing.contentDensity < 0.55 && !compactIcons;
  const compactSteps = logoSizing.contentDensity > 0.65;
  const platformTweak =
    platform && templateId
      ? getPlatformTweak(AD_TEMPLATE_REGISTRY[templateId], platform)
      : {};
  const headlineScale = platformTweak.headlineScale ?? 1;
  const textOnlyType = TYPE.textOnly;
  const displaySpec = textOnlyMode
    ? textOnlyType.headline
    : headlineSize === "vertical"
      ? TYPE.displayLg
      : TYPE.displayMd;
  const scaledHeadlineSize = Math.round(displaySpec.size * headlineScale);
  const maxWidth = copyMaxWidth ?? LAYOUT.copyColumn;
  const linkedInCta = platform === "linkedin" ? "Request a demo" : cta;
  const categorySpec = textOnlyMode ? textOnlyType.productCategory : TYPE.productCategory;
  const whatWeDoSpec = textOnlyMode ? textOnlyType.whatWeDo : TYPE.whatWeDo;
  const ctaSpec = textOnlyMode ? textOnlyType.cta : TYPE.cta;
  const centered = textOnlyMode;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: pinQrBottom && !textOnlyMode ? "100%" : undefined,
        minHeight: pinQrBottom && !textOnlyMode ? 0 : undefined,
        paddingRight: textOnlyMode ? 0 : SPACE.md,
        zIndex: 20,
        maxWidth,
        width: textOnlyMode ? "100%" : undefined,
        textAlign: centered ? "center" : "left",
        gap: textOnlyMode ? SPACE.lg : undefined,
      }}
    >
      <div style={{ flex: textOnlyMode ? undefined : pinQrBottom ? 1 : undefined }}>
      <div
        style={{
          ...(sparseHeader && !textOnlyMode ? { minHeight: logoSizing.headerMinHeight } : {}),
          marginBottom: textOnlyMode ? SPACE.lg : SPACE.md,
        }}
      >
        <Logo sizing={logoSizing} centered={centered} />
      </div>

      <p
        style={{
          margin: 0,
          fontSize: categorySpec.size,
          lineHeight: categorySpec.lineHeight,
          fontWeight: categorySpec.weight,
          letterSpacing: categorySpec.tracking,
          color: T.blue,
          textTransform: "uppercase",
        }}
      >
        {clarity.productCategory}
      </p>

      {accentBar && (
        <div
          style={{
            width: 48,
            height: 3,
            background: T.blue,
            margin: `${SPACE.md}px auto ${SPACE.lg}px`,
          }}
        />
      )}

      <EditorialHeadline
        lines={lines}
        highlightWord={pillar?.highlightWord}
        size={headlineSize}
        fontSizePx={scaledHeadlineSize}
        textAlign={centered ? "center" : "left"}
      />

      <p
        style={{
          marginTop: textOnlyMode ? SPACE.md : SPACE.lg,
          fontSize: whatWeDoSpec.size,
          lineHeight: whatWeDoSpec.lineHeight,
          fontWeight: whatWeDoSpec.weight,
          color: T.slate,
        }}
      >
        {whatWeDo}
      </p>

      <CapabilityValueBand
        pillarId={contentPillarId}
        compact={compactSteps || compactIcons}
        layout="bullets"
        centered={centered}
        fontSize={textOnlyMode ? textOnlyType.valueProp.size : undefined}
      />
      </div>

      <div
        style={{
          marginTop: textOnlyMode ? SPACE.xl : pinQrBottom ? 0 : SPACE.xl,
          paddingBottom: textOnlyMode ? SPACE.lg : SPACE.xxl,
          marginBottom: headlineSize === "vertical" ? SPACE.lg : 0,
          alignSelf: centered ? "center" : "flex-start",
          width: centered ? "100%" : undefined,
        }}
      >
        <QrCta
          qrDataUrl={qrDataUrl}
          cta={linkedInCta}
          compact={headlineSize === "vertical" || platformTweak.compactFooter}
          qrSize={textOnlyMode ? LAYOUT.qrSize : platformTweak.qrSize}
          centered={centered}
          ctaFontSize={textOnlyMode ? ctaSpec.size : undefined}
        />
      </div>
    </div>
  );
}

function resolveCardLayoutModes(
  headline: string,
  subhead: string,
  contentPillarId: string | undefined,
  templateId: AdTemplateId,
  aspectRatio: AspectRatio,
  layoutVariant: LayoutVariant,
  platform?: SocialPlatform
) {
  const rawSupporting = getSupportingLine(contentPillarId);
  const layout: AdLayoutSpec = {
    templateId,
    aspectRatio,
    platform: platform ?? "linkedin",
    layoutVariant,
    contentPillarId,
  };
  return resolveAdLayoutModes(headline, subhead, layout, rawSupporting);
}

function SplitLayoutCard({
  headline: h,
  subhead: s,
  disclaimer: d,
  cta: ctaProp,
  contentPillarId,
  qrDataUrl,
  variant,
  templateId,
  platform,
  canvasStyle = "gradient",
}: {
  headline: string;
  subhead: string;
  disclaimer: string;
  cta: string;
  contentPillarId?: string;
  qrDataUrl?: string;
  variant: LayoutVariant;
  templateId: AdTemplateId;
  platform?: SocialPlatform;
  canvasStyle?: CanvasStyle;
}) {
  const headline = sanitizeNoEmDash(h);
  const subhead = sanitizeNoEmDash(s);
  const disclaimer = sanitizeNoEmDash(d);
  const cta = sanitizeNoEmDash(ctaProp);
  const templateDef = AD_TEMPLATE_REGISTRY[templateId];
  const proofType = templateDef.copySchema.proofType;
  const layoutModes = resolveCardLayoutModes(
    headline,
    subhead,
    contentPillarId,
    templateId,
    "1:1",
    variant,
    platform
  );
  const supporting = layoutModes.supportingLine;
  const accentBar = templateDef?.copySchema.accentBar ?? variant === "split-clarity";
  const stepList = proofType === "steps" && usesStepList(contentPillarId);
  const logoSizing = buildLogoSizing({
    aspectRatio: "1:1",
    headline,
    subhead,
    supporting,
    hasAccentBar: accentBar,
    hasStepList: stepList,
    hasValueProps: true,
    hasFeatureIcons: proofType === "icons",
    qrDataUrl,
  });

  return (
    <Canvas canvasStyle={canvasStyle}>
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
        <div style={{ gridColumn: 1, gridRow: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
          <LeftCopyStack
            contentPillarId={contentPillarId}
            headline={headline}
            subhead={subhead}
            supporting={supporting}
            cta={cta}
            qrDataUrl={qrDataUrl}
            accentBar={accentBar}
            logoSizing={logoSizing}
            templateId={templateId}
            platform={platform}
            proofType={proofType}
            pinQrBottom
            compactIcons={layoutModes.compactIcons}
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

        <FooterAccentBar style={{ gridColumn: "1 / -1", gridRow: 2 }} />

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

function TextOnlyLayoutCard({
  headline: h,
  subhead: s,
  disclaimer: d,
  cta: ctaProp,
  contentPillarId,
  qrDataUrl,
  templateId,
  platform,
  canvasStyle = "clean",
}: {
  headline: string;
  subhead: string;
  disclaimer: string;
  cta: string;
  contentPillarId?: string;
  qrDataUrl?: string;
  templateId: AdTemplateId;
  platform?: SocialPlatform;
  canvasStyle?: CanvasStyle;
}) {
  const headline = sanitizeNoEmDash(h);
  const subhead = sanitizeNoEmDash(s);
  const disclaimer = sanitizeNoEmDash(d);
  const cta = sanitizeNoEmDash(ctaProp);
  const templateDef = AD_TEMPLATE_REGISTRY[templateId];
  const proofType = templateDef.copySchema.proofType;
  const layoutModes = resolveCardLayoutModes(
    headline,
    subhead,
    contentPillarId,
    templateId,
    "1:1",
    templateDef.layoutVariant,
    platform
  );
  const supporting = layoutModes.supportingLine;
  const logoSizing = buildLogoSizing({
    aspectRatio: "1:1",
    headline,
    subhead,
    supporting,
    hasValueProps: true,
    hasFeatureIcons: proofType === "icons",
    hasStepList: proofType === "steps" && usesStepList(contentPillarId),
    qrDataUrl,
  });

  return (
    <Canvas canvasStyle={canvasStyle}>
      <div
        style={{
          width: LAYOUT.squareWidth,
          height: LAYOUT.squareHeight,
          display: "grid",
          gridTemplateRows: `1fr ${LAYOUT.footerHeight}px auto`,
          padding: `${SPACE.xl}px ${SPACE.xl}px 0`,
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            gridRow: 1,
            minHeight: 0,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            maxWidth: LAYOUT.textOnlyCopyMax,
            margin: "0 auto",
            width: "100%",
            flex: 1,
            paddingTop: SPACE.lg,
            paddingBottom: SPACE.lg,
          }}
        >
          <LeftCopyStack
            contentPillarId={contentPillarId}
            headline={headline}
            subhead={subhead}
            supporting={supporting}
            cta={cta}
            qrDataUrl={qrDataUrl}
            logoSizing={logoSizing}
            templateId={templateId}
            platform={platform}
            proofType={proofType}
            compactIcons={layoutModes.compactIcons}
            copyMaxWidth={LAYOUT.textOnlyCopyMax}
            textOnlyMode
          />
        </div>

        <FooterAccentBar style={{ gridRow: 2 }} />

        <div
          style={{
            gridRow: 3,
            padding: `${SPACE.sm}px ${SPACE.xl}px ${SPACE.md}px`,
            zIndex: 20,
            textAlign: "center",
          }}
        >
          <LegalLine text={disclaimer} centered />
        </div>
      </div>
    </Canvas>
  );
}

function DiagonalGrowthCard({
  headline: h,
  subhead: s,
  disclaimer: d,
  cta: ctaProp,
  contentPillarId,
  qrDataUrl,
  templateId,
  platform,
  canvasStyle = "gradient",
}: {
  headline: string;
  subhead: string;
  disclaimer: string;
  cta: string;
  contentPillarId?: string;
  qrDataUrl?: string;
  templateId: AdTemplateId;
  platform?: SocialPlatform;
  canvasStyle?: CanvasStyle;
}) {
  const headline = sanitizeNoEmDash(h);
  const subhead = sanitizeNoEmDash(s);
  const disclaimer = sanitizeNoEmDash(d);
  const cta = sanitizeNoEmDash(ctaProp);
  const templateDef = AD_TEMPLATE_REGISTRY[templateId];
  const proofType = templateDef.copySchema.proofType;
  const layoutModes = resolveCardLayoutModes(
    headline,
    subhead,
    contentPillarId,
    templateId,
    "1:1",
    "diagonal-growth",
    platform
  );
  const supporting = layoutModes.supportingLine;
  const logoSizing = buildLogoSizing({
    aspectRatio: "1:1",
    headline,
    subhead,
    supporting,
    hasValueProps: true,
    hasFeatureIcons: proofType === "icons",
    hasStepList: proofType === "steps" && usesStepList(contentPillarId),
    qrDataUrl,
  });

  return (
    <Canvas canvasStyle={canvasStyle}>
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
            cta={cta}
            qrDataUrl={qrDataUrl}
            logoSizing={logoSizing}
            templateId={templateId}
            platform={platform}
            proofType={proofType}
            compactIcons={layoutModes.compactIcons}
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

        <FooterAccentBar style={{ gridColumn: "1 / -1", gridRow: 2 }} />

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

function isSplitGraphicRenderable(templateId: AdTemplateId, pillarId?: string): boolean {
  const template = AD_TEMPLATE_REGISTRY[templateId];
  if (template.visual.mode === "text-only" || templateId === "text-focused") {
    return false;
  }
  if (templateId === "split-dashboard") return true;
  return Boolean(getScreenshotForTemplate(templateId, pillarId, "1:1"));
}

function SquareCard({
  headline,
  subhead,
  disclaimer,
  cta,
  contentPillarId,
  layoutVariant,
  layoutStyle,
  templateId: propTemplateId,
  platform,
  canvasStyle,
  qrDataUrl,
}: AdCardProps) {
  const variant = (layoutVariant as LayoutVariant) ?? "split-office";
  const templateId = propTemplateId ?? getTemplateIdForPillar(contentPillarId);
  const resolvedCanvasStyle =
    canvasStyle ?? AD_TEMPLATE_REGISTRY[templateId].canvasStyle;
  const isTextOnly =
    layoutStyle === "text-only" || templateId === "text-focused";

  if (isTextOnly || !isSplitGraphicRenderable(templateId, contentPillarId)) {
    return (
      <TextOnlyLayoutCard
        headline={headline}
        subhead={subhead}
        disclaimer={disclaimer}
        cta={cta}
        contentPillarId={contentPillarId}
        qrDataUrl={qrDataUrl}
        templateId="text-focused"
        platform={platform}
        canvasStyle={resolvedCanvasStyle}
      />
    );
  }

  if (variant === "diagonal-growth" || templateId === "diagonal-growth") {
    return (
      <DiagonalGrowthCard
        headline={headline}
        subhead={subhead}
        disclaimer={disclaimer}
        cta={cta}
        contentPillarId={contentPillarId}
        qrDataUrl={qrDataUrl}
        templateId={templateId}
        platform={platform}
        canvasStyle={resolvedCanvasStyle}
      />
    );
  }

  return (
    <SplitLayoutCard
      headline={headline}
      subhead={subhead}
      disclaimer={disclaimer}
      cta={cta}
      contentPillarId={contentPillarId}
      qrDataUrl={qrDataUrl}
      variant={variant}
      templateId={templateId}
      platform={platform}
      canvasStyle={resolvedCanvasStyle}
    />
  );
}

function VerticalCard({
  headline: h,
  subhead: s,
  disclaimer: d,
  cta: ctaProp,
  contentPillarId,
  layoutVariant,
  layoutStyle,
  templateId: propTemplateId,
  platform,
  canvasStyle,
  qrDataUrl,
}: Omit<AdCardProps, "aspectRatio" | "showQR">) {
  const headline = sanitizeNoEmDash(h);
  const subhead = sanitizeNoEmDash(s);
  const disclaimer = sanitizeNoEmDash(d);
  const cta = sanitizeNoEmDash(ctaProp);
  const variant = (layoutVariant as LayoutVariant) ?? "split-office";
  const templateId = propTemplateId ?? getTemplateIdForPillar(contentPillarId);
  const templateDef = AD_TEMPLATE_REGISTRY[templateId];
  const proofType = templateDef.copySchema.proofType;
  const resolvedCanvasStyle = canvasStyle ?? templateDef.canvasStyle;
  const isTextOnly =
    layoutStyle === "text-only" || templateId === "text-focused";
  const layoutModes = resolveCardLayoutModes(
    headline,
    subhead,
    contentPillarId,
    templateId,
    "9:16",
    variant,
    platform
  );
  const supporting = layoutModes.supportingLine;
  const logoSizing = buildLogoSizing({
    aspectRatio: "9:16",
    headline,
    subhead,
    supporting,
    hasValueProps: true,
    hasFeatureIcons: proofType === "icons",
    hasStepList: proofType === "steps" && usesStepList(contentPillarId),
    qrDataUrl,
  });
  const instagramSafe = platform === "instagram";

  return (
    <Canvas canvasStyle={resolvedCanvasStyle}>
      <div
        style={{
          width: LAYOUT.verticalWidth,
          height: LAYOUT.verticalHeight,
          display: "grid",
          gridTemplateRows: isTextOnly
            ? `1fr ${LAYOUT.footerHeight}px auto`
            : `auto minmax(520px, 1fr) ${LAYOUT.footerHeight}px auto`,
          padding: `0 ${SPACE.xxl}px 0`,
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            zIndex: 20,
            maxWidth: isTextOnly ? LAYOUT.textOnlyCopyMax : LAYOUT.copyColumn,
            margin: isTextOnly ? "0 auto" : undefined,
            width: isTextOnly ? "100%" : undefined,
            paddingTop: instagramSafe ? 120 : SPACE.xl,
            paddingBottom: isTextOnly ? 0 : 40,
            gridRow: 1,
            minHeight: isTextOnly ? 0 : undefined,
            display: isTextOnly ? "flex" : undefined,
            flexDirection: isTextOnly ? "column" : undefined,
          }}
        >
          <LeftCopyStack
            contentPillarId={contentPillarId}
            headline={headline}
            subhead={subhead}
            supporting={supporting}
            cta={cta}
            qrDataUrl={qrDataUrl}
            accentBar={templateDef?.copySchema.accentBar ?? variant === "split-clarity"}
            headlineSize="vertical"
            logoSizing={logoSizing}
            templateId={templateId}
            platform={platform}
            proofType={proofType}
            iconLayout="grid"
            compactIcons={layoutModes.compactIcons}
            pinQrBottom={isTextOnly}
            copyMaxWidth={isTextOnly ? LAYOUT.textOnlyCopyMax : undefined}
          />
        </div>

        {!isTextOnly && (
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
        )}

        <FooterAccentBar />

        <div style={{ padding: `${SPACE.sm}px 0 ${SPACE.lg}px`, zIndex: 20 }}>
          <LegalLine text={disclaimer} />
        </div>
      </div>
    </Canvas>
  );
}

export const AdCardTemplate = forwardRef<HTMLDivElement, AdCardProps>(function AdCardTemplate(
  { aspectRatio, qrDataUrl, layoutVariant, layoutStyle, templateId, platform, canvasStyle, ...props },
  ref
) {
  return (
    <div ref={ref}>
      {aspectRatio === "9:16" ? (
        <VerticalCard
          {...props}
          layoutVariant={layoutVariant}
          layoutStyle={layoutStyle}
          templateId={templateId}
          platform={platform}
          canvasStyle={canvasStyle}
          qrDataUrl={qrDataUrl}
        />
      ) : (
        <SquareCard
          {...props}
          aspectRatio={aspectRatio}
          layoutVariant={layoutVariant}
          layoutStyle={layoutStyle}
          templateId={templateId}
          platform={platform}
          canvasStyle={canvasStyle}
          qrDataUrl={qrDataUrl}
        />
      )}
    </div>
  );
});
