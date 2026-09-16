import type { ToolContent } from '../types';

export const imageCompressorContent: ToolContent = {
  slug: 'image-compressor',
  valueProposition:
    'Shrink JPG, PNG and WebP files on your own device, with the before-and-after numbers shown for every file.',
  intro:
    'Drop in one image or twenty and this tool re-encodes them in your browser at the quality you choose. Your files are decoded, transformed and written back out by your own device — nothing is uploaded, so there is no queue, no upload wait and no copy of your photos sitting on a server. Every file reports its original and final size, and when an output comes out larger than the input, the tool says so and offers you the original instead.',
  steps: [
    {
      title: 'Add your images',
      body: 'Drag them in or use the file picker. JPG, PNG and WebP are accepted, up to 20 MB each and 20 files at a time.',
    },
    {
      title: 'Choose an output format and quality',
      body: 'Keep the original format or convert everything to JPEG, PNG or WebP. The quality slider applies to the lossy formats; PNG is lossless and ignores it.',
    },
    {
      title: 'Cap the dimensions if you want to',
      body: 'Setting a maximum width or height scales large photos down before encoding, which usually saves far more than quality alone. Images are never scaled up.',
    },
    {
      title: 'Compress, then download',
      body: 'Each file shows its saving as a percentage. Download them individually, or grab everything at once as a ZIP.',
    },
  ],
  example: {
    title: 'Getting a phone photo under an upload limit',
    body: 'A 4,032 × 3,024 JPEG straight from a phone camera, around 4.2 MB, needs to fit a 1 MB form limit.',
    rows: [
      { label: 'Quality 80, no resize', value: 'about 1.6 MB — still over the limit' },
      { label: 'Quality 80, max 2000 px', value: 'about 420 KB — comfortably under' },
      { label: 'Visible difference', value: 'None at normal viewing size' },
    ],
    conclusion:
      'Capping dimensions did most of the work. A 12-megapixel photo has far more detail than any web page or form will ever display, so reducing the pixel count is usually the first thing to try.',
  },
  method: {
    title: 'What happens to your image',
    body: 'The file is decoded into pixels in your browser, drawn onto a canvas at the target size, then encoded again in the output format. Because it is a re-encode rather than an edit of the original data, the process is lossy for JPEG and WebP.',
    notes: [
      'EXIF orientation is applied before anything else, so a photo taken sideways stays the right way up instead of rotating unexpectedly.',
      'Metadata, including GPS coordinates, camera model and timestamps, is stripped by default. This is a privacy measure and it also saves a little space.',
      'Transparency is kept for PNG and WebP output. When you convert to JPEG, which cannot store transparency, you choose the background colour that transparent pixels are flattened onto.',
      'Re-compressing an already-compressed JPEG loses a little more quality each time, so work from the original file where you can.',
    ],
  },
  limitations: [
    'PNG is a lossless format and the browser PNG encoder is not especially aggressive, so PNG-to-PNG savings are often small or nonexistent. The dedicated PNG compressor offers a lossy mode for that case.',
    'Compressing an already well-compressed file can produce a larger output. When that happens the tool tells you and recommends keeping the original.',
    'Encoder implementations differ between browsers, so the same settings can produce slightly different file sizes in Chrome, Firefox and Safari.',
    'Maximum 20 MB and 40 megapixels per image, 20 files per batch. These caps exist to stop a large file exhausting your device memory.',
    'HEIC files from iPhones are only supported if your browser can decode them natively, which most cannot. Export to JPEG first.',
  ],
  privacyNote:
    'Your images never leave your device. There is no upload endpoint in this product — the decoding, resizing and encoding all happen inside this browser tab, and everything is released from memory when you reset or close it.',
  faqs: [
    {
      question: 'Are my photos uploaded to a server?',
      answer:
        'No. All processing happens in your browser using standard web APIs. You can confirm it by opening your browser network panel while compressing: no request carrying your image is made, because there is no endpoint to make it to.',
    },
    {
      question: 'What quality setting should I use?',
      answer:
        'For photographs, 75 to 85 is the usual sweet spot — a large size reduction with no difference most people can see. Below about 60, JPEG artefacts start showing around sharp edges and in flat areas like skies.',
    },
    {
      question: 'Why did my file get bigger?',
      answer:
        'Usually because it was already compressed efficiently, or because you converted to a format that suits it badly — a screenshot with flat colour compresses well as PNG and poorly as JPEG. The tool flags this and lets you keep the original.',
    },
    {
      question: 'Which format should I choose?',
      answer:
        'WebP for the web, since it is typically 25 to 35% smaller than JPEG at similar quality and supports transparency. JPEG for maximum compatibility with older software. PNG only when you need exact pixels or transparency without WebP support.',
    },
    {
      question: 'Does compressing remove the location data from my photos?',
      answer:
        'Yes. Metadata is stripped by default, which removes GPS coordinates, the camera model and the capture timestamp. That is worth doing before sharing any photo taken on a phone.',
    },
  ],
};
