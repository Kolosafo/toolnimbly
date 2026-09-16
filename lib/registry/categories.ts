import type { CategoryDefinition, ToolCategory } from './types';

/**
 * The five launch categories (spec §4). Each category page carries its own
 * introduction and selection guidance — never a thin list of links.
 */
export const categories: readonly CategoryDefinition[] = [
  {
    slug: 'calculators',
    name: 'Calculators',
    shortName: 'Calculators',
    title: 'Free Online Calculators',
    description:
      'Nine everyday calculators for percentages, loans, mortgages, compound interest, pay, ages, dates, BMI and calories — each one shows its full working.',
    heading: 'Calculators',
    intro:
      'These nine calculators cover the arithmetic most people look up in a hurry: what a loan really costs, how far a salary stretches across pay periods, how many days sit between two dates. Every one of them shows the formula it used and the numbers it substituted, so you can check the result rather than take it on trust. Nothing you type is sent anywhere.',
    selectionGuidance: [
      'For borrowing questions, start with the loan calculator. Switch to the mortgage calculator when property tax, insurance and HOA fees need to be part of the monthly figure.',
      'Use the compound interest calculator for money that grows over time, including regular contributions. The loan calculator is for money that is paid down over time.',
      'The salary calculator converts between pay frequencies. It does not estimate tax, so treat every figure it shows as gross pay.',
      'The age and date difference calculators share the same calendar engine. Pick age for birthdays and milestones, date difference for project timelines and business-day counts.',
      'The BMI and calorie calculators are general information tools. They are not a substitute for advice from a qualified health professional.',
    ],
    icon: 'Calculator',
    order: 1,
  },
  {
    slug: 'text-developer-tools',
    name: 'Text & Developer Tools',
    shortName: 'Text & Dev',
    title: 'Text and Developer Tools',
    description:
      'Generate QR codes, strong passwords and UUIDs, and count words, characters and reading time. Everything runs locally in your browser.',
    heading: 'Text & Developer Tools',
    intro:
      'Six small utilities for writing and building: encode a QR code, generate a password your browser never transmits, mint UUIDs, measure a draft against a word count, check a character limit precisely, or reshape text into another casing convention. Text you paste here stays in the page. It is held in memory, never uploaded, and cleared the moment you reset or close the tab.',
    selectionGuidance: [
      'Use the word counter for writing targets — words, reading time and keyword frequency. Use the character counter when a hard limit matters, because it reports the three different ways software counts characters.',
      'The password generator draws from the operating system random source through the Web Crypto API. Passwords are never stored, logged or transmitted.',
      'The QR generator builds correctly formatted payloads for URLs, email, SMS, phone and Wi-Fi rather than just encoding raw text.',
      'The case converter keeps your original text alongside the transformed output, so a conversion is never destructive.',
    ],
    icon: 'Braces',
    order: 2,
  },
  {
    slug: 'image-tools',
    name: 'Image Tools',
    shortName: 'Images',
    title: 'Online Image Tools',
    description:
      'Compress, resize, crop and convert JPG, PNG and WebP images in your browser. Files are processed on your device and never uploaded.',
    heading: 'Image Tools',
    intro:
      'Seven image utilities that run entirely on your device. Your pictures are decoded, transformed and re-encoded by your own browser, so nothing is uploaded to a server and nothing is retained after you close the tab. Each tool reports the original and resulting dimensions and file size, including the cases where an output ends up larger than what you started with.',
    selectionGuidance: [
      'To make a file smaller without changing its dimensions, use a compressor. The general image compressor handles JPG, PNG and WebP; the JPG and PNG compressors expose the controls that matter for each specific format.',
      'To change dimensions, use the resizer. To change which part of the picture is visible, use the cropper.',
      'Converting JPG to PNG will usually make the file larger and cannot restore quality that JPEG compression already discarded.',
      'Converting PNG to JPG removes transparency. Choose the background colour that transparent pixels are flattened onto before you download.',
      'Photo metadata, including GPS coordinates, is stripped by default on every tool that writes a new image.',
    ],
    icon: 'Image',
    order: 3,
  },
  {
    slug: 'pdf-tools',
    name: 'PDF Tools',
    shortName: 'PDF',
    title: 'Online PDF Tools',
    description:
      'Merge, split, compress and convert PDF files entirely in your browser. Page sizes and rotation are preserved, and your documents are never uploaded.',
    heading: 'PDF Tools',
    intro:
      'Six PDF utilities that read and write your documents locally. PDFs often hold contracts, medical letters, bank statements and identity documents, so none of these tools send file bytes anywhere — the parsing, page copying and rendering all happen inside your browser tab. Page sizes and rotations are preserved wherever a tool copies pages instead of rasterising them.',
    selectionGuidance: [
      'Merging and splitting copy pages without re-rendering them, so text stays selectable and page dimensions stay exact.',
      'PDF to JPG rasterises pages into pictures. That is the right choice for a thumbnail or a slide, and the wrong choice if you need the text back.',
      'The PDF compressor is honest about its limits. Structure optimisation is safe but often saves little; rasterising saves more but discards selectable text, links and form fields.',
      'Image to PDF and JPG to PDF share the same assembly engine. Use the JPG route when every input is a photo, and the general route when you are mixing PNG, WebP and JPEG.',
      'Password-protected PDFs are detected and refused. These tools do not remove encryption.',
    ],
    icon: 'FileText',
    order: 4,
  },
  {
    slug: 'business-tools',
    name: 'Business Tools',
    shortName: 'Business',
    title: 'Business Document Tools',
    description:
      'Create professional invoices and receipts in your browser, with exact currency maths and print or PDF output. No account required.',
    heading: 'Business Tools',
    intro:
      'Two document generators for small businesses and freelancers. Build an invoice or a receipt, preview it exactly as it will print, and download a PDF — all without an account and without sending customer details, prices or line items to a server. Every total is calculated with exact decimal arithmetic rather than binary floating point, so the figures on screen match the figures in the PDF to the last cent.',
    selectionGuidance: [
      'An invoice requests payment and carries a due date and payment instructions. A receipt records a payment that has already been made.',
      'Both tools share the same line-item and currency engine, so subtotals, discounts and tax behave identically across the two.',
      'A logo is downscaled in your browser and embedded directly into the document. It is never uploaded.',
      'Drafts can be kept in this browser using local storage. That is opt-in, it never leaves your device, and there is a delete control for it.',
      'Numbering rules, tax treatment and record-keeping requirements vary by country. These tools produce a clear document; they cannot guarantee compliance in your jurisdiction.',
    ],
    icon: 'ReceiptText',
    order: 5,
  },
] as const;

const categoryBySlug = new Map<ToolCategory, CategoryDefinition>(
  categories.map((category) => [category.slug, category]),
);

export function getCategory(slug: ToolCategory): CategoryDefinition {
  const category = categoryBySlug.get(slug);
  if (!category) throw new Error(`Unknown category: ${slug}`);
  return category;
}

export function findCategory(slug: string): CategoryDefinition | undefined {
  return categoryBySlug.get(slug as ToolCategory);
}

/** Route path for a category page. Categories live at the site root. */
export function categoryPath(slug: ToolCategory): string {
  return `/${slug}`;
}

/** The two categories shown as "explore next" links on a category page. */
export function adjacentCategories(slug: ToolCategory): CategoryDefinition[] {
  const ordered = [...categories].sort((a, b) => a.order - b.order);
  const index = ordered.findIndex((category) => category.slug === slug);
  if (index === -1) return [];
  const before = ordered[(index - 1 + ordered.length) % ordered.length];
  const after = ordered[(index + 1) % ordered.length];
  const neighbours: CategoryDefinition[] = [];
  for (const candidate of [before, after]) {
    if (!candidate || candidate.slug === slug) continue;
    if (neighbours.some((existing) => existing.slug === candidate.slug)) continue;
    neighbours.push(candidate);
  }
  return neighbours;
}
