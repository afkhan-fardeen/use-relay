import { ImageResponse } from "next/og";

export const alt = "Klyroo Data Exporter for Shopify";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 72, background: "linear-gradient(135deg,#FFFFFF 40%,#EEF0FF)", fontFamily: "sans-serif", color: "#0A2540" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div style={{ display: "flex", position: "relative", width: 96, height: 56 }}>
            <div style={{ position: "absolute", left: 0, top: 0, width: 56, height: 56, borderRadius: 56, background: "#533AFD" }} />
            <div style={{ position: "absolute", left: 40, top: 0, width: 56, height: 56, borderRadius: 56, background: "#000EFF", opacity: 0.9 }} />
          </div>
          <div style={{ fontSize: 44 }}>klyroo</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 76, lineHeight: 1.05, letterSpacing: -2 }}>Your Shopify data,</div>
          <div style={{ fontSize: 76, lineHeight: 1.05, letterSpacing: -2, color: "#533AFD" }}>as clean spreadsheets.</div>
          <div style={{ fontSize: 32, color: "#4F6682", marginTop: 28 }}>Klyroo Data Exporter: Excel and CSV exports from Shopify Admin.</div>
        </div>
        <div style={{ display: "flex", gap: 16, fontSize: 28 }}>
          <div style={{ display: "flex", background: "#00A99D", color: "#fff", borderRadius: 14, padding: "12px 26px" }}>Shopify app</div>
          <div style={{ display: "flex", marginLeft: "auto", color: "#4F6682" }}>useklyroo.com</div>
        </div>
      </div>
    ),
    size,
  );
}
