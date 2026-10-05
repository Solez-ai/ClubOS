import { createHmac } from 'crypto';

const HMAC_SECRET = process.env.CHECKIN_HMAC_SECRET || 'clubos_super_secret_hmac_key_2026_drmc';

export function generateRotatingToken(eventToken: string, timeOffsetSec: number = 0): string {
  const currentSlot = Math.floor((Date.now() / 1000 + timeOffsetSec) / 30);
  const payload = `${eventToken}:${currentSlot}`;
  return createHmac('sha256', HMAC_SECRET).update(payload).digest('hex').substring(0, 16);
}

export function verifyRotatingToken(eventToken: string, providedCode: string): boolean {
  // Accepts current window (0s offset) or previous 30s window (-30s offset)
  const currentCode = generateRotatingToken(eventToken, 0);
  const prevCode = generateRotatingToken(eventToken, -30);

  return providedCode === currentCode || providedCode === prevCode;
}
