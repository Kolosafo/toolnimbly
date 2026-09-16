import type { ToolContent } from '../types';

export const pdfMergerContent: ToolContent = {
  slug: 'pdf-merger',
  valueProposition:
    'Join up to ten PDFs in any order, with pages copied rather than re-rendered — so text stays text.',
  intro:
    'Add between two and ten PDFs, arrange them in the order you want and download one combined document. Pages are copied across rather than rasterised, which means selectable text stays selectable, page dimensions stay exact and rotated pages stay rotated. Reordering works by dragging or by keyboard. The whole operation runs in your browser, so contracts, statements and reports are never uploaded anywhere.',
  steps: [
    {
      title: 'Add your PDFs',
      body: 'Between two and ten files, up to 100 MB each. Each one shows its filename, size and page count once it loads.',
    },
    {
      title: 'Put them in order',
      body: 'Drag the files into sequence or move the focused item with the keyboard. The list order is the page order in the output.',
    },
    {
      title: 'Remove anything you do not need',
      body: 'Removing one file leaves the rest of the queue intact. If one file fails validation, it is identified by name and the others are unaffected.',
    },
    {
      title: 'Merge and download',
      body: 'The combined document is assembled locally and downloads with a total page count you can verify.',
    },
  ],
  example: {
    title: 'Assembling a mortgage application pack',
    body: 'Four documents that must arrive as one file, in a specified order.',
    rows: [
      { label: 'Cover letter', value: '1 page, A4' },
      { label: 'Three months of statements', value: '9 pages, A4' },
      { label: 'Payslips', value: '3 pages, US Letter' },
      { label: 'Signed declaration', value: '2 pages, A4, one page rotated' },
      { label: 'Merged result', value: '15 pages, each keeping its original size and rotation' },
    ],
    conclusion:
      'Mixed page sizes are preserved rather than being forced onto a common size. The Letter-sized payslips stay Letter-sized, and the rotated page stays rotated.',
  },
  method: {
    title: 'How merging works',
    body: 'Each source document is parsed and its pages are copied — content streams, fonts and resources intact — into a new document in the order you set. Nothing is rendered to an image at any point.',
    notes: [
      'Because pages are copied rather than redrawn, text remains selectable and searchable and vector graphics stay sharp at any zoom.',
      'Page dimensions and rotation are carried across individually, so a document mixing A4 and Letter pages merges correctly.',
      'Output metadata is minimal and deliberately excludes local file paths, so the merged document does not leak your folder structure.',
      'The finished document is re-parsed before download to confirm the page count and that it opens cleanly.',
    ],
  },
  limitations: [
    'Between two and ten PDFs per merge, each up to 100 MB. For a larger set, merge in stages.',
    'Password-protected PDFs are refused. Remove the password in an authorised PDF editor first.',
    'Bookmarks, form field values, digital signatures and some annotations may not survive the copy. A digital signature is invalidated by any modification, by design.',
    'Pages are merged whole. Interleaving or selecting individual pages is a job for the splitter first, then the merger.',
    'A corrupted file is identified by name and skipped rather than failing the whole batch.',
  ],
  privacyNote:
    'PDFs commonly contain bank statements, contracts and identity documents. None of these files are uploaded — parsing and assembly happen in this browser tab, and everything is released from memory when you reset.',
  faqs: [
    {
      question: 'Will merging change the quality of my pages?',
      answer:
        'No. Pages are copied rather than re-rendered, so text stays text, vector graphics stay vector and images are untouched. A merged page is byte-for-byte equivalent in content to the page it came from.',
    },
    {
      question: 'What happens when the PDFs have different page sizes?',
      answer:
        'Each page keeps its own dimensions. A merged document can contain A4 and US Letter pages side by side, which is the correct behaviour — forcing everything to one size would scale or crop content.',
    },
    {
      question: 'Can I merge a password-protected PDF?',
      answer:
        'No. Encrypted files are detected and refused. Remove the password in a PDF editor you are authorised to use, then merge the unprotected file.',
    },
    {
      question: 'Do bookmarks and form fields survive?',
      answer:
        'Page content always does. Bookmarks, form field values and some annotation types may not be carried across, and any digital signature is invalidated by modification. Check the merged file if those matter for your document.',
    },
    {
      question: 'How large can the files be?',
      answer:
        'Up to 100 MB each and ten files per merge. Those limits keep memory use within what a phone or older laptop can handle, since the entire operation runs on your device.',
    },
  ],
};
