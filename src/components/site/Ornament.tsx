import type { ThemeTokens } from "@/lib/content/schemas";

type Props = { decoration: ThemeTokens["decoration"]; className?: string };

/** Ornamentos originais em traço fino — mudam conforme o tema escolhido. */
export function Ornament({ decoration, className = "" }: Props) {
  const common = {
    className: `mx-auto h-8 w-40 text-primary ${className}`,
    viewBox: "0 0 160 32",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1,
    strokeLinecap: "round" as const,
    "aria-hidden": true,
  };

  switch (decoration) {
    case "none":
      return <div aria-hidden className={`mx-auto h-px w-16 bg-primary/40 ${className}`} />;
    case "floral":
      return (
        <svg {...common}>
          <path d="M8 16h52M100 16h52" opacity=".5" />
          <path d="M80 6c-4 4-4 8 0 10 4-2 4-6 0-10Z" />
          <path d="M80 26c-4-4-4-8 0-10 4 2 4 6 0 10Z" />
          <path d="M70 16c4-4 8-4 10 0-2 4-6 4-10 0Z" />
          <path d="M90 16c-4-4-8-4-10 0 2 4 6 4 10 0Z" />
          <circle cx="80" cy="16" r="1.6" fill="currentColor" />
          <path d="M60 16c3-3 6-4 9-3M100 16c-3-3-6-4-9-3" />
          <path d="M63 16c1 3 3 4 6 4M97 16c-1 3-3 4-6 4" opacity=".7" />
        </svg>
      );
    case "leaves":
    case "rustic":
      return (
        <svg {...common}>
          <path d="M20 16h120" opacity=".45" />
          {[52, 64, 96, 108].map((x, i) => (
            <path key={x} d={i < 2 ? `M${x} 16c4-7 10-8 12-7-2 5-7 8-12 7Z` : `M${x} 16c-4-7-10-8-12-7 2 5 7 8 12 7Z`} />
          ))}
          {[52, 64, 96, 108].map((x, i) => (
            <path key={`b${x}`} d={i < 2 ? `M${x} 16c4 7 10 8 12 7-2-5-7-8-12-7Z` : `M${x} 16c-4 7-10 8-12 7 2-5 7-8 12-7Z`} opacity=".7" />
          ))}
          <circle cx="80" cy="16" r="2.2" />
        </svg>
      );
    case "boho":
      return (
        <svg {...common}>
          <path d="M80 28V6" />
          {[10, 14, 18, 22].map((y) => (
            <g key={y}>
              <path d={`M80 ${y}c-6-3-12-3-16-1`} opacity=".8" />
              <path d={`M80 ${y}c6-3 12-3 16-1`} opacity=".8" />
            </g>
          ))}
          <path d="M20 22c14-6 24-6 36 0M104 22c12-6 22-6 36 0" opacity=".45" />
        </svg>
      );
    case "geometric":
      return (
        <svg {...common}>
          <path d="M14 16h48M98 16h48" opacity=".5" />
          <path d="M80 4l12 12-12 12-12-12Z" />
          <path d="M80 10l6 6-6 6-6-6Z" opacity=".6" />
          <circle cx="66" cy="16" r="1.2" fill="currentColor" />
          <circle cx="94" cy="16" r="1.2" fill="currentColor" />
        </svg>
      );
    case "minimal":
    default:
      return (
        <svg {...common}>
          <path d="M24 16h46M90 16h46" opacity=".55" />
          <path d="M80 11l5 5-5 5-5-5Z" />
        </svg>
      );
  }
}

/** Ramo floral grande para cantos da capa e do rodapé (apenas temas floral/boho/rústico). */
export function CornerSprig({ decoration, className = "" }: Props) {
  if (!["floral", "boho", "rustic", "leaves"].includes(decoration)) return null;
  return (
    <svg
      aria-hidden
      viewBox="0 0 200 200"
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
      strokeLinecap="round"
      className={`pointer-events-none text-primary ${className}`}
    >
      <path d="M10 190C60 150 100 110 150 20" />
      {[
        [40, 165], [62, 145], [84, 120], [104, 95], [122, 68], [138, 42],
      ].map(([x, y], i) => (
        <g key={i}>
          <path d={`M${x} ${y}c-14-2-24-12-26-24 12 0 24 10 26 24Z`} opacity=".8" />
          <path d={`M${x} ${y}c14 0 26-8 30-20-12-2-26 6-30 20Z`} opacity=".6" />
        </g>
      ))}
      {decoration === "floral" && (
        <g>
          <circle cx="150" cy="20" r="6" />
          <circle cx="150" cy="20" r="2" fill="currentColor" />
          <path d="M150 8c3 4 3 8 0 12-3-4-3-8 0-12ZM162 20c-4 3-8 3-12 0 4-3 8-3 12 0Z" opacity=".7" />
        </g>
      )}
    </svg>
  );
}
