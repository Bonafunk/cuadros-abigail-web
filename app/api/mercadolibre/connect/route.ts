import { NextResponse } from "next/server";
import { randomBytes, createHmac } from "node:crypto";

export async function GET() {
  const clientId = process.env.ML_CLIENT_ID;
  const redirectUri = process.env.ML_REDIRECT_URI;
  const stateSecret = process.env.ML_OAUTH_STATE_SECRET;
  if (!clientId || !redirectUri || !stateSecret) return NextResponse.json({ error: "Falta configurar ML_CLIENT_ID, ML_REDIRECT_URI o ML_OAUTH_STATE_SECRET." }, { status: 500 });
  const nonce = randomBytes(24).toString("hex");
  const signature = createHmac("sha256", stateSecret).update(nonce).digest("hex");
  const state = `${nonce}.${signature}`;
  const url = new URL("https://auth.mercadolibre.com.mx/authorization");
  url.search = new URLSearchParams({ response_type: "code", client_id: clientId, redirect_uri: redirectUri, state }).toString();
  const response = NextResponse.redirect(url);
  response.cookies.set("ml_oauth_state", state, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 600 });
  return response;
}
