import type { ToolContent } from '../types';

export const pdfCompressorContent: ToolContent = {
  slug: 'pdf-compressor',
  valueProposition:
    'Two modes, two honest trade-offs — and a plain statement of how many bytes you actually saved.',
  intro:
    'PDF compression is oversold almost everywhere. What is actually possible in a browser is either rewriting the document structure, which is safe but often saves very little, or rasterising the pages into images, which saves a lot but destroys selectable text, links, form fields and accessibility structure. This tool offers both, defaults to the safe one, and compares the before and after byte counts rather than declaring success because a process finished.',
  steps: [
    {
      title: 'Add a PDF',
      body: 'One file, up to 100 MB and 500 pages. Password-protected files are detected and refused.',
    },
    {
      title: 'Choose a mode',
      body: 'Optimise structure keeps the pages exactly as they are and removes unnecessary metadata and objects. Rasterise pages converts each page into a compressed image.',
    },
    {
      title: 'Set the quality if you rasterise',
      body: 'Resolution and JPEG quality control the trade-off. The warning about what rasterising discards is displayed before you proceed, not after.',
    },
    {
      title: 'Compare and decide',
      body: 'The result shows both sizes and the actual change. If the output is larger, the tool says so and recommends keeping the original.',
    },
  ],
  example: {
    title: 'A 14 MB scanned contract in both modes',
    body: 'Twelve pages scanned at high resolution, already stored as embedded images.',
    rows: [
      { label: 'Optimise structure', value: 'about 13.7 MB — a 2% saving' },
      { label: 'Rasterise at 150 DPI', value: 'about 2.4 MB — an 83% saving' },
      { label: 'What rasterising cost', value: 'Any selectable text layer, bookmarks and links' },
      { label: 'Page count and size', value: 'Unchanged in both modes' },
    ],
    conclusion:
      'For a scan that was already images, rasterising costs little and saves a great deal. For a text document produced by a word processor, the same operation would destroy the text layer for a much smaller gain.',
  },
  method: {
    title: 'What each mode does',
    body: 'Structure optimisation rewrites the document without touching page content. Rasterisation renders each page to an image and builds a new PDF from those images.',
    notes: [
      'Structure optimisation removes document metadata and unused objects and rewrites the cross-reference table. Vectors, text and fonts are all preserved.',
      'Most of a typical PDF is embedded images and fonts. Structure optimisation cannot touch either, which is why its savings are usually in the low single digits.',
      'Rasterisation renders at your chosen resolution and re-encodes as JPEG. Everything that was not a visible pixel is gone: text, links, annotations, form fields and tagged structure.',
      'Page count and physical page dimensions are preserved in both modes, and the result is re-parsed after generation to confirm it is a valid, renderable PDF.',
    ],
  },
  limitations: [
    'Structure optimisation frequently saves almost nothing. That is an honest outcome, and it will be reported as such rather than dressed up.',
    'Rasterising destroys selectable text, links, bookmarks, annotations, form fields and accessibility tagging. This is irreversible in the output file.',
    'Rasterising a text-based PDF often makes the file larger, not smaller, because a page of crisp text compresses far better as text than as an image.',
    'Image recompression inside an otherwise intact PDF is not available in this version — that is a middle option requiring tooling the browser does not provide.',
    'Password-protected PDFs are refused. Maximum 100 MB and 500 pages.',
  ],
  privacyNote:
    'The document is parsed, rewritten and re-checked entirely in your browser. No bytes are transmitted, and the original file on your device is never modified.',
  faqs: [
    {
      question: 'Why did my PDF barely get smaller?',
      answer:
        'Because most of its size is embedded images and fonts, and structure optimisation cannot compress those. If the document is a scan, the rasterise mode will help substantially. If it is text, it was probably already efficient.',
    },
    {
      question: 'Will compressing ruin my document?',
      answer:
        'Structure optimisation will not — pages come through untouched. Rasterising will change the document fundamentally: it becomes a series of pictures, and text, links and form fields are lost. The tool warns you before you choose it.',
    },
    {
      question: 'Which mode should I use?',
      answer:
        'Start with structure optimisation, since it is safe. If the saving is not enough and the document is a scan or something you only need to view and print, try rasterising and check the result before you discard the original.',
    },
    {
      question: 'Can you compress a PDF without losing quality at all?',
      answer:
        'Only to the extent that the file contains waste to remove, which is usually not much. Any large reduction involves discarding something — resolution, colour depth, or the text layer. Anyone promising both is not being straight with you.',
    },
    {
      question: 'What if the compressed file is bigger?',
      answer:
        'The tool tells you plainly and recommends the original. This happens most often when rasterising a text-based PDF, where images of text take more space than the text itself.',
    },
  ],
};
