/**
 * Download helpers (spec §7.5).
 *
 * This module owns object-URL creation and revocation and filename sanitation,
 * so no tool has to remember to do either.
 */

/** Maps a generated artefact to its correct MIME type and extension. */
export const DOWNLOAD_TYPES = {
  csv: { mime: 'text/csv;charset=utf-8', extension: 'csv' },
  txt: { mime: 'text/plain;charset=utf-8', extension: 'txt' },
  json: { mime: 'application/json', extension: 'json' },
  png: { mime: 'image/png', extension: 'png' },
  jpeg: { mime: 'image/jpeg', extension: 'jpg' },
  webp: { mime: 'image/webp', extension: 'webp' },
  svg: { mime: 'image/svg+xml', extension: 'svg' },
  pdf: { mime: 'application/pdf', extension: 'pdf' },
  zip: { mime: 'application/zip', extension: 'zip' },
} as const;

export type DownloadKind = keyof typeof DOWNLOAD_TYPES;

/**
 * Makes a filename safe for every common filesystem.
 *
 * Strips path separators and control characters, collapses whitespace, removes
 * the Windows reserved names, and caps the length. Never returns an empty
 * string, so a download always has a usable name.
 */
export function sanitizeFilename(raw: string, fallback = 'download'): string {
  let name = raw
    .normalize('NFKD')
    // Path separators, null bytes and characters Windows forbids.
    .replace(/[\u0000-\u001f\u007f<>:"/\\|?*]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    // Leading dots would hide the file on Unix and, once separators have been
    // replaced, `../../etc/passwd` leaves a ".. .. etc passwd" prefix. Strip
    // any run of leading dots and spaces, plus trailing dots, which break
    // Windows.
    .replace(/^[.\s]+/, '')
    .replace(/[.\s]+$/, '')
    .trim();

  // Windows reserved device names, with or without an extension.
  if (/^(con|prn|aux|nul|com[1-9]|lpt[1-9])(\.|$)/i.test(name)) {
    name = `file-${name}`;
  }

  if (name.length === 0) name = fallback;
  if (name.length > 120) name = name.slice(0, 120).trim();

  return name;
}

/** Builds a sanitised filename with the extension matching the download kind. */
export function buildFilename(baseName: string, kind: DownloadKind): string {
  const { extension } = DOWNLOAD_TYPES[kind];
  const safeBase = sanitizeFilename(baseName.replace(new RegExp(`\\.${extension}$`, 'i'), ''));
  return `${safeBase}.${extension}`;
}

/** Zero-pads a page or index number so filenames sort correctly. */
export function padIndex(index: number, total: number): string {
  const width = Math.max(3, String(total).length);
  return String(index).padStart(width, '0');
}

/**
 * Triggers a download from a Blob, always revoking the object URL afterwards.
 *
 * The revoke is deferred by a tick because Safari needs the URL to remain live
 * until the click has been processed.
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  try {
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.rel = 'noopener';
    anchor.style.display = 'none';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}

export function downloadText(content: string, baseName: string, kind: DownloadKind): void {
  const blob = new Blob([content], { type: DOWNLOAD_TYPES[kind].mime });
  downloadBlob(blob, buildFilename(baseName, kind));
}
