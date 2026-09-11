/** Quote CSV cells and prevent spreadsheet formulas from untrusted lead fields. */
export function escapeCsvCell(value: unknown): string {
  let text = value == null ? '' : String(value);
  if (/^[\s\u0000-\u001f]*[=+\-@]/.test(text) || /^[\t\r\n]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""').replace(/[\r\n]+/g, ' ')}"`;
}
