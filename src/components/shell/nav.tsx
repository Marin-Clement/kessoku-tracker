"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Home, Music2, Activity, BarChart3, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { LangSwitcher } from "./lang-switcher";
import type { Locale } from "@/lib/i18n/dict";

interface NavLabels {
  home: string;
  riffs: string;
  session: string;
  stats: string;
  settings: string;
  tagline: string;
}

export function SideNav({ labels, locale }: { labels: NavLabels; locale: Locale }) {
  const pathname = usePathname();
  const items = [
    { href: "/", label: labels.home, icon: Home },
    { href: "/riffs", label: labels.riffs, icon: Music2 },
    { href: "/session", label: labels.session, icon: Activity, accent: true },
    { href: "/stats", label: labels.stats, icon: BarChart3 },
    { href: "/settings", label: labels.settings, icon: Settings },
  ];

  return (
    <aside className="hidden md:flex md:flex-col w-60 shrink-0 border-r border-[var(--color-border)] bg-[var(--color-bg-elevated)]/40 px-4 py-6 sticky top-0 h-screen">
      <Link href="/" className="flex items-center gap-2 mb-8 px-2">
        <Image src="/logo.png" alt="KessokuTracker Logo" width={40} height={40} className="rounded-xl" priority unoptimized />
        <div>
          <div className="font-bold tracking-tight">Kessoku</div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-[var(--color-muted)]">
            Tracker
          </div>
        </div>
      </Link>
      <nav className="flex flex-col gap-1">
        {items.map((item) => {
          const active =
            pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                active
                  ? "bg-[var(--color-primary-soft)] text-[var(--color-primary)]"
                  : "text-[var(--color-muted-strong)] hover:bg-[var(--color-card)] hover:text-[var(--color-fg)]",
                item.accent && !active && "text-[var(--color-accent)]",
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto flex flex-col gap-3 px-2">
        <LangSwitcher locale={locale} />
        <p className="text-[10px] text-[var(--color-muted-strong)] leading-relaxed">
          {labels.tagline}
        </p>
      </div>
    </aside>
  );
}

export function BottomNav({ labels }: { labels: NavLabels }) {
  const pathname = usePathname();
  const items = [
    { href: "/", label: labels.home, icon: Home },
    { href: "/riffs", label: labels.riffs, icon: Music2 },
    { href: "/session", label: labels.session, icon: Activity, accent: true },
    { href: "/stats", label: labels.stats, icon: BarChart3 },
    { href: "/settings", label: labels.settings, icon: Settings },
  ];
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-[var(--color-bg-elevated)] border-t border-[var(--color-border)]">
      <div className="flex items-center justify-around py-2">
        {items.map((item) => {
          const active =
            pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-[10px] font-medium transition-colors",
                active ? "text-[var(--color-primary)]" : "text-[var(--color-muted)]",
              )}
            >
              <Icon
                className={cn(
                  "h-5 w-5",
                  active && "drop-shadow-[0_0_8px_var(--color-primary)]",
                )}
              />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
