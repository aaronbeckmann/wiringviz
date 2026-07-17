import { useMemo, useState } from 'react';
import type { Edge, Node } from '@xyflow/react';
import {
  PART_CATEGORIES,
  PART_TYPES,
  computeBom,
  type Cable,
  type Part,
  type PartCategory,
} from '../model';

export default function PartsView({ parts, nodes, edges, cables, onAddPart, onUpdatePart, onDeletePart }: {
  parts: Part[];
  nodes: Node[];
  edges: Edge[];
  cables: Cable[];
  onAddPart: (part: Omit<Part, 'id'>) => void;
  onUpdatePart: (id: string, patch: Partial<Part>) => void;
  onDeletePart: (id: string) => void;
}) {
  const [newType, setNewType] = useState('connector');
  const [newMpn, setNewMpn] = useState('');

  const bom = useMemo(() => computeBom(nodes, edges, cables), [nodes, edges, cables]);

  const totalCost = parts.reduce((sum, p) => sum + (bom.get(p.id) ?? 0) * (p.cost ?? 0), 0);
  const totalQty = parts.reduce((sum, p) => sum + (bom.get(p.id) ?? 0), 0);
  const unpriced = parts.filter((p) => (bom.get(p.id) ?? 0) > 0 && p.cost == null).length;

  const categories = Object.keys(PART_CATEGORIES) as PartCategory[];

  const submit = () => {
    if (!newMpn.trim()) return;
    onAddPart({ type: newType, mpn: newMpn.trim() });
    setNewMpn('');
  };

  return (
    <div className="connections-view">
      <div className="connections-header">
        <h2>Parts & BOM</h2>
        <span className="connections-sub">
          {parts.length} part{parts.length === 1 ? '' : 's'} in library
        </span>
      </div>

      <div className="parts-add">
        <select value={newType} onChange={(e) => setNewType(e.target.value)}>
          {categories.map((cat) => (
            <optgroup key={cat} label={PART_CATEGORIES[cat]}>
              {Object.entries(PART_TYPES)
                .filter(([, v]) => v.category === cat)
                .map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
            </optgroup>
          ))}
        </select>
        <input
          value={newMpn}
          placeholder="Part number (MPN), e.g. JST-GH-6P"
          onChange={(e) => setNewMpn(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submit();
          }}
        />
        <button type="button" className="tb-btn tb-primary" onClick={submit}>
          Add part
        </button>
      </div>

      <div className="connections-scroll parts-scroll">
        {parts.length === 0 ? (
          <div className="connections-empty" style={{ border: 'none' }}>
            No parts yet. Add connector housings, wires, contacts, coverings and terminals here, then assign
            them to components from the inspector.
          </div>
        ) : (
          categories.map((cat) => {
            const catParts = parts.filter((p) => PART_TYPES[p.type]?.category === cat);
            if (catParts.length === 0) return null;
            return (
              <div key={cat}>
                <div className="parts-cat">{PART_CATEGORIES[cat]}</div>
                <table>
                  <thead>
                    <tr>
                      <th style={{ width: 180 }}>Part number</th>
                      <th style={{ width: 130 }}>Type</th>
                      <th style={{ width: 150 }}>Manufacturer</th>
                      <th>Description</th>
                      <th style={{ width: 70 }}>Cavities</th>
                      <th style={{ width: 80 }}>Cost</th>
                      <th style={{ width: 60 }}>Used</th>
                      <th style={{ width: 80 }}>Ext. cost</th>
                      <th style={{ width: 40 }} />
                    </tr>
                  </thead>
                  <tbody>
                    {catParts.map((p) => {
                      const used = bom.get(p.id) ?? 0;
                      return (
                        <tr key={p.id}>
                          <td>
                            <input className="cell-input" value={p.mpn} onChange={(e) => onUpdatePart(p.id, { mpn: e.target.value })} />
                          </td>
                          <td className="dim">{PART_TYPES[p.type]?.label ?? p.type}</td>
                          <td>
                            <input
                              className="cell-input"
                              value={p.manufacturer ?? ''}
                              placeholder="—"
                              onChange={(e) => onUpdatePart(p.id, { manufacturer: e.target.value })}
                            />
                          </td>
                          <td>
                            <input
                              className="cell-input"
                              value={p.description ?? ''}
                              placeholder="—"
                              onChange={(e) => onUpdatePart(p.id, { description: e.target.value })}
                            />
                          </td>
                          <td>
                            {p.type === 'connector' ? (
                              <input
                                className="cell-input"
                                type="number"
                                min={1}
                                value={p.cavities ?? ''}
                                placeholder="—"
                                onChange={(e) =>
                                  onUpdatePart(p.id, { cavities: e.target.value ? Number(e.target.value) : undefined })
                                }
                              />
                            ) : (
                              <span className="dim">—</span>
                            )}
                          </td>
                          <td>
                            <input
                              className="cell-input"
                              type="number"
                              step="0.01"
                              min={0}
                              value={p.cost ?? ''}
                              placeholder="—"
                              onChange={(e) => onUpdatePart(p.id, { cost: e.target.value ? Number(e.target.value) : undefined })}
                            />
                          </td>
                          <td className={used ? '' : 'dim'}>{used || '—'}</td>
                          <td className={used && p.cost ? '' : 'dim'}>
                            {used && p.cost ? (used * p.cost).toFixed(2) : '—'}
                          </td>
                          <td>
                            <button
                              type="button"
                              className="mini-btn"
                              title="Delete part (unassigns it everywhere)"
                              onClick={() => onDeletePart(p.id)}
                            >
                              ×
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            );
          })
        )}
      </div>

      <div className="bom-total">
        <span>
          <b>{totalQty}</b> item{totalQty === 1 ? '' : 's'} on the BOM
          {unpriced > 0 && (
            <span className="dim"> · {unpriced} used part{unpriced === 1 ? '' : 's'} without a cost</span>
          )}
        </span>
        <span className="bom-total-cost">
          Total cost: <b>{totalCost.toFixed(2)}</b>
        </span>
      </div>
    </div>
  );
}
