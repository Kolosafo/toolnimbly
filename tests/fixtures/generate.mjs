/**
 * Generates the image fixtures used by the unit and end-to-end suites.
 *
 * Every file produced here is synthetic and contains no personal data, which is
 * the rule SECURITY.md sets for anything in this directory. Run with:
 *
 *   node tests/fixtures/generate.mjs
 *
 * The output is committed so that CI does not depend on regenerating it.
 */

import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const outputDir = join(here, 'images');
mkdirSync(outputDir, { recursive: true });

// --- PNG ---------------------------------------------------------------------

function crc32(buffer) {
  let table = crc32.table;
  if (!table) {
    table = crc32.table = new Int32Array(256);
    for (let n = 0; n < 256; n += 1) {
      let c = n;
      for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      table[n] = c;
    }
  }
  let crc = -1;
  for (const byte of buffer) crc = (crc >>> 8) ^ table[(crc ^ byte) & 0xff];
  return (crc ^ -1) >>> 0;
}

function pngChunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const typeAndData = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(typeAndData), 0);
  return Buffer.concat([length, typeAndData, crc]);
}

/**
 * Writes a PNG.
 *
 * `pixel(x, y)` returns [r, g, b, a]. Colour type 6 (RGBA) is always used so a
 * transparent fixture is a one-line change.
 */
function makePng(width, height, pixel) {
  const raw = Buffer.alloc(height * (1 + width * 4));
  let offset = 0;
  for (let y = 0; y < height; y += 1) {
    raw[offset] = 0; // filter type: none
    offset += 1;
    for (let x = 0; x < width; x += 1) {
      const [r, g, b, a] = pixel(x, y);
      raw[offset] = r;
      raw[offset + 1] = g;
      raw[offset + 2] = b;
      raw[offset + 3] = a;
      offset += 4;
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // colour type RGBA
  ihdr[10] = 0; // deflate
  ihdr[11] = 0; // adaptive filtering
  ihdr[12] = 0; // no interlace

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', deflateSync(raw)),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

// --- JPEG --------------------------------------------------------------------

/**
 * A minimal valid baseline JPEG, 8×8, solid mid-grey.
 *
 * Handcrafting a JPEG encoder is out of scope for a fixture, so this is a known
 * good minimal file produced once and embedded here. It carries no EXIF, which
 * is what makes it a clean base for the orientation variants below.
 */
const BASE_JPEG_BASE64 =
  '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0a' +
  'HBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIy' +
  'MjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAAIAAgDASIA' +
  'AhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQA' +
  'AAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3' +
  'ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWm' +
  'p6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEA' +
  'AwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSEx' +
  'BhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElK' +
  'U1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3' +
  'uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD3+iii' +
  'gD//2Q==';

/**
 * Inserts an EXIF APP1 segment carrying the given orientation.
 *
 * The segment is written immediately after the SOI marker, which is where
 * decoders expect it.
 */
function withExifOrientation(jpeg, orientation) {
  const tiff = Buffer.alloc(8 + 2 + 12 + 4);
  let offset = 0;
  tiff.write('MM', offset, 'ascii'); // big-endian
  offset += 2;
  tiff.writeUInt16BE(42, offset); // TIFF magic
  offset += 2;
  tiff.writeUInt32BE(8, offset); // offset to IFD0
  offset += 4;
  tiff.writeUInt16BE(1, offset); // one entry
  offset += 2;
  tiff.writeUInt16BE(0x0112, offset); // Orientation tag
  offset += 2;
  tiff.writeUInt16BE(3, offset); // type SHORT
  offset += 2;
  tiff.writeUInt32BE(1, offset); // count
  offset += 4;
  tiff.writeUInt16BE(orientation, offset); // value, left-aligned in 4 bytes
  offset += 2;
  tiff.writeUInt16BE(0, offset); // padding
  offset += 2;
  tiff.writeUInt32BE(0, offset); // next IFD: none

  const exifBody = Buffer.concat([Buffer.from('Exif\0\0', 'binary'), tiff]);
  const segment = Buffer.alloc(4 + exifBody.length);
  segment.writeUInt16BE(0xffe1, 0); // APP1
  segment.writeUInt16BE(exifBody.length + 2, 2); // segment length
  exifBody.copy(segment, 4);

  return Buffer.concat([jpeg.subarray(0, 2), segment, jpeg.subarray(2)]);
}

// --- Write the fixtures ------------------------------------------------------

const files = [];
const write = (name, buffer) => {
  writeFileSync(join(outputDir, name), buffer);
  files.push(`${name} (${buffer.length} bytes)`);
};

// A gradient, so a resize visibly changes content rather than a flat colour.
write(
  'gradient-64x32.png',
  makePng(64, 32, (x, y) => [(x * 4) % 256, (y * 8) % 256, 128, 255]),
);

// Half transparent, for alpha preservation and matte compositing tests.
write(
  'transparent-32x32.png',
  makePng(32, 32, (x) => [255, 0, 0, x < 16 ? 255 : 0]),
);

// Wide and tall, for aspect-ratio and fit-mode tests.
write('wide-100x20.png', makePng(100, 20, () => [0, 128, 255, 255]));
write('tall-20x100.png', makePng(20, 100, () => [255, 128, 0, 255]));

const baseJpeg = Buffer.from(BASE_JPEG_BASE64, 'base64');
write('plain.jpg', baseJpeg);

for (let orientation = 1; orientation <= 8; orientation += 1) {
  write(`orientation-${orientation}.jpg`, withExifOrientation(baseJpeg, orientation));
}

// Deliberately broken inputs: these must fail cleanly, never hang.
write('truncated.jpg', baseJpeg.subarray(0, Math.floor(baseJpeg.length / 3)));
write('not-an-image.txt', Buffer.from('This is plain text, not an image.\n', 'utf8'));
// A PNG signature followed by nonsense: passes sniffing, fails decoding.
write(
  'corrupt.png',
  Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    Buffer.from('not actually png data', 'utf8'),
  ]),
);

console.log(`Wrote ${files.length} fixtures to ${outputDir}:`);
for (const file of files) console.log(`  ${file}`);
