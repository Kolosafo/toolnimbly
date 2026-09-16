import type { ToolContent } from '../types';

export const uuidGeneratorContent: ToolContent = {
  slug: 'uuid-generator',
  valueProposition:
    'Up to 100 random version 4 UUIDs at a time, generated with Web Crypto and validated before they are shown.',
  intro:
    'A version 4 UUID is 122 bits of randomness wrapped in a standard format, which makes it a practical identifier when several systems need to mint IDs without coordinating. This generator uses crypto.randomUUID where the browser provides it and a Web Crypto fallback where it does not. Every value is checked against the specification — correct version nibble, correct variant bits — before it reaches the screen. Formatting options are applied only after that check passes.',
  steps: [
    {
      title: 'Choose how many you need',
      body: 'Anywhere from 1 to 100 in a single batch. They are generated independently, so a batch is no less random than one at a time.',
    },
    {
      title: 'Pick a format if the default does not suit',
      body: 'The default is conventional lowercase with hyphens. You can switch to uppercase, wrap each value in braces, or strip the hyphens for systems that store them as 32 characters.',
    },
    {
      title: 'Copy or download',
      body: 'Copy the whole list to the clipboard, or download it as a plain text file with one UUID per line.',
    },
  ],
  example: {
    title: 'Reading a version 4 UUID',
    body: 'Take 3f2504e0-4f89-41d3-9a0c-0305e82c3301 and look at two specific positions.',
    rows: [
      { label: 'Full value', value: '3f2504e0-4f89-41d3-9a0c-0305e82c3301' },
      { label: 'Version nibble', value: 'the 4 starting the third group — version 4' },
      { label: 'Variant nibble', value: 'the 9 starting the fourth group — 8, 9, a or b' },
      { label: 'Random bits', value: '122 of the 128 bits; the other 6 carry version and variant' },
    ],
    conclusion:
      'Those two fixed positions are what distinguish a real version 4 UUID from 32 random hex characters, and they are exactly what this tool validates before displaying a value.',
  },
  method: {
    title: 'How the values are generated',
    body: 'Randomness comes from the same cryptographic source as the password generator. Where crypto.randomUUID is unavailable, 16 random bytes are drawn and the version and variant bits are set by hand.',
    formulas: [
      'format:  xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx',
      'byte 6:  (byte & 0x0f) | 0x40   → sets version 4',
      'byte 8:  (byte & 0x3f) | 0x80   → sets the RFC variant',
      'random bits = 128 − 6 = 122',
    ],
    notes: [
      'Version 4 means the value is random. Versions 1 and 7 encode a timestamp instead and are not produced here.',
      'Uppercase, braces and hyphen removal are display transformations applied after validation — they never change the underlying value.',
      'The chance of a collision is negligible at any realistic scale: you would need to generate billions of UUIDs before it became worth thinking about.',
    ],
  },
  limitations: [
    'Only version 4 is generated. If you need time-ordered identifiers for database index locality, look at UUID v7 instead.',
    'Random UUIDs make poor clustered primary keys in some databases, precisely because they are unordered.',
    'A UUID is an identifier, not a secret. Do not use one as a password, an API key or a capability token.',
    'Batches are capped at 100 per generation to keep the page responsive. Generate repeatedly if you need more.',
  ],
  privacyNote:
    'Generated UUIDs stay in your browser. They are not stored, not logged, not transmitted and never included in an analytics event.',
  faqs: [
    {
      question: 'What is a version 4 UUID?',
      answer:
        'A 128-bit identifier in which 122 bits are random and the remaining 6 encode the version and variant. It is the general-purpose UUID: no coordination between systems is needed, and no information about the machine or the time is embedded.',
    },
    {
      question: 'Can two UUIDs ever collide?',
      answer:
        'In principle yes, in practice no. With 122 random bits you would need to generate on the order of a billion UUIDs per second for decades before a collision became probable. Practical systems treat them as unique.',
    },
    {
      question: 'Should I use UUID v4 or v7 for database keys?',
      answer:
        'Version 7 is usually better for primary keys because it embeds a timestamp and therefore sorts roughly in insertion order, which keeps B-tree indexes compact. Version 4 is the right choice when you want no ordering information leaking at all.',
    },
    {
      question: 'Is a UUID secure enough to use as a token?',
      answer:
        'It has 122 bits of entropy, which is plenty, but it is the wrong tool for the job. UUIDs are routinely logged, put in URLs and shared between systems, so they tend to leak. Use a purpose-built token for anything that grants access.',
    },
    {
      question: 'Why do some systems store UUIDs without hyphens?',
      answer:
        'The hyphens are purely presentational — the value is 16 bytes either way. Storing 32 hex characters, or the raw bytes, saves space and can be faster to index. The no-hyphen option here produces exactly that form.',
    },
  ],
};
