import type { ToolContent } from '../types';

export const jpgCompressorContent: ToolContent = {
  slug: 'jpg-compressor',
  valueProposition:
    'A JPG-only compressor with the controls that matter for photographs, and a warning when quality drops too far.',
  intro:
    'This tool accepts JPG and JPEG files only and re-encodes them at the quality you choose, in your browser. Photographs are what JPEG was designed for, and a quality setting in the high seventies usually cuts file size dramatically with no visible change. You can also cap the dimensions, which often saves more than quality does. Batch several photos at once and download them together as a ZIP.',
  steps: [
    {
      title: 'Add your JPG files',
      body: 'Drag and drop or use the picker. Only JPEG files are accepted here; use the general image compressor for mixed formats.',
    },
    {
      title: 'Set the quality',
      body: 'The slider runs from low to high. The tool warns you below the point where compression artefacts usually become visible.',
    },
    {
      title: 'Optionally cap the dimensions',
      body: 'A maximum width or height scales oversized photos down before encoding. Images are never enlarged.',
    },
    {
      title: 'Compress and download',
      body: 'Each file lists its original size, new size and percentage saved. Download one at a time or take them all as a ZIP.',
    },
  ],
  example: {
    title: 'What quality actually costs',
    body: 'A typical 3,000 × 2,000 photograph of about 2.8 MB, re-encoded at several settings with no resizing.',
    rows: [
      { label: 'Quality 95', value: 'about 2.1 MB — visually identical' },
      { label: 'Quality 85', value: 'about 950 KB — no difference at normal size' },
      { label: 'Quality 75', value: 'about 620 KB — the usual recommendation' },
      { label: 'Quality 50', value: 'about 330 KB — artefacts visible around edges' },
    ],
    conclusion:
      'The steep part of the curve is between 95 and 75, where the file shrinks by two thirds for almost no visible cost. Below 60 the savings shrink while the damage grows.',
  },
  method: {
    title: 'How JPEG compression works',
    body: 'JPEG discards detail your eye is least sensitive to. The image is split into blocks, converted into frequency components, and the fine detail is quantised away more aggressively at lower quality settings.',
    notes: [
      'The quality number is a setting on that quantisation, not a percentage of anything. Quality 50 does not mean half the detail.',
      'Because the discarded detail is gone for good, re-compressing the same file repeatedly degrades it each time. Always work from the original.',
      'EXIF orientation is applied before encoding so a portrait photo stays upright, and the remaining metadata — including GPS coordinates — is stripped by default.',
      'Target-size mode, where offered, searches for a quality setting that lands near a size you name. It is approximate by nature and never guarantees an exact byte count.',
    ],
  },
  limitations: [
    'JPEG cannot store transparency. That is not a limitation of this tool but of the format, and it is why PNG screenshots are better left as PNG.',
    'Each re-encode loses a little more quality. Compressing an already heavily compressed photo gives poor results.',
    'Browsers use different JPEG encoders, so the same quality setting can produce a slightly different file size in Chrome, Firefox and Safari.',
    'Photographs compress well; screenshots, line art and text do not. JPEG blurs sharp edges, so flat-colour images belong in PNG or WebP.',
    'Maximum 20 MB and 40 megapixels per image, 20 files per batch.',
  ],
  privacyNote:
    'Your photographs are decoded and re-encoded in this browser tab. Nothing is uploaded, and location data in the original file is removed from the output by default.',
  faqs: [
    {
      question: 'What is the best quality setting for JPG?',
      answer:
        'For photographs, 75 to 85. That range typically removes 60 to 80% of the file size with no difference most people can see at normal viewing distance. Go higher only when the image will be printed or edited further.',
    },
    {
      question: 'Can I compress a JPG without losing any quality?',
      answer:
        'Not by re-encoding, which is what this tool does — JPEG is lossy, so every pass discards some detail. Truly lossless JPEG optimisation exists but requires specialist tools. If you need lossless, keep the original.',
    },
    {
      question: 'Why is my JPG still large after compressing?',
      answer:
        'Almost always because of its pixel dimensions. A 12-megapixel photo has a lot of data regardless of quality setting. Cap the maximum width to around 2,000 pixels for web use and the file will drop sharply.',
    },
    {
      question: 'Does compressing remove EXIF and GPS data?',
      answer:
        'Yes, by default. Orientation is read and applied to the pixels first so the photo stays the right way up, then the metadata — including GPS coordinates, camera model and timestamp — is left out of the output.',
    },
    {
      question: 'Can I compress several photos at once?',
      answer:
        'Yes, up to 20 per batch. Each file is processed independently with its own before-and-after figures, and you can download them individually or together as a single ZIP.',
    },
  ],
};
