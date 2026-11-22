"use client";

import { useState } from "react";

export function CopyButton({ text, label = "Copiar" }: { text: string; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className="admin-btn admin-btn-secondary !min-h-8 !px-2 text-xs"
      onClick={async () => {
        await navigator.clipboard.writeText(text).catch(() => window.prompt("Copie o link:", text));
        setDone(true);
        setTimeout(() => setDone(false), 2000);
      }}
    >
      {done ? "Copiado ✓" : label}
    </button>
  );
}
