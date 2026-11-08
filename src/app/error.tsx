"use client";

import { useEffect } from "react";
import { StatusPage } from "@/components/kit/status-page";
import { Button } from "@/components/ui";

/** Shown when something unexpected breaks on a page. The error itself is reported on the server. */
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error("page error", error.digest ?? error.message); }, [error]);
  return (
    <StatusPage
      title="Something went wrong"
      actions={<><Button onClick={reset}>Try again</Button><Button href="/" variant="secondary">Go to the home page</Button></>}
    >
      It&apos;s on our side, and we&apos;ve been told. Your data is safe. Try again, and if it keeps happening email support@useklyroo.com{error.digest ? ` and quote ${error.digest}` : ""}.
    </StatusPage>
  );
}
