import type { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { marked, type Token, type Tokens } from 'marked';

/** Remove inline markdown markers for plain-text PDF output. */
const strip = (s: string): string =>
  s
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/(\*\*|__)(.*?)\1/g, '$2')
    .replace(/(\*|_)(.*?)\1/g, '$2')
    .replace(/~~(.*?)~~/g, '$1')
    .replace(/`([^`]*)`/g, '$1')
    .trim();

/**
 * Typeset markdown into the PDF using text primitives (no rasterization):
 * headings, paragraphs, (task) lists with one nesting level, tables, code,
 * blockquotes and rules. Adds portrait pages as needed.
 */
export function renderMarkdownToPdf(
  doc: jsPDF,
  markdown: string,
  { startY, margin }: { startY: number; margin: number },
): void {
  let y = startY;

  const pageWidth = () => doc.internal.pageSize.getWidth() - margin * 2;
  const ensure = (needed: number) => {
    if (y + needed > doc.internal.pageSize.getHeight() - margin) {
      doc.addPage('a4', 'portrait');
      y = margin;
    }
  };

  const writeText = (
    str: string,
    size: number,
    o: { bold?: boolean; mono?: boolean; indent?: number; gray?: boolean } = {},
  ) => {
    if (!str) return;
    doc.setFont(o.mono ? 'courier' : 'helvetica', o.bold ? 'bold' : 'normal');
    doc.setFontSize(size);
    doc.setTextColor(o.gray ? 110 : 30);
    const indent = o.indent ?? 0;
    const lines = doc.splitTextToSize(str, pageWidth() - indent) as string[];
    for (const line of lines) {
      ensure(size * 1.6);
      doc.text(line, margin + indent, y);
      y += size * 1.4;
    }
  };

  const renderList = (list: Tokens.List, indent: number) => {
    const start = typeof list.start === 'number' ? list.start : 1;
    list.items.forEach((item, i) => {
      const marker = item.task ? (item.checked ? '[x]  ' : '[  ]  ') : list.ordered ? `${start + i}.  ` : '•  ';
      const firstLine = strip(item.text.split('\n')[0] ?? '');
      writeText(marker + firstLine, 10, { indent });
      // one nesting level: render sub-lists indented
      for (const sub of item.tokens ?? []) {
        if (sub.type === 'list') renderList(sub as Tokens.List, indent + 16);
      }
      y += 1;
    });
    y += 4;
  };

  const walk = (tokens: Token[]) => {
    for (const t of tokens) {
      switch (t.type) {
        case 'heading': {
          const h = t as Tokens.Heading;
          y += h.depth === 1 ? 10 : 8;
          ensure(34);
          writeText(strip(h.text), h.depth === 1 ? 16 : h.depth === 2 ? 13 : 11, { bold: true });
          y += 2;
          break;
        }
        case 'paragraph':
          writeText(strip((t as Tokens.Paragraph).text), 10);
          y += 4;
          break;
        case 'list':
          renderList(t as Tokens.List, 4);
          break;
        case 'code': {
          const code = (t as Tokens.Code).text.split('\n');
          y += 2;
          for (const line of code) writeText(line || ' ', 8.5, { mono: true, indent: 10 });
          y += 4;
          break;
        }
        case 'table': {
          const tt = t as Tokens.Table;
          ensure(48);
          autoTable(doc, {
            startY: y,
            margin: { left: margin, right: margin },
            styles: { fontSize: 8 },
            headStyles: { fillColor: [28, 35, 51] },
            head: [tt.header.map((h) => strip(h.text))],
            body: tt.rows.map((row) => row.map((c) => strip(c.text))),
          });
          y = ((doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y) + 10;
          break;
        }
        case 'blockquote':
          writeText(strip((t as Tokens.Blockquote).text), 10, { indent: 14, gray: true });
          y += 4;
          break;
        case 'hr':
          ensure(12);
          doc.setDrawColor(190);
          doc.line(margin, y, margin + pageWidth(), y);
          y += 10;
          break;
        case 'space':
          y += 3;
          break;
        default:
          if ('text' in t && typeof (t as { text?: unknown }).text === 'string') {
            writeText(strip((t as { text: string }).text), 10);
          }
      }
    }
  };

  walk(marked.lexer(markdown));
  doc.setTextColor(0);
}
