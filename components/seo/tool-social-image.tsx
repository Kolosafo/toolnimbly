import { ImageResponse } from 'next/og';

import { PRIORITY_TOOL_SOCIAL_IMAGES } from '@/lib/seo/tool-social-images';

export const TOOL_SOCIAL_IMAGE_SIZE = { width: 1200, height: 630 } as const;

export function renderToolSocialImage(slug: string): ImageResponse {
  const image = PRIORITY_TOOL_SOCIAL_IMAGES[slug] ?? {
    title: 'Free browser tools',
    differentiator: 'Private • No signup',
    alt: 'ToolNimbly browser tools',
    accent: '#38bdf8',
  };

  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '72px 80px',
        color: '#f8fafc',
        background:
          'radial-gradient(circle at 88% 10%, rgba(56,189,248,0.20), transparent 32%), linear-gradient(135deg, #07111f 0%, #0f172a 55%, #111827 100%)',
        fontFamily: 'Arial, Helvetica, sans-serif',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
        <div
          style={{
            width: 46,
            height: 46,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 12,
            color: '#07111f',
            backgroundColor: image.accent,
            fontSize: 26,
            fontWeight: 800,
          }}
        >
          T
        </div>
        <div style={{ display: 'flex', fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em' }}>
          ToolNimbly
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', maxWidth: 980 }}>
        <div
          style={{
            display: 'flex',
            alignSelf: 'flex-start',
            marginBottom: 26,
            padding: '11px 18px',
            border: `2px solid ${image.accent}`,
            borderRadius: 999,
            color: image.accent,
            fontSize: 24,
            fontWeight: 700,
          }}
        >
          {image.differentiator}
        </div>
        <div
          style={{
            display: 'flex',
            fontSize: image.title.length > 34 ? 60 : 68,
            lineHeight: 1.06,
            fontWeight: 800,
            letterSpacing: '-0.045em',
          }}
        >
          {image.title}
        </div>
      </div>

      <div style={{ display: 'flex', color: '#94a3b8', fontSize: 22 }}>
        Useful tools that work in your browser
      </div>
    </div>,
    TOOL_SOCIAL_IMAGE_SIZE,
  );
}
