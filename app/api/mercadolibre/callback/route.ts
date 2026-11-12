import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";
import { saveTokens } from "@/lib/mercadolibre";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state") || "";
  const cookieState = request.cookies.get("ml_oauth_state")?.value || "";
  const secret = process.env.ML_OAUTH_STATE_SECRET;
  if (!secret || !code || !cookieState || state !== cookieState) return NextResponse.json({ error: "Autorización inválida o expirada. Intenta conectar nuevamente." }, { status: 400 });
  const [nonce, signature] = state.split(".");
  const expected = createHmac("sha256", secret).update(nonce || "").digest("hex");
  if (!signature || signature.length !== expected.length || !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return NextResponse.json({ error: "No se pudo validar la autorización." }, { status: 400 });

  const response = await fetch("https://api.mercadolibre.com/oauth/token", {
    method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "authorization_code", client_id: process.env.ML_CLIENT_ID || "", client_secret: process.env.ML_CLIENT_SECRET || "", code, redirect_uri: process.env.ML_REDIRECT_URI || "" })
  });
  if (!response.ok) return NextResponse.json({ error: "Mercado Libre rechazó la autorización. Revisa la configuración de la aplicación." }, { status: 400 });
  const tokens = await response.json();
  await saveTokens(tokens);
  const destination = new URL("/", request.url);
  destination.searchParams.set("ml_connected", "1");
  const result = NextResponse.redirect(destination);
  result.cookies.delete("ml_oauth_state");
  return result;
}
