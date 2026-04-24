"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createRiffAction, updateRiffAction, deleteRiffAction } from "@/lib/actions";
import type { Riff } from "@/lib/types";
import { Save, Trash2 } from "lucide-react";
import type { Dict } from "@/lib/i18n/dict";

interface Props {
  riff?: Riff;
  t: Dict["riffs"]["form"];
  tStatus: Dict["status"];
  tCommon: Dict["common"];
}

export function RiffForm({ riff, t, tStatus, tCommon }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(formData: FormData) {
    setError(null);
    try {
      if (riff) {
        await updateRiffAction(riff.id, formData);
      } else {
        const created = await createRiffAction(formData);
        router.push(`/riffs/${created.id}`);
        return;
      }
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    }
  }

  async function onDelete() {
    if (!riff) return;
    if (!confirm(t.deleteConfirm)) return;
    await deleteRiffAction(riff.id);
    router.push("/riffs");
  }

  return (
    <form action={(fd) => startTransition(() => onSubmit(fd))} className="space-y-5">
      <div>
        <Label htmlFor="title">{t.titleLabel}</Label>
        <Input
          id="title"
          name="title"
          required
          defaultValue={riff?.title ?? ""}
          placeholder={t.titlePlaceholder}
        />
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="artist">{t.artist}</Label>
          <Input
            id="artist"
            name="artist"
            defaultValue={riff?.artist ?? ""}
            placeholder={t.artistPlaceholder}
          />
        </div>
        <div>
          <Label htmlFor="status">{t.status}</Label>
          <Select id="status" name="status" defaultValue={riff?.status ?? "todo"}>
            <option value="todo">{tStatus.todo}</option>
            <option value="in_progress">{tStatus.in_progress}</option>
            <option value="mastered">{tStatus.mastered}</option>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="target_bpm">{t.targetBpm}</Label>
          <Input
            id="target_bpm"
            name="target_bpm"
            type="number"
            inputMode="numeric"
            min={20}
            max={400}
            defaultValue={riff?.target_bpm ?? ""}
            placeholder={t.targetBpmPlaceholder}
          />
        </div>
        <div>
          <Label htmlFor="current_bpm">{t.currentBpm}</Label>
          <Input
            id="current_bpm"
            name="current_bpm"
            type="number"
            inputMode="numeric"
            min={20}
            max={400}
            defaultValue={riff?.current_bpm ?? ""}
            placeholder={t.currentBpmPlaceholder}
          />
        </div>
      </div>
      <div>
        <Label htmlFor="tags">{t.tags}</Label>
        <Input
          id="tags"
          name="tags"
          defaultValue={riff?.tags ?? ""}
          placeholder={t.tagsPlaceholder}
        />
        <p className="text-xs text-[var(--color-muted)] mt-1">{t.tagsHint}</p>
      </div>
      <div>
        <Label htmlFor="resource_url">{t.resourceUrl}</Label>
        <Input
          id="resource_url"
          name="resource_url"
          type="url"
          defaultValue={riff?.resource_url ?? ""}
          placeholder="https://"
        />
        <p className="text-xs text-[var(--color-muted)] mt-1">{t.resourceHint}</p>
      </div>
      <div>
        <Label htmlFor="notes">{t.notes}</Label>
        <Textarea
          id="notes"
          name="notes"
          defaultValue={riff?.notes ?? ""}
          placeholder={t.notesPlaceholder}
          rows={4}
        />
      </div>

      {error && <div className="text-sm text-[var(--color-danger)]">{error}</div>}

      <div className="flex justify-between items-center pt-2">
        {riff ? (
          <Button type="button" variant="danger" onClick={onDelete} disabled={pending}>
            <Trash2 className="h-4 w-4" />
            {tCommon.delete}
          </Button>
        ) : (
          <span />
        )}
        <Button type="submit" variant="primary" disabled={pending}>
          <Save className="h-4 w-4" />
          {pending ? tCommon.saving : riff ? t.update : t.create}
        </Button>
      </div>
    </form>
  );
}
