import { useEffect } from 'react';
import { Handle, NodeResizer, Position, useUpdateNodeInternals, type NodeProps } from '@xyflow/react';
import {
  NOTE_COLORS,
  type BranchPointData,
  type DiodeData,
  type GroupData,
  type LayoutPointData,
  type NoteData,
  type ResistorData,
  type TerminalData,
  type TerminalType,
} from '../model';

/** Invisible handle that fills its parent so wires anchor at the center. */
function FillHandle({ id }: { id: string }) {
  return (
    <Handle
      type="source"
      id={id}
      position={Position.Right}
      style={{
        width: '100%',
        height: '100%',
        top: 0,
        left: 0,
        right: 'auto',
        transform: 'none',
        borderRadius: '50%',
        opacity: 0,
      }}
    />
  );
}

// ---------- Terminal (ferrule / ring / spade / quick connect / loose end) ----------
function TerminalGlyph({ type }: { type: TerminalType }) {
  switch (type) {
    case 'ferrule':
      return (
        <svg width="30" height="18" viewBox="0 0 30 18">
          <rect x="1" y="6.5" width="10" height="5" rx="2" fill="#94a3b8" />
          <rect x="11" y="5" width="14" height="8" rx="1.5" fill="#cbd5e1" stroke="#64748b" strokeWidth="1.3" />
          <rect x="25" y="6.5" width="4" height="5" fill="#e2b13c" stroke="#a16207" strokeWidth="0.8" />
        </svg>
      );
    case 'spade':
      return (
        <svg width="30" height="18" viewBox="0 0 30 18">
          <rect x="1" y="6.5" width="9" height="5" rx="2" fill="#94a3b8" />
          <path d="M10 4h8c4 0 4 2.5 4 2.5v5s0 2.5-4 2.5h-8z" fill="#cbd5e1" stroke="#64748b" strokeWidth="1.3" />
          <path d="M22 6.5h7M22 11.5h7" stroke="#64748b" strokeWidth="1.8" />
        </svg>
      );
    case 'quick-m':
      return (
        <svg width="30" height="18" viewBox="0 0 30 18">
          <rect x="1" y="6.5" width="9" height="5" rx="2" fill="#94a3b8" />
          <rect x="10" y="4.5" width="9" height="9" rx="1.5" fill="#cbd5e1" stroke="#64748b" strokeWidth="1.3" />
          <rect x="19" y="6.8" width="10" height="4.4" fill="#e2e8f0" stroke="#64748b" strokeWidth="1.2" />
        </svg>
      );
    case 'quick-f':
      return (
        <svg width="30" height="18" viewBox="0 0 30 18">
          <rect x="1" y="6.5" width="9" height="5" rx="2" fill="#94a3b8" />
          <path d="M10 4.5h12a3 3 0 0 1 3 3v3a3 3 0 0 1-3 3H10z" fill="#cbd5e1" stroke="#64748b" strokeWidth="1.3" />
          <rect x="25" y="7.3" width="4" height="3.4" fill="#f4f5f8" stroke="#64748b" strokeWidth="1.1" />
        </svg>
      );
    case 'loose':
      return (
        <svg width="30" height="18" viewBox="0 0 30 18">
          <rect x="1" y="6.5" width="14" height="5" rx="2" fill="#94a3b8" />
          <path d="M15 9c4-3 6 3 9-2M15 9c4 3 6-3 9 3M15 9h11" stroke="#a16207" strokeWidth="1.1" fill="none" />
        </svg>
      );
    default: // ring
      return (
        <svg width="30" height="18" viewBox="0 0 30 18">
          <rect x="1" y="6.5" width="9" height="5" rx="2" fill="#94a3b8" />
          <circle cx="20" cy="9" r="7.5" fill="#cbd5e1" stroke="#64748b" strokeWidth="1.4" />
          <circle cx="20" cy="9" r="3.2" fill="#f4f5f8" stroke="#64748b" strokeWidth="1" />
        </svg>
      );
  }
}

export function TerminalNode({ data, selected }: NodeProps) {
  const d = data as unknown as TerminalData;
  return (
    <div className={`terminal-node ${selected ? 'is-selected' : ''}`}>
      <div className="terminal-glyph">
        <TerminalGlyph type={d.termType ?? 'ring'} />
        <FillHandle id="t" />
      </div>
      <div className="mini-node-label">
        {d.label}
        {d.signal ? <span className="mini-node-sub"> · {d.signal}</span> : null}
      </div>
    </div>
  );
}

// ---------- Diode ----------
export function DiodeNode({ id, data, selected }: NodeProps) {
  const d = data as unknown as DiodeData;
  const flip = Boolean(d.flip);
  const updateNodeInternals = useUpdateNodeInternals();
  useEffect(() => {
    updateNodeInternals(id);
  }, [id, flip, updateNodeInternals]);
  const left = { top: '50%', left: -5 } as const;
  const right = { top: '50%', right: -5, left: 'auto' } as const;
  return (
    <div className={`two-pin-node ${selected ? 'is-selected' : ''}`}>
      <div className="two-pin-body">
        <svg width="54" height="24" viewBox="0 0 54 24" style={flip ? { transform: 'scaleX(-1)' } : undefined}>
          <path d="M0 12h16M38 12h16" stroke="#475569" strokeWidth="2" />
          <path d="M18 4v16l16-8z" fill="#334155" />
          <path d="M36 4v16" stroke="#334155" strokeWidth="3" />
        </svg>
        <Handle type="source" id="a" position={flip ? Position.Right : Position.Left} style={flip ? right : left} />
        <Handle type="source" id="k" position={flip ? Position.Left : Position.Right} style={flip ? left : right} />
      </div>
      <div className="mini-node-label">{d.label}</div>
    </div>
  );
}

// ---------- Resistor ----------
export function ResistorNode({ data, selected }: NodeProps) {
  const d = data as unknown as ResistorData;
  return (
    <div className={`two-pin-node ${selected ? 'is-selected' : ''}`}>
      <div className="two-pin-body">
        <svg width="54" height="24" viewBox="0 0 54 24">
          <path d="M0 12h12M42 12h12" stroke="#475569" strokeWidth="2" />
          <rect x="12" y="6" width="30" height="12" rx="2" fill="#fff" stroke="#334155" strokeWidth="2" />
        </svg>
        <Handle type="source" id="p1" position={Position.Left} style={{ top: '50%', left: -5 }} />
        <Handle type="source" id="p2" position={Position.Right} style={{ top: '50%', right: -5, left: 'auto' }} />
      </div>
      <div className="mini-node-label">
        {d.label}
        {d.value ? <span className="mini-node-sub"> · {d.value}</span> : null}
      </div>
    </div>
  );
}

// ---------- Layout point (routing waypoint — net-continuous) ----------
export function LayoutPointNode({ data, selected }: NodeProps) {
  const d = data as unknown as LayoutPointData;
  return (
    <div className={`layoutpoint-node ${selected ? 'is-selected' : ''}`}>
      <div className="layoutpoint-dot">
        <FillHandle id="lp" />
      </div>
      <div className="mini-node-label">{d.label}</div>
    </div>
  );
}

// ---------- Branch point (marker where the harness trunk splits) ----------
export function BranchPointNode({ data, selected }: NodeProps) {
  const d = data as unknown as BranchPointData;
  return (
    <div className={`branchpoint-node ${selected ? 'is-selected' : ''}`}>
      <svg width="26" height="26" viewBox="0 0 26 26">
        <path d="M3 13h10M13 13L23 5M13 13l10 8" stroke="#b45309" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="13" cy="13" r="4" fill="#f59e0b" stroke="#b45309" strokeWidth="1.5" />
      </svg>
      <div className="mini-node-label">{d.label}</div>
    </div>
  );
}

// ---------- Group (organizational container) ----------
export function GroupNode({ data, selected }: NodeProps) {
  const d = data as unknown as GroupData;
  return (
    <div className={`group-node ${selected ? 'is-selected' : ''}`}>
      <NodeResizer isVisible={selected} minWidth={160} minHeight={100} />
      <div className="group-label">{d.label}</div>
    </div>
  );
}

// ---------- Note ----------
export function NoteNode({ data, selected }: NodeProps) {
  const d = data as unknown as NoteData;
  const c = NOTE_COLORS[d.color ?? 'yellow'] ?? NOTE_COLORS.yellow;
  return (
    <div
      className={`note-node ${selected ? 'is-selected' : ''}`}
      style={{
        background: c.bg,
        borderColor: c.border,
        color: c.text,
        width: d.width ?? 190,
        textAlign: d.align ?? 'left',
      }}
    >
      <div className="note-pin" />
      {d.text || 'Empty note — select it and type in the inspector.'}
    </div>
  );
}
