// Turns QR content into a real, scannable image: SVG for the page and downloads, and a plain pixel
// buffer for tests. Client-safe. Uses the `qrcode` library only to work out which modules are dark.

import QRCode from "qrcode";

export type QrShape = "square" | "rounded" | "dots";
export type QrStyle = { fg: string; bg: string; shape: QrShape; logo?: string | null };

export const DEFAULT_STYLE: QrStyle = { fg: "#0A2540", bg: "#FFFFFF", shape: "square", logo: null };
export const QUIET_ZONE = 4; // modules of empty border; required for reliable scanning

export const isHexColor = (v: unknown): v is string => typeof v === "string" && /^#[0-9a-fA-F]{6}$/.test(v);
export const MAX_LOGO_CHARS = 200_000;
export const isLogoDataUrl = (v: unknown): v is string =>
  typeof v === "string" && v.length <= MAX_LOGO_CHARS && /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(v);

function luminance(hex: string): number {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}
/** WCAG contrast ratio. Below about 3 a code often fails to scan; the dark colour should also be the darker one. */
export function contrastRatio(a: string, b: string): number {
  const [l1, l2] = [luminance(a), luminance(b)];
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}
/** Most scanners expect dark modules on a light background. */
export const isInverted = (s: QrStyle) => luminance(s.fg) > luminance(s.bg);

export type Layout = {
  n: number; // modules per side
  dark: boolean[][];
  total: number; // modules per side including the quiet zone
  logo: { x: number; y: number; w: number } | null; // in modules, inside the code (no quiet zone offset)
  version: number;
};

/** Which modules are dark, and where the logo hole is. Throws if the content is too long for a QR code. */
export function qrLayout(content: string, style: Pick<QrStyle, "logo">): Layout {
  const q = QRCode.create(content, { errorCorrectionLevel: style.logo ? "H" : "M" });
  const n = q.modules.size;
  const dark: boolean[][] = Array.from({ length: n }, (_, r) => Array.from({ length: n }, (_, c) => !!q.modules.get(r, c)));
  let logo: Layout["logo"] = null;
  if (style.logo) {
    // About 4% of the area: well inside what level H can recover, and keeps the finder patterns clear.
    const w = Math.max(5, Math.round(n * 0.2));
    const x = Math.floor((n - w) / 2);
    logo = { x, y: x, w };
    for (let r = x - 1; r < x + w + 1; r++) for (let c = x - 1; c < x + w + 1; c++) if (dark[r]?.[c] !== undefined) dark[r][c] = false;
  }
  return { n, dark, total: n + QUIET_ZONE * 2, logo, version: q.version };
}

const inFinder = (n: number, r: number, c: number) => (r < 7 && c < 7) || (r < 7 && c >= n - 7) || (r >= n - 7 && c < 7);

/** SVG markup. Colours and the logo are validated before they get here. */
export function qrSvg(content: string, style: QrStyle): string {
  const fg = isHexColor(style.fg) ? style.fg : DEFAULT_STYLE.fg;
  const bg = isHexColor(style.bg) ? style.bg : DEFAULT_STYLE.bg;
  const L = qrLayout(content, style);
  const m = QUIET_ZONE;
  const squares: string[] = [];
  const shapes: string[] = [];
  for (let r = 0; r < L.n; r++) {
    let c = 0;
    while (c < L.n) {
      if (!L.dark[r][c]) { c++; continue; }
      if (style.shape === "square" || inFinder(L.n, r, c)) {
        let run = 1;
        while (c + run < L.n && L.dark[r][c + run] && (style.shape === "square" || inFinder(L.n, r, c + run))) run++;
        squares.push(`M${c + m} ${r + m}h${run}v1h-${run}z`);
        c += run;
      } else {
        shapes.push(style.shape === "dots"
          ? `<circle cx="${c + m + 0.5}" cy="${r + m + 0.5}" r="0.5"/>`
          : `<rect x="${c + m + 0.04}" y="${r + m + 0.04}" width="0.92" height="0.92" rx="0.28"/>`);
        c++;
      }
    }
  }
  let logo = "";
  if (L.logo && isLogoDataUrl(style.logo)) {
    const { x, y, w } = L.logo;
    const pad = 0.6;
    logo = `<rect x="${x + m - pad}" y="${y + m - pad}" width="${w + pad * 2}" height="${w + pad * 2}" rx="1" fill="${bg}"/>` +
      `<image href="${style.logo}" x="${x + m}" y="${y + m}" width="${w}" height="${w}" preserveAspectRatio="xMidYMid meet"/>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${L.total} ${L.total}" shape-rendering="${style.shape === "square" ? "crispEdges" : "geometricPrecision"}">` +
    `<rect width="${L.total}" height="${L.total}" fill="${bg}"/>` +
    `<g fill="${fg}"><path d="${squares.join("")}"/>${shapes.join("")}</g>${logo}</svg>`;
}

/** Pixels of what the SVG draws (logo drawn as a solid dark block: the worst case). For tests. */
export function qrRaster(content: string, style: QrStyle, scale = 8): { data: Uint8ClampedArray; width: number; height: number } {
  const L = qrLayout(content, style);
  const size = L.total * scale;
  const data = new Uint8ClampedArray(size * size * 4);
  const rgb = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  const [fr, fg, fb] = rgb(style.fg);
  const [br, bgc, bb] = rgb(style.bg);
  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      const mx = px / scale - QUIET_ZONE;
      const my = py / scale - QUIET_ZONE;
      const c = Math.floor(mx), r = Math.floor(my);
      let on = false;
      if (r >= 0 && c >= 0 && r < L.n && c < L.n && L.dark[r][c]) {
        const fx = mx - c, fy = my - r;
        if (style.shape === "square" || inFinder(L.n, r, c)) on = true;
        else if (style.shape === "dots") on = (fx - 0.5) ** 2 + (fy - 0.5) ** 2 <= 0.5 ** 2;
        else on = fx >= 0.04 && fx <= 0.96 && fy >= 0.04 && fy <= 0.96;
      }
      if (L.logo) {
        const { x, y, w } = L.logo;
        if (mx >= x + w * 0.1 && mx <= x + w * 0.9 && my >= y + w * 0.1 && my <= y + w * 0.9) on = true; // the logo itself
      }
      const i = (py * size + px) * 4;
      data[i] = on ? fr : br; data[i + 1] = on ? fg : bgc; data[i + 2] = on ? fb : bb; data[i + 3] = 255;
    }
  }
  return { data, width: size, height: size };
}
