import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  // Mercado Libre requires a fast HTTP 200 acknowledgement.
  // Full processing will be added after OAuth + database credentials are configured.
  try {
    const payload = await request.json();
    const expectedUser = process.env.ML_SELLER_ID;
    if (expectedUser && String(payload.user_id) !== expectedUser) {
      return NextResponse.json({ received: true }, { status: 200 });
    }
    console.info("Mercado Libre notification received", {
      topic: payload.topic,
      resource: payload.resource,
      user_id: payload.user_id,
      sent: payload.sent
    });
    return NextResponse.json({ received: true }, { status: 200 });
  } catch {
    // Acknowledge malformed/duplicate deliveries to avoid endless retries;
    // monitoring should record the invalid payload in production.
    return NextResponse.json({ received: true }, { status: 200 });
  }
}