// Browser-only helpers to save a QR code as SVG or PNG. Nothing is sent to a server.

export const safeFileName = (name: string, ext: string) =>
  `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 50) || "qr-code"}.${ext}`;

function save(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function downloadSvg(svg: string, filename: string) {
  save(new Blob([svg], { type: "image/svg+xml;charset=utf-8" }), filename);
}

/** Draws the SVG onto a canvas at `px` pixels square and saves it as a PNG. */
export function downloadPng(svg: string, px: number, filename: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = px;
      canvas.height = px;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Canvas isn't available"));
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(img, 0, 0, px, px);
      canvas.toBlob((blob) => {
        if (!blob) return reject(new Error("Couldn't make the image"));
        save(blob, filename);
        resolve();
      }, "image/png");
    };
    img.onerror = () => reject(new Error("Couldn't draw the code"));
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  });
}

/** Shrinks a chosen logo to at most 256px so it stays small, and returns a PNG data URL. */
export function prepareLogo(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!/^image\/(png|jpeg|webp)$/.test(file.type)) return reject(new Error("Use a PNG, JPEG or WebP image."));
    if (file.size > 4_000_000) return reject(new Error("That image is too large. Use one under 4 MB."));
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Couldn't read that file."));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("That doesn't look like a valid image."));
      img.onload = () => {
        const scale = Math.min(1, 256 / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const c = document.createElement("canvas");
        c.width = w;
        c.height = h;
        c.getContext("2d")!.drawImage(img, 0, 0, w, h);
        const out = c.toDataURL("image/png");
        if (out.length > 190_000) return reject(new Error("That logo is still too detailed. Try a simpler image."));
        resolve(out);
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}
