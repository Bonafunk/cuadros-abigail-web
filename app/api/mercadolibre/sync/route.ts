import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { syncCatalog } from "@/lib/mercadolibre";

export async function POST(request: NextRequest) {
  const secret = process.env.CATALOG_SYNC_SECRET;
  const supplied = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") || "";
  if (!secret || supplied.length !== secret.length || !timingSafeEqual(Buffer.from(supplied), Buffer.from(secret))) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  try {
    const result = await syncCatalog();
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Error de sincronización." }, { status: 500 });
  }
}
