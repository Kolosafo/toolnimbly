import { NextResponse } from 'next/server';

import { features } from '@/lib/config/features';
import {
  handleWebhookEvent,
  SIGNATURE_HEADER,
  verifySignature,
  type MarbleWebhookPayload,
} from '@/lib/marble/webhook';

/**
 * `POST /api/revalidate` — the endpoint Marble calls on publish.
 *
 * Responses are deliberately terse. A detailed rejection ("bad signature" vs
 * "unknown event") tells an attacker probing the endpoint how close they are;
 * Marble only needs to know whether it succeeded.
 */
export async function POST(request: Request): Promise<Response> {
  if (!features.blogEnabled) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const secret = process.env.MARBLE_WEBHOOK_SECRET;
  const signature = request.headers.get(SIGNATURE_HEADER);

  if (!secret || !signature) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Raw bytes, before any parsing — re-serialising would break the digest.
  const bodyText = await request.text();

  if (!verifySignature(secret, signature, bodyText)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let payload: MarbleWebhookPayload;
  try {
    payload = JSON.parse(bodyText) as MarbleWebhookPayload;
  } catch {
    return NextResponse.json({ error: 'Malformed body' }, { status: 400 });
  }

  if (typeof payload?.event !== 'string' || typeof payload?.data !== 'object' || !payload.data) {
    return NextResponse.json({ error: 'Malformed body' }, { status: 400 });
  }

  try {
    return NextResponse.json(await handleWebhookEvent(payload));
  } catch (error) {
    console.error('[marble] webhook handling failed:', error);
    return NextResponse.json({ error: 'Failed to process webhook' }, { status: 500 });
  }
}
