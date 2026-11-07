/* eslint-disable @next/next/no-img-element -- small static SVGs; no optimisation needed */
import Link from "next/link";

type Tool = "Export" | "QR" | string | null;

const lockup = (tool: Tool) => (tool === "Export" ? { src: "/brand/klyroo-export.svg", w: 323, label: "Klyroo Export" } : tool === "QR" ? { src: "/brand/klyroo-qr.svg", w: 253, label: "Klyroo QR" } : { src: "/brand/klyroo.svg", w: 211, label: "Klyroo" });
const icon = (tool: Tool) => (tool === "Export" ? "/brand/klyroo-export-icon.svg" : tool === "QR" ? "/brand/klyroo-qr-icon.svg" : "/brand/klyroo-icon.svg");

/** The Klyroo brand mark (two circles), or an app's mark when `tool` is given. */
export function LogoMark({ size = 28, tool = null }: { size?: number; tool?: Tool }) {
  return <img src={icon(tool)} alt="" width={size} height={size} className="shrink-0" />;
}

/** The brand lockup from /public/brand. The artwork has built-in padding, so it is nudged to line up with page edges. */
export function Logo({ href = "/", tool = null, iconOnly = false, height = 52 }: { href?: string; tool?: Tool; iconOnly?: boolean; height?: number }) {
  const l = lockup(tool);
  return (
    <Link href={href} aria-label={`${l.label} home`} className="inline-flex items-center text-ink">
      {iconOnly ? (
        <LogoMark size={32} tool={tool} />
      ) : (
        <img src={l.src} alt={l.label} height={height} width={Math.round((l.w / 96) * height)} style={{ height, width: "auto", marginLeft: -Math.round(height / 6), marginRight: -Math.round(height / 6) }} />
      )}
    </Link>
  );
}
