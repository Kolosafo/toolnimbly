import type { ToolContent } from '../types';

export const imageToPdfContent: ToolContent = {
  slug: 'image-to-pdf',
  valueProposition:
    'Turn a folder of photos into one properly paginated PDF, in the order you choose, without uploading anything.',
  intro:
    'Combine JPG, PNG and WebP images into a single PDF with one image per page. Reorder pages by dragging or with the keyboard, choose A4, US Letter or a page that matches each image exactly, and set margins. Aspect ratios are preserved by default, so nothing is stretched. The PDF is assembled in your browser, which matters when the images are receipts, medical documents or anything else you would rather not upload.',
  steps: [
    {
      title: 'Add your images',
      body: 'JPG, PNG and WebP are accepted. Each becomes one page. Add them in any order — you can rearrange afterwards.',
    },
    {
      title: 'Put them in the right order',
      body: 'Drag thumbnails to reorder, or move the focused item with the keyboard. The order shown is the order in the PDF.',
    },
    {
      title: 'Choose page size and margins',
      body: 'A4 and US Letter give consistent pages for printing. "Fit image" makes each page match its image, which suits screenshots and scans.',
    },
    {
      title: 'Create and download the PDF',
      body: 'The finished file downloads straight from your browser. Page count and size are shown before you commit.',
    },
  ],
  example: {
    title: 'Turning eight receipt photos into one expense claim',
    body: 'Eight phone photos, mixed portrait and landscape, submitted as a single A4 PDF.',
    rows: [
      { label: 'Page size', value: 'A4 — consistent pages for printing and filing' },
      { label: 'Orientation', value: 'Auto — each page matches its image' },
      { label: 'Image fit', value: 'Contain — the whole receipt visible, nothing cropped' },
      { label: 'Margins', value: 'Small, so the text stays clear of the page edge' },
      { label: 'Result', value: 'One eight-page PDF' },
    ],
    conclusion:
      'Contain is the right choice here. Cover would fill each page edge to edge but crop the top and bottom of the receipts, which for an expense claim is exactly the wrong outcome.',
  },
  method: {
    title: 'How the PDF is assembled',
    body: 'Each image is decoded, its orientation corrected, and embedded into a new PDF page at the physical size you selected. The images are placed at their natural aspect ratio and scaled to fit within the margins.',
    notes: [
      'A4 is 210 × 297 mm; US Letter is 8.5 × 11 inches. Both are written into the PDF as real physical page dimensions, so printing comes out correctly.',
      'Contain scales the image until it fits entirely inside the margins, which can leave space at the sides. Cover fills the area and crops the overflow — you are warned before that happens.',
      'Auto orientation gives each page the orientation of its own image, so a portrait photo produces a portrait page even among landscape ones.',
      'JPEG images are embedded directly without re-encoding where possible, which keeps the file smaller and avoids a second round of quality loss.',
    ],
  },
  limitations: [
    'One image per page. Multi-image layouts and contact sheets are not supported in this version.',
    'The PDF contains pictures, not text. There is no OCR, so text in the images will not be searchable or selectable.',
    'Large images produce large PDFs. Compress or resize first if file size matters for the destination.',
    'HEIC files are only supported where your browser can decode them natively, which most cannot. Export to JPEG first.',
    'Maximum 20 MB and 40 megapixels per image, 20 images per document.',
  ],
  privacyNote:
    'Images and the PDF they produce never leave your device. The assembly happens in this browser tab using a local PDF library, with no server involved.',
  faqs: [
    {
      question: 'How do I combine several photos into one PDF?',
      answer:
        'Add them all, drag them into the order you want, pick a page size and create the PDF. Each image becomes one page, and the whole document downloads as a single file.',
    },
    {
      question: 'Should I choose A4, Letter or fit-to-image?',
      answer:
        'A4 or Letter for anything that will be printed or filed, since consistent pages behave predictably. Fit-to-image when the document is only ever viewed on screen and you want no borders — screenshots are the usual case.',
    },
    {
      question: 'Will the images be compressed again?',
      answer:
        'JPEGs are embedded as they are wherever possible, so there is no second round of quality loss. PNG and WebP images are converted for embedding, which is lossless for PNG.',
    },
    {
      question: 'Can I make the text in my scanned pages searchable?',
      answer:
        'Not with this tool. That requires optical character recognition, which is outside the scope of this version. The PDF will contain images of the text, readable by a person but not selectable or searchable.',
    },
    {
      question: 'Is there a limit on how many images I can combine?',
      answer:
        'Twenty per document, which keeps memory use reasonable on phones and older laptops. For a larger set, create several PDFs and join them with the PDF merger.',
    },
  ],
};
