"use client";

import { useEffect, useState } from "react";

export function AdminCountdown({ target }: { target: string }) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    const first = setTimeout(() => setNow(Date.now()), 0);
    return () => {
      clearInterval(id);
      clearTimeout(first);
    };
  }, []);
  if (now === null) return <p className="font-admin-serif text-4xl text-stone-300">—</p>;
  const ms = new Date(target).getTime() - now;
  if (ms <= 0) return <p className="font-admin-serif text-3xl">O grande dia chegou! ♡</p>;
  const s = Math.floor(ms / 1000);
  const parts = [
    [Math.floor(s / 86400), "dias"],
    [Math.floor((s % 86400) / 3600), "horas"],
    [Math.floor((s % 3600) / 60), "min"],
    [s % 60, "seg"],
  ] as const;
  return (
    <div className="flex gap-5 sm:gap-8">
      {parts.map(([v, l]) => (
        <div key={l}>
          <p className="nums font-admin-serif text-4xl sm:text-5xl">{v}</p>
          <p className="text-xs uppercase tracking-wide text-stone-500">{l}</p>
        </div>
      ))}
    </div>
  );
}
