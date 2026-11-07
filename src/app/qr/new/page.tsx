import { Suspense } from "react";
import { QrDesigner } from "./designer";

export const metadata = { title: "Create a QR code — Klyroo" };

export default function NewQr() {
  return (
    <Suspense fallback={null}>
      <QrDesigner />
    </Suspense>
  );
}
