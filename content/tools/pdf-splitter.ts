import type { ToolContent } from '../types';

export const pdfSplitterContent: ToolContent = {
  slug: 'pdf-splitter',
  valueProposition:
    'Extract, split, divide or delete pages — with a preview of exactly what each mode will produce.',
  intro:
    'Four ways to break up a PDF: pull selected pages into one new document, split every page into its own file, cut the document into several files by range, or delete pages and keep the rest. Page ranges use the familiar comma and hyphen syntax, and the preview shows precisely which files you will get before anything is generated. Pages are copied rather than re-rendered, so text and page dimensions come through intact.',
  steps: [
    {
      title: 'Add a PDF',
      body: 'One file, up to 100 MB and 500 pages. Page thumbnails load lazily so a long document does not stall the page.',
    },
    {
      title: 'Choose what you want to do',
      body: 'Extract selected pages, split every page separately, split by ranges into several files, or remove pages and keep the remainder.',
    },
    {
      title: 'Enter your page selection',
      body: 'Write it as 1-3, 5, 8-10. Invalid tokens are explained rather than silently ignored, and a page number outside the document is rejected with the valid range shown.',
    },
    {
      title: 'Check the preview and download',
      body: 'The preview lists the files that will be created and their page counts. A single output downloads as a PDF; several come back as a ZIP.',
    },
  ],
  example: {
    title: 'Pulling one chapter out of a 240-page report',
    body: 'Chapter four runs from page 88 to page 113 and needs to go to a colleague on its own.',
    rows: [
      { label: 'Mode', value: 'Extract selected pages' },
      { label: 'Selection', value: '88-113' },
      { label: 'Result', value: 'One 26-page PDF' },
      { label: 'Preserved', value: 'Selectable text, page size, rotation and any embedded fonts' },
    ],
    conclusion:
      'Sending 26 relevant pages instead of 240 is both more considerate and, for a confidential report, more careful.',
  },
  method: {
    title: 'How page selection is parsed',
    body: 'The selection string is normalised, split on commas, and each token is interpreted as either a single page or an inclusive range. Pages are then copied into new documents in the order the modes define.',
    formulas: [
      '1-3, 5      →  pages 1, 2, 3, 5',
      '5-3         →  interpreted as 3, 4, 5',
      '2, 2, 4     →  pages 2 and 4, duplicates collapsed',
      '1-3, 2-5    →  pages 1 to 5, overlapping ranges merged',
    ],
    notes: [
      'Page numbers are one-based, matching what your PDF viewer displays. There is no off-by-one between what you type and what you get.',
      'Whitespace is ignored, so "1-3,5" and "1 - 3 , 5" are equivalent.',
      'A reversed range is read in ascending order rather than rejected, because the intent is unambiguous.',
      'Every output is re-parsed after generation to confirm the page count and that the file opens.',
    ],
  },
  limitations: [
    'Password-protected PDFs are refused. This tool does not remove encryption.',
    'Bookmarks, form field values, digital signatures and some annotations may not survive extraction. Page content always does.',
    'Splitting a large document into many single-page files produces a large ZIP and uses a fair amount of memory.',
    'There is no way to split part of a page or to extract a region — page boundaries are the smallest unit.',
    'Maximum 100 MB and 500 pages per document.',
  ],
  privacyNote:
    'The document is parsed and split in your browser. No file bytes are transmitted, so extracting pages from a confidential document does not involve sending it to anyone.',
  faqs: [
    {
      question: 'How do I write a page range?',
      answer:
        'Use commas between items and hyphens for ranges: 1-3, 5, 8-10 gives pages 1, 2, 3, 5, 8, 9 and 10. Spaces are ignored, and the preview always confirms what your selection resolves to before you generate anything.',
    },
    {
      question: 'What is the difference between extracting and splitting?',
      answer:
        'Extracting produces one new PDF containing the pages you chose. Splitting produces several files — either one per page, or one per range you specify. Choose extract when you want a single subset, split when you want the document divided up.',
    },
    {
      question: 'Will the extracted pages keep their formatting?',
      answer:
        'Yes. Pages are copied rather than re-rendered, so text stays selectable, page dimensions and rotation are preserved exactly, and embedded fonts come across with the content.',
    },
    {
      question: 'How do I delete pages from a PDF?',
      answer:
        'Use the remove-pages mode and enter the pages you want gone. The output contains everything else in its original order, which is easier than listing all the pages you want to keep.',
    },
    {
      question: 'Can I split a password-protected PDF?',
      answer:
        'No. Encrypted documents are detected and refused with an explanation. Remove the password using a PDF editor you are authorised to use, then split the unprotected file.',
    },
  ],
};
