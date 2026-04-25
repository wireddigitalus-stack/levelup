"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Target, ArrowRightLeft, BarChart3, User, Package } from "lucide-react";
import { clsx } from "clsx";

export default function BottomNav() {
  const pathname = usePathname();

  const tabs = [
    { name: "Home", href: "/", icon: Home },
    { name: "Log", href: "/log", icon: Target },
    { name: "Inventory", href: "/inventory", icon: Package },
    { name: "Analytics", href: "/analytics", icon: BarChart3 },
    { name: "Compare", href: "/compare", icon: ArrowRightLeft },
    { name: "Profile", href: "/profile", icon: User },
  ];

  return (
    <div className="fixed bottom-0 left-0 w-full bg-[#1C1C1E]/90 backdrop-blur-md border-t border-[#2C2C2E] px-4 pt-3 pb-8 z-50">
      <div className="flex justify-between items-center max-w-md mx-auto">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href;
          return (
            <Link key={tab.name} href={tab.href} className="flex flex-col items-center gap-1 min-w-0">
              <tab.icon
                className={clsx("w-5 h-5", isActive ? "text-primary" : "text-[#8E8E93]")}
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span
                className={clsx(
                  "text-[10px] font-medium truncate",
                  isActive ? "text-primary" : "text-[#8E8E93]"
                )}
              >
                {tab.name}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
