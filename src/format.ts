import chalk from 'chalk';
// cli-table3 uses export = ; default import for interop
import TableConstructor from 'cli-table3';

export function formatJson(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

function columnLabel(col: string): string {
  return col
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Rich terminal table with borders and colors (for TTY). */
export function formatRichTable(
  items: Record<string, unknown>[],
  columns: string[]
): string {
  if (items.length === 0) return chalk.dim('(no rows)');
  const maxCell = 50;
  const table = new TableConstructor({
    head: columns.map((c) => chalk.bold.cyan(columnLabel(c))),
    chars: {
      'top': '─',
      'top-mid': '┬',
      'top-left': '┌',
      'top-right': '┐',
      'bottom': '─',
      'bottom-mid': '┴',
      'bottom-left': '└',
      'bottom-right': '┘',
      'left': '│',
      'left-mid': '├',
      'mid': '─',
      'mid-mid': '┼',
      'right': '│',
      'right-mid': '┤',
    },
    style: {
      'padding-left': 1,
      'padding-right': 1,
      head: [],
      border: ['cyan'],
      compact: false,
    },
    colWidths: columns.map((col) => {
      const max = Math.max(
        columnLabel(col).length,
        ...items.map((r) => String(r[col] ?? '').length)
      );
      return Math.min(Math.max(max + 2, 6), maxCell + 2);
    }),
  });
  for (const r of items) {
    table.push(
      columns.map((col) => {
        let v = String(r[col] ?? '');
        if (v.length > maxCell) v = v.slice(0, maxCell - 2) + '…';
        return v;
      })
    );
  }
  return table.toString();
}

/** Styled error box for TTY (e.g. "Project not found", API errors). */
export function formatError(
  message: string,
  options: { title?: string; statusCode?: number } = {}
): string {
  const { title = 'Error', statusCode } = options;
  const label = statusCode !== undefined ? `${title} (${statusCode})` : title;
  const padding = 1;
  const maxLine = 60;
  const lines = message.split(/\n/).flatMap((line) => {
    if (line.length <= maxLine) return [line];
    const chunks: string[] = [];
    let i = 0;
    while (i < line.length) {
      const slice = line.slice(i, i + maxLine);
      const lastSpace = slice.lastIndexOf(' ');
      const breakAt = lastSpace > maxLine >> 1 ? lastSpace : slice.length;
      chunks.push(slice.slice(0, breakAt).trimEnd());
      i += breakAt;
    }
    return chunks;
  });
  const contentWidth = Math.max(label.length, ...lines.map((l) => l.length), 20);
  const width = contentWidth + padding * 2 + 2;
  const topBorder = chalk.red('┌' + '─'.repeat(width - 2) + '┐');
  const labelLine =
    chalk.red('│') +
    ' '.repeat(padding) +
    chalk.bold.red(label) +
    ' '.repeat(width - 2 - padding - label.length) +
    chalk.red('│');
  const midBorder = chalk.red('├' + '─'.repeat(width - 2) + '┤');
  const contentLines = lines.map(
    (line) =>
      chalk.red('│') +
      ' '.repeat(padding) +
      line +
      ' '.repeat(width - 2 - padding - line.length) +
      chalk.red('│')
  );
  const bottomBorder = chalk.red('└' + '─'.repeat(width - 2) + '┘');
  return [topBorder, labelLine, midBorder, ...contentLines, bottomBorder].join('\n');
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
