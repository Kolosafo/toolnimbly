/**
 * Extra explanatory context for every tool page (SEO build brief §4).
 *
 * The ordinary content module explains the method and the immediate limits.
 * These sections answer the next question a careful user has: what changes the
 * result, what does not, and where do otherwise sensible workflows go wrong?
 * Keeping them keyed by canonical slug makes the content-depth requirement
 * auditable without bloating the interactive client bundles.
 */

export type ToolDeepDive = {
  readonly heading: string;
  readonly paragraphs: readonly [string, string];
};

export const toolDeepDives: Readonly<Record<string, ToolDeepDive>> = {
  'percentage-calculator': {
    heading: 'Choosing the right percentage comparison',
    paragraphs: [
      'A percentage only makes sense after you choose the base. Twenty is 20% of 100, but 100 is 500% of 20. That is why “what percentage is A of B?” is not interchangeable with “what percentage is B of A?” The denominator is the reference quantity, and changing it changes the answer. For a discount, the original price is normally the base. For growth, the earlier value is the base. For a margin, revenue is the base rather than cost.',
      'Percentage change also differs from percentage-point change. If an interest rate moves from 4% to 5%, it rises by one percentage point but by 25% relative to its old level. Reversing a percentage requires division as well: adding 20% and then subtracting 20% does not return to the start because the second operation uses a larger base. Naming the base and the type of comparison before calculating prevents most percentage mistakes.',
    ],
  },
  'loan-calculator': {
    heading: 'Why a lender’s schedule can differ',
    paragraphs: [
      'This calculator models a conventional fixed-rate loan with one payment period per month. Real contracts can accrue interest daily, choose a payment date that creates a short first period, or add fees to the financed balance. Each choice changes the lender’s schedule even when the advertised amount, rate and term look identical. Rounding can also happen at each payment rather than only in the displayed totals, leaving a small final adjustment.',
      'An extra payment only produces the illustrated saving when the lender applies it directly to principal. Some lenders hold it for the next instalment, recalculate the required payment, or charge a prepayment fee. Ask for a payoff statement when exact settlement figures matter. It includes interest accrued since the last statement and any contract-specific charges that a general calculator cannot know, so it is the correct figure for refinancing or closing the loan.',
    ],
  },
  'mortgage-calculator': {
    heading: 'What sits outside the mortgage formula',
    paragraphs: [
      'Principal and interest follow a predictable amortisation formula, but the amount leaving a homeowner’s account often includes more. Property tax, buildings insurance, mortgage insurance and association charges can be collected into an escrow payment. Those costs can change each year even on a fixed-rate mortgage, so a fixed loan payment does not necessarily mean a fixed housing payment.',
      'Loan-to-value is another moving part. It compares the loan with the property value used by the lender, not automatically the price you entered. A different appraisal can affect the available rate or whether mortgage insurance is required. The calculator is most useful for comparing scenarios on the same assumptions: change the deposit, rate or term and observe the difference. For an actual purchase, replace every estimate with the lender’s disclosure, the local tax bill and a current insurance quote.',
    ],
  },
  'compound-interest-calculator': {
    heading: 'Rate, compounding and contribution timing',
    paragraphs: [
      'The stated annual rate and the effective annual return are not always the same. A nominal 6% rate compounded monthly applies 0.5% each month and produces slightly more than 6% over a full year because later months earn a return on earlier interest. If an account quotes an annual percentage yield, that figure may already include compounding; treating it as a nominal rate would count the effect twice.',
      'Regular contributions add another timing choice. Money deposited at the start of a month earns for one period longer than money deposited at the end, and that difference compounds across a long projection. Real investments also have uneven returns, fees, taxes and sometimes contribution limits. A constant-rate result is therefore a planning scenario, not a forecast. Compare several plausible rates and focus on the range of outcomes rather than treating the largest total as a promise.',
    ],
  },
  'salary-calculator': {
    heading: 'What an hourly equivalent does and does not show',
    paragraphs: [
      'An annual salary becomes an hourly figure only after choosing working hours and paid weeks. A 40-hour week across 52 paid weeks uses 2,080 hours, but unpaid leave, seasonal work or a different weekly schedule changes the denominator. Overtime makes the comparison more complicated because an hourly role may pay a premium after a threshold while a salaried role may include extra hours without extra pay.',
      'The converter deliberately compares gross rates. It does not infer income tax, pension contributions, health insurance, bonuses or the cash value of paid leave. When comparing two jobs, calculate the base pay on the hours you realistically expect to work and list benefits separately. A lower headline salary can still provide better effective compensation if it has fewer hours, more paid time off or employer contributions that the other offer lacks.',
    ],
  },
  'age-calculator': {
    heading: 'Why calendar age is not elapsed time divided by 365',
    paragraphs: [
      'Calendar age is built from anniversaries, not from an average year length. The calculator first counts complete years, then complete months after the last anniversary, and finally the remaining days. Dividing elapsed days by 365 fails around leap years and month ends because calendar months are not equally long. The years-months-days result is therefore a calendar description, while total days is an elapsed-duration measurement.',
      'A date without a time zone is intentionally treated as a calendar date. Converting midnight through a time-zone offset can otherwise move it into the previous day and create an off-by-one result. People born on 29 February also need a convention for non-leap-year anniversaries; legal and cultural rules differ between 28 February and 1 March. The calculator reports the mathematical calendar interval, not a jurisdiction-specific legal age rule.',
    ],
  },
  'date-difference-calculator': {
    heading: 'Inclusive dates, business days and month lengths',
    paragraphs: [
      'Two dates define boundaries, but the question decides whether both boundaries count. From Monday to Tuesday is one elapsed day, yet a booking that occupies both Monday and Tuesday covers two calendar dates. The “include end date” option makes that distinction explicit instead of hiding it in the result. Business-day mode removes Saturdays and Sundays, but it cannot know local public holidays unless a holiday calendar is supplied.',
      'Months and years are calendar units rather than fixed durations. One month after 31 January may land at the end of February, while thirty elapsed days may land in March. For deadlines, billing periods and age calculations, the calendar breakdown is usually clearer. For service-level measurements or data analysis, total days is usually safer. Write down the inclusion rule whenever another person must reproduce the result.',
    ],
  },
  'bmi-calculator': {
    heading: 'Using BMI as a screening measure',
    paragraphs: [
      'BMI relates weight to height and is useful for describing populations because both inputs are easy to collect consistently. It does not measure body fat directly and cannot distinguish muscle, bone, fluid or fat. Two people with the same BMI can therefore have very different body composition, fitness and health risk. Age, pregnancy, ethnicity, disability and athletic training can also affect how useful the standard adult categories are.',
      'A single number should not be used to diagnose a condition or prescribe weight change. Trends, waist measurement, blood pressure, laboratory results, medication and clinical history can matter more. If a result worries you, discuss it with a qualified health professional who can interpret it in context. For children and teenagers, adult category thresholds are inappropriate; clinicians use age- and sex-specific growth references instead.',
    ],
  },
  'calorie-calculator': {
    heading: 'Why calorie needs are an estimate',
    paragraphs: [
      'The Mifflin–St Jeor equation estimates resting energy use from age, height, weight and sex, then an activity multiplier turns that estimate into daily expenditure. The multiplier is the largest uncertainty because labels such as “moderately active” compress work, training, walking and individual physiology into one category. Two people with identical inputs can still have meaningfully different needs.',
      'Use the result as a starting range and compare it with several weeks of real intake and weight trend. Day-to-day scale movement is mostly water, food and glycogen, so one reading is not evidence that an estimate is wrong. Medical conditions, pregnancy, breastfeeding, growth, eating-disorder history and some medicines require individual guidance. The illustrative loss and gain targets are not prescriptions and should never replace advice from a qualified clinician or dietitian.',
    ],
  },
  'qr-code-generator': {
    heading: 'What makes a QR code reliable',
    paragraphs: [
      'A QR code stores the exact payload plus error-correction data. Longer text creates a denser grid with smaller modules, which becomes harder to scan when printed small or viewed from a distance. A short web address is usually more reliable than a long tracking URL. The blank quiet zone around the code is part of the symbol, so cropping it tightly or placing graphics against the edges can break detection.',
      'Error correction can recover some damaged or obscured modules, but it does not make every design safe. Low contrast, reflective paper, stretching and heavy logo overlays remain common causes of failure. Test the finished code on more than one phone, from the expected distance, and test the actual printed version rather than only the image on screen. A QR code encodes data; it does not verify that a destination is trustworthy or will remain online.',
    ],
  },
  'password-generator': {
    heading: 'Strength comes from randomness and uniqueness',
    paragraphs: [
      'A password is hard to guess when it has enough unpredictable possibilities. Adding length increases that space far more reliably than replacing a few letters with familiar symbols. Randomly generated characters are strong because each position is independent; a human-made pattern such as a name plus a year remains predictable even when it satisfies a site’s complexity rules.',
      'Uniqueness matters just as much. Reusing one excellent password lets a breach at one service unlock every other account. Store generated passwords in a reputable password manager and enable multi-factor authentication where it is available. Some sites silently truncate long passwords or reject certain symbols, so use the longest random value the service accepts and verify that it was saved. Never send a generated password through an untrusted message or paste it into a password-strength site.',
    ],
  },
  'uuid-generator': {
    heading: 'What UUID v4 uniqueness means',
    paragraphs: [
      'A version 4 UUID is mostly random data with a few bits reserved to identify its version and variant. That leaves 122 random bits, an enormous space in which independently generated identifiers are extraordinarily unlikely to collide. The guarantee is probabilistic rather than absolute, so systems that cannot tolerate any duplicate should still enforce a unique database constraint.',
      'Formatting choices do not change the underlying identifier. Uppercase, braces and removed hyphens only change its written representation, although a receiving system may insist on the standard lowercase hyphenated form. UUIDs are identifiers, not secrets: they can appear in logs, URLs and exported data and should not be treated as access tokens. Use a cryptographically secure random source when unpredictability matters, which is why this generator relies on the browser’s crypto API.',
    ],
  },
  'word-counter': {
    heading: 'Why word counts vary between editors',
    paragraphs: [
      'There is no universal rule for every piece of punctuation. Editors can disagree about hyphenated compounds, apostrophes, emoji, web addresses and languages that do not separate words with spaces. A document application may also count headers, footnotes, comments and text boxes that are absent from copied body text. This tool applies one consistent segmentation rule to exactly what is in the box.',
      'Reading and speaking times are estimates derived from average rates, not measurements of a particular reader. Technical material, unfamiliar names, tables and deliberate pauses slow delivery; simple prose may be much faster. Keyword frequency is descriptive too. A common word is not automatically a good search keyword, and repeating it unnaturally can make writing worse. Use the figures to check a limit or spot patterns, then review the text in context.',
    ],
  },
  'character-counter': {
    heading: 'A character has more than one technical meaning',
    paragraphs: [
      'What a reader sees as one character can contain several Unicode code points. An accented letter may be stored as one precomposed code point or as a base letter followed by a combining mark, and many emoji are sequences joined together. JavaScript string length counts UTF-16 code units, while a database or API may limit code points, grapheme clusters or encoded bytes. Those totals can legitimately differ.',
      'Use the visible-character count for human-facing limits such as captions. Use UTF-8 bytes when an API, file format or database column specifies a byte limit. Normalising text can make canonically equivalent accents use the same representation, but it should not be done silently because identifiers and signatures may depend on the original bytes. Always match the counter to the definition in the system enforcing the limit.',
    ],
  },
  'case-converter': {
    heading: 'Case conversion needs word-boundary rules',
    paragraphs: [
      'Changing every letter to upper- or lowercase is straightforward. Converting to camelCase, snake_case or title case first requires deciding where words begin and end. Spaces and punctuation are obvious separators, but existing capitals, numbers, acronyms and non-Latin scripts create ambiguous cases. “XMLHttpRequest” might be read as XML, Http and Request or as several individual capitals depending on the algorithm.',
      'Title case is a style decision rather than a universal transformation. Editorial styles disagree about short articles, prepositions and the first word after a colon. Code-oriented formats are stricter, but changing an identifier’s case can still break a reference in a case-sensitive language or file system. Treat the output as an editable draft, especially for names, acronyms and program identifiers, and compare it with the conventions of the destination system.',
    ],
  },
  'image-compressor': {
    heading: 'Where image file-size savings come from',
    paragraphs: [
      'Image size is controlled by pixel dimensions, colour detail, format and encoder settings. Reducing dimensions removes pixels permanently and usually creates the largest saving when a camera image is being prepared for a screen. Lossy quality settings keep the dimensions but discard detail that the encoder expects people not to notice. Lossless compression keeps every decoded pixel and therefore has a smaller ceiling.',
      'The best setting depends on the subject. Photographs tolerate JPEG or WebP compression well, while screenshots and text expose ringing and blur sooner. Transparency rules out ordinary JPEG unless transparent pixels are flattened onto a chosen background. Compare the downloaded result at its intended display size, not only as a zoomed preview. Repeatedly saving a lossy file compounds damage, so keep an original and create new delivery copies from it.',
    ],
  },
  'jpg-compressor': {
    heading: 'How JPEG quality affects a photograph',
    paragraphs: [
      'JPEG divides an image into blocks, transforms their colour information and rounds away detail according to a quantisation table. A quality slider controls that rounding, but quality values are not standardised between applications. A setting of 75 in one encoder does not promise the same file size or appearance as 75 in another. Fine textures, noise and sharp text usually need more data than smooth skies or softly focused backgrounds.',
      'Reducing dimensions before encoding is often the cleanest way to reach a web-size target because it removes detail that cannot be displayed anyway. Metadata can also add size, although it is rarely the main cause in a large photograph. Judge the result around edges, gradients and faces, and avoid compressing the same JPEG repeatedly. Keep the original file so a future size or quality can be produced without another generation of loss.',
    ],
  },
  'png-compressor': {
    heading: 'Why some PNG files shrink more than others',
    paragraphs: [
      'PNG uses lossless filtering and DEFLATE compression, so its success depends on repeated patterns. Flat colours, simple icons and screenshots often compress well; photographic noise produces few repetitions and can remain surprisingly large. Re-optimising the lossless stream may save space without changing a pixel, but it cannot make a photograph behave like a simple graphic.',
      'Lossy PNG tools usually reduce the colour palette or merge nearly identical colours before the normal PNG compressor runs. That can create a dramatic saving while retaining transparency, but gradients may band and small colour differences may disappear. Compare transparent edges against both light and dark backgrounds because halos are easy to miss on one. If the destination accepts WebP or AVIF, those formats are often smaller for complex images, while PNG remains dependable for exact pixels and broad compatibility.',
    ],
  },
  'image-resizer': {
    heading: 'Resampling, aspect ratio and output sharpness',
    paragraphs: [
      'Resizing is not just changing width and height metadata. The browser resamples the pixel grid, estimating new pixels from the old ones. Shrinking usually looks clean because several source pixels contribute to one output pixel. Enlarging must invent intermediate detail, so it can soften edges without revealing information that the original never captured.',
      'Locking the aspect ratio prevents circles becoming ovals and people appearing stretched. “Contain” fits the whole image inside a box and may leave unused space; “cover” fills the box by cropping an edge. Social platforms can crop again after upload, so keep important content away from the boundary and use the platform’s current recommended dimensions. Export format and quality still matter after resizing, and a smaller pixel grid does not guarantee a small file if it is saved inefficiently.',
    ],
  },
  'image-cropper': {
    heading: 'A crop changes composition, not just dimensions',
    paragraphs: [
      'Cropping selects a rectangle from the transformed image. Rotation, zoom and flip therefore affect which source pixels fall inside that rectangle, and the crop must be mapped back to full-resolution coordinates before export. A preview can be smaller than the original for speed, but the downloaded result should be sampled from the original pixels so detail is not limited by the screen-sized canvas.',
      'A fixed ratio controls shape rather than final resolution. A square crop can still be 300 pixels or 3,000 pixels wide, so resize afterward when a platform specifies exact dimensions. Phones may store orientation as metadata instead of physically rotating pixels; applying that orientation before the crop avoids sideways or mirrored output. Keep a margin around faces, logos and text when another service may apply its own responsive crop.',
    ],
  },
  'jpg-to-png': {
    heading: 'What converting JPEG to PNG can preserve',
    paragraphs: [
      'PNG stores the pixels decoded from the JPEG without adding another lossy compression step. It cannot reconstruct detail the original JPEG discarded, remove block artefacts or create genuine transparency. The visual result should look the same, but the file is often larger because PNG is trying to preserve photographic pixels exactly rather than approximating them efficiently.',
      'Conversion is useful when a program requires PNG, when later editing needs repeated lossless saves, or when a graphic must be combined with transparency added in an editor. It is not an image-enhancement technique. If the final destination accepts JPEG, keeping the original avoids unnecessary size. If it accepts WebP or AVIF, those may provide a better balance for the web. Always compare dimensions and colour appearance after conversion, especially when the source contains an embedded colour profile.',
    ],
  },
  'png-to-jpg': {
    heading: 'Flattening transparency before JPEG export',
    paragraphs: [
      'JPEG has no alpha channel, so every transparent PNG pixel must be combined with a solid background. A logo designed for a dark page can gain a pale fringe when flattened onto white because partly transparent edge pixels already contain blended colour. Choose the same background that will surround the image, or keep PNG when the background is unknown.',
      'The quality control then introduces normal JPEG loss. Photographs generally shrink well, but text, diagrams and hard-edged icons can develop ringing around lines. The conversion also cannot reduce dimensions unless resizing is a separate step. Check the final image at normal size and at the edge of formerly transparent areas. Keep the source PNG because converting the JPEG back later will neither restore transparency nor undo compression damage.',
    ],
  },
  'image-to-pdf': {
    heading: 'Pixels, page size and printable resolution',
    paragraphs: [
      'A PDF page has a physical size, while an image starts with pixel dimensions. Fitting the image onto A4 or Letter determines how densely those pixels will print. A 1,200-pixel image spread across ten inches provides roughly 120 pixels per inch; the same image printed five inches wide provides about 240. The PDF does not create extra detail when a small image is stretched.',
      'Margins reduce the printable area and help keep content away from printer edges. “Contain” preserves the entire image and may leave white space; cropping to fill would remove part of it. Reordering changes the reading sequence, so check thumbnails before download. Large photographs can make a very large PDF because each page carries image data. Resize or compress copies first when screen viewing matters more than high-resolution printing, and retain the originals separately.',
    ],
  },
  'pdf-to-jpg': {
    heading: 'Rasterising a PDF page',
    paragraphs: [
      'A PDF can contain text, vectors and images at several resolutions. Converting a page to JPG renders all of them onto one pixel grid. The selected scale controls that grid: a higher value makes small text and lines sharper but increases memory use and file size. Once rasterised, text is no longer selectable and vector artwork no longer scales without softening.',
      'JPEG is best for pages dominated by photographs. Diagrams, screenshots and small type may look cleaner as PNG because JPEG can create ringing around hard edges. Password-protected, damaged or unusually complex PDFs may fail to render, and colour can vary when a document uses print-oriented colour spaces. Export only the pages and resolution you need, then inspect fine text at 100% before discarding the original PDF.',
    ],
  },
  'jpg-to-pdf': {
    heading: 'Turning photographs into document pages',
    paragraphs: [
      'A PDF gives a set of photographs a stable page order and physical page size. The image can be embedded or drawn onto the page, but wrapping it in PDF does not improve its resolution. Automatic orientation uses the image dimensions and stored camera orientation to choose a sensible page direction; margins then determine the maximum area available without cropping.',
      'File size is still driven mainly by the photographs. A set of full-resolution phone images can produce a document far larger than an email service accepts. Resize or compress copies before assembly when the document is for screen reading, and keep the originals for printing. Check the order after adding files because camera filenames do not always sort chronologically. Scanned documents may also need optical character recognition elsewhere if searchable text is required.',
    ],
  },
  'pdf-compressor': {
    heading: 'Structural optimisation versus raster compression',
    paragraphs: [
      'A PDF is a container, so there is no single compression method that helps every document. Structural optimisation removes redundant objects and rewrites streams without changing the visible pages. It is safe for selectable text and vectors but may save little when the source is already optimised. Raster compression renders pages as images, which can save far more on scans and image-heavy documents.',
      'The trade-off is substantial: rasterisation can remove selectable text, links, form fields, annotations, layers and digital signatures. A signed document may become visually similar but cryptographically invalid after any rewrite. Resolution and JPEG quality determine whether small print remains readable. Test a few representative pages before processing an important archive, keep the original, and use a dedicated archival or document-management workflow when legal authenticity, accessibility or searchable text must be preserved.',
    ],
  },
  'pdf-merger': {
    heading: 'What merging preserves and what it can change',
    paragraphs: [
      'A page-copy merger keeps each page’s dimensions, rotation, text and vector content rather than taking screenshots. That is why mixed A4, Letter and landscape pages can coexist in the result. Shared fonts and images may be copied into the new container, so the final size is not always exactly the sum of the inputs and may sometimes be slightly larger.',
      'Document-level features need more caution. Bookmarks, forms, attachments, metadata, page labels and digital signatures do not behave like ordinary page content and may not survive or remain valid after assembly. A signed source cannot stay cryptographically signed once placed in a new file. Confirm the order, open the downloaded PDF and test important links or forms. Keep the originals whenever the source documents have legal, archival or accessibility requirements.',
    ],
  },
  'pdf-splitter': {
    heading: 'Why an extracted PDF may still be large',
    paragraphs: [
      'Splitting copies selected pages into a new document without re-rendering them. Text stays selectable, vectors remain sharp and original page dimensions are retained. A one-page output may nevertheless contain shared fonts, colour profiles or resources needed by that page, so its size is not guaranteed to be the original size divided by the number of pages.',
      'Ranges should be checked against the displayed one-based page numbers, especially when the document itself prints different page labels such as roman numerals. Removing pages can also break bookmarks or links that point to material no longer present. Forms, attachments and digital signatures are document-level features and may not survive extraction as expected. Open the result before deleting the source, and use a specialist workflow when signatures or archival fidelity matter.',
    ],
  },
  'invoice-generator': {
    heading: 'An invoice is a record, not only a layout',
    paragraphs: [
      'A useful invoice identifies the seller and customer, describes what was supplied, shows the calculation and states when and how payment is due. A unique invoice number creates the audit trail that connects the document to accounting entries, messages and payments. Numbers should not be silently reused or changed after issue; corrections are normally handled through an amended document or credit note according to local practice.',
      'Tax requirements vary by country, registration status and transaction type. A generic generator cannot decide whether tax applies, which registration number must appear or how long records must be retained. Configure the fields from authoritative local guidance or an accountant, and verify currency, rounding and payment instructions before sending. Save a durable copy outside the browser because the generated PDF is the business record; the site does not store or recover it for you.',
    ],
  },
  'receipt-generator': {
    heading: 'A receipt records payment, not merely a sale',
    paragraphs: [
      'A receipt should make clear what was paid, when it was paid, who received it and which payment method was used. That distinguishes it from an invoice, which requests payment and may still be outstanding. If a payment settles a numbered invoice, including that reference helps both parties reconcile their records without treating the receipt as a second sale.',
      'Local rules may require tax numbers, sequential receipt numbers, fiscal devices or prescribed wording. Refunds and partial payments also need an audit trail rather than an edited copy that hides the earlier transaction. Check the completed totals and payment status, then save or print the result immediately. The browser creates the document locally and ToolNimbly does not retain a backup, so your own accounting or records system remains the source of truth.',
    ],
  },
};

export function findToolDeepDive(slug: string): ToolDeepDive | undefined {
  return toolDeepDives[slug];
}
