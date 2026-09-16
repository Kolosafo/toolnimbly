/**
 * QR payload construction (spec §6.10).
 *
 * A QR code carries text. What makes one "a Wi-Fi code" is a convention about
 * how that text is structured, and phones recognise those conventions. Getting
 * the escaping right is the part most generators skip.
 */

export const QR_MODES = ['url', 'text', 'email', 'phone', 'sms', 'wifi'] as const;
export type QrMode = (typeof QR_MODES)[number];

export const QR_ERROR_CORRECTION = {
  L: { label: 'L — recovers about 7%', recovery: 7 },
  M: { label: 'M — recovers about 15%', recovery: 15 },
  Q: { label: 'Q — recovers about 25%', recovery: 25 },
  H: { label: 'H — recovers about 30%', recovery: 30 },
} as const;

export type QrErrorCorrection = keyof typeof QR_ERROR_CORRECTION;

export type WifiEncryption = 'WPA' | 'WEP' | 'nopass';

/**
 * Escapes a Wi-Fi field.
 *
 * Backslash, semicolon, comma, colon and double quote are all significant in
 * the `WIFI:` format and must be backslash-escaped. A password containing a
 * semicolon silently produces an unscannable code otherwise — this is the most
 * common bug in Wi-Fi QR generators.
 */
export function escapeWifiValue(value: string): string {
  return value.replace(/([\\;,:"])/g, '\\$1');
}

export type QrPayloadInput =
  | { mode: 'url'; url: string }
  | { mode: 'text'; text: string }
  | { mode: 'email'; address: string; subject?: string; body?: string }
  | { mode: 'phone'; number: string }
  | { mode: 'sms'; number: string; message?: string }
  | {
      mode: 'wifi';
      ssid: string;
      password: string;
      encryption: WifiEncryption;
      hidden: boolean;
    };

export type QrPayloadResult =
  | { ok: true; payload: string; note?: string }
  | { ok: false; error: string };

/** True when a URL already carries a scheme, so we never guess silently. */
export function hasScheme(value: string): boolean {
  return /^[a-z][a-z0-9+.-]*:/i.test(value.trim());
}

export function normaliseUrl(raw: string): { url: string; addedScheme: boolean } {
  const trimmed = raw.trim();
  if (hasScheme(trimmed)) return { url: trimmed, addedScheme: false };
  return { url: `https://${trimmed}`, addedScheme: true };
}

/** Phone numbers keep a leading `+` and drop formatting characters. */
function normalisePhone(raw: string): string {
  const trimmed = raw.trim();
  const plus = trimmed.startsWith('+') ? '+' : '';
  return plus + trimmed.replace(/[^\d]/g, '');
}

export function buildQrPayload(input: QrPayloadInput): QrPayloadResult {
  switch (input.mode) {
    case 'url': {
      if (input.url.trim().length === 0) {
        return { ok: false, error: 'Enter a web address.' };
      }
      const { url, addedScheme } = normaliseUrl(input.url);
      try {
        // Validates structure; throws for something that is not a URL at all.
        new URL(url);
      } catch {
        return { ok: false, error: 'That does not look like a valid web address.' };
      }
      return {
        ok: true,
        payload: url,
        ...(addedScheme ? { note: 'No scheme was given, so https:// was added.' } : {}),
      };
    }

    case 'text': {
      if (input.text.length === 0) return { ok: false, error: 'Enter some text to encode.' };
      return { ok: true, payload: input.text };
    }

    case 'email': {
      const address = input.address.trim();
      if (address.length === 0) return { ok: false, error: 'Enter an email address.' };
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address)) {
        return { ok: false, error: 'That does not look like a valid email address.' };
      }

      const params = new URLSearchParams();
      if (input.subject?.trim()) params.set('subject', input.subject.trim());
      if (input.body?.trim()) params.set('body', input.body.trim());
      const query = params.toString();

      return { ok: true, payload: `mailto:${address}${query ? `?${query}` : ''}` };
    }

    case 'phone': {
      const number = normalisePhone(input.number);
      if (number.replace('+', '').length < 3) {
        return { ok: false, error: 'Enter a phone number.' };
      }
      return { ok: true, payload: `tel:${number}` };
    }

    case 'sms': {
      const number = normalisePhone(input.number);
      if (number.replace('+', '').length < 3) {
        return { ok: false, error: 'Enter a phone number.' };
      }
      const message = input.message?.trim() ?? '';
      return { ok: true, payload: `smsto:${number}${message ? `:${message}` : ''}` };
    }

    case 'wifi': {
      const ssid = input.ssid.trim();
      if (ssid.length === 0) return { ok: false, error: 'Enter the network name (SSID).' };

      const encryption = input.encryption;
      if (encryption !== 'nopass' && input.password.length === 0) {
        return {
          ok: false,
          error: 'Enter the network password, or set encryption to "None" for an open network.',
        };
      }

      const parts = [
        `T:${encryption}`,
        `S:${escapeWifiValue(ssid)}`,
        encryption === 'nopass' ? 'P:' : `P:${escapeWifiValue(input.password)}`,
        `H:${input.hidden ? 'true' : 'false'}`,
      ];

      return {
        ok: true,
        payload: `WIFI:${parts.join(';')};;`,
        note: 'The password is stored in the code as plain text. Anyone who can scan or photograph it can read it.',
      };
    }

    default:
      return { ok: false, error: 'Unknown QR mode.' };
  }
}

/**
 * Relative luminance, used to warn about colour pairs unlikely to scan.
 * Follows the WCAG definition.
 */
function relativeLuminance(hex: string): number {
  const value = hex.replace('#', '');
  const full =
    value.length === 3
      ? value
          .split('')
          .map((c) => c + c)
          .join('')
      : value;

  const channels = [0, 2, 4].map((offset) => {
    const component = parseInt(full.slice(offset, offset + 2), 16) / 255;
    return component <= 0.03928 ? component / 12.92 : ((component + 0.055) / 1.055) ** 2.4;
  });

  const [r, g, b] = channels as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(foreground: string, background: string): number {
  const a = relativeLuminance(foreground);
  const b = relativeLuminance(background);
  const lighter = Math.max(a, b);
  const darker = Math.min(a, b);
  return (lighter + 0.05) / (darker + 0.05);
}

export type ColourWarning = { level: 'error' | 'warning'; message: string } | null;

/**
 * Scanners expect dark modules on a light background with strong contrast.
 * Inverted or low-contrast pairs frequently fail to scan on some devices.
 */
export function checkQrColours(foreground: string, background: string): ColourWarning {
  const ratio = contrastRatio(foreground, background);

  if (ratio < 3) {
    return {
      level: 'error',
      message: `These colours have a contrast ratio of ${ratio.toFixed(1)}:1. That is very unlikely to scan. Aim for at least 7:1, and ideally black on white.`,
    };
  }

  if (relativeLuminance(foreground) > relativeLuminance(background)) {
    return {
      level: 'warning',
      message:
        'This code is light on dark. Many scanners expect dark modules on a light background and will not read an inverted code.',
    };
  }

  if (ratio < 7) {
    return {
      level: 'warning',
      message: `Contrast is ${ratio.toFixed(1)}:1. This may scan poorly in low light or when printed small.`,
    };
  }

  return null;
}
