export function formatJson(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

export function formatList(
  items: Record<string, unknown>[],
  columns: string[]
): string {
  if (items.length === 0) return '';
  const widths = columns.map((col) => {
    const max = Math.max(
      col.length,
      ...items.map((r) => String(r[col] ?? '').length)
    );
    return Math.min(max, 40);
  });
  const header = columns
    .map((col, i) => col.padEnd(widths[i]).slice(0, widths[i]))
    .join('  ');
  const sep = columns.map((_, i) => '-'.repeat(widths[i])).join('  ');
  const rows = items.map((r) =>
    columns
      .map((col, i) => {
        const v = String(r[col] ?? '');
        return (v.length > widths[i] ? v.slice(0, widths[i] - 2) + '..' : v).padEnd(
          widths[i]
        );
      })
      .join('  ')
  );
  return [header, sep, ...rows].join('\n');
}
