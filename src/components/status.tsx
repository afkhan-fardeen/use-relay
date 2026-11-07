import { Chip } from "@/components/ui";

export function StatusChip({ status }: { status: string }) {
  switch (status) {
    case "succeeded":
      return <Chip tone="success">Succeeded</Chip>;
    case "queued":
      return <Chip tone="info">Queued</Chip>;
    case "starting":
    case "shopify_running":
    case "downloading":
    case "building":
    case "publishing":
    case "delivering":
      return <Chip tone="info">Running</Chip>;
    case "failed":
      return <Chip tone="danger">Failed</Chip>;
    case "connected":
      return <Chip tone="success">Connected</Chip>;
    case "needs_attention":
      return <Chip tone="danger">Reconnect</Chip>;
    case "disconnected":
      return <Chip tone="outline">Disconnected</Chip>;
    default:
      return <Chip tone="outline">{status}</Chip>;
  }
}
