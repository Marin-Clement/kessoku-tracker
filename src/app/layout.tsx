import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SideNav, BottomNav } from "@/components/shell/nav";
import { getDict } from "@/lib/i18n/server";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Kessoku Tracker — Guitar Practice",
  description:
    "Track practice time, BPM progression, and health. Become a better guitarist, one BPM at a time.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Kessoku",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0910",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { t, locale } = await getDict();
  const labels = {
    home: t.nav.home,
    riffs: t.nav.riffs,
    session: t.nav.session,
    stats: t.nav.stats,
    settings: t.nav.settings,
    tagline: t.nav.tagline,
  };
  return (
    <html lang={locale} className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex">
        <SideNav labels={labels} locale={locale} />
        <main className="flex-1 min-w-0 pb-24 md:pb-8">{children}</main>
        <BottomNav labels={labels} />
      </body>
    </html>
  );
}
