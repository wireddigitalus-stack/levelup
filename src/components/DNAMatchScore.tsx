// ============================================================
// DNAMatchScore — DNA Double Helix grade visualization
//
// The "North Star" component of SubsonicDNA. A double helix
// that fills with green light as the ammo/rifle pairing score
// increases from 0 → 100. The grade letter sits centered.
// ============================================================

"use client";

interface DNAMatchScoreProps {
  grade: string;
  score: number;
  color: string;
}

export default function DNAMatchScore({ grade, score, color }: DNAMatchScoreProps) {
  const totalRungs = 10;
  const litRungs = Math.round((score / 100) * totalRungs);
  const isEmpty = grade === "N/A";

  // Generate helix path points
  // Two sine waves, 180° out of phase, running vertically
  const height = 120;
  const width = 80;
  const cx = width / 2;
  const amplitude = 22;
  const rungGap = height / (totalRungs + 1);

  // Build strand paths as smooth curves
  const strandAPoints: { x: number; y: number }[] = [];
  const strandBPoints: { x: number; y: number }[] = [];
  const steps = 60;

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const y = 8 + t * (height - 16);
    const phase = t * Math.PI * 3; // ~1.5 full twists
    const xA = cx + Math.sin(phase) * amplitude;
    const xB = cx - Math.sin(phase) * amplitude;
    strandAPoints.push({ x: xA, y });
    strandBPoints.push({ x: xB, y });
  }

  const toPath = (points: { x: number; y: number }[]) => {
    return points
      .map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`))
      .join(" ");
  };

  // Calculate rung positions
  const rungs = [];
  for (let i = 0; i < totalRungs; i++) {
    const t = (i + 1) / (totalRungs + 1);
    const y = 8 + t * (height - 16);
    const phase = t * Math.PI * 3;
    const xA = cx + Math.sin(phase) * amplitude;
    const xB = cx - Math.sin(phase) * amplitude;
    const isLit = i < litRungs;
    rungs.push({ x1: xA, x2: xB, y, isLit, index: i });
  }

  // Glow intensity based on score
  const glowOpacity = isEmpty ? 0 : Math.min(score / 100, 1) * 0.6;

  return (
    <div className="relative flex flex-col items-center">
      {/* Label */}
      <span className="text-xs text-textSecondary font-medium mb-1.5">DNA Match</span>

      {/* Helix container */}
      <div className="relative" style={{ width, height }}>
        {/* Background glow */}
        {!isEmpty && (
          <div
            className="absolute inset-0 rounded-full blur-2xl transition-opacity duration-1000"
            style={{
              background: `radial-gradient(ellipse at center, ${color}40 0%, transparent 70%)`,
              opacity: glowOpacity,
            }}
          />
        )}

        <svg
          viewBox={`0 0 ${width} ${height}`}
          width={width}
          height={height}
          className="relative z-10"
        >
          <defs>
            {/* Green glow filter for lit rungs */}
            <filter id="rungGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Strand gradient */}
            <linearGradient id="strandGradA" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={isEmpty ? "#3A3A3C" : color} stopOpacity={isEmpty ? 0.3 : 0.7} />
              <stop offset="100%" stopColor={isEmpty ? "#3A3A3C" : color} stopOpacity={isEmpty ? 0.15 : 0.3} />
            </linearGradient>
            <linearGradient id="strandGradB" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={isEmpty ? "#3A3A3C" : color} stopOpacity={isEmpty ? 0.15 : 0.3} />
              <stop offset="100%" stopColor={isEmpty ? "#3A3A3C" : color} stopOpacity={isEmpty ? 0.3 : 0.7} />
            </linearGradient>
          </defs>

          {/* Strand A */}
          <path
            d={toPath(strandAPoints)}
            fill="none"
            stroke="url(#strandGradA)"
            strokeWidth={2}
            strokeLinecap="round"
          />

          {/* Strand B */}
          <path
            d={toPath(strandBPoints)}
            fill="none"
            stroke="url(#strandGradB)"
            strokeWidth={2}
            strokeLinecap="round"
          />

          {/* Rungs (base pairs) */}
          {rungs.map((rung) => (
            <line
              key={rung.index}
              x1={rung.x1}
              y1={rung.y}
              x2={rung.x2}
              y2={rung.y}
              stroke={rung.isLit ? color : "#2C2C2E"}
              strokeWidth={rung.isLit ? 2.5 : 1.5}
              strokeLinecap="round"
              filter={rung.isLit ? "url(#rungGlow)" : undefined}
              opacity={rung.isLit ? 1 : 0.4}
              style={{
                transition: `all 0.6s ease ${rung.index * 80}ms`,
              }}
            />
          ))}

          {/* Rung node dots — where rungs connect to strands */}
          {rungs.map((rung) => (
            <g key={`dots-${rung.index}`}>
              <circle
                cx={rung.x1}
                cy={rung.y}
                r={rung.isLit ? 2.5 : 1.5}
                fill={rung.isLit ? color : "#3A3A3C"}
                style={{ transition: `all 0.6s ease ${rung.index * 80}ms` }}
              />
              <circle
                cx={rung.x2}
                cy={rung.y}
                r={rung.isLit ? 2.5 : 1.5}
                fill={rung.isLit ? color : "#3A3A3C"}
                style={{ transition: `all 0.6s ease ${rung.index * 80}ms` }}
              />
            </g>
          ))}
        </svg>

        {/* Centered grade letter */}
        <div className="absolute inset-0 flex items-center justify-center z-20">
          <div className="text-center">
            <p
              className="text-3xl font-black leading-none drop-shadow-lg"
              style={{
                color: isEmpty ? "#8E8E93" : color,
                textShadow: isEmpty ? "none" : `0 0 20px ${color}40`,
              }}
            >
              {grade}
            </p>
          </div>
        </div>
      </div>

      {/* Score readout */}
      <p className="text-xs text-textSecondary mt-1 font-mono">{score}/100</p>
    </div>
  );
}
