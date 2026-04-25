// ============================================================
// FormattedAIMessage — Dyslexia-friendly AI text formatting
//
// Parses markdown-style Gemini responses into structured,
// easy-to-read UI: bold headers, bulleted lists, and spaced
// paragraphs with generous leading and tracking.
// ============================================================

"use client";

export default function FormattedAIMessage({ text }: { text: string }) {
  const lines = text.split("\n").filter((l) => l.trim() !== "");

  return (
    <div className="space-y-3" style={{ letterSpacing: "0.015em" }}>
      {lines.map((line, i) => {
        const trimmed = line.trim();

        // Bullet point line (-, •, *, or numbered like "1.")
        const isBullet = /^[-•*]/.test(trimmed) || /^\d+[.)]/.test(trimmed);
        // Bold header line (starts with **)
        const isHeader = /^\*\*(.+?)\*\*/.test(trimmed);

        if (isHeader) {
          const headerText = trimmed.replace(/\*\*/g, "");
          return (
            <p key={i} className="font-semibold text-white mt-1 leading-loose tracking-wide">
              {headerText}
            </p>
          );
        }

        if (isBullet) {
          // Strip the bullet marker
          const content = trimmed.replace(/^[-•*]\s*/, "").replace(/^\d+[.)]\s*/, "");
          // Bold segments within bullet
          const parts = content.split(/(\*\*.*?\*\*)/g);
          return (
            <div key={i} className="flex gap-2.5 items-start py-1">
              <span className="text-green-400 mt-0.5 shrink-0 text-xs">●</span>
              <p className="leading-loose tracking-wide text-white/85">
                {parts.map((part, j) =>
                  /^\*\*(.+?)\*\*$/.test(part) ? (
                    <span key={j} className="font-semibold text-white">{part.replace(/\*\*/g, "")}</span>
                  ) : (
                    <span key={j}>{part}</span>
                  )
                )}
              </p>
            </div>
          );
        }

        // Regular paragraph
        const parts = trimmed.split(/(\*\*.*?\*\*)/g);
        return (
          <p key={i} className="leading-loose tracking-wide text-white/85">
            {parts.map((part, j) =>
              /^\*\*(.+?)\*\*$/.test(part) ? (
                <span key={j} className="font-semibold text-white">{part.replace(/\*\*/g, "")}</span>
              ) : (
                <span key={j}>{part}</span>
              )
            )}
          </p>
        );
      })}
    </div>
  );
}
