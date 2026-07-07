import type { ReactNode } from "react";
import clsx from "clsx";

export function Card({
  children,
  className,
  elevated,
}: {
  children: ReactNode;
  className?: string;
  elevated?: boolean;
}) {
  return (
    <div
      className={clsx(
        "rounded-lg border border-mckinsey-border bg-white",
        elevated ? "shadow-elevated" : "shadow-card",
        className
      )}
    >
      {children}
    </div>
  );
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  className,
  disabled,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "inverse" | "outline-light";
  size?: "sm" | "md" | "lg";
}) {
  return (
    <button
      className={clsx(
        "inline-flex items-center justify-center gap-2 font-medium transition-all focus:outline-none focus:ring-2 focus:ring-mckinsey-blue focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        size === "sm" && "rounded-md px-3 py-1.5 text-sm",
        size === "md" && "rounded-md px-5 py-2.5 text-sm",
        size === "lg" && "rounded-md px-6 py-3 text-base",
        variant === "primary" &&
          "bg-mckinsey-navy text-white hover:bg-mckinsey-blue",
        variant === "secondary" &&
          "border border-mckinsey-navy bg-white text-mckinsey-navy hover:bg-mckinsey-mist",
        variant === "ghost" &&
          "text-mckinsey-navy hover:bg-mckinsey-mist",
        variant === "danger" &&
          "bg-mckinsey-danger text-white hover:opacity-90",
        variant === "inverse" &&
          "bg-white text-mckinsey-navy hover:bg-blue-50",
        variant === "outline-light" &&
          "border border-white/40 bg-transparent text-white hover:bg-white/10",
        className
      )}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}

export function Badge({
  children,
  variant = "default",
  className,
}: {
  children: ReactNode;
  variant?: "default" | "clear" | "caution" | "danger" | "blue";
  className?: string;
}) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        variant === "default" && "bg-mckinsey-mist text-mckinsey-slate",
        variant === "clear" && "bg-emerald-50 text-mckinsey-success",
        variant === "caution" && "bg-amber-50 text-mckinsey-warning",
        variant === "danger" && "bg-red-50 text-mckinsey-danger",
        variant === "blue" && "bg-blue-50 text-mckinsey-blue",
        className
      )}
    >
      {children}
    </span>
  );
}

export function StepIndicator({
  steps,
  current,
}: {
  steps: string[];
  current: number;
}) {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between">
        {steps.map((label, i) => (
          <div key={label} className="flex flex-1 items-center">
            <div className="flex flex-col items-center">
              <div
                className={clsx(
                  "flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors",
                  i < current && "bg-mckinsey-navy text-white",
                  i === current && "bg-mckinsey-blue text-white ring-4 ring-blue-100",
                  i > current && "bg-mckinsey-mist text-mckinsey-slate"
                )}
              >
                {i < current ? "✓" : i + 1}
              </div>
              <span
                className={clsx(
                  "mt-2 hidden text-center text-xs sm:block",
                  i === current ? "font-medium text-mckinsey-navy" : "text-mckinsey-slate"
                )}
              >
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={clsx(
                  "mx-2 h-0.5 flex-1",
                  i < current ? "bg-mckinsey-navy" : "bg-mckinsey-border"
                )}
              />
            )}
          </div>
        ))}
      </div>
      <p className="mt-3 text-center text-sm font-medium text-mckinsey-navy sm:hidden">
        Step {current + 1} of {steps.length}: {steps[current]}
      </p>
    </div>
  );
}

export function HelpTip({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-md border border-blue-100 bg-blue-50/50 px-4 py-3 text-sm text-mckinsey-slate">
      <span className="mr-1 font-medium text-mckinsey-blue">Tip:</span>
      {children}
    </div>
  );
}

export function RiskBadge({ risk }: { risk: "clear" | "caution" | "action-required" }) {
  const map = {
    clear: { label: "Looks Good", variant: "clear" as const },
    caution: { label: "Review Needed", variant: "caution" as const },
    "action-required": { label: "Action Required", variant: "danger" as const },
  };
  const { label, variant } = map[risk];
  return <Badge variant={variant}>{label}</Badge>;
}
