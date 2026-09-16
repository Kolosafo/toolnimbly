import type { ToolContent } from '../types';

export const pngToJpgContent: ToolContent = {
  slug: 'png-to-jpg',
  valueProposition:
    'Convert PNG to JPG with control over quality and over the colour that replaces transparency.',
  intro:
    'Converting PNG to JPG is usually about file size, and the saving can be large for photographic content. Two things change in the process: the conversion is lossy, and transparency disappears because JPEG cannot store it. This tool makes the second one your decision rather than a surprise — you choose the background colour that transparent pixels are flattened onto, defaulting to white. Batch conversion and ZIP download are supported, and nothing is uploaded.',
  steps: [
    {
      title: 'Add your PNG files',
      body: 'Up to 20 files, 20 MB each. Files containing transparency are detected and flagged.',
    },
    {
      title: 'Set the JPEG quality',
      body: 'Between 75 and 85 suits most photographic content. Higher keeps more detail at a larger size.',
    },
    {
      title: 'Choose the background colour',
      body: 'Transparent areas are composited onto this colour before encoding. White is the default; pick the colour your image will actually sit on.',
    },
    {
      title: 'Convert and download',
      body: 'Before-and-after sizes are shown for each file. Download singly or as a ZIP.',
    },
  ],
  example: {
    title: 'A logo with a transparent background',
    body: 'A 1,200 × 1,200 PNG logo with a transparent surround, about 240 KB, converted at quality 85.',
    rows: [
      { label: 'Background white', value: 'Clean on a white page, with a visible white box on any other colour' },
      { label: 'Background matched to the page', value: 'Blends correctly on that one background only' },
      { label: 'Resulting size', value: 'about 95 KB' },
      { label: 'Better option for a logo', value: 'Keep the PNG, or use WebP, so transparency survives' },
    ],
    conclusion:
      'For a logo that has to sit on different backgrounds, converting to JPEG is the wrong move regardless of the colour chosen. For a photograph with no transparency, it is usually the right one.',
  },
  method: {
    title: 'How the conversion works',
    body: 'The PNG is decoded, any transparent or partially transparent pixels are composited onto your chosen background colour, and the flattened result is encoded as JPEG at the quality you set.',
    notes: [
      'Partially transparent pixels — the soft edges of antialiased text or a drop shadow — are blended proportionally with the background colour rather than being made fully opaque.',
      'JPEG encoding discards detail permanently. The original PNG on your device is untouched, but the JPEG cannot be converted back losslessly.',
      'JPEG handles photographic gradients well and sharp-edged graphics poorly, which is why text-heavy screenshots often look worse after conversion even at high quality.',
    ],
  },
  limitations: [
    'Transparency is lost. This is a property of the JPEG format, not of this tool, and it cannot be worked around.',
    'The conversion is lossy and irreversible. Keep your PNG if you might need to edit the image again.',
    'Screenshots, line art and images with fine text can show visible artefacts around sharp edges, even at high quality. PNG or WebP are better for those.',
    'Maximum 20 MB and 40 megapixels per image, 20 files per batch.',
  ],
  privacyNote:
    'Files are converted in your browser and never uploaded. No copy is retained once you leave the page.',
  faqs: [
    {
      question: 'What happens to the transparent parts of my PNG?',
      answer:
        'They are filled with the background colour you choose, defaulting to white. JPEG has no alpha channel, so transparency has to be resolved to something concrete before encoding. Partially transparent pixels are blended proportionally.',
    },
    {
      question: 'How much smaller will the JPG be?',
      answer:
        'For photographs, often 70 to 90% smaller. For flat graphics and screenshots, sometimes barely smaller and occasionally larger, since JPEG is poorly suited to sharp edges and large blocks of identical colour.',
    },
    {
      question: 'Should I convert my logo to JPG?',
      answer:
        'Generally no. A logo usually needs a transparent background so it can sit on any colour, and JPEG cannot provide one. Keep the PNG, or use WebP if you want transparency with a smaller file.',
    },
    {
      question: 'Can I convert back to PNG afterwards?',
      answer:
        'You can produce a PNG from the JPEG, but it will not restore what was lost — neither the transparency nor the detail JPEG discarded. Always keep the original PNG if there is any chance you will need it.',
    },
    {
      question: 'What quality should I pick?',
      answer:
        'For photographic content, 80 to 85 is a good balance. For anything with text or sharp edges, go higher — 90 or above — or reconsider whether JPEG is the right format at all.',
    },
  ],
};
