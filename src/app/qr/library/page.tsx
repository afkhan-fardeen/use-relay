import { FakeQr } from "@/components/fake-qr";
import { Button, Card, Chip, PageHeader } from "@/components/ui";

const rows = [
  { name: "Spring collection", target: "https://example.com/spring", kind: "Link", seed: 3 },
  { name: "Returns portal", target: "https://example.com/returns", kind: "Link", seed: 7 },
  { name: "Store Wi-Fi", target: "WIFI:T:WPA;S:Northwind;P:••••••", kind: "Wi-Fi", seed: 11 },
];

export default function QrLibrary() {
  return (
    <>
      <PageHeader title="My codes" sub="Everything you've created, in one place." actions={<><Chip tone="info">Sample data</Chip><Button size="sm" href="/qr/new">Create a code</Button></>} />
      <Card padded={false} className="overflow-hidden max-w-4xl">
        <ul>
          {rows.map((r) => (
            <li key={r.name} className="flex items-center gap-5 px-6 py-4 border-b border-line last:border-0">
              <FakeQr seed={r.seed} size={56} />
              <div className="min-w-0 flex-1">
                <p>{r.name}</p>
                <p className="text-xs text-muted truncate">{r.target}</p>
              </div>
              <Chip tone="outline">{r.kind}</Chip>
              <Button variant="secondary" size="sm" disabled>Download</Button>
            </li>
          ))}
        </ul>
      </Card>
      <p className="mt-4 text-xs text-muted">Saving and downloading codes is coming soon.</p>
    </>
  );
}
