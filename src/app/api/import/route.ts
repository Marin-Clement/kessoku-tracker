import { NextResponse } from "next/server";
import { importAll } from "@/lib/queries";
import { revalidatePath } from "next/cache";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    importAll({
      riffs: body.riffs,
      sessions: body.sessions,
      practice_logs: body.practice_logs,
    });
    revalidatePath("/", "layout");
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Import failed" },
      { status: 400 },
    );
  }
}
