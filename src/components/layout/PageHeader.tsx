"use client";

import Image from "next/image";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
}

export default function PageHeader({ title, subtitle }: PageHeaderProps) {
  return (
    <div>
      <div className="flex items-center gap-2">
        <Image
          src="/icon-192x192.svg"
          alt="SubsonicDNA"
          width={28}
          height={28}
          className="rounded-lg shrink-0"
        />
        <h1 className="text-[22px] tracking-tight whitespace-nowrap leading-none">
          <span className="text-white font-extrabold">Subsonic</span>
          <span className="bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent font-extrabold">DNA</span>
          <span className="text-[11px] font-semibold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent align-super ml-0.5">AI</span>
        </h1>
        <span className="text-[10px] font-bold tracking-wide uppercase text-white/60 bg-white/10 px-2.5 py-0.5 rounded-full border border-white/10 shrink-0">
          {title}
        </span>
      </div>
      <p className="text-[8px] font-bold tracking-[0.12em] uppercase text-green-400 mt-1 ml-[36px]">
        Precision Ammo Sequencing &amp; Ballistics
      </p>
      {subtitle && (
        <p className="text-textSecondary text-xs mt-0.5 ml-[36px]">{subtitle}</p>
      )}
    </div>
  );
}
