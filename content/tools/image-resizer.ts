import type { ToolContent } from '../types';

export const imageResizerContent: ToolContent = {
  slug: 'image-resizer',
  valueProposition:
    'Resize by pixels or percentage with the aspect ratio locked, and see the exact output dimensions before you download.',
  intro:
    'Change the pixel dimensions of a JPG, PNG or WebP image in your browser. Enter a width or a height and the other follows automatically while the aspect ratio is locked, or unlock it and choose how the image should fit the box you specify. The resulting dimensions and file size are shown before you commit to a download, so there are no surprises. Nothing is uploaded at any point.',
  steps: [
    {
      title: 'Add an image',
      body: 'JPG, PNG or WebP, up to 20 MB and 40 megapixels. The current dimensions are shown as soon as it loads.',
    },
    {
      title: 'Enter the size you want',
      body: 'Work in pixels or as a percentage of the original. With the aspect lock on, filling in one dimension calculates the other.',
    },
    {
      title: 'Choose a fit mode if the ratio differs',
      body: 'Contain fits the whole image inside your box. Cover fills the box and crops the overflow. Stretch distorts the image to match exactly, and is flagged as such.',
    },
    {
      title: 'Pick an output format and download',
      body: 'Keep the original format or convert. For JPEG output you also choose the background colour used where the original was transparent.',
    },
  ],
  example: {
    title: 'Preparing a hero image for a web page',
    body: 'A 5,472 × 3,648 camera photo needs to become a 1,600 × 900 banner.',
    rows: [
      { label: 'Original aspect ratio', value: '3:2' },
      { label: 'Target aspect ratio', value: '16:9 — different, so fit mode matters' },
      { label: 'Contain', value: '1,600 × 1,067 scaled down, letterboxed to fit' },
      { label: 'Cover', value: 'Exactly 1,600 × 900, with the top and bottom cropped' },
      { label: 'File size', value: 'About 20 MB down to roughly 280 KB' },
    ],
    conclusion:
      'Cover is almost always what you want for a banner, because letterboxing wastes the space. Use the cropper when you need control over which part gets cut.',
  },
  method: {
    title: 'How resizing works',
    body: 'The image is decoded, drawn onto a canvas at the target dimensions with the browser high-quality smoothing enabled, and re-encoded. The pixel grid is rebuilt from scratch, which is why the result is a new image rather than an edit of the original.',
    notes: [
      'Scaling down discards pixels and looks clean. Scaling up invents them and always looks softer — no resizer can add detail that was never captured.',
      'The aspect ratio lock keeps the original proportions exactly, calculating the second dimension from the first.',
      'EXIF orientation is applied before resizing, so a portrait photo is measured by how it looks rather than how it is stored.',
      'Output dimensions are capped at 40 megapixels to prevent a very large canvas exhausting device memory.',
    ],
  },
  limitations: [
    'Enlarging an image cannot recover detail. The result will be softer than the original, and no amount of smoothing changes that.',
    'Stretch mode distorts proportions. It is available because it is occasionally needed, and it is visibly warned about because it usually is not.',
    'Resampling quality is set by the browser rather than by this tool, so results can differ slightly between browsers.',
    'Presets show their exact pixel dimensions and are conveniences only. Platform requirements change, so confirm against the current official guidance.',
    'Maximum 20 MB and 40 megapixels input, 40 megapixels output.',
  ],
  privacyNote:
    'Your image is decoded, resized and encoded in this browser tab. It is never uploaded, and metadata including GPS coordinates is stripped from the output by default.',
  faqs: [
    {
      question: 'How do I resize an image without stretching it?',
      answer:
        'Keep the aspect ratio lock on and enter only one dimension — the other is calculated for you. If you need to hit an exact box whose ratio differs from the original, use cover, which scales and crops rather than distorting.',
    },
    {
      question: 'What is the difference between contain and cover?',
      answer:
        'Contain fits the entire image inside your dimensions, which can leave empty space at the sides. Cover fills the dimensions completely and crops whatever falls outside. Contain shows everything; cover fills everything.',
    },
    {
      question: 'Can I make a small image bigger without losing quality?',
      answer:
        'Not meaningfully. Upscaling interpolates new pixels from existing ones, so the result is larger but softer. Going beyond about 200% rarely looks acceptable. Start from the highest-resolution original you have.',
    },
    {
      question: 'What size should a web image be?',
      answer:
        'For a full-width hero, 1,600 to 2,000 pixels wide is usually plenty. For content images, match the display width — often 800 to 1,200 pixels. Anything beyond the display size is bandwidth spent on detail nobody sees.',
    },
    {
      question: 'Does resizing reduce the file size?',
      answer:
        'Substantially, because file size scales roughly with pixel count. Halving both dimensions leaves a quarter of the pixels, and the file usually shrinks by a similar proportion — often more than a quality reduction would achieve.',
    },
  ],
};
