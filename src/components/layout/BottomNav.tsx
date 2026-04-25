"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Target, ArrowRightLeft, BarChart3, User, Package } from "lucide-react";
import { clsx } from "clsx";
import { memo } from "react";

const tabs = [
  { name: "Home", href: "/", icon: Home },
  { name: "Log", href: "/log", icon: Target },
  { name: "Inventory", href: "/inventory", icon: Package },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Compare", href: "/compare", icon: ArrowRightLeft },
  { name: "Profile", href: "/profile", icon: User },
] as const;

function BottomNav() {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-0 left-0 w-full bg-[#1C1C1E]/90 backdrop-blur-md border-t border-[#2C2C2E] px-2 pt-2 pb-[max(env(safe-area-inset-bottom,8px),8px)] z-40 will-change-transform">
      <div className="flex justify-around items-center max-w-md mx-auto">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href;
          const Icon = tab.icon;
          return (
            <Link
              key={tab.name}
              href={tab.href}
              prefetch={true}
              className={clsx(
                "flex flex-col items-center gap-0.5 py-1 px-2 rounded-lg transition-colors duration-150",
                isActive ? "text-primary" : "text-[#8E8E93] active:text-white/60"
              )}
            >
              <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 1.8} />
              <span className="text-[10px] font-medium leading-none">{tab.name}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export default memo(BottomNav);
