'use client';

import { DocumentEditor } from './document-editor';

export function InvoiceGenerator() {
  return <DocumentEditor kind="invoice" />;
}

export function ReceiptGenerator() {
  return <DocumentEditor kind="receipt" />;
}
