import Link from "next/link";
import type { Severity } from "@/lib/engine/types";

/**
 * Layout and display primitives.
 *
 * These exist so that spacing, radius, label case and number treatment are
 * decided once. Before this, every page restated them slightly differently,
 * which is most of why the interface read as unfinished rather than plain.
 */

export function Card({
  children,
  className = "",
  tone = "plain",
}: {
  children: React.ReactNode;
  className?: string;
  /** `sunken` for secondary information, `accent` for the one thing that matters. */
  tone?: "plain" | "sunken" | "accent";
}) {
  const tones = {
    plain: "bg-card border-line",
    sunken: "bg-sunken border-line",
    accent: "bg-brand-wash border-brand/25",
  };
  return (
    <div className={`rounded-[--radius-card] border ${tones[tone]} ${className}`}>
      {children}
    </div>
  );
}

/** Small uppercase label. Used for every section and field label in the app. */
export function Label({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={`text-[0.7rem] font-semibold uppercase tracking-[0.09em] text-ink-faint ${className}`}>
      {children}
    </p>
  );
}

export function Section({
  title,
  children,
  action,
  className = "",
}: {
  title?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`mt-8 ${className}`}>
      {(title || action) && (
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          {title && <Label>{title}</Label>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

/** A figure with its label. Numbers are tabular so columns of them line up. */
export function Stat({
  label,
  value,
  note,
  size = "md",
  tone = "ink",
}: {
  label: string;
  value: string;
  note?: string;
  size?: "sm" | "md" | "lg";
  tone?: "ink" | "brand" | "stop";
}) {
  const sizes = {
    sm: "text-[1.05rem]",
    md: "text-[1.4rem]",
    lg: "text-[2rem]",
  };
  const tones = { ink: "text-ink", brand: "text-brand", stop: "text-stop" };
  return (
    <div>
      <Label>{label}</Label>
      <p className={`mt-1 font-bold leading-none tracking-tight tabular-nums ${sizes[size]} ${tones[tone]}`}>
        {value}
      </p>
      {note && <p className="mt-1.5 text-[0.76rem] leading-snug text-ink-faint">{note}</p>}
    </div>
  );
}

/* Colour only. The severity wording lives in the dictionary, keyed `sev.*`,
   because it is copy and has to translate like the rest of the interface. */
const SEVERITY: Record<Severity, { text: string; rule: string }> = {
  BLOCKER: { text: "text-stop", rule: "bg-stop" },
  RISK: { text: "text-warn", rule: "bg-warn" },
  ADVISORY: { text: "text-note", rule: "bg-note" },
};

export function severityStyle(s: Severity) {
  return SEVERITY[s];
}

/** Text badge. No filled pill — a pill per finding is visual noise at this density. */
export function Badge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "stop" | "warn" | "go" | "note" | "brand";
}) {
  const tones = {
    neutral: "text-ink-faint",
    stop: "text-stop",
    warn: "text-warn",
    go: "text-go",
    note: "text-note",
    brand: "text-brand",
  };
  return (
    <span className={`text-[0.72rem] font-bold uppercase tracking-[0.07em] ${tones[tone]}`}>
      {children}
    </span>
  );
}

export function Button({
  href,
  children,
  variant = "primary",
  className = "",
  full = false,
}: {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "quiet";
  className?: string;
  full?: boolean;
}) {
  const variants = {
    primary: "bg-brand text-white border-brand",
    secondary: "bg-card text-ink border-line-strong",
    quiet: "bg-transparent text-brand border-transparent underline underline-offset-4 decoration-brand/40",
  };
  return (
    <Link
      href={href}
      className={`inline-flex items-center justify-center rounded-[--radius-card] border px-4 py-3 text-[0.94rem] font-semibold ${
        variants[variant]
      } ${full ? "w-full" : ""} ${className}`}
    >
      {children}
    </Link>
  );
}

/** Key–value rows inside a Card. */
export function Rows({ items }: { items: Array<[string, React.ReactNode]> }) {
  return (
    <dl className="divide-y divide-line">
      {items.map(([k, v], i) => (
        <div key={i} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-4 py-3">
          <dt className="text-[0.84rem] text-ink-faint">{k}</dt>
          <dd className="text-[0.92rem] font-medium text-ink">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

export function Meter({
  value,
  max,
  tone = "brand",
  label,
}: {
  value: number;
  max: number;
  tone?: "brand" | "stop" | "go";
  label: string;
}) {
  const tones = { brand: "bg-brand", stop: "bg-stop", go: "bg-go" };
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-line" role="img" aria-label={label}>
      <div
        className={`h-full rounded-full ${tones[tone]}`}
        style={{ width: `${Math.min(100, (value / max) * 100)}%` }}
      />
    </div>
  );
}

export function Note({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "warn" | "stop";
}) {
  const tones = {
    neutral: "border-line bg-sunken text-ink-soft",
    warn: "border-warn/30 bg-sunken text-ink-soft",
    stop: "border-stop/30 bg-sunken text-ink-soft",
  };
  return (
    <p className={`rounded-[--radius-card] border px-4 py-3 text-[0.82rem] leading-relaxed ${tones[tone]}`}>
      {children}
    </p>
  );
}
