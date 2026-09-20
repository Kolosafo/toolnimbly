import type { ToolContent } from '../types';

export const jpgToPdfContent: ToolContent = {
  slug: 'jpg-to-pdf',
  valueProposition:
    'Photos into a single PDF, in your order, with pages sized for printing — all without an upload.',
  intro:
    'This tool takes JPG and JPEG photos and assembles them into one PDF, one image per page, in whatever order you arrange them. It is the same tested assembly engine as the general image-to-PDF converter, narrowed to the case where every input is a photograph. Orientation is corrected automatically, aspect ratios are preserved, and the whole document is built in your browser with nothing uploaded.',
  steps: [
    {
      title: 'Add your JPG photos',
      body: 'JPEG only, up to 20 files. Use the general image-to-PDF tool if you also have PNG or WebP files.',
    },
    {
      title: 'Arrange the order',
      body: 'Drag the thumbnails, or move the focused item with the keyboard. The displayed order is the page order.',
    },
    {
      title: 'Set page size, orientation and margins',
      body: 'A4 or US Letter for printing, or fit-to-image for screen use. Auto orientation matches each page to its own photo.',
    },
    {
      title: 'Create and download',
      body: 'The PDF is built and downloaded locally. No file leaves your device at any point.',
    },
  ],
  example: {
    title: 'Submitting photographed documents as one file',
    body: 'Six phone photos of a signed agreement that must be uploaded to a portal as a single PDF.',
    rows: [
      { label: 'Page size', value: 'A4' },
      { label: 'Orientation', value: 'Auto — portrait photos give portrait pages' },
      { label: 'Fit', value: 'Contain, so no signature or page edge is cropped' },
      { label: 'Result', value: 'One six-page PDF in the correct order' },
    ],
    conclusion:
      'Photographing the pages in order and checking the thumbnails before creating the file takes less time than fixing a document that arrived out of sequence.',
  },
  method: {
    title: 'How the PDF is built',
    body: 'Each JPEG is embedded into a new PDF page at the physical size you chose. Where possible the original JPEG data is embedded directly rather than being decoded and re-encoded, which avoids a second round of quality loss.',
    notes: [
      'EXIF orientation is read and applied, so a photo taken sideways is placed upright on the page.',
      'A4 pages are 210 × 297 mm and US Letter pages are 8.5 × 11 inches, written as real physical dimensions so printing is accurate.',
      'Contain fits the whole photo within the margins. Cover fills the page and crops the overflow, with a warning before it does.',
    ],
  },
  limitations: [
    'One photo per page. There is no multi-photo page layout in this version.',
    'The PDF holds images, not text. Photographed documents will not be searchable or selectable without OCR, which is out of scope here.',
    'High-resolution photos make large PDFs. Compress them first if the destination has a size limit.',
    'JPEG only. For mixed formats use the image-to-PDF converter.',
    'Maximum 20 MB per photo and 20 photos per document.',
  ],
  privacyNote:
    'Photographed documents often contain signatures, addresses and identity details. Nothing here is uploaded — the PDF is assembled entirely inside this browser tab.',
  faqs: [
    {
      question: 'How do I combine multiple JPGs into one PDF?',
      answer:
        'Add all the photos, drag them into the right order, choose a page size and create the PDF. Every photo becomes one page and the result downloads as a single file.',
    },
    {
      question: 'Why use this instead of the image-to-PDF tool?',
      answer:
        'They share the same engine. This route exists because starting from a set of JPGs is a distinct and very common task, and the interface here can assume every input is a photograph. If your files include PNG or WebP, use the general tool.',
    },
    {
      question: 'Will my photos lose quality?',
      answer:
        'No. Where possible the original JPEG data is embedded directly into the PDF without re-encoding, so the photo in the document is the photo you started with.',
    },
    {
      question: 'Are photos rotated correctly?',
      answer:
        'Yes. The orientation recorded by the camera is read and applied before the photo is placed, so pictures taken sideways appear the right way up rather than rotated in the PDF.',
    },
    {
      question: 'Can I reduce the size of the finished PDF?',
      answer:
        'Compress the photos first with the JPG compressor, then build the PDF — that gives much better results than compressing the finished document. Capping dimensions to around 2,000 pixels usually shrinks it dramatically.',
    },
    {
      question: 'Can I change the page order before converting?',
      answer:
        'Yes. Each image in the list has controls to move it up or down, and the PDF is built in the order shown. Reordering after adding files is often quicker than adding them one at a time in the right sequence, particularly when your phone named them out of order.',
    },
  ],
};
