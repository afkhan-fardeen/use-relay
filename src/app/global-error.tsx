"use client";

/** Last resort: if the page frame itself fails, this replaces the whole document. Self-contained on purpose. */
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif", color: "#0A2540", display: "grid", placeItems: "center", minHeight: "100vh", textAlign: "center", padding: 24 }}>
        <main>
          <h1 style={{ fontWeight: 300, fontSize: 32, margin: "0 0 12px" }}>Something went wrong</h1>
          <p style={{ color: "#627A96", margin: "0 0 24px", maxWidth: 420 }}>Your data is safe. Please try again, or email support@useklyroo.com if it keeps happening.</p>
          <button onClick={reset} style={{ background: "#000000", color: "#fff", border: 0, borderRadius: 4, padding: "12px 24px", fontSize: 16, cursor: "pointer" }}>Try again</button>
        </main>
      </body>
    </html>
  );
}
