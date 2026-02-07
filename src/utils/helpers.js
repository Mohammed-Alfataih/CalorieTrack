/**
 * Returns the display name for an entry based on the active language.
 * Falls back to the other language if the preferred one is empty.
 *
 * @param {{ nameEn: string, nameAr: string }} entry
 * @param {"en" | "ar"} lang
 * @returns {string}
 */
export function getEntryName(entry, lang) {
  if (lang === "ar") return entry.nameAr || entry.nameEn;
  return entry.nameEn || entry.nameAr;
}
