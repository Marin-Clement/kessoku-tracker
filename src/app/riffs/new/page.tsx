import Link from "next/link";
import { Card } from "@/components/ui/card";
import { RiffForm } from "@/components/riffs/riff-form";
import { ChevronLeft } from "lucide-react";
import { getDict } from "@/lib/i18n/server";

export default async function NewRiffPage() {
  const { t } = await getDict();
  return (
    <div className="max-w-2xl mx-auto px-5 md:px-10 py-8 md:py-12 space-y-6">
      <Link
        href="/riffs"
        className="inline-flex items-center text-sm text-[var(--color-muted)] hover:text-[var(--color-fg)] transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
        {t.riffs.allRiffs}
      </Link>
      <header>
        <h1 className="text-3xl font-bold tracking-tight">{t.riffs.newTitle}</h1>
        <p className="text-[var(--color-muted-strong)] mt-1">{t.riffs.newSubtitle}</p>
      </header>
      <Card className="p-6">
        <RiffForm t={t.riffs.form} tStatus={t.status} tCommon={t.common} />
      </Card>
    </div>
  );
}
