import { createClient } from "@supabase/supabase-js";
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const api = "https://api.mercadolibre.com";
const sellerId = process.env.ML_SELLER_ID || "37962663";

function db() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Falta configurar Supabase.");
  return createClient(url, key, { auth: { persistSession: false } });
}

function encryptionKey() {
  const raw = process.env.ML_TOKEN_ENCRYPTION_KEY;
  if (!raw) throw new Error("Falta ML_TOKEN_ENCRYPTION_KEY.");
  const key = Buffer.from(raw, "hex");
  if (key.length !== 32) throw new Error("ML_TOKEN_ENCRYPTION_KEY debe contener 64 caracteres hexadecimales.");
  return key;
}

function encrypt(value: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const data = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  return [iv.toString("hex"), cipher.getAuthTag().toString("hex"), data.toString("hex")].join(":");
}

function decrypt(value: string) {
  const [iv, tag, data] = value.split(":");
  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), Buffer.from(iv, "hex"));
  decipher.setAuthTag(Buffer.from(tag, "hex"));
  return Buffer.concat([decipher.update(Buffer.from(data, "hex")), decipher.final()]).toString("utf8");
}

export async function saveTokens(tokens: { access_token: string; refresh_token: string; expires_in: number; user_id: number }) {
  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();
  const { error } = await db().from("integration_tokens").upsert({
    provider: "mercadolibre",
    seller_id: tokens.user_id,
    access_token_enc: encrypt(tokens.access_token),
    refresh_token_enc: encrypt(tokens.refresh_token),
    expires_at: expiresAt,
    updated_at: new Date().toISOString()
  }, { onConflict: "provider" });
  if (error) throw error;
}

export async function getAccessToken() {
  const clientId = process.env.ML_CLIENT_ID;
  const clientSecret = process.env.ML_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error("Faltan credenciales de Mercado Libre.");
  const { data, error } = await db().from("integration_tokens").select("*").eq("provider", "mercadolibre").single();
  if (error || !data) throw new Error("La cuenta de Mercado Libre aún no está autorizada.");
  if (new Date(data.expires_at).getTime() > Date.now() + 60_000) return decrypt(data.access_token_enc);

  const refresh = decrypt(data.refresh_token_enc);
  const response = await fetch(`${api}/oauth/token`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "refresh_token", client_id: clientId, client_secret: clientSecret, refresh_token: refresh })
  });
  if (!response.ok) throw new Error("No se pudo renovar el acceso a Mercado Libre. Es necesario volver a autorizar la cuenta.");
  const tokens = await response.json();
  await saveTokens(tokens);
  return tokens.access_token as string;
}

export async function syncCatalog() {
  const token = await getAccessToken();
  const ids: string[] = [];
  let offset = 0;
  while (true) {
    const response = await fetch(`${api}/users/${sellerId}/items/search?status=active&limit=50&offset=${offset}`, {
      headers: { Authorization: `Bearer ${token}` }, cache: "no-store"
    });
    if (!response.ok) throw new Error(`Mercado Libre devolvió ${response.status} al consultar publicaciones.`);
    const page = await response.json();
    ids.push(...(page.results || []));
    offset += 50;
    if (offset >= (page.paging?.total || 0) || !page.results?.length) break;
  }

  const client = db();
  // Mark the previous catalog inactive first; only active items returned below are reactivated.
  const { error: inactiveError } = await client.from("catalog_products").update({ is_active: false, listing_status: "inactive", updated_at: new Date().toISOString() }).eq("seller_id", Number(sellerId));
  if (inactiveError) throw inactiveError;

  for (let i = 0; i < ids.length; i += 20) {
    const batch = ids.slice(i, i + 20);
    const response = await fetch(`${api}/items?ids=${batch.join(",")}`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
    if (!response.ok) throw new Error("No fue posible obtener el detalle de las publicaciones.");
    const rows = await response.json();
    const products = (rows || []).filter((row: any) => row.code === 200 && row.body).map((row: any) => {
      const item = row.body;
      return {
        item_id: item.id, seller_id: Number(sellerId), title: item.title, price: item.price,
        currency_id: item.currency_id || "MXN", permalink: item.permalink,
        thumbnail: item.pictures?.[0]?.secure_url || item.thumbnail?.replace(/^http:/, "https:") || null,
        pictures: (item.pictures || []).map((pic: any) => pic.secure_url || pic.url).filter(Boolean),
        category_id: item.category_id || null, listing_status: item.status,
        is_active: item.status === "active", source_updated_at: item.last_updated || null,
        updated_at: new Date().toISOString()
      };
    });
    if (products.length) {
      const { error } = await client.from("catalog_products").upsert(products, { onConflict: "item_id" });
      if (error) throw error;
    }
  }
  return { imported: ids.length };
}
