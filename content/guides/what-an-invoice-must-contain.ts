import type { GuideContent } from './types';

/**
 * Deliberately framed around what makes an invoice *work* rather than what the
 * law requires, because the legal requirements differ by country and this site
 * gives no tax or legal advice. Every section that touches a statutory rule
 * says so and sends the reader to their own jurisdiction.
 */
export const whatAnInvoiceMustContain: GuideContent = {
  slug: 'what-an-invoice-must-contain',
  standfirst:
    'An invoice exists to get you paid and to survive being audited. Those two jobs decide almost every field on it.',
  intro: [
    'An invoice is not a receipt, an estimate or a statement. It is a dated demand for payment for work already done or goods already supplied, and it has two audiences: the person who has to approve and pay it, and whoever later has to reconcile it — an accountant, a tax authority, or a court.',
    'Serve the first audience and you get paid sooner. Serve the second and the payment stands up to scrutiny years later. Most fields on a well-made invoice serve both. What follows is what each one is for, and where local law takes over from general practice.',
    'One caveat before the detail: the statutory content of an invoice is set by the country you operate in, and in some cases by the country your customer is in. Nothing here is tax or legal advice. Treat it as the structure, and confirm the specifics with an accountant or your tax authority.',
  ],
  sections: [
    {
      heading: 'The fields that get you paid',
      paragraphs: [
        'Accounts payable departments reject invoices for administrative reasons far more often than for disputes about the work. Almost every rejection traces back to a missing field that made the invoice impossible to process.',
        'The word "Invoice" should appear on it, clearly. That sounds trivial until you have watched a document filed as a quote because nothing on it said otherwise.',
        'Then: who is billing, who is being billed, what for, how much, and by when. The customer’s details matter as much as yours — an invoice addressed to a person at a company, when the company requires a purchase order number and a department, will sit in someone’s inbox rather than entering the payment system at all.',
      ],
      bullets: [
        'The word "Invoice", and a unique invoice number.',
        'Your business name, address and contact details; your tax registration number where you have one.',
        'The customer’s name and address, plus any reference they require, such as a purchase order number.',
        'The invoice date, and the date the goods or services were supplied if it differs.',
        'A line per item: description, quantity, unit price, line total.',
        'Subtotal, any tax shown separately, any discount, and the total due.',
        'Payment terms and the due date, plus how to pay.',
      ],
    },
    {
      heading: 'Why the invoice number matters more than the layout',
      paragraphs: [
        'Of everything on an invoice, the number is the field people treat most casually and regulators care about most. It is what makes a specific document referable — in a payment reference, in a dispute, in a ledger — and what allows a complete sequence to be demonstrated.',
        'Two properties do the work. It must be unique, so no two documents can be confused. And it should be sequential, because a gap-free sequence is evidence that no invoice has been quietly removed from the record. Many jurisdictions require exactly this, and some require that a cancelled invoice be reversed by a credit note rather than deleted and its number reused.',
        'A simple scheme is usually the best one: a year and a running count, such as 2026-001, optionally with a short customer or project prefix. Avoid embedding anything that might change, and avoid restarting the count in a way that produces two documents with the same number in different years.',
      ],
    },
    {
      heading: 'Terms, dates and the gap between them',
      paragraphs: [
        'Payment terms are the most consequential words on the document and the most often omitted. "Net 30" means the balance is due thirty days from the invoice date; "due on receipt" means immediately. If the invoice does not say, the customer’s default process decides — and their default is rarely your preference.',
        'State the due date as an actual date rather than only as a term. It removes an ambiguity (thirty days from the invoice date, or from when they received it?) and it gives an overdue invoice a fact to point at.',
        'Where you intend to charge for late payment, say so on the invoice, before it is late. Many countries give suppliers a statutory right to interest on overdue commercial debts whether or not the invoice mentions it, but the rate, the entitlement and any additional recovery costs vary, so check what applies to you rather than inventing a figure.',
      ],
    },
    {
      heading: 'Tax, and where general advice stops',
      paragraphs: [
        'If you are registered for a sales tax — VAT, GST or an equivalent — the requirements become strict and specific. A compliant tax invoice typically has to show your registration number, the rate applied, the tax amount as a separate line, and the amount excluding tax; and the customer generally cannot reclaim the tax without those details. Some jurisdictions also mandate particular wording for exemptions, reverse charges and cross-border supplies.',
        'The amounts themselves need care in one respect that catches people out: the order of operations. A discount applied before tax produces a different total from the same discount applied after it, and only one of them will match your customer’s expectation and your accounts. Decide which order applies, apply it consistently, and show enough of the working on the invoice that the total can be reconstructed.',
        'Finally, keep the records. Retention periods for invoices are set by law and commonly run to five, six or seven years. A PDF stored somewhere durable, with its number matching your ledger, is the whole obligation for most small suppliers.',
      ],
    },
  ],
  faqs: [
    {
      question: 'What is the difference between an invoice and a receipt?',
      answer:
        'An invoice requests payment; a receipt confirms payment was made. The invoice comes first and creates the obligation, the receipt comes after and discharges it. A document that says "paid" and also demands payment is doing neither job clearly.',
    },
    {
      question: 'Do invoice numbers have to be sequential?',
      answer:
        'In many jurisdictions, yes, and it is good practice everywhere. A gap-free sequence shows that no invoice has been removed from the record. Where a document has to be cancelled, the usual approach is a credit note rather than deleting it and reusing the number — confirm what your own rules require.',
    },
    {
      question: 'Can I invoice without a registered company?',
      answer:
        'Generally yes. Sole traders and individuals issue invoices in their own name, using their own address and whatever tax identifier applies to them. What changes with registration is the tax treatment and the details you must show, not the right to invoice.',
    },
    {
      question: 'Should tax be calculated before or after a discount?',
      answer:
        'Ordinarily the discount is applied first and tax is charged on the reduced amount, since that is the actual consideration. Practice and rules vary, so agree the order with your accountant, apply it consistently, and make the sequence visible on the invoice.',
    },
    {
      question: 'What should I do when an invoice is not paid?',
      answer:
        'Check first that it reached the right place and carried the reference the customer needs — that resolves a surprising proportion. Then follow up in writing against the stated due date. Where a statutory right to interest on late commercial payment exists in your jurisdiction, it applies whether or not the invoice mentioned it.',
    },
  ],
  keyPoints: [
    'An invoice serves two audiences: the person paying it and whoever audits it later.',
    'Most rejections are administrative — a missing reference or an unclear payee, not a dispute.',
    'The invoice number must be unique and should be sequential; cancel with a credit note rather than reusing it.',
    'State the due date as a date, not only as a term.',
    'Tax content and record-retention periods are set locally — confirm them rather than assuming.',
  ],
};
