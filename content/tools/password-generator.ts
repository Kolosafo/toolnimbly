import type { ToolContent } from '../types';

export const passwordGeneratorContent: ToolContent = {
  slug: 'password-generator',
  valueProposition:
    'Passwords drawn from your operating system random source, with no bias, no storage and no network request.',
  intro:
    'A generated password is only as good as the randomness behind it. This tool draws every character from the Web Crypto API, which is backed by your operating system cryptographic random source, and uses rejection sampling so no character is more likely than another. You choose the length and which character sets to draw from. The password is never stored, never logged and never transmitted — you can verify that in your browser network panel.',
  steps: [
    {
      title: 'Set the length',
      body: 'Anywhere from 8 to 128 characters. The default is 20, which is comfortably strong for a password you keep in a password manager.',
    },
    {
      title: 'Choose the character sets',
      body: 'Uppercase, lowercase, digits and symbols can each be turned on or off. Excluding ambiguous characters removes the pairs that are hard to tell apart when read aloud or typed from a printout.',
    },
    {
      title: 'Require one from every set if you need to',
      body: 'Some sites demand at least one of each selected type. Turning this on guarantees it, and the required characters are then shuffled into random positions.',
    },
    {
      title: 'Generate, reveal and copy',
      body: 'Regenerate as many times as you like. The password is hidden by default; reveal it if you need to type it manually, and copy it straight into your password manager.',
    },
  ],
  example: {
    title: 'What length buys you',
    body: 'Entropy measures how many guesses an attacker would need on average. Each extra character multiplies the work.',
    rows: [
      { label: '8 characters, all four sets', value: 'about 52 bits of entropy' },
      { label: '12 characters, all four sets', value: 'about 78 bits' },
      { label: '16 characters, all four sets', value: 'about 104 bits' },
      { label: '20 characters, all four sets', value: 'about 130 bits' },
    ],
    conclusion:
      'Length gains you more than complexity does. A long password from a smaller alphabet usually beats a short one packed with symbols — and it is far easier to handle.',
  },
  method: {
    title: 'How randomness is generated',
    body: 'Every character is chosen with crypto.getRandomValues. Naively taking a random byte modulo the alphabet size would make the first few characters slightly more likely, so values that would introduce that bias are discarded and redrawn.',
    formulas: [
      'entropy (bits) = length × log₂(alphabet size)',
      'lowercase 26 · uppercase 26 · digits 10 · symbols 30',
      'all four sets: 92 characters → about 6.52 bits per character',
    ],
    notes: [
      'Math.random is never used. It is not a cryptographic generator and is unsuitable for anything that has to stay secret.',
      'Rejection sampling discards raw random values above the largest exact multiple of the alphabet size, so every character is equally likely.',
      'When "require one from every set" is on, the guaranteed characters are placed first and then shuffled with a Fisher-Yates shuffle driven by the same cryptographic source.',
    ],
  },
  limitations: [
    'The entropy figure describes this generator, not your overall security. It cannot account for a site storing passwords badly, a phishing page, or the same password being reused elsewhere.',
    'Excluding ambiguous characters shrinks the alphabet slightly, which lowers entropy a little at the same length. The displayed figure already accounts for it.',
    'Some sites impose maximum lengths or ban certain symbols. If a password is rejected, reduce the length or turn off symbols rather than assuming the generator failed.',
    'No password strength estimate can predict a targeted attack. Treat the number as a comparison between settings, not a guarantee.',
  ],
  privacyNote:
    'The generated password exists only in this page memory. It is never written to storage, never logged, never sent anywhere, and is not included in any analytics event. Closing the tab destroys it.',
  faqs: [
    {
      question: 'Is it safe to generate a password on a website?',
      answer:
        'It depends entirely on whether the generation is local. Here it is: the password is produced by your own browser cryptographic API and never leaves the page. You can confirm this by opening your browser network panel and watching that no request is made when you generate one.',
    },
    {
      question: 'How long should a password be?',
      answer:
        'Sixteen characters or more for anything that matters, and longer for an email account or password manager master password, since those unlock everything else. The default of 20 is a good general choice when a password manager is doing the remembering.',
    },
    {
      question: 'Are symbols really necessary?',
      answer:
        'They help, but less than length does. Adding four characters to a lowercase-and-digit password buys more entropy than sprinkling in a couple of symbols. Use symbols when a site requires them; use length always.',
    },
    {
      question: 'What does "exclude ambiguous characters" do?',
      answer:
        'It removes characters that are easily confused in print — capital O against zero, lowercase l against capital I and the digit one. Useful for a password you will read aloud or copy by hand, unnecessary if it goes straight into a password manager.',
    },
    {
      question: 'Where should I store the password?',
      answer:
        'In a password manager. That is the one habit that makes long, unique, random passwords practical for every account. Writing them down is a distant second, and reusing one strong password everywhere undoes most of the benefit.',
    },
    {
      question: 'What does the entropy number actually mean?',
      answer:
        'It is the base-two logarithm of how many equally likely passwords your settings could produce. Each additional bit doubles that number, so 60 bits is roughly a thousand times harder to brute force than 50.',
    },
  ],
};
