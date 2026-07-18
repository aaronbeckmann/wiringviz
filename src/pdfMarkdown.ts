import type { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { marked, type Token, type Tokens } from 'marked';

/**
 * jsPDF's built-in fonts only support CP1252. A single character outside it
 * (e.g. an arrow) silently switches the whole string to 16-bit encoding and
 * the line renders as interleaved garbage ("C o p y … !'"). Map common
 * symbols to ASCII and replace anything else non-encodable with "?".
 */
const CHAR_MAP: Record<string, string> = {
  '→': '->', // →
  '←': '<-', // ←
  '↔': '<->', // ↔
  '⇒': '=>', // ⇒
  '⇐': '<=', // ⇐
  '↑': '^', // ↑
  '↓': 'v', // ↓
  'Ω': 'Ohm', // Ω
  '−': '-', // − minus sign
  '≈': '~', // ≈
  '≤': '<=', // ≤
  '≥': '>=', // ≥
  '≠': '!=', // ≠
  '×': 'x', // ×
  '✓': 'x', // ✓
  '✔': 'x', // ✔
  '✗': 'x', // ✗
  '✘': 'x', // ✘
  '⏚': 'GND', // ⏚
  '′': "'", // ′
  '″': '"', // ″
  ' ': ' ',
  ' ': ' ',
  ' ': ' ',
};

/** CP1252 characters above U+00FF that jsPDF encodes correctly. */
const CP1252_EXTRA = '€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ';

export const toWinAnsi = (s: string): string =>
  Array.from(s)
    .map((ch) => {
      if (CHAR_MAP[ch] !== undefined) return CHAR_MAP[ch];
      const cp = ch.codePointAt(0) ?? 0;
      if (cp <= 0xff || CP1252_EXTRA.includes(ch)) return ch;
      return '?';
    })
    .join('');

/** A run of inline text; mono runs came from `code spans`. */
export type InlineSeg = { text: string; mono: boolean };

/**
 * Split inline markdown into plain/mono segments. Code spans are extracted
 * first so emphasis regexes can't mangle underscores/asterisks inside them
 * (e.g. `wire_gauge_22`, `a*b`); the rest loses its markers.
 */
export const parseSegments = (s: string): InlineSeg[] => {
  const codes: string[] = [];
  let out = s.replace(/`([^`]*)`/g, (_m, c: string) => {
    codes.push(c);
    return `§CODE${codes.length - 1}§`;
  });
  out = out
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/(\*\*|__)(.*?)\1/g, '$2')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/(^|\W)_([^_]+)_(?=\W|$)/g, '$1$2')
    .replace(/~~(.*?)~~/g, '$1');
  const segs: InlineSeg[] = [];
  for (const part of out.split(/(§CODE\d+§)/)) {
    if (!part) continue;
    const m = part.match(/^§CODE(\d+)§$/);
    if (m) segs.push({ text: toWinAnsi(codes[Number(m[1])] ?? ''), mono: true });
    else segs.push({ text: toWinAnsi(part), mono: false });
  }
  return segs;
};

/** Flatten to plain text (for headings and table cells). */
export const strip = (s: string): string =>
  parseSegments(s)
    .map((seg) => seg.text)
    .join('')
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
    str = toWinAnsi(str);
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

  /**
   * Mixed-font flow layout: word-by-word with wrapping, so `code spans`
   * render in Courier inside the surrounding Helvetica text.
   */
  const writeRich = (
    segs: InlineSeg[],
    size: number,
    o: { indent?: number; gray?: boolean; bold?: boolean } = {},
  ) => {
    if (segs.every((seg) => !seg.text)) return;
    const indent = o.indent ?? 0;
    const left = margin + indent;
    const right = doc.internal.pageSize.getWidth() - margin;
    const lineH = size * 1.4;
    let x = left;
    let lineEmpty = true;
    ensure(size * 1.6);
    doc.setTextColor(o.gray ? 110 : 30);
    doc.setFontSize(size);
    const newline = () => {
      y += lineH;
      ensure(size * 1.6);
      x = left;
      lineEmpty = true;
    };
    for (const seg of segs) {
      doc.setFont(seg.mono ? 'courier' : 'helvetica', o.bold ? 'bold' : 'normal');
      for (const tok of seg.text.split(/(\s+)/)) {
        if (!tok) continue;
        const isSpace = /^\s+$/.test(tok);
        const w = doc.getTextWidth(tok);
        if (!isSpace && x + w > right && !lineEmpty) newline();
        if (isSpace && lineEmpty) continue;
        doc.text(tok, x, y);
        x += w;
        if (!isSpace) lineEmpty = false;
      }
    }
    y += lineH;
  };

  const renderList = (list: Tokens.List, indent: number) => {
    const start = typeof list.start === 'number' ? list.start : 1;
    list.items.forEach((item, i) => {
      const marker = item.task ? (item.checked ? '[x]  ' : '[  ]  ') : list.ordered ? `${start + i}.  ` : '•  ';
      // the item's own text lives in its leading text/paragraph tokens —
      // item.text would also contain nested blocks (and only rendering its
      // first line used to truncate soft-wrapped items)
      const own = (item.tokens ?? [])
        .filter((tk) => tk.type === 'text' || tk.type === 'paragraph')
        .map((tk) => (tk as Tokens.Text).text)
        .join(' ');
      const textSrc = own || item.text;
      writeRich(
        [{ text: marker, mono: false }, ...parseSegments(textSrc.replace(/\s*\n\s*/g, ' '))],
        10,
        { indent },
      );
      // nested blocks: sub-lists and code blocks, indented
      for (const sub of item.tokens ?? []) {
        if (sub.type === 'list') renderList(sub as Tokens.List, indent + 16);
        if (sub.type === 'code') {
          y += 2;
          for (const line of (sub as Tokens.Code).text.split('\n')) {
            writeText(line || ' ', 8.5, { mono: true, indent: indent + 12 });
          }
          y += 3;
        }
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
          writeRich(parseSegments((t as Tokens.Paragraph).text.replace(/\s*\n\s*/g, ' ')), 10);
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
            head: [tt.header.map((h) => toWinAnsi(strip(h.text)))],
            body: tt.rows.map((row) => row.map((c) => toWinAnsi(strip(c.text)))),
          });
          y = ((doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y) + 10;
          break;
        }
        case 'blockquote':
          writeRich(parseSegments((t as Tokens.Blockquote).text.replace(/\s*\n\s*/g, ' ')), 10, {
            indent: 14,
            gray: true,
          });
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
