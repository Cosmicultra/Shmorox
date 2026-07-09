import type { ReactNode, InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { motion } from "@/components/motion";
import { Check, ChevronDown } from "lucide-react";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/cn";
import { AnimatedNumber } from "@/components/motion";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 font-medium transition-all duration-fast focus:outline-none focus:ring-2 focus:ring-accent/30 focus:ring-offset-2 focus:ring-offset-base disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        primary: "bg-primary text-inverse hover:bg-accent shadow-sm hover:shadow-glow",
        secondary: "border border-border bg-surface text-primary hover:bg-muted hover:border-accent/30",
        ghost: "text-secondary hover:bg-muted hover:text-primary",
        danger: "bg-danger text-white hover:opacity-90",
        inverse: "bg-surface text-primary hover:bg-muted shadow-sm",
        "outline-light": "border border-white/30 bg-transparent text-white hover:bg-white/10",
        gold: "bg-gold text-primary hover:bg-gold-dark shadow-sm hover:shadow-glow-gold",
      },
      size: {
        sm: "rounded-lg px-3 py-1.5 text-xs",
        md: "rounded-lg px-5 py-2.5 text-sm",
        lg: "rounded-xl px-6 py-3 text-base",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  }
);

export function Card({
  children,
  className,
  elevated,
  hover,
}: {
  children: ReactNode;
  className?: string;
  elevated?: boolean;
  hover?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-surface/90 backdrop-blur-sm",
        elevated ? "shadow-elevated" : "shadow-card",
        hover && "transition-all duration-normal hover:-translate-y-0.5 hover:shadow-glow",
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
  variant?: "primary" | "secondary" | "ghost" | "danger" | "inverse" | "outline-light" | "gold";
  size?: "sm" | "md" | "lg";
}) {
  return (
    <button
      className={cn(buttonVariants({ variant, size }), className)}
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
  variant?: "default" | "clear" | "caution" | "danger" | "blue" | "gold";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        variant === "default" && "bg-muted text-secondary",
        variant === "clear" && "bg-success/10 text-success ring-1 ring-success/20",
        variant === "caution" && "bg-warning/10 text-warning ring-1 ring-warning/20",
        variant === "danger" && "bg-danger/10 text-danger ring-1 ring-danger/20",
        variant === "blue" && "bg-accent/10 text-accent ring-1 ring-accent/20",
        variant === "gold" && "bg-gold/15 text-gold-dark ring-1 ring-gold/25 dark:text-gold",
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
              <motion.div
                animate={{
                  scale: i === current ? 1.08 : 1,
                }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-colors duration-normal",
                  i < current && "bg-success text-white",
                  i === current && "bg-accent text-white ring-4 ring-accent/20",
                  i > current && "bg-muted text-secondary"
                )}
              >
                {i < current ? <Check className="h-4 w-4" /> : i + 1}
              </motion.div>
              <span
                className={cn(
                  "mt-2 hidden text-center text-xs sm:block",
                  i === current ? "font-semibold text-primary" : "text-secondary"
                )}
              >
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className="relative mx-2 h-0.5 flex-1 overflow-hidden rounded-full bg-border">
                <motion.div
                  className="absolute inset-y-0 left-0 bg-accent"
                  initial={false}
                  animate={{ width: i < current ? "100%" : "0%" }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                />
              </div>
            )}
          </div>
        ))}
      </div>
      <p className="mt-3 text-center text-sm font-medium text-primary sm:hidden">
        Step {current + 1} of {steps.length}: {steps[current]}
      </p>
    </div>
  );
}

export function HelpTip({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-lg border border-accent/20 bg-accent/5 px-4 py-3 text-sm text-secondary">
      <span className="mr-1 font-semibold text-accent">Tip:</span>
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

const inputClass =
  "w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-primary placeholder:text-secondary/50 transition-colors duration-fast focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20";

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(inputClass, props.className)} {...props} />;
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn(inputClass, props.className)} {...props} />;
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(inputClass, "min-h-[80px] resize-y", props.className)} {...props} />;
}

export function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-primary">
        {label}
        {required && <span className="text-danger"> *</span>}
      </label>
      {hint && <p className="mb-1.5 text-xs text-secondary">{hint}</p>}
      {children}
    </div>
  );
}

export function KpiStat({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  accent?: "blue" | "gold" | "success" | "warning";
}) {
  const accentClass = {
    blue: "text-accent bg-accent/10 ring-accent/20",
    gold: "text-gold bg-gold/10 ring-gold/20",
    success: "text-success bg-success/10 ring-success/20",
    warning: "text-warning bg-warning/10 ring-warning/20",
  }[accent ?? "blue"];

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-secondary">{label}</p>
          <p className="mt-1 text-2xl font-bold tabular-nums tracking-tight text-primary">
            <AnimatedNumber value={value} />
          </p>
        </div>
        <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg ring-1", accentClass)}>
          <Icon className="h-4 w-4" strokeWidth={2} />
        </div>
      </div>
    </Card>
  );
}

export function PipelineTimeline({
  phases,
  currentIndex,
  running,
}: {
  phases: { id: string; label: string }[];
  currentIndex: number;
  running?: boolean;
}) {
  return (
    <div className="relative">
      <div className="absolute left-4 top-4 bottom-4 w-px bg-border md:hidden" />
      <div className="hidden md:absolute md:left-0 md:right-0 md:top-4 md:block md:h-px md:bg-border" />

      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between md:gap-2">
        {phases.map((phase, i) => {
          const done = i < currentIndex;
          const active = i === currentIndex;
          return (
            <div key={phase.id} className="relative flex items-start gap-3 md:flex-1 md:flex-col md:items-center md:gap-2 md:text-center">
              <motion.div
                animate={active && running ? { scale: [1, 1.08, 1] } : { scale: 1 }}
                transition={active && running ? { repeat: Infinity, duration: 1.5 } : {}}
                className={cn(
                  "relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors",
                  done && "bg-success text-white",
                  active && "bg-accent text-white ring-4 ring-accent/25",
                  !done && !active && "bg-muted text-secondary"
                )}
              >
                {done ? <Check className="h-4 w-4" /> : i + 1}
              </motion.div>
              <p
                className={cn(
                  "text-xs font-medium leading-tight",
                  active ? "text-primary" : done ? "text-success" : "text-secondary"
                )}
              >
                {phase.label}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <Card className="p-10 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10 ring-1 ring-accent/20">
        <Icon className="h-6 w-6 text-accent" strokeWidth={1.75} />
      </div>
      <h3 className="text-lg font-semibold text-primary">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-secondary">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </Card>
  );
}

export function Dialog({
  open,
  onClose,
  children,
  className,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  className?: string;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-primary/80 backdrop-blur-md" onClick={onClose} />
      <div className={cn("relative z-10 w-full max-w-lg animate-fade-in", className)}>{children}</div>
    </div>
  );
}

export function AccordionItem({
  title,
  children,
  open,
  onToggle,
}: {
  title: string;
  children: ReactNode;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <Card className="overflow-hidden">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-3 p-5 text-left transition-colors hover:bg-muted/50"
      >
        <span className="font-medium text-primary">{title}</span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="h-5 w-5 text-secondary" />
        </motion.span>
      </button>
      {open && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="border-t border-border px-5 pb-5 pt-3"
        >
          <p className="text-sm leading-relaxed text-secondary">{children}</p>
        </motion.div>
      )}
    </Card>
  );
}

export function SelectionTile({
  selected,
  onClick,
  children,
  className,
}: {
  selected: boolean;
  onClick: () => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "rounded-xl border p-4 text-left transition-all duration-normal",
        selected
          ? "border-gold bg-primary text-inverse shadow-glow-gold ring-2 ring-gold/40 ring-offset-2 ring-offset-base"
          : "border-border bg-surface hover:border-accent/40 hover:shadow-card",
        className
      )}
    >
      {children}
    </motion.button>
  );
}

export function InlineNotice({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-lg border border-warning/20 bg-warning/5 px-4 py-3 text-xs leading-relaxed text-secondary">
      {children}
    </div>
  );
}
