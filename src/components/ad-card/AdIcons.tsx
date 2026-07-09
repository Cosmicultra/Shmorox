import type { IconKey } from "@/lib/ad/visual-config";
import { VISUAL_TOKENS } from "@/lib/ad/visual-config";

const ICON_PATHS: Record<IconKey, string> = {
  clock:
    "M12 6v6l4 2 M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0z",
  pie: "M21 12a9 9 0 1 1-9-9 M21 3v9h-9",
  chart: "M3 3v18h18 M7 16l4-8 4 5 5-9",
  clipboard:
    "M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2 M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2",
  file: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6",
  shield: "M12 2l8 4v6c0 5-3.5 9-8 10-4.5-1-8-5-8-10V6z",
  cloud: "M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z",
  users: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M23 21v-2a4 4 0 0 0-3-3.87",
  target: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z M12 6a6 6 0 1 0 0 12 6 6 0 0 0 0-12z M12 10a2 2 0 1 0 0 4 2 2 0 0 0 0-4z",
  check: "M20 6L9 17l-5-5",
  trend: "M23 6l-9.5 9.5-5-5L1 18",
};

export function AdIcon({
  icon,
  size = 22,
  color = VISUAL_TOKENS.navy,
  strokeWidth = 1.5,
}: {
  icon: IconKey;
  size?: number;
  color?: string;
  strokeWidth?: number;
}) {
  const d = ICON_PATHS[icon];
  const isMulti = d.includes(" M");
  const parts = isMulti ? d.split(" M").map((p, i) => (i === 0 ? p : `M${p}`)) : [d];

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {parts.map((path, i) => (
        <path key={i} d={path} />
      ))}
    </svg>
  );
}

export function FeatureIconCircle({ icon, label }: { icon: IconKey; label: string }) {
  return (
    <div style={{ flex: 1, textAlign: "center" }}>
      <div
        style={{
          width: 52,
          height: 52,
          borderRadius: "50%",
          border: `1.5px solid ${VISUAL_TOKENS.navy}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 10px",
          background: "rgba(255,255,255,0.8)",
        }}
      >
        <AdIcon icon={icon} size={24} />
      </div>
      <div
        style={{
          fontSize: 11,
          lineHeight: 1.35,
          color: VISUAL_TOKENS.navy,
          fontWeight: 600,
          fontFamily: "var(--font-sans, Inter, system-ui, sans-serif)",
        }}
      >
        {label}
      </div>
    </div>
  );
}
