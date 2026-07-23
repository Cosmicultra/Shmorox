import type { ReactNode, CSSProperties } from "react";
import { ELEVATION, FONT_BODY, FONT_MONO } from "@/lib/ad/ad-design-system";
import { getPrimaryScreenshotForPillar } from "@/lib/ad/product-screenshots";

/** AdvisorPilot product tokens (from AdvisorPilot/app/globals.css) */
const AP = {
  navy: "#0c1929",
  navyMid: "#153a5c",
  royal: "#0f6fde",
  pilotLight: "#cce4ff",
  appBg: "#eef0f4",
  surface: "#ffffff",
  gray: "#6b7280",
  border: "#e2e8f0",
  success: "#22c55e",
  warning: "#f59e0b",
};

interface ProductSceneProps {
  pillarId?: string;
  variant: "square" | "vertical";
  /** Prefer real PNG screenshots when available (default true). */
  useScreenshot?: boolean;
}

const WIZARD_STEPS = ["Statement Intake", "Holdings Confirmed", "Review Draft"];

function Shell({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: AP.surface,
        border: `1px solid ${AP.border}`,
        boxShadow: ELEVATION.product,
        display: "flex",
        flexDirection: "column",
        fontFamily: FONT_BODY,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          height: 48,
          background: AP.surface,
          borderBottom: `1px solid ${AP.border}`,
          display: "flex",
          alignItems: "center",
          padding: "0 16px",
          gap: 12,
          flexShrink: 0,
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 600, color: AP.navy, letterSpacing: "-0.01em" }}>{title}</span>
        {subtitle && (
          <span
            style={{
              fontSize: 9,
              fontWeight: 600,
              color: AP.success,
              background: "rgba(34, 197, 94, 0.1)",
              padding: "3px 8px",
              letterSpacing: "0.04em",
              textTransform: "uppercase",
            }}
          >
            {subtitle}
          </span>
        )}
        <div style={{ flex: 1 }} />
        <div
          style={{
            fontSize: 10,
            fontWeight: 600,
            color: AP.surface,
            background: AP.royal,
            padding: "6px 12px",
            letterSpacing: "0.02em",
          }}
        >
          Generate Report
        </div>
      </div>

      <div
        style={{
          height: 36,
          background: AP.surface,
          borderBottom: `1px solid ${AP.border}`,
          display: "flex",
          alignItems: "stretch",
          flexShrink: 0,
        }}
      >
        {WIZARD_STEPS.map((step, i) => (
          <div
            key={step}
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 8,
              fontWeight: i === 2 ? 600 : 500,
              color: i === 2 ? AP.royal : AP.gray,
              letterSpacing: "0.03em",
              textTransform: "uppercase",
              borderBottom: i === 2 ? `2px solid ${AP.royal}` : "2px solid transparent",
            }}
          >
            {step}
          </div>
        ))}
      </div>

      <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
        <div
          style={{
            width: 44,
            background: AP.navy,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            paddingTop: 12,
            gap: 14,
            flexShrink: 0,
          }}
        >
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              style={{
                width: 20,
                height: 20,
                background: i === 0 ? AP.royal : "rgba(255,255,255,0.12)",
              }}
            />
          ))}
        </div>

        <div style={{ flex: 1, background: AP.appBg, padding: 10, overflow: "hidden" }}>{children}</div>
      </div>
    </div>
  );
}

function Panel({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div
      style={{
        background: AP.surface,
        border: `1px solid ${AP.border}`,
        fontFamily: FONT_BODY,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function ClientReviewDashboard() {
  const allocation = [
    { label: "Equities", pct: 62, color: AP.royal },
    { label: "Fixed Income", pct: 24, color: "#64748b" },
    { label: "Alternatives", pct: 9, color: AP.navyMid },
    { label: "Cash", pct: 5, color: "#94a3b8" },
  ];

  const insights = [
    "Tax-aware opportunities detected",
    "International exposure below target",
    "Fee structure competitive vs. benchmark",
  ];

  return (
    <Shell title="Client Review" subtitle="On track">
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, height: "100%" }}>
        <Panel style={{ padding: "10px 12px", gridColumn: "1 / -1" }}>
          <div style={{ fontSize: 8, fontWeight: 600, color: AP.gray, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Portfolio Summary
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginTop: 4 }}>
            <span
              style={{
                fontSize: 22,
                fontWeight: 700,
                color: AP.navy,
                fontFamily: FONT_MONO,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              $2,842,181
            </span>
            <span style={{ fontSize: 10, fontWeight: 600, color: AP.success }}>+8.72% YTD</span>
          </div>
        </Panel>

        <Panel style={{ padding: "10px 12px", display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ fontSize: 8, fontWeight: 600, color: AP.gray, textTransform: "uppercase", letterSpacing: "0.06em", alignSelf: "flex-start" }}>
            Risk Score
          </div>
          <div
            style={{
              marginTop: 6,
              width: 56,
              height: 56,
              borderRadius: "50%",
              border: `4px solid ${AP.pilotLight}`,
              borderTopColor: AP.royal,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "column",
            }}
          >
            <span style={{ fontSize: 16, fontWeight: 700, color: AP.navy, fontFamily: FONT_MONO }}>72</span>
            <span style={{ fontSize: 7, color: AP.gray, fontWeight: 600 }}>Moderate</span>
          </div>
        </Panel>

        <Panel style={{ padding: "10px 12px" }}>
          <div style={{ fontSize: 8, fontWeight: 600, color: AP.gray, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Holdings Allocation
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: "50%",
                background: `conic-gradient(${allocation.map((a, i) => {
                  const start = allocation.slice(0, i).reduce((s, x) => s + x.pct, 0);
                  return `${a.color} ${start}% ${start + a.pct}%`;
                }).join(", ")})`,
                flexShrink: 0,
              }}
            />
            <div style={{ flex: 1 }}>
              {allocation.map((a) => (
                <div key={a.label} style={{ display: "flex", justifyContent: "space-between", fontSize: 8, marginBottom: 2 }}>
                  <span style={{ color: AP.gray }}>{a.label}</span>
                  <span style={{ fontWeight: 600, color: AP.navy, fontFamily: FONT_MONO }}>{a.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        </Panel>

        <Panel style={{ padding: "10px 12px" }}>
          <div style={{ fontSize: 8, fontWeight: 600, color: AP.gray, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Fee Analysis
          </div>
          <div style={{ marginTop: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, marginBottom: 4 }}>
              <span style={{ color: AP.gray }}>All-In Fee</span>
              <span style={{ fontWeight: 700, color: AP.navy, fontFamily: FONT_MONO }}>1.28%</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9 }}>
              <span style={{ color: AP.gray }}>Industry Avg</span>
              <span style={{ color: AP.gray, fontFamily: FONT_MONO }}>1.65%</span>
            </div>
          </div>
        </Panel>

        <Panel style={{ padding: "10px 12px" }}>
          <div style={{ fontSize: 8, fontWeight: 600, color: AP.gray, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Review Insights
          </div>
          <div style={{ marginTop: 6 }}>
            {insights.map((item) => (
              <div key={item} style={{ display: "flex", gap: 6, alignItems: "flex-start", marginBottom: 4 }}>
                <span style={{ color: AP.success, fontSize: 9, lineHeight: 1.4 }}>✓</span>
                <span style={{ fontSize: 8, color: AP.navy, lineHeight: 1.4 }}>{item}</span>
              </div>
            ))}
          </div>
        </Panel>

        <Panel style={{ padding: "10px 12px", gridColumn: "1 / -1" }}>
          <div style={{ fontSize: 8, fontWeight: 600, color: AP.gray, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Projected Outcomes
          </div>
          <div style={{ marginTop: 6, height: 48, position: "relative" }}>
            <svg viewBox="0 0 200 48" style={{ width: "100%", height: "100%" }} preserveAspectRatio="none">
              <defs>
                <linearGradient id="mcGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={AP.royal} stopOpacity="0.15" />
                  <stop offset="100%" stopColor={AP.royal} stopOpacity="0" />
                </linearGradient>
              </defs>
              <path
                d="M0,40 Q30,38 50,32 T100,22 T150,14 T200,8"
                fill="none"
                stroke={AP.royal}
                strokeWidth="1.5"
              />
              <path d="M0,40 Q30,38 50,32 T100,22 T150,14 T200,8 L200,48 L0,48 Z" fill="url(#mcGrad)" />
              {[0, 1, 2].map((i) => (
                <path
                  key={i}
                  d={`M0,${42 - i * 4} Q40,${38 - i * 4} 80,${30 - i * 3} T160,${18 - i * 2} T200,${12 - i}`}
                  fill="none"
                  stroke="rgba(15,111,222,0.2)"
                  strokeWidth="1"
                />
              ))}
            </svg>
            <div style={{ position: "absolute", bottom: 0, right: 0, fontSize: 7, color: AP.gray }}>
              Monte Carlo · 87% probability of success
            </div>
          </div>
        </Panel>
      </div>
    </Shell>
  );
}

function HoldingsScene() {
  const rows = [
    { sym: "AAPL", name: "Apple Inc.", qty: "142", val: "$34,218", pct: "8.2%" },
    { sym: "MSFT", name: "Microsoft Corp.", qty: "88", val: "$36,104", pct: "8.7%" },
    { sym: "VTI", name: "Vanguard Total Stock", qty: "410", val: "$112,400", pct: "27.1%" },
    { sym: "BND", name: "Vanguard Total Bond", qty: "—", val: "$48,200", pct: "11.6%" },
  ];

  return (
    <Shell title="Confirm Holdings" subtitle="Q4 2025">
      <div style={{ display: "flex", gap: 10, height: "100%" }}>
        <Panel style={{ width: 110, padding: 10, flexShrink: 0 }}>
          <div style={{ fontSize: 8, fontWeight: 600, color: AP.gray, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Source
          </div>
          <div
            style={{
              marginTop: 8,
              height: 80,
              background: "#f5f6f8",
              border: `1px dashed ${AP.border}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span style={{ fontSize: 8, color: AP.gray }}>schwab_q4.pdf</span>
          </div>
          <div style={{ marginTop: 8, fontSize: 9, color: AP.success, fontWeight: 600 }}>847 positions parsed</div>
        </Panel>

        <Panel style={{ flex: 1, overflow: "hidden" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "40px 1fr 36px 56px 36px",
              gap: 4,
              padding: "6px 10px",
              background: "#fafbfc",
              borderBottom: `1px solid ${AP.border}`,
              fontSize: 7,
              fontWeight: 600,
              color: AP.gray,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            <span>Ticker</span>
            <span>Security</span>
            <span>Qty</span>
            <span>Value</span>
            <span>Wt.</span>
          </div>
          {rows.map((r) => (
            <div
              key={r.sym}
              style={{
                display: "grid",
                gridTemplateColumns: "40px 1fr 36px 56px 36px",
                gap: 4,
                padding: "6px 10px",
                borderBottom: `1px solid #f0f2f5`,
                fontSize: 9,
                alignItems: "center",
              }}
            >
              <span style={{ fontWeight: 700, color: AP.navy }}>{r.sym}</span>
              <span style={{ color: AP.gray, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.name}</span>
              <span style={{ color: AP.gray }}>{r.qty}</span>
              <span style={{ fontWeight: 600, color: AP.navy, fontFamily: FONT_MONO, fontVariantNumeric: "tabular-nums" }}>{r.val}</span>
              <span style={{ color: AP.gray }}>{r.pct}</span>
            </div>
          ))}
          <div style={{ padding: "8px 10px", fontSize: 9, fontWeight: 600, color: AP.success }}>All holdings confirmed</div>
        </Panel>
      </div>
    </Shell>
  );
}

function NarrativeScene() {
  return (
    <Shell title="Client Review Report" subtitle="Chen Household">
      <div style={{ display: "flex", gap: 10, height: "100%" }}>
        <Panel style={{ flex: 1, padding: 12 }}>
          <div style={{ fontSize: 8, fontWeight: 600, color: AP.gray, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>
            Portfolio narrative
          </div>
          <p style={{ margin: "0 0 10px", fontSize: 10, lineHeight: 1.6, color: AP.navy }}>
            Your portfolio remains aligned with your stated objective of long-term growth with moderate risk tolerance.
          </p>
          <p style={{ margin: "0 0 10px", fontSize: 10, lineHeight: 1.6, color: AP.gray }}>
            Equity exposure at 62% reflects your target range. International diversification increased 2.1% this quarter.
          </p>
          <p style={{ margin: 0, fontSize: 10, lineHeight: 1.6, color: AP.gray }}>
            Fixed income allocation provides stability consistent with your retirement income needs.
          </p>
        </Panel>
        <div style={{ width: 130, display: "flex", flexDirection: "column", gap: 6 }}>
          {[
            { label: "Risk profile", value: "Moderate" },
            { label: "Diversification", value: "Well-balanced" },
            { label: "Income", value: "On target" },
          ].map((item, i) => (
            <Panel key={item.label} style={{ padding: "8px 10px" }}>
              <div style={{ fontSize: 7, color: AP.gray, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>{item.label}</div>
              <div style={{ marginTop: 3, fontSize: 11, fontWeight: 600, color: i === 0 ? AP.royal : AP.navy }}>{item.value}</div>
            </Panel>
          ))}
        </div>
      </div>
    </Shell>
  );
}

function ScaleScene() {
  const metrics = [
    { label: "Reviews completed", value: "127", delta: "+34%" },
    { label: "Avg. prep time", value: "42m", delta: "-58%" },
    { label: "On-time delivery", value: "94%", delta: "+12%" },
  ];
  const bars = [48, 62, 71, 88, 94];

  return (
    <Shell title="Firm Operations" subtitle="Q1 2026">
      <div style={{ display: "flex", flexDirection: "column", gap: 10, height: "100%" }}>
        <div style={{ display: "flex", gap: 8 }}>
          {metrics.map((m) => (
            <Panel key={m.label} style={{ flex: 1, padding: "10px 12px" }}>
              <div style={{ fontSize: 7, color: AP.gray, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>{m.label}</div>
              <div style={{ marginTop: 4, fontSize: 18, fontWeight: 700, color: AP.navy, fontFamily: FONT_MONO, fontVariantNumeric: "tabular-nums" }}>{m.value}</div>
              <div style={{ marginTop: 2, fontSize: 8, fontWeight: 600, color: AP.success }}>{m.delta}</div>
            </Panel>
          ))}
        </div>
        <Panel style={{ flex: 1, padding: "12px 14px" }}>
          <div style={{ fontSize: 8, fontWeight: 600, color: AP.gray, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>
            Review throughput
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 10, height: 70 }}>
            {bars.map((h, i) => (
              <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <div style={{ width: "100%", height: h, background: i === 4 ? AP.royal : AP.border }} />
                <span style={{ fontSize: 7, color: AP.gray }}>W{i + 1}</span>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </Shell>
  );
}

function ComplianceScene() {
  const events = [
    { time: "09:14:02", actor: "System", event: "Schwab statement ingested", status: "complete" },
    { time: "09:14:18", actor: "AI Engine", event: "847 holdings structured", status: "complete" },
    { time: "09:16:41", actor: "J. Morrison", event: "Holdings confirmed", status: "complete" },
    { time: "09:22:03", actor: "AI Engine", event: "Narrative draft generated", status: "review" },
  ];

  return (
    <Shell title="Supervision Log" subtitle="Morrison Trust">
      <Panel style={{ height: "100%", overflow: "hidden" }}>
        {events.map((e) => (
          <div
            key={e.time}
            style={{
              display: "grid",
              gridTemplateColumns: "56px 64px 1fr 56px",
              gap: 8,
              padding: "8px 12px",
              borderBottom: `1px solid #f0f2f5`,
              fontSize: 9,
              alignItems: "center",
            }}
          >
            <span style={{ color: AP.gray, fontFamily: FONT_MONO, fontSize: 8 }}>{e.time}</span>
            <span style={{ color: AP.gray, fontWeight: 500 }}>{e.actor}</span>
            <span style={{ color: AP.navy }}>{e.event}</span>
            <span
              style={{
                fontSize: 7,
                fontWeight: 600,
                textTransform: "uppercase",
                color: e.status === "complete" ? AP.success : AP.royal,
              }}
            >
              {e.status}
            </span>
          </div>
        ))}
      </Panel>
    </Shell>
  );
}

const SCENES: Record<string, ReactNode> = {
  "prospect-workflow": <ClientReviewDashboard />,
  "statement-intelligence": <HoldingsScene />,
  "portfolio-narrative": <NarrativeScene />,
  "operational-scale": <ScaleScene />,
  "compliance-posture": <ComplianceScene />,
  "company-launch": <ClientReviewDashboard />,
  "custom-request": <ClientReviewDashboard />,
};

function ScreenshotScene({ pillarId }: { pillarId?: string }) {
  const shot = getPrimaryScreenshotForPillar(pillarId);
  if (!shot) return null;

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxSizing: "border-box",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={shot.path}
        alt={shot.title}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
          objectPosition: "center center",
          borderRadius: 10,
          boxShadow: ELEVATION.product,
        }}
      />
    </div>
  );
}

export function ProductScene({ pillarId, variant, useScreenshot = true }: ProductSceneProps) {
  const screenshot = useScreenshot ? getPrimaryScreenshotForPillar(pillarId) : undefined;
  const scene = screenshot ? (
    <ScreenshotScene pillarId={pillarId} />
  ) : (
    SCENES[pillarId ?? ""] ?? <ClientReviewDashboard />
  );

  const useFlatScreenshot = Boolean(screenshot);

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        fontFamily: FONT_BODY,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: useFlatScreenshot ? "0" : "10% 5% 5% 15%",
          background: "radial-gradient(ellipse at center, rgba(34, 81, 255, 0.08) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          transform: useFlatScreenshot
            ? undefined
            : variant === "square"
              ? "perspective(1400px) rotateY(-6deg) rotateX(1.5deg)"
              : "perspective(1200px) rotateY(-3deg)",
          transformOrigin: variant === "square" ? "left center" : "center center",
        }}
      >
        {scene}
      </div>
    </div>
  );
}
