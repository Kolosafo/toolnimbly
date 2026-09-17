import { describe, expect, it } from 'vitest';

import { escapeCsvField, toCsv } from '@/lib/download/csv';
import { buildFilename, DOWNLOAD_TYPES, padIndex, sanitizeFilename } from '@/lib/download/file';
import { FORMAT_DOWNLOAD_KINDS } from '@/lib/image/codec';

describe('filename sanitation', () => {
  it('strips path separators so a name cannot escape the download folder', () => {
    expect(sanitizeFilename('../../etc/passwd')).toBe('etc passwd');
    expect(sanitizeFilename('C:\\Windows\\system32')).toBe('C Windows system32');
    expect(sanitizeFilename('a/b/c')).toBe('a b c');
  });

  it('removes characters that are invalid on Windows', () => {
    expect(sanitizeFilename('in<va>lid:na"me?.txt')).toBe('in va lid na me .txt');
  });

  it('leaves no path traversal residue', () => {
    for (const input of ['../../etc/passwd', '....//....//x', '..\\..\\y']) {
      const result = sanitizeFilename(input);
      expect(result, input).not.toContain('/');
      expect(result, input).not.toContain('\\');
      expect(result.startsWith('.'), input).toBe(false);
    }
  });

  it('strips control characters', () => {
    expect(sanitizeFilename('report\u0000\u001fname.csv')).toBe('report name.csv');
  });

  it('never returns an empty name', () => {
    expect(sanitizeFilename('')).toBe('download');
    expect(sanitizeFilename('   ')).toBe('download');
    expect(sanitizeFilename('...')).toBe('download');
    expect(sanitizeFilename('///')).toBe('download');
  });

  it('avoids Windows reserved device names', () => {
    expect(sanitizeFilename('CON')).toBe('file-CON');
    expect(sanitizeFilename('nul.txt')).toBe('file-nul.txt');
    expect(sanitizeFilename('COM1')).toBe('file-COM1');
    expect(sanitizeFilename('console')).toBe('console'); // not reserved
  });

  it('caps very long names', () => {
    expect(sanitizeFilename('x'.repeat(500)).length).toBeLessThanOrEqual(120);
  });

  it('preserves ordinary names untouched', () => {
    expect(sanitizeFilename('loan-schedule 2026')).toBe('loan-schedule 2026');
  });
});

describe('filename construction', () => {
  it('matches the extension to the download kind', () => {
    expect(buildFilename('schedule', 'csv')).toBe('schedule.csv');
    expect(buildFilename('photo', 'jpeg')).toBe('photo.jpg');
    expect(buildFilename('doc', 'pdf')).toBe('doc.pdf');
  });

  it('does not double an extension that is already present', () => {
    expect(buildFilename('schedule.csv', 'csv')).toBe('schedule.csv');
    expect(buildFilename('photo.jpg', 'jpeg')).toBe('photo.jpg');
  });

  it('agrees with the declared MIME type for every kind', () => {
    for (const [kind, { mime, extension }] of Object.entries(DOWNLOAD_TYPES)) {
      expect(mime.length, kind).toBeGreaterThan(0);
      expect(buildFilename('file', kind as keyof typeof DOWNLOAD_TYPES)).toBe(`file.${extension}`);
    }
  });

  it('maps every image output format to a real download kind', () => {
    // Regression: FORMAT_EXTENSIONS maps image/jpeg to "jpg", which is not a
    // key of DOWNLOAD_TYPES. Passing it through a cast produced an undefined
    // lookup that crashed every JPEG and WebP export at runtime.
    for (const [mime, kind] of Object.entries(FORMAT_DOWNLOAD_KINDS)) {
      expect(DOWNLOAD_TYPES[kind], `${mime} → ${kind}`).toBeDefined();
      expect(buildFilename('photo', kind)).toMatch(/^photo\.(jpg|png|webp)$/);
    }

    expect(buildFilename('photo', FORMAT_DOWNLOAD_KINDS['image/jpeg'])).toBe('photo.jpg');
    expect(buildFilename('photo', FORMAT_DOWNLOAD_KINDS['image/png'])).toBe('photo.png');
    expect(buildFilename('photo', FORMAT_DOWNLOAD_KINDS['image/webp'])).toBe('photo.webp');
  });

  it('zero-pads indices so they sort correctly', () => {
    expect(padIndex(1, 12)).toBe('001');
    expect(padIndex(10, 12)).toBe('010');
    expect(padIndex(7, 1500)).toBe('0007');
    // The failure this prevents: "page-10" sorting before "page-2".
    expect([padIndex(10, 20), padIndex(2, 20)].sort()).toEqual(['002', '010']);
  });
});

describe('CSV escaping', () => {
  it('quotes fields containing a delimiter, quote or newline', () => {
    expect(escapeCsvField('plain')).toBe('plain');
    expect(escapeCsvField('has,comma')).toBe('"has,comma"');
    expect(escapeCsvField('has"quote')).toBe('"has""quote"');
    expect(escapeCsvField('has\nnewline')).toBe('"has\nnewline"');
  });

  it('neutralises spreadsheet formula injection', () => {
    expect(escapeCsvField('=1+1')).toBe("'=1+1");
    expect(escapeCsvField('+SUM(A1)')).toBe("'+SUM(A1)");
    expect(escapeCsvField('@import')).toBe("'@import");
    expect(escapeCsvField('-5')).toBe("'-5");
  });

  it('renders null and undefined as empty fields', () => {
    expect(escapeCsvField(null)).toBe('');
    expect(escapeCsvField(undefined)).toBe('');
  });

  it('passes numbers through', () => {
    expect(escapeCsvField(1234.56)).toBe('1234.56');
    expect(escapeCsvField(0)).toBe('0');
  });
});

describe('CSV generation', () => {
  it('writes a header row and CRLF line endings', () => {
    const csv = toCsv(
      [
        { n: 1, label: 'first' },
        { n: 2, label: 'second' },
      ],
      [
        { header: 'Number', value: (row) => row.n },
        { header: 'Label', value: (row) => row.label },
      ],
    );
    expect(csv).toBe('Number,Label\r\n1,first\r\n2,second\r\n');
  });

  it('handles an empty row set', () => {
    const csv = toCsv([], [{ header: 'Only', value: () => '' }]);
    expect(csv).toBe('Only\r\n');
  });
});
