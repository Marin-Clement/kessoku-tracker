import { NextResponse } from "next/server";
import { exportAll } from "@/lib/queries";

export async function GET() {
  const data = exportAll();
  return new NextResponse(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="kessoku-backup-${new Date().toISOString().slice(0, 10)}.json"`,
    },
  });
}
