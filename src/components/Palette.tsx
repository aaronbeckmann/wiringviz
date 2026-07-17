import type { ReactNode } from 'react';

export type PaletteItem =
  | { kind: 'board' }
  | { kind: 'group' }
  | { kind: 'connector'; pinCount: number }
  | { kind: 'terminal' }
  | { kind: 'splice' }
  | { kind: 'branchpoint' }
  | { kind: 'diode' }
  | { kind: 'resistor' }
  | { kind: 'note' };

const CONNECTOR_SIZES = [2, 3, 4, 6, 8, 12];

function DragCard({ item, label, icon, onAdd }: {
  item: PaletteItem;
  label: string;
  icon: ReactNode;
  onAdd: (item: PaletteItem) => void;
}) {
  return (
    <div
      className="palette-card"
      draggable
      title="Drag onto the canvas, or click to add"
      onDragStart={(e) => {
        e.dataTransfer.setData('application/x-harness', JSON.stringify(item));
        e.dataTransfer.effectAllowed = 'move';
      }}
      onClick={() => onAdd(item)}
    >
      <span className="palette-icon">{icon}</span>
      <span>{label}</span>
    </div>
  );
}

export default function Palette({ onAdd }: { onAdd: (item: PaletteItem) => void }) {
  return (
    <aside className="palette">
      <div className="panel-title">Components</div>

      <div className="palette-section">Layout</div>
      <DragCard item={{ kind: 'board' }} label="Board / PCB" icon={<BoardIcon />} onAdd={onAdd} />
      <DragCard item={{ kind: 'group' }} label="Group" icon={<GroupIcon />} onAdd={onAdd} />
      <DragCard item={{ kind: 'branchpoint' }} label="Branch point" icon={<BranchIcon />} onAdd={onAdd} />

      <div className="palette-section">Connectors & terminals</div>
      {CONNECTOR_SIZES.map((n) => (
        <DragCard
          key={n}
          item={{ kind: 'connector', pinCount: n }}
          label={`Connector · ${n} pin`}
          icon={<ConnIcon pins={Math.min(n, 4)} />}
          onAdd={onAdd}
        />
      ))}
      <DragCard item={{ kind: 'terminal' }} label="Terminal" icon={<TerminalIcon />} onAdd={onAdd} />

      <div className="palette-section">Conductors & components</div>
      <DragCard item={{ kind: 'splice' }} label="Splice" icon={<SpliceIcon />} onAdd={onAdd} />
      <DragCard item={{ kind: 'diode' }} label="Diode" icon={<DiodeIcon />} onAdd={onAdd} />
      <DragCard item={{ kind: 'resistor' }} label="Resistor" icon={<ResistorIcon />} onAdd={onAdd} />

      <div className="palette-section">Documentation</div>
      <DragCard item={{ kind: 'note' }} label="Note" icon={<NoteIcon />} onAdd={onAdd} />

      <div className="palette-hint">
        Drag a component onto the canvas. Draw a wire by dragging from one pin
        to another — switch to <b>Wire mode (W)</b> to start wires from splices
        and terminals, and back to <b>Move mode (V)</b> to drag them.
        <b> Double-click a wire</b> to add a layout point (bend);
        double-click a bend to remove it. Press <b>R</b> to flip the selected
        connector or diode. Cables, bundles and twisted pairs are created from
        the wire inspector; parts are managed in the Parts view.
      </div>
    </aside>
  );
}

function BoardIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18">
      <rect x="1.5" y="2.5" width="15" height="13" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 2" />
    </svg>
  );
}

function GroupIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18">
      <rect x="1.5" y="2.5" width="15" height="13" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <rect x="4.5" y="5.5" width="4" height="3" fill="currentColor" opacity="0.5" />
      <rect x="10" y="8.5" width="4" height="3" fill="currentColor" opacity="0.5" />
    </svg>
  );
}

function BranchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18">
      <path d="M1 9h7m0 0l9-6M8 9l9 6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" fill="none" />
      <circle cx="8" cy="9" r="2.4" fill="currentColor" />
    </svg>
  );
}

function ConnIcon({ pins }: { pins: number }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18">
      <rect x="2" y="2" width="11" height="14" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
      {Array.from({ length: pins }, (_, i) => (
        <circle key={i} cx="14.8" cy={4.5 + (i * 9) / Math.max(pins - 1, 1)} r="1.4" fill="currentColor" />
      ))}
    </svg>
  );
}

function TerminalIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18">
      <rect x="1" y="7" width="6" height="4" rx="1.2" fill="currentColor" />
      <circle cx="12.5" cy="9" r="4.5" fill="none" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="12.5" cy="9" r="1.6" fill="currentColor" />
    </svg>
  );
}

function SpliceIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18">
      <circle cx="9" cy="9" r="3" fill="currentColor" />
      <path d="M1 9h5M12 9h5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function DiodeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18">
      <path d="M1 9h4M13 9h4" stroke="currentColor" strokeWidth="1.5" />
      <path d="M5.5 4.5v9l7-4.5z" fill="currentColor" />
      <path d="M12.8 4.5v9" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

function ResistorIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18">
      <path d="M1 9h3M14 9h3" stroke="currentColor" strokeWidth="1.5" />
      <rect x="4" y="5.5" width="10" height="7" rx="1.2" fill="none" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function NoteIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18">
      <path d="M3 2.5h12v9l-4 4H3z" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M11 15.5v-4h4" fill="none" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}
