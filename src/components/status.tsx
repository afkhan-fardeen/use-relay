import { Chip } from "@/components/ui";

export function StatusChip({ status }: { status: string }) {
  switch (status) {
    case "succeeded":
      return <Chip>Succeeded</Chip>;
    case "running":
      return <Chip tone="info">Running</Chip>;
    case "queued":
      return <Chip tone="info">Queued</Chip>;
    case "failed":
      return <Chip tone="danger">Failed</Chip>;
    case "connected":
      return <Chip>Connected</Chip>;
    case "needs_attention":
      return <Chip tone="danger">Reconnect</Chip>;
    default:
      return <Chip tone="outline">{status}</Chip>;
  }
}
