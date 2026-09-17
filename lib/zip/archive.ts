/**
 * ZIP creation for batch downloads (spec §6.16, Appendix A).
 *
 * `fflate` is used rather than a larger archive library because the only
 * requirement is a flat archive of already-compressed files.
 */

import { zip, type Zippable } from 'fflate';

export type ZipEntry = {
  /** Path inside the archive. Sanitised by the caller. */
  name: string;
  data: Uint8Array;
};

/**
 * Builds a ZIP archive.
 *
 * Images and PDFs are already compressed, so entries are stored with a low
 * deflate level: spending CPU to re-compress them would gain almost nothing and
 * would block the main thread for longer.
 */
export function createZip(entries: readonly ZipEntry[]): Promise<Uint8Array> {
  if (entries.length === 0) {
    return Promise.reject(new Error('There are no files to put in the archive.'));
  }

  const payload: Zippable = {};
  const usedNames = new Set<string>();

  for (const entry of entries) {
    payload[uniqueName(entry.name, usedNames)] = [entry.data, { level: 1 }];
  }

  return new Promise((resolve, reject) => {
    zip(payload, { level: 1 }, (error, data) => {
      if (error) reject(new Error('The archive could not be created.'));
      else resolve(data);
    });
  });
}

/**
 * Ensures every entry has a distinct name.
 *
 * Two inputs called `photo.jpg` from different folders would otherwise collide
 * and one would silently overwrite the other.
 */
export function uniqueName(name: string, used: Set<string>): string {
  if (!used.has(name)) {
    used.add(name);
    return name;
  }

  const dotIndex = name.lastIndexOf('.');
  const base = dotIndex > 0 ? name.slice(0, dotIndex) : name;
  const extension = dotIndex > 0 ? name.slice(dotIndex) : '';

  let counter = 2;
  let candidate = `${base} (${counter})${extension}`;
  while (used.has(candidate)) {
    counter += 1;
    candidate = `${base} (${counter})${extension}`;
  }

  used.add(candidate);
  return candidate;
}
