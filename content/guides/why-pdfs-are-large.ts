import type { GuideContent } from './types';

export const whyPdfsAreLarge: GuideContent = {
  slug: 'why-pdfs-are-large',
  standfirst:
    'A PDF is a container, not a compression format. Its size is decided almost entirely by what somebody put inside it.',
  intro: [
    'People expect a PDF to be small because it looks like a document, and documents are text. But a PDF is a container that can hold text, vector drawings, embedded fonts, colour profiles, attachments, form data and — most consequentially — images at any resolution. A twelve-page report can be 80 KB or 80 MB, and the difference has almost nothing to do with the number of pages.',
    'Before trying to compress a PDF it is worth knowing which kind you have, because the three common causes have three different fixes and only one of them responds to a compressor at all.',
  ],
  sections: [
    {
      heading: 'Cause one: it is not a document, it is photographs of one',
      paragraphs: [
        'This is by far the most common reason a PDF is enormous. A scanner, or a phone scanning app, produces one image per page and wraps those images in a PDF. Nothing in the file is text. A colour scan at 600 dots per inch is roughly 35 million pixels per page, and thirty pages of that runs to tens of megabytes before anything else is added.',
        'You can identify one instantly: try to select a line of text. If nothing highlights, or the whole page highlights as a single block, you have a scan. Searching the document for a word you can plainly see will also fail.',
        'The fix here is resolution, not compression. Scans intended for reading on screen or printing at ordinary sizes rarely need more than 200–300 dpi, and greyscale instead of colour halves the data again for a document that was black ink on white paper to begin with. Re-scanning at sensible settings beats any amount of post-processing.',
      ],
    },
    {
      heading: 'Cause two: images saved at print resolution',
      paragraphs: [
        'A genuine text document can still be huge if the images placed into it were never resized. Word processors and layout tools embed the file you gave them, at its original pixel dimensions, regardless of how small it appears on the page. A 12-megapixel photograph dropped in and scaled to a two-inch box is still a 12-megapixel photograph inside the PDF.',
        'This is the case a compressor genuinely helps with: it can re-encode those images at a resolution appropriate to their printed size. It is also the case worth preventing at the source, by resizing images before placing them.',
      ],
    },
    {
      heading: 'Cause three: fonts, and everything else',
      paragraphs: [
        'PDFs embed their fonts so the document looks the same everywhere, which is the format’s entire purpose. A subset of one font — only the characters actually used — adds tens of kilobytes. A full font family embedded in its entirety, several weights of it, or a CJK font covering thousands of glyphs, adds megabytes.',
        'Beyond fonts, files accumulate things nobody looks at: colour profiles, thumbnails, form field definitions, JavaScript, file attachments, the revision history left by incremental saves, and metadata from whatever produced them. Individually small, collectively enough to notice on a document that should have been tiny.',
      ],
      bullets: [
        'Scanned pages → fix the scan resolution, not the PDF.',
        'Oversized embedded images → a compressor will genuinely help.',
        'Fonts and accumulated structure → modest savings at best.',
      ],
    },
    {
      heading: 'Why a compressor sometimes saves nothing at all',
      paragraphs: [
        'A PDF that is already mostly text, with subsetted fonts and no oversized images, has nothing left to remove. Its content streams are already compressed, usually with the same algorithm a compressor would apply. Running it through a compression tool can leave it the same size or very slightly larger, and that is the correct outcome rather than a failure.',
        'It is also worth being clear about what is being traded. Reducing image resolution is not reversible: the detail is gone from the output file, and a document compressed for email is a poor archival copy. Keep the original where the document matters.',
        'And when the goal is only to get under an attachment limit, splitting is often better than compressing. Sending three intact files beats sending one degraded file, and a reader who wants page 40 does not have to download everything else to reach it.',
      ],
    },
  ],
  faqs: [
    {
      question: 'Why is my PDF so large when it is only a few pages?',
      answer:
        'Almost certainly images. Either the pages are scans — photographs of a document rather than text — or full-resolution pictures were placed into it and never resized. Try selecting a line of text: if you cannot, it is a scan, and the resolution is what to change.',
    },
    {
      question: 'Will compressing a PDF reduce its quality?',
      answer:
        'If the savings come from images, yes, and irreversibly. Text, vector drawings and fonts are unaffected. The useful question is what the document is for: a copy for email can afford it, an archival original should not be replaced by it.',
    },
    {
      question: 'Why did compressing my PDF not make it smaller?',
      answer:
        'Because there was nothing redundant left. A text-only PDF with subsetted fonts is already compressed internally, so a second pass finds no savings. Occasionally the result is marginally larger, which simply reflects the rewritten file structure.',
    },
    {
      question: 'Is it better to split a large PDF or compress it?',
      answer:
        'Split it, when the aim is to get under a size limit. Splitting loses nothing, and most readers only want a particular section anyway. Compress when the whole document genuinely has to travel as one file.',
    },
    {
      question: 'Does deleting pages make the file smaller?',
      answer:
        'It should, but not always immediately — some editors mark pages as removed while leaving the underlying objects in place until the file is rewritten. Saving a fresh copy rather than saving over the original usually recovers the space.',
    },
  ],
  keyPoints: [
    'A PDF is a container; its size reflects its contents, not its page count.',
    'Scanned pages are images, and their resolution is the real lever.',
    'Compression helps most where oversized images were embedded at print resolution.',
    'A text-only PDF is already compressed, so saving nothing is the expected result.',
    'Splitting is lossless; compressing images is not.',
  ],
};
