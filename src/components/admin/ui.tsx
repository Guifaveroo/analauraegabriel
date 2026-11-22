import type { ReactNode } from "react";

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-admin-serif text-3xl sm:text-4xl">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-sm text-stone-500">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function StatCard({ label, value, hint, tone = "default" }: { label: string; value: ReactNode; hint?: string; tone?: "default" | "success" | "warning" }) {
  const accent = tone === "success" ? "text-emerald-700" : tone === "warning" ? "text-amber-700" : "text-stone-900";
  return (
    <div className="admin-card p-4 sm:p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-stone-500">{label}</p>
      <p className={`mt-2 text-2xl font-semibold tabular-nums sm:text-3xl ${accent}`}>{value}</p>
      {hint && <p className="mt-1 text-xs text-stone-500">{hint}</p>}
    </div>
  );
}

const BADGE_TONES: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  PAID: "bg-emerald-100 text-emerald-800",
  CANCELLED: "bg-stone-200 text-stone-600",
  AVAILABLE: "bg-sky-100 text-sky-800",
  pending: "bg-amber-100 text-amber-800",
  approved: "bg-emerald-100 text-emerald-800",
  rejected: "bg-stone-200 text-stone-600",
  yes: "bg-emerald-100 text-emerald-800",
  no: "bg-rose-100 text-rose-800",
  none: "bg-stone-100 text-stone-600",
};

export function Badge({ tone, children }: { tone: string; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ${BADGE_TONES[tone] ?? "bg-stone-100 text-stone-700"}`}>
      {children}
    </span>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <div className="admin-card px-6 py-14 text-center text-sm text-stone-500">{children}</div>;
}

export function Notice({ tone = "info", children }: { tone?: "info" | "warning" | "error" | "success"; children: ReactNode }) {
  const cls = {
    info: "bg-sky-50 text-sky-900 border-sky-200",
    warning: "bg-amber-50 text-amber-900 border-amber-200",
    error: "bg-red-50 text-red-900 border-red-200",
    success: "bg-emerald-50 text-emerald-900 border-emerald-200",
  }[tone];
  return <div className={`rounded-lg border px-4 py-3 text-sm ${cls}`}>{children}</div>;
}

/** Filtros por link (?status=…) — funcionam sem JavaScript e mantêm o estado na URL. */
export function FilterTabs({ base, param, current, options }: { base: string; param: string; current: string; options: { value: string; label: string; count?: number }[] }) {
  return (
    <div className="scrollbar-none -mx-4 mb-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      {options.map((o) => {
        const active = current === o.value;
        const href = o.value ? `${base}?${param}=${encodeURIComponent(o.value)}` : base;
        return (
          <a
            key={o.value}
            href={href}
            className={`flex min-h-9 shrink-0 items-center gap-2 rounded-full border px-4 text-sm transition ${
              active ? "border-stone-900 bg-stone-900 text-white" : "border-stone-300 bg-white text-stone-700 hover:border-stone-500"
            }`}
          >
            {o.label}
            {o.count !== undefined && <span className={`text-xs ${active ? "text-white/70" : "text-stone-400"}`}>{o.count}</span>}
          </a>
        );
      })}
    </div>
  );
}
