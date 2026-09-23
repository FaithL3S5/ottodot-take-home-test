export function formatDateTime(isoDateTime: string): string {
  return new Date(isoDateTime).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}
