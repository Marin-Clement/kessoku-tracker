import { SettingsPanel } from "@/components/settings/settings-panel";
import { Card } from "@/components/ui/card";
import { LangSwitcher } from "@/components/shell/lang-switcher";
import { Heart, Code, Info, Languages } from "lucide-react";
import { getDict } from "@/lib/i18n/server";
import { getAppSettings } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const { t, locale } = await getDict();
  const settings = getAppSettings();
  return (
    <div className="max-w-3xl mx-auto px-5 md:px-10 py-8 md:py-12 space-y-8">
      <header>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{t.settings.title}</h1>
        <p className="text-[var(--color-muted-strong)] mt-1">{t.settings.subtitle}</p>
      </header>

      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-[var(--color-muted)]">
          {t.settings.language}
        </h2>
        <Card className="p-5">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-start gap-3">
              <Languages className="h-5 w-5 text-[var(--color-accent)] mt-1" />
              <div>
                <h3 className="font-semibold">{t.settings.language}</h3>
                <p className="text-sm text-[var(--color-muted)]">{t.settings.languageDesc}</p>
              </div>
            </div>
            <LangSwitcher locale={locale} />
          </div>
        </Card>
      </section>

      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-[var(--color-muted)]">
          {t.settings.preferences} · {t.settings.data}
        </h2>
        <SettingsPanel t={t.settings} settings={settings} />
      </section>

      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-[var(--color-muted)]">
          {t.settings.about}
        </h2>
        <Card className="p-5 space-y-3">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 text-[var(--color-accent)] mt-0.5 shrink-0" />
            <p className="text-sm">{t.settings.aboutBody}</p>
          </div>
          <p className="text-xs text-[var(--color-muted)] pl-6">{t.settings.aboutPwa}</p>
          <div className="flex items-center gap-2 pl-6 pt-2 text-xs text-[var(--color-muted)]">
            <Heart className="h-3.5 w-3.5 text-[var(--color-primary)]" />
            {t.settings.aboutFooter}
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-2 text-sm text-[var(--color-muted-strong)]">
            <Code className="h-4 w-4" />
            <span>Next.js · Tailwind v4 · SQLite · Recharts</span>
          </div>
        </Card>
      </section>
    </div>
  );
}
