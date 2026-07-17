import { useMemo, useState } from 'react';
import { marked } from 'marked';

import gettingStarted from '../../manuals/getting-started.md?raw';
import components from '../../manuals/components.md?raw';
import wiresRouting from '../../manuals/wires-routing.md?raw';
import cablesBundles from '../../manuals/cables-bundles.md?raw';
import partsBom from '../../manuals/parts-bom.md?raw';
import shortcuts from '../../manuals/shortcuts.md?raw';
import viewsExport from '../../manuals/views-export.md?raw';

const CHAPTERS = [
  { id: 'getting-started', title: 'Getting started', md: gettingStarted },
  { id: 'components', title: 'Components', md: components },
  { id: 'wires-routing', title: 'Wires & routing', md: wiresRouting },
  { id: 'cables-bundles', title: 'Cables & bundles', md: cablesBundles },
  { id: 'parts-bom', title: 'Parts & BOM', md: partsBom },
  { id: 'views-export', title: 'Views & export', md: viewsExport },
  { id: 'shortcuts', title: 'Shortcuts', md: shortcuts },
];

export default function ManualView() {
  const [chapterId, setChapterId] = useState(CHAPTERS[0].id);
  const chapter = CHAPTERS.find((c) => c.id === chapterId) ?? CHAPTERS[0];

  const html = useMemo(() => ({ __html: marked.parse(chapter.md, { async: false }) }), [chapter]);

  return (
    <div className="connections-view manual-view">
      <div className="manual-layout">
        <nav className="manual-nav">
          <div className="panel-title">Manual</div>
          {CHAPTERS.map((c) => (
            <button
              type="button"
              key={c.id}
              className={`manual-nav-item ${c.id === chapterId ? 'is-active' : ''}`}
              onClick={() => setChapterId(c.id)}
            >
              {c.title}
            </button>
          ))}
        </nav>
        <article className="manual-content" dangerouslySetInnerHTML={html} />
      </div>
    </div>
  );
}
