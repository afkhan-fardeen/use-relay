import { FakeQr } from "@/components/fake-qr";
import { Button, Card, Chip, PageHeader } from "@/components/ui";

const samples = [
  { name: "Spring collection", kind: "Link", scans: "1,204", seed: 3 },
  { name: "Returns portal", kind: "Link", scans: "388", seed: 7 },
  { name: "Store Wi-Fi", kind: "Wi-Fi", scans: "96", seed: 11 },
];

export default function QrOverview() {
  return (
    <>
      <PageHeader
        title="QR Codes"
        sub="Branded QR codes for packaging, flyers and your store."
        actions={<><Chip tone="info">Preview</Chip><Button size="sm" href="/qr/new">Create a code</Button></>}
      />

      <Card featured className="!p-8 mb-6 max-w-3xl">
        <h2 className="text-[22px] leading-[1.2] font-light">This app is in preview</h2>
        <p className="mt-3 text-sm text-muted leading-[22px]">
          You can look around and try the designer. Saving and downloading codes arrives soon. The examples below are sample data and the codes are not scannable.
        </p>
      </Card>

      <div className="grid sm:grid-cols-3 gap-4 max-w-4xl">
        {samples.map((s) => (
          <Card key={s.name} className="!p-6">
            <div className="grid place-items-center rounded-ctl bg-wash p-5"><FakeQr seed={s.seed} size={112} /></div>
            <p className="mt-4 font-normal">{s.name}</p>
            <p className="text-xs text-muted mt-0.5">{s.kind} · {s.scans} scans (sample)</p>
          </Card>
        ))}
      </div>
    </>
  );
}
