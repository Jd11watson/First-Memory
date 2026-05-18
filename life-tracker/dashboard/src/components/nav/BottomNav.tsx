"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/",         label: "Today",   emoji: "🏠" },
  { href: "/trends",   label: "Trends",  emoji: "📈" },
  { href: "/chores",   label: "Chores",  emoji: "✅" },
  { href: "/contacts", label: "People",  emoji: "👥" },
  { href: "/check-in", label: "Log Day", emoji: "📝" },
];

export function BottomNav() {
  const path = usePathname();
  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-gray-950/95 backdrop-blur border-t border-gray-800 pb-safe">
      <div className="flex">
        {TABS.map(tab => {
          const active = tab.href === "/" ? path === "/" : path.startsWith(tab.href);
          return (
            <Link key={tab.href} href={tab.href}
              className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors
                ${active ? "text-orange-400" : "text-gray-500"}`}>
              <span className="text-xl">{tab.emoji}</span>
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
