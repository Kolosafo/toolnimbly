import type { ToolContent } from '../types';

export const invoiceGeneratorContent: ToolContent = {
  slug: 'invoice-generator',
  valueProposition:
    'A professional invoice with exact currency maths, built in your browser — no account, no customer data leaving your device.',
  intro:
    'Fill in your business details, your client, and the work you are billing for, and this tool produces a clean invoice you can print or download as a PDF. Totals are calculated with exact decimal arithmetic rather than binary floating point, so the figures in the PDF match what you see on screen to the last cent. There is no account and no server: your client list, rates and line items stay on your own device.',
  steps: [
    {
      title: 'Add your business details',
      body: 'Name, address, contact details and tax or business ID. A logo can be added and is downscaled locally before being embedded — it is never uploaded.',
    },
    {
      title: 'Enter the client and invoice details',
      body: 'Who you are billing, the invoice number, the issue date, the due date and the currency. The tool flags a due date that falls before the issue date.',
    },
    {
      title: 'Add your line items',
      body: 'Description, quantity and unit price for each. Add, remove and reorder rows; the subtotal updates as you go.',
    },
    {
      title: 'Apply discount, tax and fees',
      body: 'A document-level discount, a tax rate or amount with your own label, and any shipping or fee. Tax is applied after the discount by default, and the breakdown shows the order used.',
    },
    {
      title: 'Preview, then print or download',
      body: 'The preview is exactly what prints. Choose a template, then print directly or save a PDF.',
    },
  ],
  example: {
    title: 'A freelance invoice with a discount and VAT',
    body: 'Two line items, a 10% goodwill discount and 20% VAT.',
    rows: [
      { label: '24 hours design at 65.00', value: '1,560.00' },
      { label: '6 hours revisions at 65.00', value: '390.00' },
      { label: 'Subtotal', value: '1,950.00' },
      { label: 'Discount 10%', value: '−195.00' },
      { label: 'Taxable amount', value: '1,755.00' },
      { label: 'VAT 20%', value: '351.00' },
      { label: 'Total due', value: '2,106.00' },
    ],
    conclusion:
      'Applying tax after the discount is what most tax authorities expect, because tax is due on what the customer actually pays. Applying it before would have produced 2,145.00 — a difference worth getting right.',
  },
  method: {
    title: 'How the totals are calculated',
    body: 'Every amount is held as an exact decimal. Binary floating point cannot represent 0.1 exactly, which is how invoices end up a cent out; this tool avoids that class of error entirely.',
    formulas: [
      'line total     = quantity × unit price',
      'subtotal       = sum of line totals',
      'discount       = percentage of subtotal, or a fixed amount',
      'taxable amount = subtotal − discount',
      'tax            = taxable amount × tax rate',
      'total          = taxable amount + tax + shipping and fees',
      'balance due    = total − amount already paid',
    ],
    notes: [
      'Tax is applied after the document discount by default, which matches standard practice in most jurisdictions.',
      'Rounding happens once, at the point of display, using the conventions of the currency you selected — so a two-decimal currency rounds to cents and a zero-decimal currency to whole units.',
      'Currencies use ISO 4217 codes. A custom symbol can be shown for presentation, but the underlying code is what governs formatting.',
    ],
  },
  limitations: [
    'This produces a clear, conventional invoice. It cannot guarantee compliance with the tax, numbering or record-keeping rules of any particular country.',
    'One tax rate per document. Mixed-rate invoices, reverse charge and multi-jurisdiction VAT are not supported in this version.',
    'There is no numbering sequence, client database or history, because there is no account and no server. Track your invoice numbers yourself.',
    'Currency conversion is not performed. One invoice, one currency.',
    'Saved drafts, if you enable them, live in this browser only. Clearing site data or switching browser or device loses them.',
  ],
  privacyNote:
    'Your business details, client information, rates and line items never leave your device. Nothing is sent to a server, and none of this data appears in analytics in any form — not the amounts, not the names, not the filenames.',
  resultDisclaimer:
    'This tool generates a document. It does not provide tax, accounting or legal advice, and it cannot confirm that an invoice meets the requirements of your jurisdiction. Check local rules on invoice content, numbering and record keeping, or ask an accountant.',
  faqs: [
    {
      question: 'Is tax calculated before or after the discount?',
      answer:
        'After, by default, because tax is normally due on the amount the customer actually pays. The breakdown on the invoice shows the taxable amount explicitly, so the order used is visible to you and to your client.',
    },
    {
      question: 'Do I need an account to use this?',
      answer:
        'No. There is no sign-up, no login and no server-side storage. That also means nothing is saved for you automatically — enable local drafts if you want the browser to remember your work between sessions.',
    },
    {
      question: 'What should an invoice include?',
      answer:
        'Generally: your business name and contact details, your client details, a unique invoice number, the issue and due dates, a clear description of what is being charged, the amounts and any tax, the total due and how to pay. Specific requirements vary by country and by whether you are registered for VAT or sales tax.',
    },
    {
      question: 'Where is my logo stored?',
      answer:
        'Nowhere but your own device. It is downscaled in your browser to a size appropriate for a document and embedded directly into the PDF. It is never uploaded and no copy is kept.',
    },
    {
      question: 'Why do the totals matter more than they look?',
      answer:
        'Because ordinary floating-point arithmetic gets currency wrong in small ways — adding 0.1 and 0.2 famously does not give exactly 0.3. On an invoice that shows up as a total that is a cent off and does not reconcile. This tool uses exact decimal arithmetic so that cannot happen.',
    },
    {
      question: 'Can I save an invoice and come back to it?',
      answer:
        'Yes, if you turn on local drafts. The draft is kept in this browser using local storage, never transmitted, and there is a delete control for it. It will not follow you to another device or survive clearing your site data.',
    },
  ],
};
