import type { ToolContent } from '../types';

export const pdfToJpgContent: ToolContent = {
  slug: 'pdf-to-jpg',
  valueProposition:
    'Render any pages of a PDF to JPG at the resolution you choose, entirely inside your browser.',
  intro:
    'Select a PDF, choose which pages you want and at what resolution, and this tool renders them to JPEG images. Rendering uses PDF.js in a background worker, so the page stays responsive even on a long document, and every page is drawn by your own browser rather than a server. Thumbnails let you check the result before downloading, and multiple pages come back as a ZIP with zero-padded filenames that sort correctly.',
  steps: [
    {
      title: 'Add a PDF',
      body: 'One file, up to 100 MB and 500 pages. Encrypted PDFs are detected and refused with an explanation.',
    },
    {
      title: 'Choose pages',
      body: 'All pages, individual pages, or ranges written as 1-3, 5, 8-10. The preview shows exactly which pages will be produced.',
    },
    {
      title: 'Set the resolution and quality',
      body: 'Higher scale means sharper images and larger files. Screen use is fine at the lower presets; print or archival work needs the higher ones.',
    },
    {
      title: 'Render and download',
      body: 'Thumbnails appear as pages complete. Download a single page, or the whole selection as a ZIP. Long jobs can be cancelled.',
    },
  ],
  example: {
    title: 'Pulling three diagrams out of a report',
    body: 'A 48-page PDF where pages 12, 19 and 33 hold the figures you need for a slide deck.',
    rows: [
      { label: 'Page selection', value: '12, 19, 33' },
      { label: 'Scale', value: '2× — roughly 150 DPI, enough for a projected slide' },
      { label: 'Output filenames', value: 'report-page-012.jpg, report-page-019.jpg, report-page-033.jpg' },
      { label: 'Delivery', value: 'A single ZIP containing all three' },
    ],
    conclusion:
      'The zero-padded page numbers are deliberate: without them, page 10 sorts before page 2 in most file managers.',
  },
  method: {
    title: 'How pages are rendered',
    body: 'PDF.js parses the document and draws each selected page onto a canvas at the scale you chose, which is then encoded as JPEG. The work happens in a dedicated worker thread so the interface stays responsive.',
    formulas: [
      'output width  = page width in points × scale',
      'output height = page height in points × scale',
      'approximate DPI = 72 × scale',
    ],
    notes: [
      'A PDF page is measured in points, where 72 points make an inch. A scale of 2 therefore gives roughly 150 DPI and a scale of 4 around 288 DPI.',
      'Total output pixels are capped to protect device memory. If a selection would exceed the cap, the tool says so rather than crashing the tab.',
      'Rendering is a faithful reproduction of how PDF.js draws the page. Very unusual fonts, transparency groups or colour profiles can differ slightly from a desktop PDF viewer.',
    ],
  },
  limitations: [
    'Rendering turns text into pixels. The output is a picture of the page — nothing in it will be selectable, searchable or editable as text.',
    'Password-protected PDFs are refused. This tool does not remove encryption.',
    'Complex pages with heavy transparency, unusual blend modes or rare fonts may render slightly differently from your desktop PDF viewer.',
    'High scale values on many pages consume a lot of memory. The pixel cap will stop a job that would exhaust the tab.',
    'Maximum 100 MB and 500 pages per document.',
  ],
  privacyNote:
    'Your PDF is parsed and rendered entirely in this browser tab. No file bytes are transmitted, which matters given how often PDFs hold statements, contracts and medical letters.',
  faqs: [
    {
      question: 'What resolution should I choose?',
      answer:
        'For viewing on screen or in a slide, 2× (about 150 DPI) is plenty. For printing, 4× (about 288 DPI) is closer to what a printer can use. Higher settings make much larger files without adding useful detail on screen.',
    },
    {
      question: 'How do I convert only some pages?',
      answer:
        'Type them into the page selection field using commas and ranges — 1-3, 5, 8-10 gives pages 1, 2, 3, 5, 8, 9 and 10. The preview confirms the selection before anything is rendered.',
    },
    {
      question: 'Will the text still be selectable in the images?',
      answer:
        'No. Rendering converts the page to pixels, so text becomes part of the picture. If you need selectable text, keep the PDF — use the splitter to extract pages instead of converting them.',
    },
    {
      question: 'Why does my PDF fail to open?',
      answer:
        'The two common reasons are password protection, which is detected and refused, and file corruption. A corrupted file fails cleanly with a message rather than freezing the page.',
    },
    {
      question: 'Can I get PNG instead of JPG?',
      answer:
        'This route produces JPEG, which suits scanned and photographic pages. For a page that is mostly flat colour and text, convert the JPEG afterwards with the JPG to PNG tool, or use a higher quality setting here.',
    },
  ],
};
