// A decorative, NOT scannable QR-style graphic for the preview app. Deterministic from a seed.
export function FakeQr({ seed = 1, size = 120, color = "#0A2540", label }: { seed?: number; size?: number; color?: string; label?: string }) {
  const n = 25;
  const cells: boolean[][] = Array.from({ length: n }, () => Array<boolean>(n).fill(false));
  let x = seed * 9301 + 49297;
  const rnd = () => ((x = (x * 9301 + 49297) % 233280) / 233280);
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) cells[r][c] = rnd() > 0.52;
  const finder = (r0: number, c0: number) => {
    for (let r = -1; r <= 7; r++) for (let c = -1; c <= 7; c++) {
      const rr = r0 + r, cc = c0 + c;
      if (rr < 0 || cc < 0 || rr >= n || cc >= n) continue;
      const edge = r === 0 || r === 6 || c === 0 || c === 6;
      const core = r >= 2 && r <= 4 && c >= 2 && c <= 4;
      cells[rr][cc] = r >= 0 && r <= 6 && c >= 0 && c <= 6 && (edge || core);
    }
  };
  finder(0, 0); finder(0, n - 7); finder(n - 7, 0);
  return (
    <svg viewBox={`0 0 ${n} ${n}`} width={size} height={size} role="img" aria-label={label ?? "Sample QR code (not scannable)"} shapeRendering="crispEdges">
      <rect width={n} height={n} fill="#fff" />
      {cells.map((row, r) => row.map((on, c) => (on ? <rect key={`${r}-${c}`} x={c} y={r} width={1} height={1} fill={color} /> : null)))}
    </svg>
  );
}
