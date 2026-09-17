/**
 * EXIF orientation (spec §6 "Shared image rules").
 *
 * A photo taken with the phone rotated is stored unrotated, with a tag saying
 * how to display it. Every transform here applies that rotation to the pixels
 * before anything else, then the metadata is dropped — so the output is upright
 * and carries no GPS coordinates, camera model or timestamp.
 *
 * Modern browsers can do this during decode via
 * `createImageBitmap(blob, { imageOrientation: 'from-image' })`. This parser
 * exists for the cases where that is unavailable or unreliable, and so the
 * behaviour is testable without a browser.
 */

/** The eight EXIF orientation values. 1 means "already upright". */
export type ExifOrientation = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export const ORIENTATION_DESCRIPTIONS: Record<ExifOrientation, string> = {
  1: 'Upright',
  2: 'Mirrored horizontally',
  3: 'Rotated 180°',
  4: 'Mirrored vertically',
  5: 'Mirrored horizontally and rotated 270° clockwise',
  6: 'Rotated 90° clockwise',
  7: 'Mirrored horizontally and rotated 90° clockwise',
  8: 'Rotated 270° clockwise',
};

/** True when the orientation exchanges width and height. */
export function orientationSwapsAxes(orientation: ExifOrientation): boolean {
  return orientation >= 5;
}

/**
 * The canvas transform that renders an image upright.
 *
 * Returned as the six arguments to `CanvasRenderingContext2D.setTransform`,
 * given the *displayed* width and height.
 */
export function orientationTransform(
  orientation: ExifOrientation,
  width: number,
  height: number,
): [number, number, number, number, number, number] {
  switch (orientation) {
    case 2:
      return [-1, 0, 0, 1, width, 0];
    case 3:
      return [-1, 0, 0, -1, width, height];
    case 4:
      return [1, 0, 0, -1, 0, height];
    case 5:
      return [0, 1, 1, 0, 0, 0];
    case 6:
      return [0, 1, -1, 0, width, 0];
    case 7:
      return [0, -1, -1, 0, width, height];
    case 8:
      return [0, -1, 1, 0, 0, height];
    case 1:
    default:
      return [1, 0, 0, 1, 0, 0];
  }
}

const SOI = 0xffd8;
const APP1 = 0xffe1;
const SOS = 0xffda;

/**
 * Reads the orientation tag from a JPEG's EXIF block.
 *
 * Returns 1 when there is no EXIF data, no orientation tag, or the structure is
 * malformed — an unreadable tag should never stop a valid image being
 * processed, it just means no rotation is applied.
 */
export function readJpegOrientation(bytes: Uint8Array): ExifOrientation {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

  if (view.byteLength < 4 || view.getUint16(0, false) !== SOI) return 1;

  let offset = 2;

  // Walk the JPEG segment markers looking for APP1/Exif.
  while (offset + 4 <= view.byteLength) {
    const marker = view.getUint16(offset, false);

    // Entropy-coded data starts here; EXIF cannot appear beyond it.
    if (marker === SOS) return 1;
    // Not a marker at all — the file is malformed.
    if ((marker & 0xff00) !== 0xff00) return 1;

    const segmentLength = view.getUint16(offset + 2, false);
    if (segmentLength < 2) return 1;

    if (marker === APP1) {
      const exifStart = offset + 4;
      // "Exif\0\0"
      if (
        exifStart + 6 <= view.byteLength &&
        view.getUint32(exifStart, false) === 0x45786966 &&
        view.getUint16(exifStart + 4, false) === 0x0000
      ) {
        const orientation = readTiffOrientation(view, exifStart + 6);
        if (orientation) return orientation;
      }
      return 1;
    }

    offset += 2 + segmentLength;
  }

  return 1;
}

/** Reads the orientation tag (0x0112) from a TIFF header at `tiffStart`. */
function readTiffOrientation(view: DataView, tiffStart: number): ExifOrientation | null {
  if (tiffStart + 8 > view.byteLength) return null;

  const byteOrder = view.getUint16(tiffStart, false);
  let littleEndian: boolean;
  if (byteOrder === 0x4949) littleEndian = true; // "II"
  else if (byteOrder === 0x4d4d) littleEndian = false; // "MM"
  else return null;

  // Magic number 42 confirms a TIFF header.
  if (view.getUint16(tiffStart + 2, littleEndian) !== 42) return null;

  const ifdOffset = view.getUint32(tiffStart + 4, littleEndian);
  const ifdStart = tiffStart + ifdOffset;
  if (ifdStart + 2 > view.byteLength) return null;

  const entryCount = view.getUint16(ifdStart, littleEndian);

  for (let index = 0; index < entryCount; index += 1) {
    const entry = ifdStart + 2 + index * 12;
    if (entry + 12 > view.byteLength) return null;

    if (view.getUint16(entry, littleEndian) === 0x0112) {
      const value = view.getUint16(entry + 8, littleEndian);
      if (value >= 1 && value <= 8) return value as ExifOrientation;
      return null;
    }
  }

  return null;
}

/** Reads the orientation of a JPEG Blob, reading only its header. */
export async function readOrientationFromBlob(file: Blob): Promise<ExifOrientation> {
  // 128 KB is comfortably beyond where an EXIF block ever sits.
  const header = await file.slice(0, 131_072).arrayBuffer();
  return readJpegOrientation(new Uint8Array(header));
}
