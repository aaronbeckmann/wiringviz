import type { ReactNode } from 'react';
import type { Edge, Node } from '@xyflow/react';
import {
  ACCESSORY_PART_TYPES,
  BOARD_COLORS,
  CABLE_KINDS,
  COVERING_PART_TYPES,
  GAUGES,
  NOTE_COLORS,
  PART_TYPES,
  TERMINAL_PART_TYPES,
  TERMINAL_TYPES,
  WIRE_COLORS,
  type AccessoryRef,
  type BoardData,
  type Cable,
  type CableKind,
  type ConnectorData,
  type NoteData,
  type Part,
  type ResistorData,
  type SpliceData,
  type TerminalData,
  type TerminalType,
  type WireData,
} from '../model';

type InspectorProps = {
  nodes: Node[];
  edges: Edge[];
  cables: Cable[];
  parts: Part[];
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  onUpdateNodeData: (id: string, patch: Record<string, unknown>) => void;
  onSetPinCount: (id: string, count: number) => void;
  onUpdateEdgeData: (id: string, patch: Partial<WireData>) => void;
  onAddCable: (name: string) => string;
  onUpdateCable: (id: string, patch: Partial<Cable>) => void;
  onDeleteCable: (id: string) => void;
  onCreatePart: (type: string, mpn: string) => string;
};

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="form-row">
      <span className="form-label">{label}</span>
      {children}
    </label>
  );
}

function SwatchGrid({ value, onChange, allowNone }: {
  value: string | null | undefined;
  onChange: (code: string | null) => void;
  allowNone?: boolean;
}) {
  return (
    <div className="swatch-grid">
      {allowNone && (
        <button
          type="button"
          className={`swatch swatch-none ${!value ? 'is-active' : ''}`}
          title="None"
          onClick={() => onChange(null)}
        >
          ×
        </button>
      )}
      {Object.entries(WIRE_COLORS).map(([code, c]) => (
        <button
          type="button"
          key={code}
          className={`swatch ${value === code ? 'is-active' : ''}`}
          style={{ background: c.hex }}
          title={`${code} — ${c.name}`}
          onClick={() => onChange(code)}
        />
      ))}
    </div>
  );
}

function PartSelect({ parts, allow, value, onChange, onCreatePart }: {
  parts: Part[];
  allow: string[];
  value?: string | null;
  onChange: (id: string | null) => void;
  onCreatePart: (type: string, mpn: string) => string;
}) {
  const options = parts.filter((p) => allow.includes(p.type));
  return (
    <select
      value={value ?? ''}
      onChange={(e) => {
        if (e.target.value === '__new__') {
          const mpn = window.prompt(`New ${PART_TYPES[allow[0]]?.label.toLowerCase() ?? ''} part — part number (MPN):`);
          if (mpn) onChange(onCreatePart(allow[0], mpn));
        } else {
          onChange(e.target.value || null);
        }
      }}
    >
      <option value="">— no part —</option>
      {options.map((p) => (
        <option key={p.id} value={p.id}>
          {p.mpn}
          {p.type !== allow[0] ? ` · ${PART_TYPES[p.type]?.label}` : ''}
        </option>
      ))}
      <option value="__new__">+ New part…</option>
    </select>
  );
}

function CoveringsEditor({ parts, value, onChange }: {
  parts: Part[];
  value: string[];
  onChange: (coverings: string[]) => void;
}) {
  const coveringParts = parts.filter((p) => COVERING_PART_TYPES.includes(p.type));
  return (
    <div className="covering-editor">
      {value.map((id, i) => {
        const p = parts.find((x) => x.id === id);
        return (
          <span key={`${id}-${i}`} className="covering-chip" title={p ? PART_TYPES[p.type]?.label : ''}>
            {p?.mpn ?? '?'}
            <button type="button" onClick={() => onChange(value.filter((_, j) => j !== i))}>×</button>
          </span>
        );
      })}
      {coveringParts.length > 0 ? (
        <select
          value=""
          onChange={(e) => {
            if (e.target.value) onChange([...value, e.target.value]);
          }}
        >
          <option value="">+ Add covering…</option>
          {coveringParts.map((p) => (
            <option key={p.id} value={p.id}>
              {p.mpn} · {PART_TYPES[p.type]?.label}
            </option>
          ))}
        </select>
      ) : (
        <span className="panel-hint">Create covering parts (heatshrink, tape, tubing…) in the Parts view.</span>
      )}
    </div>
  );
}

function AccessoriesEditor({ parts, value, onChange }: {
  parts: Part[];
  value: AccessoryRef[];
  onChange: (accessories: AccessoryRef[]) => void;
}) {
  const accessoryParts = parts.filter((p) => ACCESSORY_PART_TYPES.includes(p.type));
  return (
    <div>
      {value.map((acc, i) => {
        const p = parts.find((x) => x.id === acc.partId);
        return (
          <div key={`${acc.partId}-${i}`} className="accessory-row">
            <span className="accessory-name" title={p ? PART_TYPES[p.type]?.label : ''}>
              {p?.mpn ?? '?'}
              <span className="dim"> · {p ? PART_TYPES[p.type]?.label : 'missing part'}</span>
            </span>
            <input
              type="number"
              min={1}
              value={acc.qty}
              onChange={(e) => {
                const qty = Math.max(1, Number(e.target.value) || 1);
                onChange(value.map((a, j) => (j === i ? { ...a, qty } : a)));
              }}
            />
            <button type="button" className="mini-btn" onClick={() => onChange(value.filter((_, j) => j !== i))}>
              ×
            </button>
          </div>
        );
      })}
      {accessoryParts.length > 0 ? (
        <select
          value=""
          onChange={(e) => {
            if (e.target.value) onChange([...value, { partId: e.target.value, qty: 1 }]);
          }}
        >
          <option value="">+ Add accessory…</option>
          {accessoryParts.map((p) => (
            <option key={p.id} value={p.id}>
              {p.mpn} · {PART_TYPES[p.type]?.label}
            </option>
          ))}
        </select>
      ) : (
        <span className="panel-hint">
          Create accessory parts (contacts, seals, locks, boots, backshells…) in the Parts view.
        </span>
      )}
    </div>
  );
}

export default function Inspector(props: InspectorProps) {
  const { nodes, edges, selectedNodeId, selectedEdgeId } = props;

  const edge = selectedEdgeId ? edges.find((e) => e.id === selectedEdgeId) : undefined;
  const node = !edge && selectedNodeId ? nodes.find((n) => n.id === selectedNodeId) : undefined;

  return (
    <aside className="inspector">
      {edge ? <WireEditor edge={edge} {...props} /> : node ? <NodeEditor node={node} {...props} /> : <ProjectOverview {...props} />}
    </aside>
  );
}

function WireEditor({ edge, cables, parts, onUpdateEdgeData, onAddCable, onCreatePart }: InspectorProps & { edge: Edge }) {
  const d = (edge.data ?? {}) as WireData;
  const set = (patch: Partial<WireData>) => onUpdateEdgeData(edge.id, patch);
  return (
    <>
      <div className="panel-title">Wire</div>
      <Row label="Name">
        <input value={d.name ?? ''} placeholder="e.g. +5V" onChange={(e) => set({ name: e.target.value })} />
      </Row>
      <Row label="Color">
        <SwatchGrid value={d.color} onChange={(c) => set({ color: c ?? 'BK' })} />
      </Row>
      <Row label="Stripe">
        <SwatchGrid value={d.stripe} allowNone onChange={(c) => set({ stripe: c })} />
      </Row>
      <Row label="Gauge">
        <select value={d.gauge ?? ''} onChange={(e) => set({ gauge: e.target.value })}>
          <option value="">—</option>
          {GAUGES.map((g) => (
            <option key={g} value={g}>{g}</option>
          ))}
        </select>
      </Row>
      <Row label="Length">
        <input value={d.length ?? ''} placeholder="e.g. 250 mm" onChange={(e) => set({ length: e.target.value })} />
      </Row>
      <Row label="Wire part">
        <PartSelect parts={parts} allow={['wire', 'generic']} value={d.partId} onChange={(id) => set({ partId: id })} onCreatePart={onCreatePart} />
      </Row>
      <Row label="Cable / bundle">
        <select
          value={d.cableId ?? ''}
          onChange={(e) => {
            if (e.target.value === '__new__') {
              const name = window.prompt('Cable / bundle name', `Cable ${cables.length + 1}`);
              if (name) set({ cableId: onAddCable(name) });
            } else {
              set({ cableId: e.target.value || null });
            }
          }}
        >
          <option value="">— none —</option>
          {cables.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} · {CABLE_KINDS[c.kind]}
            </option>
          ))}
          <option value="__new__">+ New cable…</option>
        </select>
      </Row>
      <div className="form-section">Coverings</div>
      <CoveringsEditor parts={parts} value={d.coverings ?? []} onChange={(coverings) => set({ coverings })} />
      <div className="form-section">
        Layout points ({d.points?.length ?? 0})
        {(d.points?.length ?? 0) > 0 && (
          <button type="button" className="mini-btn" onClick={() => set({ points: [] })}>
            Delete all
          </button>
        )}
      </div>
      <div className="panel-hint">
        Double-click the wire to add a layout point (bend); drag it to route the wire; double-click a point to
        remove it. Press Delete to remove the selected wire.
      </div>
    </>
  );
}

function NodeEditor(props: InspectorProps & { node: Node }) {
  const { node, parts, onUpdateNodeData, onSetPinCount, onCreatePart } = props;
  const setData = (patch: Record<string, unknown>) => onUpdateNodeData(node.id, patch);

  if (node.type === 'board') {
    const d = node.data as BoardData;
    return (
      <>
        <div className="panel-title">Board</div>
        <Row label="Name">
          <input value={d.label} onChange={(e) => setData({ label: e.target.value })} />
        </Row>
        <Row label="Color">
          <div className="swatch-grid">
            {BOARD_COLORS.map((hex) => (
              <button
                type="button"
                key={hex}
                className={`swatch ${d.color === hex ? 'is-active' : ''}`}
                style={{ background: hex }}
                onClick={() => setData({ color: hex })}
              />
            ))}
          </div>
        </Row>
        <div className="panel-hint">Drag the corners to resize. Components dropped on a board move with it.</div>
      </>
    );
  }

  if (node.type === 'group') {
    const d = node.data as { label: string };
    return (
      <>
        <div className="panel-title">Group</div>
        <Row label="Name">
          <input value={d.label} onChange={(e) => setData({ label: e.target.value })} />
        </Row>
        <div className="panel-hint">
          An organizational container — components dropped inside move with the group. No electrical meaning.
        </div>
      </>
    );
  }

  if (node.type === 'note') {
    const d = node.data as NoteData;
    return (
      <>
        <div className="panel-title">Note</div>
        <Row label="Text">
          <textarea
            rows={6}
            value={d.text}
            placeholder="Annotation…"
            onChange={(e) => setData({ text: e.target.value })}
          />
        </Row>
        <Row label="Color">
          <div className="swatch-grid">
            {Object.entries(NOTE_COLORS).map(([key, c]) => (
              <button
                type="button"
                key={key}
                className={`swatch ${(d.color ?? 'yellow') === key ? 'is-active' : ''}`}
                style={{ background: c.bg, borderColor: c.border }}
                title={key}
                onClick={() => setData({ color: key })}
              />
            ))}
          </div>
        </Row>
        <Row label="Align">
          <div className="seg">
            {(['left', 'center', 'right'] as const).map((a) => (
              <button
                type="button"
                key={a}
                className={(d.align ?? 'left') === a ? 'is-active' : ''}
                onClick={() => setData({ align: a })}
              >
                {a === 'left' ? '⇤' : a === 'center' ? '↔' : '⇥'}
              </button>
            ))}
          </div>
        </Row>
        <Row label="Width">
          <select value={d.width ?? 190} onChange={(e) => setData({ width: Number(e.target.value) })}>
            {[150, 190, 240, 300, 380].map((wd) => (
              <option key={wd} value={wd}>{wd} px</option>
            ))}
          </select>
        </Row>
        <div className="panel-hint">Notes are documentation only — they never appear in the connections table or BOM.</div>
      </>
    );
  }

  if (node.type === 'splice') {
    const d = node.data as SpliceData;
    return (
      <>
        <div className="panel-title">Splice</div>
        <Row label="Name">
          <input value={d.label} onChange={(e) => setData({ label: e.target.value })} />
        </Row>
        <Row label="Splice part">
          <PartSelect parts={parts} allow={['splice', 'generic']} value={d.partId} onChange={(id) => setData({ partId: id })} onCreatePart={onCreatePart} />
        </Row>
        <div className="form-section">Coverings</div>
        <CoveringsEditor parts={parts} value={d.coverings ?? []} onChange={(coverings) => setData({ coverings })} />
        <div className="panel-hint">All wires attached to a splice belong to the same net.</div>
      </>
    );
  }

  if (node.type === 'terminal') {
    const d = node.data as TerminalData;
    return (
      <>
        <div className="panel-title">Terminal</div>
        <Row label="Name">
          <input value={d.label} onChange={(e) => setData({ label: e.target.value })} />
        </Row>
        <Row label="Type">
          <select
            value={d.termType ?? 'ring'}
            onChange={(e) => setData({ termType: e.target.value as TerminalType })}
          >
            {Object.entries(TERMINAL_TYPES).map(([k, label]) => (
              <option key={k} value={k}>{label}</option>
            ))}
          </select>
        </Row>
        <Row label="Signal">
          <input
            value={d.signal ?? ''}
            placeholder="e.g. CHASSIS GND"
            onChange={(e) => setData({ signal: e.target.value })}
          />
        </Row>
        <Row label="Terminal part">
          <PartSelect parts={parts} allow={[...TERMINAL_PART_TYPES, 'generic']} value={d.partId} onChange={(id) => setData({ partId: id })} onCreatePart={onCreatePart} />
        </Row>
        <div className="form-section">Coverings</div>
        <CoveringsEditor parts={parts} value={d.coverings ?? []} onChange={(coverings) => setData({ coverings })} />
        <div className="panel-hint">A single electrical termination point. Attach a wire to its pad.</div>
      </>
    );
  }

  if (node.type === 'diode') {
    const d = node.data as { label: string; partId?: string | null; flip?: boolean; coverings?: string[] };
    return (
      <>
        <div className="panel-title">Diode</div>
        <Row label="Name">
          <input value={d.label} onChange={(e) => setData({ label: e.target.value })} />
        </Row>
        <Row label="Direction">
          <div className="seg">
            <button type="button" className={!d.flip ? 'is-active' : ''} onClick={() => setData({ flip: false })}>
              A ▸ K
            </button>
            <button type="button" className={d.flip ? 'is-active' : ''} onClick={() => setData({ flip: true })}>
              K ◂ A
            </button>
          </div>
        </Row>
        <Row label="Diode part">
          <PartSelect parts={parts} allow={['diode', 'generic']} value={d.partId} onChange={(id) => setData({ partId: id })} onCreatePart={onCreatePart} />
        </Row>
        <div className="form-section">Coverings</div>
        <CoveringsEditor parts={parts} value={d.coverings ?? []} onChange={(coverings) => setData({ coverings })} />
        <div className="panel-hint">Inline diode — A is the anode, K the cathode. Press R to flip the selected diode.</div>
      </>
    );
  }

  if (node.type === 'resistor') {
    const d = node.data as ResistorData;
    return (
      <>
        <div className="panel-title">Resistor</div>
        <Row label="Name">
          <input value={d.label} onChange={(e) => setData({ label: e.target.value })} />
        </Row>
        <Row label="Value">
          <input value={d.value ?? ''} placeholder="e.g. 120 Ω" onChange={(e) => setData({ value: e.target.value })} />
        </Row>
        <Row label="Resistor part">
          <PartSelect parts={parts} allow={['resistor', 'generic']} value={d.partId} onChange={(id) => setData({ partId: id })} onCreatePart={onCreatePart} />
        </Row>
        <div className="form-section">Coverings</div>
        <CoveringsEditor parts={parts} value={d.coverings ?? []} onChange={(coverings) => setData({ coverings })} />
      </>
    );
  }

  if (node.type === 'layoutpoint') {
    const d = node.data as { label: string };
    return (
      <>
        <div className="panel-title">Layout point (legacy)</div>
        <Row label="Name">
          <input value={d.label} onChange={(e) => setData({ label: e.target.value })} />
        </Row>
        <div className="panel-hint">
          Layout points are now added by <b>double-clicking a wire</b> — this standalone node is a leftover from
          an older save. Delete it and bend the wire directly instead.
        </div>
      </>
    );
  }

  if (node.type === 'branchpoint') {
    const d = node.data as { label: string };
    return (
      <>
        <div className="panel-title">Branch point</div>
        <Row label="Name">
          <input value={d.label} onChange={(e) => setData({ label: e.target.value })} />
        </Row>
        <div className="panel-hint">
          Marks where the physical harness trunk splits into branches. Documentation marker only — wires don't
          connect to it.
        </div>
      </>
    );
  }

  // connector
  const d = node.data as ConnectorData;
  const part = d.partId ? parts.find((p) => p.id === d.partId) : undefined;
  const cavityMismatch = part?.cavities != null && part.cavities !== d.pinCount;
  return (
    <>
      <div className="panel-title">Connector</div>
      <Row label="Name">
        <input value={d.label} onChange={(e) => setData({ label: e.target.value })} />
      </Row>
      <Row label="Subtitle">
        <input value={d.partNo ?? ''} placeholder="free text, e.g. sensor" onChange={(e) => setData({ partNo: e.target.value })} />
      </Row>
      <Row label="Connector part">
        <PartSelect parts={parts} allow={['connector']} value={d.partId} onChange={(id) => setData({ partId: id })} onCreatePart={onCreatePart} />
      </Row>
      {cavityMismatch && (
        <div className="warn-hint">
          ⚠ Part has {part!.cavities} cavities but this connector has {d.pinCount} pins.
        </div>
      )}
      <Row label="Pins">
        <input
          type="number"
          min={1}
          max={64}
          value={d.pinCount}
          onChange={(e) => {
            const v = Math.max(1, Math.min(64, Number(e.target.value) || 1));
            onSetPinCount(node.id, v);
          }}
        />
      </Row>
      <Row label="Pins face">
        <div className="seg">
          <button type="button" className={d.side === 'left' ? 'is-active' : ''} onClick={() => setData({ side: 'left' })}>
            ← Left
          </button>
          <button type="button" className={d.side !== 'left' ? 'is-active' : ''} onClick={() => setData({ side: 'right' })}>
            Right →
          </button>
        </div>
      </Row>
      <Row label="Shell">
        <label className="check-row">
          <input
            type="checkbox"
            checked={Boolean(d.hasShell)}
            onChange={(e) => setData({ hasShell: e.target.checked })}
          />
          <span>Shell connection (e.g. for cable shields)</span>
        </label>
      </Row>
      <div className="form-section">Cavities (designation · signal)</div>
      <div className="pin-label-list">
        {Array.from({ length: d.pinCount }, (_, i) => {
          const pin = String(i + 1);
          return (
            <div key={pin} className="pin-label-row">
              <input
                className="pin-desig"
                value={d.pinDesignations?.[pin] ?? ''}
                placeholder={pin}
                title="Cavity designation (e.g. A1)"
                onChange={(e) => setData({ pinDesignations: { ...d.pinDesignations, [pin]: e.target.value } })}
              />
              <input
                value={d.pinLabels?.[pin] ?? ''}
                placeholder="signal name"
                onChange={(e) => setData({ pinLabels: { ...d.pinLabels, [pin]: e.target.value } })}
              />
            </div>
          );
        })}
      </div>
      <div className="form-section">Accessories</div>
      <AccessoriesEditor parts={parts} value={d.accessories ?? []} onChange={(accessories) => setData({ accessories })} />
    </>
  );
}

function ProjectOverview({ nodes, edges, cables, parts, onAddCable, onUpdateCable, onDeleteCable, onCreatePart }: InspectorProps) {
  const count = (t: string) => nodes.filter((n) => n.type === t).length;
  return (
    <>
      <div className="panel-title">Project</div>
      <div className="stat-grid">
        <div className="stat"><b>{count('board')}</b><span>boards</span></div>
        <div className="stat"><b>{count('connector')}</b><span>connectors</span></div>
        <div className="stat"><b>{edges.length}</b><span>wires</span></div>
        <div className="stat"><b>{count('splice')}</b><span>splices</span></div>
        <div className="stat"><b>{count('terminal')}</b><span>terminals</span></div>
        <div className="stat"><b>{count('diode') + count('resistor')}</b><span>diodes + resistors</span></div>
      </div>

      <div className="form-section">
        Cables / bundles / twisted
        <button
          type="button"
          className="mini-btn"
          onClick={() => {
            const name = window.prompt('Cable / bundle name', `Cable ${cables.length + 1}`);
            if (name) onAddCable(name);
          }}
        >
          + Add
        </button>
      </div>
      {cables.length === 0 && (
        <div className="panel-hint">No cables yet. Group wires into a cable from the wire inspector.</div>
      )}
      {cables.map((c) => {
        const wireCount = edges.filter((e) => (e.data as WireData | undefined)?.cableId === c.id).length;
        return (
          <div key={c.id} className="cable-block">
            <div className="cable-row">
              <span className="cable-dot" style={{ background: c.hex }} />
              <input value={c.name} onChange={(e) => onUpdateCable(c.id, { name: e.target.value })} />
              <select
                className="cable-kind"
                value={c.kind}
                onChange={(e) => onUpdateCable(c.id, { kind: e.target.value as CableKind })}
              >
                {Object.entries(CABLE_KINDS).map(([k, label]) => (
                  <option key={k} value={k}>{label}</option>
                ))}
              </select>
              <span className="cable-count">{wireCount}w</span>
              <button type="button" className="mini-btn" title="Delete cable" onClick={() => onDeleteCable(c.id)}>×</button>
            </div>
            <div className="cable-sub">
              <PartSelect
                parts={parts}
                allow={['cable', 'generic']}
                value={c.partId}
                onChange={(id) => onUpdateCable(c.id, { partId: id })}
                onCreatePart={onCreatePart}
              />
              <CoveringsEditor parts={parts} value={c.coverings ?? []} onChange={(coverings) => onUpdateCable(c.id, { coverings })} />
            </div>
          </div>
        );
      })}

      <div className="panel-hint" style={{ marginTop: 16 }}>
        Select any component or wire to edit its properties and assign parts. Manage the parts library and BOM
        in the <b>Parts</b> view.
      </div>
    </>
  );
}
