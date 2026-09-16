import type { ToolContent } from '../types';

export const imageCropperContent: ToolContent = {
  slug: 'image-cropper',
  valueProposition:
    'Crop by dragging, by ratio, or by typing exact coordinates — and the export is always at full source resolution.',
  intro:
    'Crop a JPG, PNG or WebP image freehand or to a fixed aspect ratio, with zoom, ninety-degree rotation and horizontal or vertical flip. You can drag the crop area with a mouse or finger, move it with the arrow keys, or type exact pixel coordinates when precision matters. The crop is calculated in the coordinates of the source image rather than the preview, so a small on-screen preview never costs you resolution in the exported file.',
  steps: [
    {
      title: 'Add an image',
      body: 'One JPG, PNG or WebP file. Its full dimensions are shown so you know what you are working with.',
    },
    {
      title: 'Set the crop area',
      body: 'Drag the handles, pick an aspect preset — free, 1:1, 4:3, 3:2 or 16:9 — or type exact x, y, width and height values. Arrow keys nudge; holding shift moves further.',
    },
    {
      title: 'Rotate, flip or zoom if needed',
      body: 'Rotation works in ninety-degree steps. Zoom affects only the preview, never the resolution of the export.',
    },
    {
      title: 'Choose a format and download',
      body: 'Pick the output format and, for JPEG or WebP, the quality. The exported dimensions are shown before you download.',
    },
  ],
  example: {
    title: 'A square profile picture from a landscape photo',
    body: 'A 4,000 × 3,000 photo needs a square crop centred on a face in the upper third.',
    rows: [
      { label: 'Aspect preset', value: '1:1 — the crop box locks to a square' },
      { label: 'Largest possible square', value: '3,000 × 3,000, limited by the shorter side' },
      { label: 'Positioned over the subject', value: 'x 1,100, y 150, 2,400 × 2,400' },
      { label: 'Exported size', value: '2,400 × 2,400 — full resolution, not preview resolution' },
    ],
    conclusion:
      'The export is 2,400 pixels square even though the preview on screen was only a few hundred pixels wide, because the crop is computed against the source image.',
  },
  method: {
    title: 'How the crop is calculated',
    body: 'The preview is a scaled view of the source. Every handle position is converted back into source-image coordinates before the crop is applied, so the exported pixels come from the original file at its native resolution.',
    formulas: [
      'scale = preview width ÷ source width',
      'source x = preview x ÷ scale',
      'source width = preview width ÷ scale',
      'export = source pixels within (x, y, width, height)',
    ],
    notes: [
      'The crop area is constrained to the image bounds, so it can never extend past an edge and produce empty pixels.',
      'Rotation and flip are applied to the source before the crop rectangle is read, which keeps the numeric fields meaningful after a transform.',
      'EXIF orientation is applied on load, so the image you crop is the image as it appears, not as it happens to be stored.',
    ],
  },
  limitations: [
    'Cropping removes pixels permanently in the exported file. The original on your device is never modified, but the download cannot be un-cropped.',
    'Rotation is limited to ninety-degree steps. Arbitrary-angle straightening is not supported in this version.',
    'One image at a time. There is no batch cropping, because a useful crop depends on what is in each individual picture.',
    'Cropping then saving as JPEG re-encodes the image, which costs a little quality. Choose PNG if you need the exact pixels.',
    'Maximum 20 MB and 40 megapixels.',
  ],
  privacyNote:
    'Your image is loaded into this page and cropped by your own browser. It is never uploaded, and metadata is stripped from the exported file.',
  faqs: [
    {
      question: 'Does cropping reduce image quality?',
      answer:
        'The cropped area keeps its original pixels exactly, so there is no loss from the crop itself. Quality is only affected by the output format — saving as JPEG or WebP re-encodes and costs a little; saving as PNG does not.',
    },
    {
      question: 'How do I crop to an exact size in pixels?',
      answer:
        'Use the numeric fields rather than dragging. Type the x and y position and the width and height you need, and the crop box moves to match. This is the reliable way to hit a specific requirement.',
    },
    {
      question: 'Can I crop with the keyboard?',
      answer:
        'Yes. Tab to the crop area, then use the arrow keys to move it and shift with the arrow keys to resize. Every control including the aspect presets is reachable and operable without a mouse.',
    },
    {
      question: 'Why is my exported image smaller than I expected?',
      answer:
        'The export matches the crop area in source pixels. If you cropped a small region of a large photo, the result is genuinely small. The dimensions are displayed before download so you can adjust before committing.',
    },
    {
      question: 'What aspect ratio should a profile picture be?',
      answer:
        'Square — 1:1 — for almost every platform. Use the 1:1 preset and aim for at least 400 pixels on a side, more if the platform displays it large anywhere.',
    },
  ],
};
