import Link from "next/link";
import { listRiffs } from "@/lib/queries";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Empty } from "@/components/ui/empty";
import { Plus, Music2, ExternalLink, Check, Play, Circle, Trophy } from "lucide-react";
import type { RiffStatus } from "@/lib/types";
import { getDict } from "@/lib/i18n/server";
import { fmt } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function RiffsPage() {
  const { t } = await getDict();
  const riffs = listRiffs();
  const grouped = {
    in_progress: riffs.filter((r) => r.status === "in_progress"),
    todo: riffs.filter((r) => r.status === "todo"),
    mastered: riffs.filter((r) => r.status === "mastered"),
  };
  const statusConfig: Record<
    RiffStatus,
    { label: string; variant: Parameters<typeof Badge>[0]["variant"]; icon: typeof Check }
  > = {
    todo: { label: t.status.todo, variant: "default", icon: Circle },
    in_progress: { label: t.status.in_progress, variant: "primary", icon: Play },
    mastered: { label: t.status.mastered, variant: "success", icon: Check },
  };

  return (
    <div className="max-w-5xl mx-auto px-5 md:px-10 py-8 md:py-12 space-y-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{t.riffs.title}</h1>
          <p className="text-[var(--color-muted-strong)] mt-1">
            {fmt(riffs.length === 1 ? t.riffs.subtitleOne : t.riffs.subtitleMany, {
              n: riffs.length,
            })}
          </p>
        </div>
        <Link href="/riffs/new">
          <Button variant="primary" size="lg">
            <Plus className="h-4 w-4" />
            {t.riffs.newRiff}
          </Button>
        </Link>
      </header>

      {riffs.length === 0 && (
        <Empty
          icon={<Music2 className="h-10 w-10" />}
          title={t.riffs.emptyTitle}
          description={t.riffs.emptyDesc}
          action={
            <Link href="/riffs/new">
              <Button variant="primary">
                <Plus className="h-4 w-4" />
                {t.riffs.emptyAction}
              </Button>
            </Link>
          }
        />
      )}

      {(["in_progress", "todo", "mastered"] as RiffStatus[]).map((status) => {
        const items = grouped[status];
        if (items.length === 0) return null;
        const cfg = statusConfig[status];
        const Icon = cfg.icon;
        return (
          <section key={status} className="space-y-3">
            <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-[var(--color-muted)]">
              <Icon className="h-4 w-4" />
              {cfg.label}
              <span className="text-[var(--color-muted)]">· {items.length}</span>
            </h2>
            <div className="grid md:grid-cols-2 gap-3">
              {items.map((r) => {
                const pct =
                  r.target_bpm && r.current_bpm
                    ? Math.min(100, Math.round((r.current_bpm / r.target_bpm) * 100))
                    : 0;
                const tags = (r.tags ?? "").split(",").filter(Boolean);
                const hasPr = r.max_bpm != null && r.max_bpm > (r.current_bpm ?? 0);
                return (
                  <Card
                    key={r.id}
                    className="p-4 hover:border-[var(--color-primary)]/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <Link href={`/riffs/${r.id}`} className="min-w-0 flex-1">
                        <h3 className="font-semibold truncate">{r.title}</h3>
                        {r.artist && (
                          <p className="text-sm text-[var(--color-muted)] truncate">{r.artist}</p>
                        )}
                      </Link>
                      <div className="flex items-center gap-2">
                        {r.resource_url && (
                          <a
                            href={r.resource_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[var(--color-muted)] hover:text-[var(--color-primary)] transition-colors"
                            aria-label="Open resource"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        )}
                        <Badge variant={cfg.variant}>{cfg.label}</Badge>
                      </div>
                    </div>
                    {tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {tags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full bg-[var(--color-bg-elevated)] border border-[var(--color-border)] px-2 py-0.5 text-[10px] text-[var(--color-muted-strong)] uppercase tracking-wider"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    <Link href={`/riffs/${r.id}`} className="block mt-3">
                      <div className="flex items-center justify-between text-xs mb-2">
                        <span className="text-[var(--color-muted)] uppercase tracking-wide">
                          {t.common.progress}
                        </span>
                        <span className="font-mono flex items-center gap-2">
                          {hasPr && (
                            <span className="inline-flex items-center gap-0.5 text-[var(--color-warning)]">
                              <Trophy className="h-3 w-3" /> {r.max_bpm}
                            </span>
                          )}
                          <span>
                            <span className="text-[var(--color-primary)] font-semibold">
                              {r.current_bpm ?? "—"}
                            </span>
                            <span className="text-[var(--color-muted)]">
                              {" "}
                              / {r.target_bpm ?? "—"} bpm
                            </span>
                          </span>
                        </span>
                      </div>
                      <Progress value={pct} />
                    </Link>
                  </Card>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
