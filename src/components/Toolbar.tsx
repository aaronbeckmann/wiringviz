import { useRef } from 'react';

export type ViewMode = 'schematic' | 'connections' | 'parts' | 'assembly' | 'manual';

export default function Toolbar({ projectName, onRename, view, onViewChange, onNew, onDemo, onImport, onExportJson, onExportPng, onExportPdf }: {
  projectName: string;
  onRename: (name: string) => void;
  view: ViewMode;
  onViewChange: (v: ViewMode) => void;
  onNew: () => void;
  onDemo: () => void;
  onImport: (file: File) => void;
  onExportJson: () => void;
  onExportPng: () => void;
  onExportPdf: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  return (
    <header className="toolbar">
      <div className="brand">
        <svg width="20" height="20" viewBox="0 0 20 20">
          <path d="M2 6h5m6 0h5M2 14h5m6 0h5" stroke="#4f6ef7" strokeWidth="2" strokeLinecap="round" />
          <path d="M7 6c3 0 3 8 6 8M7 14c3 0 3-8 6-8" stroke="#f97316" strokeWidth="2" fill="none" strokeLinecap="round" />
        </svg>
        Wiring Viz
      </div>

      <input
        className="project-name"
        value={projectName}
        onChange={(e) => onRename(e.target.value)}
        spellCheck={false}
        aria-label="Project name"
      />

      <div className="seg view-seg">
        <button type="button" className={view === 'schematic' ? 'is-active' : ''} onClick={() => onViewChange('schematic')}>
          Schematic
        </button>
        <button type="button" className={view === 'connections' ? 'is-active' : ''} onClick={() => onViewChange('connections')}>
          Connections
        </button>
        <button type="button" className={view === 'parts' ? 'is-active' : ''} onClick={() => onViewChange('parts')}>
          Parts
        </button>
        <button type="button" className={view === 'assembly' ? 'is-active' : ''} onClick={() => onViewChange('assembly')}>
          Assembly
        </button>
        <button type="button" className={view === 'manual' ? 'is-active' : ''} onClick={() => onViewChange('manual')}>
          Manual
        </button>
      </div>

      <div className="toolbar-spacer" />

      <button type="button" className="tb-btn" onClick={onNew}>New</button>
      <button type="button" className="tb-btn" onClick={onDemo}>Load demo</button>
      <button type="button" className="tb-btn" onClick={() => fileRef.current?.click()}>Import</button>
      <input
        ref={fileRef}
        type="file"
        accept=".json,application/json"
        style={{ display: 'none' }}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onImport(f);
          e.target.value = '';
        }}
      />
      <button type="button" className="tb-btn" onClick={onExportJson}>Export JSON</button>
      <button type="button" className="tb-btn" onClick={onExportPng}>Export PNG</button>
      <button type="button" className="tb-btn tb-primary" onClick={onExportPdf}>Export PDF</button>
    </header>
  );
}
