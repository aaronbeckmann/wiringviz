import { useMemo } from 'react';
import { marked } from 'marked';

const PLACEHOLDER = `# Assembly

## 1 · Preparation
1. Cut all wires to length (see the Connections view).
2. …

Use Markdown: # headings, **bold**, lists, tables, \`code\`.`;

export default function AssemblyView({ value, onChange }: {
  value: string;
  onChange: (text: string) => void;
}) {
  const html = useMemo(
    () => ({
      __html: marked.parse(
        value.trim() ? value : '*No assembly instructions yet — start writing on the left.*',
        { async: false },
      ),
    }),
    [value],
  );

  return (
    <div className="connections-view assembly-view">
      <div className="connections-header">
        <h2>Assembly instructions</h2>
        <span className="connections-sub">
          Markdown, saved with the project and included in JSON exports
        </span>
      </div>
      <div className="assembly-split">
        <textarea
          className="assembly-editor"
          value={value}
          placeholder={PLACEHOLDER}
          spellCheck={false}
          onChange={(e) => onChange(e.target.value)}
        />
        <article className="manual-content assembly-preview" dangerouslySetInnerHTML={html} />
      </div>
    </div>
  );
}
