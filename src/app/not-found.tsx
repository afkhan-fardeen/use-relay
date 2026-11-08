import { StatusPage } from "@/components/kit/status-page";
import { Button } from "@/components/ui";

export const metadata = { title: "Page not found — Klyroo", robots: { index: false } };

export default function NotFound() {
  return (
    <StatusPage
      code="404"
      title="We couldn't find that page"
      actions={<><Button href="/">Go to the home page</Button><Button href="/docs" variant="secondary">Read the docs</Button></>}
    >
      The address may have changed or never existed. If you followed a link from us, please let us know at support@useklyroo.com.
    </StatusPage>
  );
}
