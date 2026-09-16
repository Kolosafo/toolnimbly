import type { ToolContent } from '../types';

export const receiptGeneratorContent: ToolContent = {
  slug: 'receipt-generator',
  valueProposition:
    'A clear record of a payment taken, with exact totals, change calculation and a compact or full-page layout.',
  intro:
    'A receipt records a payment that has already been made, which is what distinguishes it from an invoice. This tool builds one with line items, tax, tip or service charge, the amount tendered and the change given. Totals use exact decimal arithmetic, so the printed figures always reconcile. Choose a compact till-style layout or a full page, preview it, then print or save a PDF — with nothing sent to a server.',
  steps: [
    {
      title: 'Enter your business details',
      body: 'Name, contact details and an optional logo, which is downscaled in your browser and embedded locally.',
    },
    {
      title: 'Add the transaction details',
      body: 'Receipt number, date and time, payment method and, optionally, the customer name.',
    },
    {
      title: 'Add the line items',
      body: 'Description, quantity and unit price for each item. The subtotal updates as you type.',
    },
    {
      title: 'Add tax, tip and payment',
      body: 'Apply a discount, tax and any tip or service charge. Enter the amount tendered and the change is calculated for you.',
    },
    {
      title: 'Choose a layout and output',
      body: 'Compact suits a narrow till roll; full page suits A4 or Letter filing. Preview, then print or download a PDF.',
    },
  ],
  example: {
    title: 'A café receipt with a tip and cash payment',
    body: 'Three items, 8% sales tax, a 15% tip and a cash payment of 30.00.',
    rows: [
      { label: '2 × flat white at 3.80', value: '7.60' },
      { label: '1 × sandwich at 8.50', value: '8.50' },
      { label: '2 × pastry at 3.20', value: '6.40' },
      { label: 'Subtotal', value: '22.50' },
      { label: 'Sales tax 8%', value: '1.80' },
      { label: 'Tip 15% of subtotal', value: '3.38' },
      { label: 'Total', value: '27.68' },
      { label: 'Cash tendered / change', value: '30.00 / 2.32' },
    ],
    conclusion:
      'The tip is calculated on the pre-tax subtotal, which is the more common convention. The change figure comes from exact decimal subtraction, so it always reconciles against the till.',
  },
  method: {
    title: 'How the totals are calculated',
    body: 'Amounts are held as exact decimals throughout and rounded once for display, using the conventions of the selected currency. This is what keeps the change figure consistent with the total.',
    formulas: [
      'line total = quantity × unit price',
      'subtotal   = sum of line totals',
      'taxable    = subtotal − discount',
      'tax        = taxable × tax rate',
      'total      = taxable + tax + tip or service charge',
      'change     = amount tendered − total',
    ],
    notes: [
      'Tip is calculated on the pre-tax subtotal by default, which is the more common convention; the breakdown shows which base was used.',
      'An amount tendered below the total is flagged rather than shown as negative change.',
      'Currencies use ISO 4217 codes, so a zero-decimal currency such as JPY rounds to whole units rather than to cents.',
    ],
  },
  limitations: [
    'This generates a document recording a payment. It is not proof that a transaction took place, and it is not connected to any payment system or till.',
    'One tax rate per receipt. Mixed rates across different items are not supported in this version.',
    'There is no numbering sequence or transaction history, because there is no account and no server. Keep your own records.',
    'Local rules on receipts — required fields, fiscal printers, tax registration numbers — vary by country and are not enforced here.',
    'Local drafts, if enabled, live in this browser only and are lost if you clear site data or change device.',
  ],
  privacyNote:
    'Customer names, items, prices and payment details stay on your device. Nothing is transmitted, and no transaction data appears in analytics in any form.',
  resultDisclaimer:
    'This document is generated from the details you entered. It is not evidence that a payment was made, not a fiscal or tax-compliant receipt in jurisdictions that mandate specific formats or registered devices, and not accounting or legal advice.',
  faqs: [
    {
      question: 'What is the difference between a receipt and an invoice?',
      answer:
        'An invoice requests payment and carries a due date and payment instructions. A receipt confirms that payment has already been received. If you are asking to be paid, use the invoice generator instead.',
    },
    {
      question: 'Is the tip calculated before or after tax?',
      answer:
        'Before tax, on the subtotal, which is the more common convention. The breakdown on the receipt shows the base used, so there is no ambiguity for the customer.',
    },
    {
      question: 'Does this count as a legally valid receipt?',
      answer:
        'It is a clear record of a payment, but requirements differ by country. Some jurisdictions mandate specific fields, registered fiscal devices or particular formats for tax purposes. Check your local rules or ask an accountant.',
    },
    {
      question: 'Which layout should I choose?',
      answer:
        'Compact for a narrow till-roll printer or for handing to a customer on the spot. Full page for A4 or Letter filing, for emailing as a PDF, or when you have many line items and long descriptions.',
    },
    {
      question: 'How is change calculated?',
      answer:
        'By subtracting the total from the amount tendered using exact decimal arithmetic. That matters more than it sounds: ordinary floating-point subtraction can produce a result a cent out, which would not reconcile against a till.',
    },
  ],
};
