/** A tiny looping picture of what the app does: rows arrive in a sheet, then the file is ready. Pure CSS, decorative. */
const ROWS: [string, string, string][] = [
  ["TEE-001", "Classic tee", "24.00"],
  ["TEE-002", "Classic tee, L", "24.00"],
  ["HOOD-010", "Zip hoodie", "62.00"],
  ["CAP-004", "Canvas cap", "18.00"],
  ["BAG-120", "Tote bag", "29.00"],
];
export function ExportDemo() {
  return (
    <div aria-hidden="true" className="demo rounded-card border border-line-strong bg-white text-[13px] overflow-hidden">
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <span className="text-muted">products.xlsx</span>
        <span className="demo-badge rounded-ctl border border-primary px-2 py-0.5 text-xs">Ready</span>
      </div>
      <div className="grid grid-cols-[1fr_1.6fr_.7fr] border-b border-line bg-surface px-4 py-2 text-muted"><span>SKU</span><span>Title</span><span className="text-right">Price</span></div>
      {ROWS.map(([a, b, c], i) => (
        <div key={a} className="demo-row grid grid-cols-[1fr_1.6fr_.7fr] border-b border-line px-4 py-2.5 last:border-0" style={{ "--i": i } as React.CSSProperties}>
          <span>{a}</span><span>{b}</span><span className="text-right tabular">{c}</span>
        </div>
      ))}
      <div className="demo-bar h-0.5 bg-primary" />
    </div>
  );
}
