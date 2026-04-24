import { getActiveSession, getAppSettings, listRiffs } from "@/lib/queries";
import { SessionScreen } from "@/components/session/session-screen";
import { StartScreen } from "@/components/session/start-screen";
import { getDict } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export default async function SessionPage() {
  const { t } = await getDict();
  const active = getActiveSession();
  const riffs = listRiffs().filter((r) => r.status !== "mastered");
  const settings = getAppSettings();

  if (!active) {
    return (
      <StartScreen
        hasRiffs={riffs.length > 0}
        t={t.session}
        phases={{
          warmup: settings.phase_warmup_minutes,
          technique: settings.phase_technique_minutes,
          songs: settings.phase_songs_minutes,
        }}
      />
    );
  }
  return <SessionScreen session={active} riffs={riffs} bpmStep={settings.bpm_step} t={t} />;
}
