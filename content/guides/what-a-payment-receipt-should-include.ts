import type { GuideContent } from './types';

export const whatAPaymentReceiptShouldInclude: GuideContent = {
  slug: 'what-a-payment-receipt-should-include',
  standfirst:
    'A useful receipt says what was paid, who received it and how the total was built—without pretending that one format satisfies every country’s rules.',
  intro: [
    'A payment receipt is a record of a completed transaction. It helps the customer show what they bought and what they paid, and it helps the seller reconcile cash, card or transfer receipts against their own records. That makes a receipt different from an invoice: an invoice asks for money, while a receipt records money that has already changed hands.',
    'A good receipt does not need elaborate decoration. It needs enough information for someone who was not present to understand the transaction later. The seller, date, items or services, amounts, tax, total and payment method are the core. A customer name, receipt number, refund terms or tax registration number may also matter depending on the transaction and local rules.',
    'This guide covers a clear, general-purpose receipt. Legal, tax, fiscal-device and record-retention requirements vary by jurisdiction and sometimes by industry. Use the structure as a practical starting point, then check the rules that apply where the seller operates.',
  ],
  sections: [
    {
      heading: 'Start with the purpose: evidence of completed payment',
      paragraphs: [
        'The word “receipt” should be visible, but the document must also read like one. Show the payment date and method, and avoid leaving a balance that looks unpaid unless the receipt is deliberately recording a part-payment. If an invoice number exists, referencing it connects the request for payment with the record that it was settled.',
        'A receipt is useful evidence, but a document generated from typed details is not independent proof that a transaction happened. A seller should issue it only for a genuine payment and keep records that reconcile with the underlying sale and payment channel. A customer should retain the payment confirmation as well when a refund, warranty or expense claim could depend on it.',
      ],
    },
    {
      heading: 'The common fields and what each one does',
      paragraphs: [
        'Identify the seller with the trading or legal name and contact details. Add a tax or business registration number only when it is accurate and required. Identify the customer when the sale, warranty, expense policy or local rule calls for it; a routine retail receipt may not need a customer name at all.',
        'Give the transaction a date and, when useful, a time. List goods or services clearly enough to distinguish them later. Each row normally includes a description, quantity, unit price and line total. After the rows, show the subtotal, discounts, tax, tip or service charge, and final total in a visible calculation order.',
        'Finally, state the payment method without exposing sensitive credentials. “Cash”, “bank transfer” or “card ending 1234” can be useful. A full card number, security code, account password or unnecessary bank detail does not belong on a receipt.',
      ],
      bullets: [
        'Seller name and contact details; customer details when relevant.',
        'Receipt number, transaction date and an invoice or order reference if one exists.',
        'Items or services, quantity, unit price and line totals.',
        'Subtotal, discount, tax, tip or service charge, and final amount paid.',
        'Payment method, amount tendered and change where those details help explain the transaction.',
      ],
    },
    {
      heading: 'Receipt versus invoice: choose the document for the moment',
      paragraphs: [
        'An invoice is issued before payment or while payment remains due. It usually includes a due date, payment terms and instructions for sending the money. A receipt comes after payment and records the amount and method received. Replacing one with the other creates confusion in both the customer’s records and the seller’s accounts.',
        'When a customer pays an invoice, keep the invoice and issue or retain a receipt that references it. Marking an invoice “paid” may be accepted in some workflows, but it does not automatically satisfy every receipt or tax-invoice rule. If a deposit or instalment is paid, label the document as a part-payment receipt and show both the amount received and any balance that genuinely remains.',
      ],
    },
    {
      heading: 'A worked business-receipt example',
      paragraphs: [
        'Imagine a repair shop receives cash for two services: a diagnostic check at 45.00 and a repair at 120.00. The subtotal is 165.00. If a 10% discount applies before tax, the discount is 16.50 and the taxable amount is 148.50. At an illustrative 8% tax rate, tax is 11.88 and the final amount paid is 160.38.',
        'If the customer tenders 170.00 in cash, the receipt can show 170.00 received and 9.62 change. It should also include the seller, date, receipt number, descriptions and payment method. The arithmetic is transparent: 165.00 − 16.50 + 11.88 = 160.38, then 170.00 − 160.38 = 9.62.',
        'The 8% rate is only an example, not a recommendation. The actual rate, whether the discount reduces the taxable amount and whether tax must be broken down by item are questions for the seller’s jurisdiction and accountant.',
      ],
    },
    {
      heading: 'Numbering, retention and fiscal-device rules',
      paragraphs: [
        'A unique receipt number makes a transaction easier to find, correct and reconcile. A simple chronological sequence is usually practical, but local rules may prescribe numbering, require a tax invoice identifier, or forbid deleting a cancelled record. Use a process that prevents accidental duplicates and preserves corrections rather than silently overwriting them.',
        'Keep receipts for as long as your accounting, tax, warranty and consumer-protection obligations require. Retention periods differ, and a PDF stored only on one laptop is not a durable record. Back up business records appropriately while limiting access to customer information.',
        'Some jurisdictions require registered cash registers, fiscal printers, real-time reporting, prescribed QR codes or other controlled systems. A browser-generated receipt cannot replace a mandated fiscal device. Confirm local rules before using any generic document as an official tax receipt.',
      ],
    },
  ],
  cta: {
    heading: 'Create a clear receipt from your real transaction',
    body: 'Use the free receipt generator to enter genuine payment details, check exact totals, and print or download a PDF in your browser.',
    label: 'Open the free receipt generator',
    href: '/tools/receipt-generator',
  },
  faqs: [
    {
      question: 'Does a receipt need the customer’s name?',
      answer:
        'Not always. Routine retail receipts are often anonymous, while business expenses, warranties, regulated services or local tax rules may require the customer to be identified. Include it when it serves a real record-keeping purpose and avoid collecting personal information that the transaction does not need.',
    },
    {
      question: 'Can a receipt replace an invoice?',
      answer:
        'Usually they serve different stages. An invoice requests payment and states what is due; a receipt records payment already completed. Keep both when a sale began with an invoice. Whether a paid invoice can also serve as a receipt depends on the customer’s needs and local rules.',
    },
    {
      question: 'What payment details are safe to show?',
      answer:
        'Show the method and only enough of a reference to reconcile the payment, such as cash, transfer reference or the last four card digits. Never print a full card number, security code, password or other credential. Payment processors may impose additional masking requirements.',
    },
    {
      question: 'How long should a business keep receipts?',
      answer:
        'There is no universal period. Tax, accounting, warranty and consumer rules set different retention requirements across countries and industries. Check the applicable authority or an accountant, then keep readable backups for at least that period rather than relying on one device.',
    },
  ],
  keyPoints: [
    'A receipt records completed payment; an invoice asks for payment.',
    'Identify the seller, date, items or services, amounts, tax, total and payment method.',
    'Use unique numbering and keep records that reconcile with the real transaction.',
    'Local legal, tax, retention and fiscal-device requirements take priority over a generic format.',
  ],
};
