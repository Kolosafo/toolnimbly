import { ImageResponse } from 'next/og';

import { site } from '@/lib/config/site';

export const runtime = 'nodejs';
export const alt = `${site.name} — ${site.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

/**
 * Site-wide default social image (spec §8.1). Drawn with system-available
 * fonts so it needs no font fetch at build time. Per-tool images may be added
 * later without changing the metadata contract.
 */
export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '80px',
          background: '#0b1220',
          color: '#f8fafc',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 16,
              background: '#0e7490',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 38,
              fontWeight: 700,
            }}
          >
            T
          </div>
          <div style={{ fontSize: 40, fontWeight: 600 }}>{site.name}</div>
        </div>

        <div style={{ marginTop: 48, fontSize: 64, fontWeight: 700, lineHeight: 1.15 }}>
          30 fast, private browser tools
        </div>

        <div
          style={{
            marginTop: 28,
            display: 'flex',
            flexDirection: 'column',
            fontSize: 32,
            color: '#94a3b8',
            lineHeight: 1.35,
          }}
        >
          <span>Calculators, text utilities, image editors, PDF tools and invoices.</span>
          <span>Nothing you enter is uploaded.</span>
        </div>
      </div>
    ),
    size,
  );
}
