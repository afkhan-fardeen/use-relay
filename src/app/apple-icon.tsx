import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#FFFFFF" }}>
        <div style={{ display: "flex", position: "relative", width: 120, height: 72 }}>
          <div style={{ position: "absolute", left: 0, top: 0, width: 72, height: 72, borderRadius: 72, background: "#533AFD" }} />
          <div style={{ position: "absolute", left: 48, top: 0, width: 72, height: 72, borderRadius: 72, background: "#000EFF", opacity: 0.9 }} />
        </div>
      </div>
    ),
    size,
  );
}
