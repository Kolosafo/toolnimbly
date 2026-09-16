import type { ToolContent } from '../types';

export const qrCodeGeneratorContent: ToolContent = {
  slug: 'qr-code-generator',
  valueProposition:
    'Correctly formatted QR payloads for links, email, SMS, phone and Wi-Fi — encoded in your browser, not on a server.',
  intro:
    'A QR code is just text encoded as a grid, but the text has to follow the right format for a phone to do anything useful with it. This generator builds the payload correctly for each type — a Wi-Fi code needs a specific string that most generators get subtly wrong — then encodes it locally and gives you a live preview with PNG and SVG downloads. The encoder runs in this page, so the contents of your code never reach a server.',
  steps: [
    {
      title: 'Choose what the code should do',
      body: 'URL, plain text, email, phone, SMS or Wi-Fi. Each mode shows only the fields that type needs and builds the payload for you.',
    },
    {
      title: 'Fill in the details',
      body: 'For a URL without a scheme the tool offers to add https:// rather than guessing silently. For Wi-Fi you provide the network name, password, encryption type and whether the network is hidden.',
    },
    {
      title: 'Adjust size, colours and error correction',
      body: 'Higher error correction survives more damage at the cost of a denser code. The preview warns you if your chosen colours are too low in contrast to scan reliably.',
    },
    {
      title: 'Download PNG or SVG',
      body: 'PNG suits screens and documents. SVG stays sharp at any size, so use it for print, signage or anything that will be scaled up.',
    },
  ],
  example: {
    title: 'A Wi-Fi code for a guest network',
    body: 'Wi-Fi mode with an SSID of "Cafe-Guest", WPA encryption and a password.',
    rows: [
      { label: 'Encoded payload', value: 'WIFI:T:WPA;S:Cafe-Guest;P:your-password;H:false;;' },
      { label: 'Error correction', value: 'M — recovers about 15% damage' },
      { label: 'Recommended output', value: 'SVG, so it stays sharp when printed on a card' },
    ],
    conclusion:
      'Scanning this joins the network without anyone typing the password. Note that the password is stored in the code in plain text — anyone who can photograph the code can read it.',
  },
  method: {
    title: 'How each payload is built',
    body: 'QR codes carry text. What makes a code "a Wi-Fi code" or "an email code" is a convention about how that text is structured, and phones recognise those conventions.',
    formulas: [
      'URL      https://example.com',
      'Email    mailto:name@example.com?subject=...&body=...',
      'Phone    tel:+441234567890',
      'SMS      smsto:+441234567890:message text',
      'Wi-Fi    WIFI:T:WPA;S:network;P:password;H:false;;',
    ],
    notes: [
      'Special characters in a Wi-Fi SSID or password — semicolons, colons, commas, backslashes and quotes — are escaped with a backslash, which is the step most generators skip.',
      'Error correction levels L, M, Q and H recover roughly 7%, 15%, 25% and 30% of a damaged code respectively. Higher levels need more modules for the same data.',
      'A quiet zone — the blank margin around the code — is part of the specification. Cropping it off is a common reason codes fail to scan.',
    ],
  },
  limitations: [
    'Very long payloads produce dense codes that need a larger printed size or a better camera. Shorten long URLs before encoding them.',
    'Dark-on-light is what scanners expect. Inverted or low-contrast colour pairs may not scan on all devices, and the tool warns you when your choice is risky.',
    'This version does not place a logo in the centre of the code. Doing that reliably requires care with error correction, and a broken code is worse than a plain one.',
    'A QR code is not secure. Anything encoded in it — including a Wi-Fi password — is readable by anyone who can scan or photograph it.',
    'Codes generated here are static. There is no redirect service, so the destination cannot be changed after printing.',
  ],
  privacyNote:
    'The URL, message, phone number or Wi-Fi password you encode never leaves your browser, and is never included in analytics. No third-party QR service is contacted.',
  faqs: [
    {
      question: 'Do these QR codes expire?',
      answer:
        'No. The code is a direct encoding of your content with no redirect in between, so it works for as long as the destination does. Nothing here tracks scans or can stop working because a service shut down.',
    },
    {
      question: 'Which error correction level should I choose?',
      answer:
        'M is a sensible default. Choose Q or H if the code will be printed small, placed outdoors, or applied to something that may get scuffed — a higher level lets a scanner recover from more damage. L keeps the code sparse for long payloads on clean screens.',
    },
    {
      question: 'Why is my code not scanning?',
      answer:
        'The usual causes are too little contrast between foreground and background, a missing quiet zone around the edge, printing it too small for the amount of data, or inverting it so the light and dark are swapped. Try increasing size and reverting to black on white.',
    },
    {
      question: 'Should I download PNG or SVG?',
      answer:
        'SVG for anything printed or resized, because it is vector and stays perfectly crisp. PNG for screens, email and documents that need a bitmap. Both encode exactly the same data.',
    },
    {
      question: 'Is it safe to put my Wi-Fi password in a QR code?',
      answer:
        'It is convenient, but treat the printed code like the password itself — the password is stored in plain text inside it. For a home network, consider a guest network instead so the code does not expose your main credentials.',
    },
  ],
};
