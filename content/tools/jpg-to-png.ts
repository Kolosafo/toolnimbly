import type { ToolContent } from '../types';

export const jpgToPngContent: ToolContent = {
  slug: 'jpg-to-png',
  valueProposition:
    'Convert JPG to PNG in your browser — with an honest note about what the conversion can and cannot do.',
  intro:
    'This converter decodes your JPG files and writes them out as PNG, one at a time or in a batch. It is worth being clear about what that achieves: PNG is lossless, so the output preserves exactly what the JPEG contained, but it cannot recover detail that JPEG compression already discarded, and it cannot add transparency that was never there. The file will usually get larger. Everything runs locally, so nothing is uploaded.',
  steps: [
    {
      title: 'Add your JPG files',
      body: 'Drag and drop or pick them. JPEG only, up to 20 MB each and 20 files at a time.',
    },
    {
      title: 'Convert',
      body: 'Each file is decoded with its orientation corrected and re-encoded as PNG. There are no quality settings, because PNG is lossless.',
    },
    {
      title: 'Compare the sizes',
      body: 'Every file shows its original and resulting size. An increase is normal here and is reported plainly rather than hidden.',
    },
    {
      title: 'Download',
      body: 'Individually, or all of them together as a ZIP.',
    },
  ],
  example: {
    title: 'What happens to file size',
    body: 'A 2,400 × 1,600 photograph of about 640 KB as a JPEG.',
    rows: [
      { label: 'Original JPG', value: 'about 640 KB' },
      { label: 'Converted PNG', value: 'about 5.8 MB' },
      { label: 'Change', value: 'Roughly nine times larger' },
      { label: 'Visible quality', value: 'Identical — PNG stores exactly what the JPEG decoded to' },
    ],
    conclusion:
      'The increase is expected. PNG stores every pixel without discarding anything, and photographic detail does not compress well losslessly. Convert when you need PNG specifically, not to improve the image.',
  },
  method: {
    title: 'What the conversion does',
    body: 'The JPEG is decoded into pixels, and those exact pixels are written into a PNG. No quality is lost in this step, but no quality is regained either — the JPEG artefacts that were already baked into the image are preserved faithfully.',
    notes: [
      'EXIF orientation is applied during decoding, so a photo shot in portrait stays upright in the PNG.',
      'The resulting PNG is fully opaque. JPEG has no alpha channel, so there is no transparency to carry across.',
      'Photo metadata, including GPS coordinates, is not copied into the output.',
    ],
  },
  limitations: [
    'PNG files from photographs are typically several times larger than the JPEG they came from. This is inherent to lossless compression of photographic data.',
    'Converting to PNG does not improve quality or remove existing JPEG artefacts. Those artefacts are now part of the image.',
    'No transparency is created. If you need a transparent background, that requires an editor that can select and remove the background.',
    'Maximum 20 MB and 40 megapixels per image, 20 files per batch.',
  ],
  privacyNote:
    'Conversion happens entirely in your browser. Your photos are never uploaded, and their metadata is not carried into the output.',
  faqs: [
    {
      question: 'Will converting JPG to PNG improve the image quality?',
      answer:
        'No. PNG preserves exactly what the JPEG decoded to, including any compression artefacts already present. Lossless storage from this point forward is a real benefit if you plan to edit and re-save repeatedly, but the starting quality is unchanged.',
    },
    {
      question: 'Why is the PNG so much bigger?',
      answer:
        'Because JPEG achieves its size by throwing away detail, while PNG keeps everything. For photographic content, which is full of fine variation, lossless compression simply cannot do much. A several-fold increase is normal.',
    },
    {
      question: 'Does this give my image a transparent background?',
      answer:
        'No. PNG supports transparency but JPEG does not, so there is none in the source to carry over. The converted file is fully opaque; removing a background is a separate editing operation.',
    },
    {
      question: 'When is converting JPG to PNG actually worth it?',
      answer:
        'When you need a format that will not degrade through repeated edits and saves, when a tool or platform requires PNG specifically, or when you are about to add transparency in an editor. For general use and for the web, keeping the JPEG is usually better.',
    },
    {
      question: 'Can I convert several files at once?',
      answer:
        'Yes, up to 20 per batch, with a ZIP download for the whole set. Each file is converted independently and reports its own before-and-after size.',
    },
    {
      question: 'Should I use WebP or AVIF instead?',
      answer:
        'For the web, usually yes. WebP and AVIF both support transparency and lossless modes, and both produce far smaller files than PNG at the same quality. PNG remains the safer choice when a specific tool, printer or platform requires it, or when you need a format every piece of software made in the last thirty years can open.',
    },
  ],
};
