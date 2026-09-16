import jsQR from 'jsqr';
import QRCode from 'qrcode';
import { describe, expect, it } from 'vitest';

import {
  buildQrPayload,
  checkQrColours,
  contrastRatio,
  escapeWifiValue,
  hasScheme,
  normaliseUrl,
  QR_ERROR_CORRECTION,
  type QrErrorCorrection,
} from '@/lib/qr/payloads';

describe('URL payloads', () => {
  it('keeps an existing scheme', () => {
    expect(hasScheme('https://example.com')).toBe(true);
    expect(hasScheme('mailto:a@b.com')).toBe(true);
    expect(hasScheme('example.com')).toBe(false);

    const result = buildQrPayload({ mode: 'url', url: 'https://toolnimbly.com' });
    expect(result.ok && result.payload).toBe('https://toolnimbly.com');
    expect(result.ok && result.note).toBeUndefined();
  });

  it('offers https rather than guessing silently', () => {
    const result = buildQrPayload({ mode: 'url', url: 'toolnimbly.com' });
    expect(result.ok && result.payload).toBe('https://toolnimbly.com');
    // The addition is disclosed, not hidden.
    expect(result.ok && result.note).toMatch(/https:\/\/ was added/i);
  });

  it('normalises without mangling paths or queries', () => {
    expect(normaliseUrl('example.com/a/b?c=d').url).toBe('https://example.com/a/b?c=d');
  });

  it('rejects empty and malformed input', () => {
    expect(buildQrPayload({ mode: 'url', url: '' }).ok).toBe(false);
    expect(buildQrPayload({ mode: 'url', url: '   ' }).ok).toBe(false);
  });
});

describe('email, phone and SMS payloads', () => {
  it('builds a mailto with encoded subject and body', () => {
    const result = buildQrPayload({
      mode: 'email',
      address: 'hello@example.com',
      subject: 'Hello there',
      body: 'Line one & line two',
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.payload.startsWith('mailto:hello@example.com?')).toBe(true);
    expect(result.payload).toContain('subject=Hello+there');
    // The ampersand must be encoded or it would start a new parameter.
    expect(result.payload).toContain('body=Line+one+%26+line+two');
  });

  it('omits the query when there is no subject or body', () => {
    const result = buildQrPayload({ mode: 'email', address: 'a@b.com' });
    expect(result.ok && result.payload).toBe('mailto:a@b.com');
  });

  it('rejects an invalid email address', () => {
    expect(buildQrPayload({ mode: 'email', address: 'not-an-email' }).ok).toBe(false);
    expect(buildQrPayload({ mode: 'email', address: '' }).ok).toBe(false);
  });

  it('builds tel and smsto payloads, stripping formatting', () => {
    const phone = buildQrPayload({ mode: 'phone', number: '+44 (0) 1234 567890' });
    expect(phone.ok && phone.payload).toBe('tel:+4401234567890');

    const sms = buildQrPayload({ mode: 'sms', number: '+15551234567', message: 'On my way' });
    expect(sms.ok && sms.payload).toBe('smsto:+15551234567:On my way');

    const bare = buildQrPayload({ mode: 'sms', number: '5551234567' });
    expect(bare.ok && bare.payload).toBe('smsto:5551234567');
  });

  it('rejects a phone number that is too short to be real', () => {
    expect(buildQrPayload({ mode: 'phone', number: '12' }).ok).toBe(false);
  });
});

describe('Wi-Fi payloads', () => {
  it('matches the format published on the page', () => {
    const result = buildQrPayload({
      mode: 'wifi',
      ssid: 'Cafe-Guest',
      password: 'your-password',
      encryption: 'WPA',
      hidden: false,
    });
    expect(result.ok && result.payload).toBe('WIFI:T:WPA;S:Cafe-Guest;P:your-password;H:false;;');
  });

  it('escapes every significant character', () => {
    // This is the bug most Wi-Fi QR generators have. String.raw is used on
    // both sides so the backslashes are literal and unambiguous.
    expect(escapeWifiValue('pass;word')).toBe(String.raw`pass\;word`);
    expect(escapeWifiValue('a,b')).toBe(String.raw`a\,b`);
    expect(escapeWifiValue('a:b')).toBe(String.raw`a\:b`);
    expect(escapeWifiValue('a"b')).toBe(String.raw`a\"b`);
    expect(escapeWifiValue(String.raw`a\b`)).toBe(String.raw`a\\b`);
    expect(escapeWifiValue('plain')).toBe('plain');
  });

  it('escapes inside a built payload', () => {
    const result = buildQrPayload({
      mode: 'wifi',
      ssid: 'My;Network',
      password: 'p@ss;w,rd',
      encryption: 'WPA',
      hidden: true,
    });
    expect(result.ok && result.payload).toBe(
      // String.raw so the backslashes are unambiguous: each escaped
      // character is a literal backslash followed by that character.
      String.raw`WIFI:T:WPA;S:My\;Network;P:p@ss\;w\,rd;H:true;;`,
    );
  });

  it('supports an open network with no password', () => {
    const result = buildQrPayload({
      mode: 'wifi',
      ssid: 'Open',
      password: '',
      encryption: 'nopass',
      hidden: false,
    });
    expect(result.ok && result.payload).toBe('WIFI:T:nopass;S:Open;P:;H:false;;');
  });

  it('requires a password for a secured network', () => {
    const result = buildQrPayload({
      mode: 'wifi',
      ssid: 'Secured',
      password: '',
      encryption: 'WPA',
      hidden: false,
    });
    expect(result.ok).toBe(false);
  });

  it('always warns that the password is stored in plain text', () => {
    const result = buildQrPayload({
      mode: 'wifi',
      ssid: 'Net',
      password: 'secret',
      encryption: 'WPA',
      hidden: false,
    });
    expect(result.ok && result.note).toMatch(/plain text/i);
  });

  it('rejects an empty SSID', () => {
    const result = buildQrPayload({
      mode: 'wifi',
      ssid: '   ',
      password: 'x',
      encryption: 'WPA',
      hidden: false,
    });
    expect(result.ok).toBe(false);
  });
});

/**
 * Decode round-trip (spec §6.10): every representative payload is encoded to a
 * real QR matrix and decoded again, so a code that cannot be read never ships.
 */
describe('encode and decode round trip', () => {
  async function roundTrip(payload: string, level: QrErrorCorrection = 'M'): Promise<string | null> {
    // Render to a raw RGBA bitmap, scaled so jsQR has enough pixels per module.
    const qr = QRCode.create(payload, { errorCorrectionLevel: level });
    const moduleCount = qr.modules.size;
    const scale = 6;
    const quietZone = 4 * scale;
    const size = moduleCount * scale + quietZone * 2;

    const data = new Uint8ClampedArray(size * size * 4).fill(255);

    for (let row = 0; row < moduleCount; row += 1) {
      for (let column = 0; column < moduleCount; column += 1) {
        if (!qr.modules.get(row, column)) continue;
        for (let dy = 0; dy < scale; dy += 1) {
          for (let dx = 0; dx < scale; dx += 1) {
            const x = quietZone + column * scale + dx;
            const y = quietZone + row * scale + dy;
            const offset = (y * size + x) * 4;
            data[offset] = 0;
            data[offset + 1] = 0;
            data[offset + 2] = 0;
            data[offset + 3] = 255;
          }
        }
      }
    }

    return jsQR(data, size, size)?.data ?? null;
  }

  const payloads: [string, string][] = [
    ['url', 'https://toolnimbly.com/tools/qr-code-generator'],
    ['plain text', 'Meet me at the north entrance at 14:30.'],
    ['email', 'mailto:hello@example.com?subject=Hello+there&body=Line+one'],
    ['phone', 'tel:+15551234567'],
    ['sms', 'smsto:+15551234567:On my way'],
    ['wifi', 'WIFI:T:WPA;S:Cafe-Guest;P:your-password;H:false;;'],
    ['wifi with escapes', String.raw`WIFI:T:WPA;S:My\;Network;P:p@ss\;w\,rd;H:true;;`],
    ['unicode', 'Καλημέρα κόσμε — 日本語 — 👋'],
  ];

  for (const [name, payload] of payloads) {
    it(`decodes a ${name} payload back to exactly what was encoded`, async () => {
      expect(await roundTrip(payload)).toBe(payload);
    });
  }

  it('round-trips at every error correction level', async () => {
    const payload = 'https://toolnimbly.com';
    for (const level of Object.keys(QR_ERROR_CORRECTION) as QrErrorCorrection[]) {
      expect(await roundTrip(payload, level), level).toBe(payload);
    }
  });

  it('round-trips payloads built by the payload builders', async () => {
    const built = buildQrPayload({
      mode: 'wifi',
      ssid: 'Cafe Guest',
      password: 'sem;icolon',
      encryption: 'WPA',
      hidden: false,
    });
    expect(built.ok).toBe(true);
    if (!built.ok) return;
    expect(await roundTrip(built.payload)).toBe(built.payload);
  });
});

describe('colour contrast warnings', () => {
  it('computes contrast ratios correctly', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 1);
    expect(contrastRatio('#ffffff', '#ffffff')).toBeCloseTo(1, 1);
  });

  it('accepts black on white without complaint', () => {
    expect(checkQrColours('#000000', '#ffffff')).toBeNull();
  });

  it('refuses a pair that will not scan', () => {
    const warning = checkQrColours('#cccccc', '#ffffff');
    expect(warning?.level).toBe('error');
    expect(warning?.message).toMatch(/unlikely to scan/i);
  });

  it('warns about an inverted code', () => {
    const warning = checkQrColours('#ffffff', '#000000');
    expect(warning?.level).toBe('warning');
    expect(warning?.message).toMatch(/light on dark/i);
  });

  it('warns about marginal contrast', () => {
    const warning = checkQrColours('#767676', '#ffffff');
    expect(warning?.level).toBe('warning');
    expect(warning?.message).toMatch(/may scan poorly/i);
  });

  it('handles three-digit hex colours', () => {
    expect(contrastRatio('#000', '#fff')).toBeCloseTo(21, 1);
  });
});
