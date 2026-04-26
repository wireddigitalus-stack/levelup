"use client";

import Image from "next/image";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
}

export default function PageHeader({ title, subtitle }: PageHeaderProps) {
  return (
    <div>
      <h1 className="text-3xl tracking-tight flex items-center gap-2">
        <Image
          src="/icon-192x192.svg"
          alt="SubsonicDNA"
          width={32}
          height={32}
          className="rounded-lg"
        />
        <span>
          <span className="text-white font-extrabold">Subsonic</span>
          <span className="bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent font-extrabold">DNA</span>
          {" "}
          <span className="text-sm font-light bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent align-super -ml-0.5">AI</span>
        </span>
        <span className="text-xs font-bold tracking-wide uppercase text-white/60 bg-white/10 px-4 py-px rounded-full border border-white/10 ml-2">
          {title}
        </span>
      </h1>
      <p className="text-[11px] font-bold tracking-widest uppercase text-green-400 mt-0.5">
        Precision Ammo Sequencing &amp; Ballistics
      </p>
      {subtitle && (
        <p className="text-textSecondary text-sm mt-1">{subtitle}</p>
      )}
    </div>
  );
}
