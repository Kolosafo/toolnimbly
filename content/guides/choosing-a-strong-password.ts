import type { GuideContent } from './types';

export const choosingAStrongPassword: GuideContent = {
  slug: 'choosing-a-strong-password',
  standfirst:
    'Length is the only thing that reliably defeats guessing. Almost everything else people are told about passwords is decoration.',
  intro: [
    'The advice most of us absorbed — mix upper and lower case, add a digit, add a symbol, change it every ninety days — was written for a threat that no longer dominates, and it quietly stopped being recommended years ago. The institution that popularised it, the US National Institute of Standards and Technology, withdrew the composition-rule and forced-rotation advice in its 2017 digital identity guidelines, and has kept it out since.',
    'What replaced it is simpler and more effective: make passwords long, let people use whatever characters they like, stop forcing routine changes, and check new passwords against lists of ones already known to be breached.',
  ],
  sections: [
    {
      heading: 'Entropy is the only score that means anything',
      paragraphs: [
        'A password’s strength against guessing is measured in bits of entropy, and for a randomly generated password it is exactly log₂(alphabet size) × length. That is the whole calculation. Every additional character multiplies the work an attacker must do by the size of the alphabet; every additional symbol type only widens the alphabet slightly.',
        'The consequence is unintuitive but decisive. Growing the alphabet from 62 characters (letters and digits) to 89 (adding symbols) takes each character from 5.95 bits to 6.48 — a 9% improvement. Adding one more character to the password adds a whole character’s worth. Four extra characters beat every symbol you could possibly add.',
      ],
      bullets: [
        '12 characters from letters and digits: about 71 bits.',
        '16 characters from letters and digits: about 95 bits.',
        '12 characters including symbols: about 78 bits — still below the 16-character version with no symbols at all.',
      ],
    },
    {
      heading: 'Why the old rules backfired',
      paragraphs: [
        'Composition rules do not make people generate random passwords. They make people take a password they can remember and deform it in the handful of ways the rule permits. An "A" becomes "@", an "s" becomes "$", a "1" and a "!" land at the end. Attackers have known these substitutions for decades and their cracking tools apply them automatically, so the rule adds far less real entropy than its arithmetic suggests.',
        'Forced rotation failed the same way. Told to change a password every quarter, people iterate: Spring2024!, Summer2024!, Autumn2024!. An attacker who obtains one has an excellent guess at the next. Worse, rotation pushes people to choose weaker passwords in the first place, because a password you must retype and relearn four times a year has to be easy to remember.',
        'The modern guidance keeps one rotation case: change a password immediately when there is evidence it has been compromised. That is the situation the rule was always meant to address.',
      ],
    },
    {
      heading: 'Passphrases, and where they genuinely help',
      paragraphs: [
        'A passphrase is several unrelated words chosen at random. Its strength comes entirely from the randomness of the selection, not from the words looking obscure: each word drawn from a 7,776-word list contributes about 12.9 bits, so six words give roughly 77 bits and seven give about 90.',
        'The critical word is "random". "correct horse battery staple" is strong as an illustration of the principle and worthless as an actual password, because it is famous. A phrase you compose yourself is weaker than it looks, because human word choice is predictable and grammatical structure narrows the field further.',
        'Use a passphrase where you must type the password by hand and from memory — a device login, a disk encryption key, the master password for your password manager. Everywhere else, a manager stores the password for you, so there is no benefit to making it memorable and no reason not to use a long random string.',
      ],
    },
    {
      heading: 'The threats length does not address',
      paragraphs: [
        'Entropy protects against guessing. It does nothing against the two ways passwords are actually lost most often.',
        'The first is reuse. When a site is breached, the credentials are tried against every other service, and a password of 200 bits reused across five sites fails at all five the moment one of them leaks. A unique password per site is worth more than any amount of added length on a shared one.',
        'The second is phishing. A password typed into a convincing imitation of a login page is handed over in full, however strong it was. This is why the strongest single improvement available to most people is not a better password at all: it is a second factor, and preferably a phishing-resistant one such as a passkey or a hardware security key, which will not authenticate to the wrong domain.',
      ],
      bullets: [
        'Never reuse a password across services.',
        'Turn on two-factor authentication, choosing an app or a security key over SMS.',
        'Check whether a password already appears in a known breach before adopting it.',
      ],
    },
  ],
  faqs: [
    {
      question: 'How long should a password actually be?',
      answer:
        'Sixteen random characters is a sensible default for anything stored in a password manager, giving around 95 bits. For something you must type from memory, a six or seven word random passphrase is easier to live with and lands in the same range. Below about 60 bits you are relying on the attacker not trying hard.',
    },
    {
      question: 'Do I still need symbols and mixed case?',
      answer:
        'They help slightly and cost nothing when a manager types the password for you, so leave them on. Just do not trade length for them. Twelve characters with symbols is weaker than sixteen without.',
    },
    {
      question: 'Should I change my passwords regularly?',
      answer:
        'No, not on a schedule. Change one when you have reason to believe it has been exposed — a breach notification, a shared device, a password sent over email. Routine rotation reliably produces weaker, more predictable passwords.',
    },
    {
      question: 'Is a password manager safe if it holds everything?',
      answer:
        'It concentrates risk, and it is still the right trade. A manager makes unique passwords per site practical, which removes the failure mode that actually causes most account compromises. Protect it with a long passphrase and a second factor.',
    },
    {
      question: 'Are passkeys replacing passwords?',
      answer:
        'Gradually, and they solve a different problem. A passkey cannot be phished, because it will only authenticate to the domain it was created for, and there is no secret to leak in a breach. Where a service offers one, it is a genuine improvement rather than a convenience feature.',
    },
  ],
  keyPoints: [
    'Strength is log₂(alphabet) × length — and length is the term you control cheaply.',
    'Composition rules and scheduled rotation were withdrawn from mainstream guidance because they made passwords worse.',
    'A passphrase is only as strong as the randomness of its word selection, never the words themselves.',
    'Uniqueness beats length: one reused password undoes every other precaution.',
    'Against phishing, a second factor does what no password length can.',
  ],
};
