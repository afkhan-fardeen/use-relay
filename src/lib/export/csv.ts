// CSV/TSV line formatting. Cells starting with = + - @ tab or CR are prefixed with an
// apostrophe so spreadsheets never run them as formulas (CSV injection).

export type Cell = string | number;

export function safeCell(v: Cell): string {
  if (typeof v === "number") return String(v);
  return /^[=+\-@\t\r]/.test(v) ? `'${v}` : v;
}

export function csvLine(cells: Cell[], delimiter: string): string {
  const esc = (s: string) => (s.includes(delimiter) || /["\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s);
  return cells.map((c) => esc(safeCell(c))).join(delimiter) + "\r\n";
}
