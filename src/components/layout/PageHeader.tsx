"use client";

import Image from "next/image";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
}

export default function PageHeader({ title, subtitle }: PageHeaderProps) {
  return (
    <>
      <h1 className="text-3xl tracking-tight flex items-center gap-2">
        <Image
          src="/icon-192x192.svg"
          alt="LevelUP"
          width={32}
          height={32}
          className="rounded-lg"
        />
        <span>
          <span className="text-white font-extrabold">Level</span>
          <span className="bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent font-extrabold">UP</span>
          {" "}
          <span className="font-normal text-white/80">{title}</span>
        </span>
      </h1>
      <p className="text-[11px] font-medium tracking-widest uppercase text-green-400/70 mt-0.5">
        Lot Evaluation &amp; Velocity Error Logger
      </p>
      {subtitle && (
        <p className="text-textSecondary text-sm mt-1">{subtitle}</p>
      )}
    </>
  );
}
