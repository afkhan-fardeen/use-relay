import { ImageResponse } from "next/og";

export const alt = "Klyroo: Shopify apps that keep it simple";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 72, background: "#FFFFFF", fontFamily: "sans-serif", color: "#000000" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div style={{ display: "flex", position: "relative", width: 96, height: 56 }}>
            <div style={{ position: "absolute", left: 0, top: 0, width: 56, height: 56, borderRadius: 56, background: "#000000" }} />
            <div style={{ position: "absolute", left: 40, top: 0, width: 56, height: 56, borderRadius: 56, background: "#000000", opacity: 0.9 }} />
          </div>
          <div style={{ fontSize: 44 }}>klyroo</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 76, lineHeight: 1.05, letterSpacing: -2 }}>We make</div>
          <div style={{ fontSize: 76, lineHeight: 1.05, letterSpacing: -2, color: "#000000" }}>Shopify apps.</div>
          <div style={{ fontSize: 32, color: "#5B5F66", marginTop: 28 }}>Simple, focused apps. First up: Klyroo Data Exporter.</div>
        </div>
        <div style={{ display: "flex", gap: 16, fontSize: 28 }}>
          <div style={{ display: "flex", background: "#000000", color: "#fff", borderRadius: 14, padding: "12px 26px" }}>Klyroo Data Exporter</div>
          <div style={{ display: "flex", marginLeft: "auto", color: "#5B5F66" }}>useklyroo.com</div>
        </div>
      </div>
    ),
    size,
  );
}
