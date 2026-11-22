"use client";

import { useEffect, useState } from "react";

type Parts = { days: number; hours: number; minutes: number; seconds: number };

function diff(target: number): Parts | null {
  const ms = target - Date.now();
  if (ms <= 0) return null;
  const s = Math.floor(ms / 1000);
  return { days: Math.floor(s / 86400), hours: Math.floor((s % 86400) / 3600), minutes: Math.floor((s % 3600) / 60), seconds: s % 60 };
}

const LABELS: [keyof Parts, string, string][] = [
  ["days", "dia", "dias"],
  ["hours", "hora", "horas"],
  ["minutes", "minuto", "minutos"],
  ["seconds", "segundo", "segundos"],
];

/** Contagem regressiva até a data cadastrada. Após o casamento exibe a mensagem especial. */
export function Countdown({
  target,
  afterMessage,
  variant = "light",
}: {
  target: string;
  afterMessage: string;
  variant?: "light" | "themed";
}) {
  const time = new Date(target).getTime();
  const [parts, setParts] = useState<Parts | null | undefined>(undefined);

  useEffect(() => {
    const tick = () => setParts(diff(time));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [time]);

  if (parts === null) {
    return <p className={`font-heading text-2xl italic md:text-3xl ${variant === "light" ? "text-white" : ""}`}>{afterMessage}</p>;
  }

  const boxClass =
    variant === "light"
      ? "border-white/40 bg-white/10 text-white backdrop-blur-sm"
      : "card hairline text-ink";

  return (
    <div role="timer" aria-live="off" className="grid grid-cols-4 gap-2 sm:gap-4">
      {LABELS.map(([key, one, many]) => {
        const value = parts?.[key];
        return (
          <div key={key} className={`flex min-w-[4.2rem] flex-col items-center border px-2 py-3 sm:min-w-[6rem] sm:py-5 ${boxClass}`}>
            <span className="font-heading text-3xl tabular-nums sm:text-5xl" suppressHydrationWarning>
              {value === undefined ? "–" : String(value).padStart(2, "0")}
            </span>
            <span className="mt-1 text-[0.6rem] uppercase tracking-[0.2em] opacity-80 sm:text-[0.68rem]">
              {value === 1 ? one : many}
            </span>
          </div>
        );
      })}
    </div>
  );
}
