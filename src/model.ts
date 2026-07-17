import type { Edge, Node } from '@xyflow/react';

// ---------- Wire colors (IEC-ish codes) ----------
export const WIRE_COLORS: Record<string, { name: string; hex: string; light?: boolean }> = {
  BK: { name: 'Black', hex: '#1f2530' },
  WH: { name: 'White', hex: '#ffffff', light: true },
  GY: { name: 'Grey', hex: '#9ca3af' },
  RD: { name: 'Red', hex: '#dc2626' },
  OG: { name: 'Orange', hex: '#f97316' },
  YE: { name: 'Yellow', hex: '#eab308', light: true },
  GN: { name: 'Green', hex: '#16a34a' },
  BU: { name: 'Blue', hex: '#2563eb' },
  VT: { name: 'Violet', hex: '#8b5cf6' },
  BN: { name: 'Brown', hex: '#8b5a2b' },
  PK: { name: 'Pink', hex: '#ec4899' },
  TQ: { name: 'Turquoise', hex: '#06b6d4' },
};

export const COLOR_CYCLE = ['RD', 'BK', 'BU', 'YE', 'GN', 'WH', 'OG', 'VT', 'BN', 'GY', 'PK', 'TQ'];

export const GAUGES = [
  '30 AWG', '28 AWG', '26 AWG', '24 AWG', '22 AWG', '20 AWG',
  '18 AWG', '16 AWG', '14 AWG', '12 AWG', '10 AWG',
];

export const BOARD_COLORS = ['#4f6ef7', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#14b8a6', '#64748b'];
export const CABLE_COLORS = ['#4f6ef7', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];

// ---------- Parts library ----------
export type PartCategory = 'component' | 'accessory' | 'covering' | 'terminal';

export const PART_CATEGORIES: Record<PartCategory, string> = {
  component: 'Component parts',
  accessory: 'Accessories',
  covering: 'Coverings',
  terminal: 'Terminals',
};

export const PART_TYPES: Record<string, { label: string; category: PartCategory }> = {
  connector: { label: 'Connector', category: 'component' },
  wire: { label: 'Wire', category: 'component' },
  splice: { label: 'Splice', category: 'component' },
  diode: { label: 'Diode', category: 'component' },
  resistor: { label: 'Resistor', category: 'component' },
  cable: { label: 'Cable', category: 'component' },
  generic: { label: 'Generic', category: 'component' },
  contact: { label: 'Contact', category: 'accessory' },
  'cavity-seal': { label: 'Cavity seal', category: 'accessory' },
  lock: { label: 'Lock', category: 'accessory' },
  'dust-cover': { label: 'Dust cover', category: 'accessory' },
  boot: { label: 'Boot', category: 'accessory' },
  backshell: { label: 'Backshell', category: 'accessory' },
  heatshrink: { label: 'Heatshrink', category: 'covering' },
  tape: { label: 'Tape', category: 'covering' },
  'corrugated-tubing': { label: 'Corrugated tubing', category: 'covering' },
  'spiral-wrap': { label: 'Spiral wrap', category: 'covering' },
  tubing: { label: 'Tubing', category: 'covering' },
  'braided-sleeve': { label: 'Braided sleeve', category: 'covering' },
  ferrule: { label: 'Ferrule', category: 'terminal' },
  'ring-terminal': { label: 'Ring terminal', category: 'terminal' },
  'spade-terminal': { label: 'Spade terminal', category: 'terminal' },
  'quick-connect': { label: 'Quick connect', category: 'terminal' },
};

export const TERMINAL_PART_TYPES = ['ferrule', 'ring-terminal', 'spade-terminal', 'quick-connect', 'contact'];
export const ACCESSORY_PART_TYPES = ['contact', 'cavity-seal', 'lock', 'dust-cover', 'boot', 'backshell', 'generic'];
export const COVERING_PART_TYPES = ['heatshrink', 'tape', 'corrugated-tubing', 'spiral-wrap', 'tubing', 'braided-sleeve'];

export type Part = {
  id: string;
  type: string; // key of PART_TYPES
  mpn: string;
  manufacturer?: string;
  description?: string;
  cost?: number;
  cavities?: number; // connector parts
};

export type AccessoryRef = { partId: string; qty: number };

// ---------- Node / edge data ----------
export type ConnectorData = {
  label: string;
  pinCount: number;
  side: 'left' | 'right';
  pinLabels: Record<string, string>;
  /** Cavity designations shown instead of 1..N (e.g. A1, B2). */
  pinDesignations?: Record<string, string>;
  /** Adds a shell connection row (handle id "shell"). */
  hasShell?: boolean;
  partNo?: string;
  partId?: string | null;
  accessories?: AccessoryRef[];
};

export type BoardData = { label: string; color: string };
export type GroupData = { label: string };
export type SpliceData = { label: string; partId?: string | null; coverings?: string[] };

export type TerminalType = 'ferrule' | 'ring' | 'spade' | 'quick-m' | 'quick-f' | 'loose';

export const TERMINAL_TYPES: Record<TerminalType, string> = {
  ferrule: 'Ferrule',
  ring: 'Ring',
  spade: 'Spade',
  'quick-m': 'Male quick connect',
  'quick-f': 'Female quick connect',
  loose: 'Loose wire end',
};

export type TerminalData = {
  label: string;
  termType?: TerminalType;
  signal?: string;
  partId?: string | null;
  coverings?: string[];
};

export type DiodeData = { label: string; partId?: string | null; flip?: boolean; coverings?: string[] };
export type ResistorData = { label: string; value?: string; partId?: string | null; coverings?: string[] };
export type LayoutPointData = { label: string };
export type BranchPointData = { label: string };

export const NOTE_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  yellow: { bg: '#fef9c3', border: '#fde047', text: '#713f12' },
  blue: { bg: '#dbeafe', border: '#93c5fd', text: '#1e3a8a' },
  green: { bg: '#dcfce7', border: '#86efac', text: '#14532d' },
  pink: { bg: '#fce7f3', border: '#f9a8d4', text: '#831843' },
  grey: { bg: '#f1f5f9', border: '#cbd5e1', text: '#334155' },
};

export type NoteData = {
  text: string;
  color?: string; // key of NOTE_COLORS
  align?: 'left' | 'center' | 'right';
  width?: number;
};

export type XY = { x: number; y: number };

export type WireData = {
  name?: string;
  color: string;
  stripe?: string | null;
  gauge: string;
  length?: string;
  cableId?: string | null;
  partId?: string | null;
  coverings?: string[];
  /** Layout points: bend positions the wire is routed through (flow coords). */
  points?: XY[];
  /** User-dragged label offset from its default spot above the wire. */
  labelOffset?: XY;
};

export type CableKind = 'cable' | 'bundle' | 'twisted';

export const CABLE_KINDS: Record<CableKind, string> = {
  cable: 'Cable',
  bundle: 'Bundle',
  twisted: 'Twisted wires',
};

export type Cable = {
  id: string;
  name: string;
  hex: string;
  kind: CableKind;
  partId?: string | null;
  coverings?: string[];
};

export type Project = {
  version: number;
  name: string;
  nodes: Node[];
  edges: Edge[];
  cables: Cable[];
  parts: Part[];
};

export const STORAGE_KEY = 'harness-studio-project-v1';

export const uid = () => Math.random().toString(36).slice(2, 10);

/** Node types that act as containers (children move with them). */
export const CONTAINER_TYPES = ['board', 'group'];

/** Node types where every attached wire becomes one electrical net. */
export const NET_MERGE_TYPES = ['splice', 'layoutpoint'];

// ---------- Helpers ----------

const LABEL_PREFIXES: Record<string, string> = {
  connector: 'J',
  splice: 'S',
  terminal: 'T',
  diode: 'D',
  resistor: 'R',
  layoutpoint: 'LP',
  branchpoint: 'BP',
  board: 'Board ',
  group: 'Group ',
};

/** Auto-name for a new node: J1, J2… / S1 / T1 / D1 / R1 / LP1 / BP1 / Board 1 / Group 1. */
export function nextLabel(nodes: Node[], kind: string): string {
  const prefix = LABEL_PREFIXES[kind] ?? 'X';
  const re = new RegExp(`^${prefix.trim()}\\s*(\\d+)$`);
  let max = 0;
  for (const n of nodes) {
    const label = (n.data as { label?: string })?.label ?? '';
    const m = label.match(re);
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }
  return `${prefix}${max + 1}`;
}

export function defaultWireData(edges: Edge[]): WireData {
  const color = COLOR_CYCLE[edges.length % COLOR_CYCLE.length];
  return { color, stripe: null, gauge: '24 AWG', cableId: null, partId: null, coverings: [] };
}

/** Human description of a wire endpoint, e.g. "Main PCB › J1.3 (SDA)". */
export function describeEnd(nodes: Node[], nodeId: string, handle?: string | null): string {
  const n = nodes.find((x) => x.id === nodeId);
  if (!n) return '?';
  const parent = n.parentId ? nodes.find((b) => b.id === n.parentId) : undefined;
  const prefix = parent ? `${(parent.data as { label?: string }).label ?? ''} › ` : '';
  const label = (n.data as { label?: string }).label ?? n.id;

  switch (n.type) {
    case 'splice':
      return `${prefix}${label} (splice)`;
    case 'layoutpoint':
      return `${prefix}${label} (routing)`;
    case 'terminal': {
      const t = n.data as TerminalData;
      const kind = TERMINAL_TYPES[t.termType ?? 'ring']?.toLowerCase() ?? 'terminal';
      return `${prefix}${label}${t.signal ? ` (${t.signal})` : ''} · ${kind}`;
    }
    case 'diode':
      return `${prefix}${label}.${handle === 'a' ? 'A' : 'K'}`;
    case 'resistor':
      return `${prefix}${label}.${handle === 'p1' ? '1' : '2'}`;
    default: {
      const d = n.data as ConnectorData;
      if (handle === 'shell') return `${prefix}${label}.SHELL`;
      const pin = handle ? handle.replace('pin-', '') : '?';
      const shown = d.pinDesignations?.[pin] || pin;
      const pinName = d.pinLabels?.[pin];
      return `${prefix}${label}.${shown}${pinName ? ` (${pinName})` : ''}`;
    }
  }
}

/**
 * Compute electrical nets (connected components across wires; splices and
 * layout points merge everything attached to them). Returns edgeId -> net name.
 */
export function computeNets(nodes: Node[], edges: Edge[]): Map<string, string> {
  const parent = new Map<string, string>();
  const find = (x: string): string => {
    let r = x;
    while (parent.get(r) !== undefined && parent.get(r) !== r) r = parent.get(r)!;
    parent.set(x, r);
    return r;
  };
  const union = (a: string, b: string) => {
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) parent.set(ra, rb);
  };
  const mergeIds = new Set(
    nodes.filter((n) => NET_MERGE_TYPES.includes(n.type ?? '')).map((n) => n.id),
  );
  const keyFor = (nodeId: string, handle?: string | null) =>
    mergeIds.has(nodeId) ? nodeId : `${nodeId}:${handle ?? ''}`;

  for (const e of edges) {
    const a = keyFor(e.source, e.sourceHandle);
    const b = keyFor(e.target, e.targetHandle);
    if (!parent.has(a)) parent.set(a, a);
    if (!parent.has(b)) parent.set(b, b);
    union(a, b);
  }

  const netNames = new Map<string, string>();
  const result = new Map<string, string>();
  let i = 1;
  for (const e of edges) {
    const root = find(keyFor(e.source, e.sourceHandle));
    if (!netNames.has(root)) netNames.set(root, `N${i++}`);
    result.set(e.id, netNames.get(root)!);
  }
  return result;
}

/** Distance from point p to segment a-b (for inserting layout points). */
export function distToSegment(p: XY, a: XY, b: XY): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const l2 = dx * dx + dy * dy;
  const t = l2 === 0 ? 0 : Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / l2));
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
}

/** Bill of materials: partId -> quantity used across the whole design. */
export function computeBom(nodes: Node[], edges: Edge[], cables: Cable[]): Map<string, number> {
  const qty = new Map<string, number>();
  const add = (partId: string | null | undefined, n = 1) => {
    if (!partId) return;
    qty.set(partId, (qty.get(partId) ?? 0) + n);
  };
  for (const n of nodes) {
    const d = n.data as Partial<ConnectorData> & { coverings?: string[] };
    add(d.partId);
    for (const acc of d.accessories ?? []) add(acc.partId, acc.qty);
    for (const c of d.coverings ?? []) add(c);
  }
  for (const e of edges) {
    const d = e.data as WireData | undefined;
    add(d?.partId);
    for (const c of d?.coverings ?? []) add(c);
  }
  for (const c of cables) {
    add(c.partId);
    for (const cov of c.coverings ?? []) add(cov);
  }
  return qty;
}
