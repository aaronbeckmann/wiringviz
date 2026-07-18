import { useMemo, useState } from 'react';
import type { Edge, Node } from '@xyflow/react';
import {
  PART_CATEGORIES,
  PART_TYPES,
  computeBom,
  partCategoryOf,
  partTypeLabel,
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
  const [newCustomType, setNewCustomType] = useState('');
  const [newMpn, setNewMpn] = useState('');

  const bom = useMemo(() => computeBom(nodes, edges, cables), [nodes, edges, cables]);

  const totalOf = (p: Part) => (bom.get(p.id) ?? 0) + (p.manualQty ?? 0);
  const totalCost = parts.reduce((sum, p) => sum + totalOf(p) * (p.cost ?? 0), 0);
  const totalQty = parts.reduce((sum, p) => sum + totalOf(p), 0);
  const unpriced = parts.filter((p) => totalOf(p) > 0 && p.cost == null).length;

  const categories = Object.keys(PART_CATEGORIES) as PartCategory[];

  const isCustom = newType === '__custom__';

  const submit = () => {
    const type = isCustom ? newCustomType.trim() : newType;
    if (!newMpn.trim() || !type) return;
    onAddPart({ type, mpn: newMpn.trim() });
    setNewMpn('');
    if (isCustom) setNewCustomType('');
  };

  return (
    <div className="connections-view">
      <div className="connections-header">
        <h2>Parts & BOM</h2>
        <span className="connections-sub">
          {parts.length} part{parts.length === 1 ? '' : 's'} in library · parts don't need to appear on the
          schematic — use "Extra" for spares, zip ties, fuses…
        </span>
      </div>

      <div className="parts-add">
        <select value={newType} onChange={(e) => setNewType(e.target.value)}>
          {categories
            .filter((c) => c !== 'other')
            .map((cat) => (
              <optgroup key={cat} label={PART_CATEGORIES[cat]}>
                {Object.entries(PART_TYPES)
                  .filter(([, v]) => v.category === cat)
                  .map(([k, v]) => (
                    <option key={k} value={k}>{v.label}</option>
                  ))}
              </optgroup>
            ))}
          <optgroup label={PART_CATEGORIES.other}>
            <option value="__custom__">Custom type…</option>
          </optgroup>
        </select>
        {isCustom && (
          <input
            className="parts-add-type"
            value={newCustomType}
            placeholder="Type, e.g. Zip tie"
            onChange={(e) => setNewCustomType(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submit();
            }}
          />
        )}
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
            them to components from the inspector. Parts with a custom type (zip ties, fuses, labels…) live
            only on the BOM — set their quantity in the "Extra" column.
          </div>
        ) : (
          categories.map((cat) => {
            const catParts = parts.filter((p) => partCategoryOf(p.type) === cat);
            if (catParts.length === 0) return null;
            return (
              <div key={cat}>
                <div className="parts-cat">{PART_CATEGORIES[cat]}</div>
                <table>
                  <thead>
                    <tr>
                      <th style={{ width: 170 }}>Part number</th>
                      <th style={{ width: 120 }}>Type</th>
                      <th style={{ width: 130 }}>Manufacturer</th>
                      <th>Description</th>
                      <th style={{ width: 66 }}>Cavities</th>
                      <th style={{ width: 74 }}>Cost</th>
                      <th style={{ width: 66 }} title="Assignments in the schematic">In design</th>
                      <th style={{ width: 66 }} title="Manually added quantity (not on the schematic)">Extra</th>
                      <th style={{ width: 56 }}>Total</th>
                      <th style={{ width: 76 }}>Ext. cost</th>
                      <th style={{ width: 40 }} />
                    </tr>
                  </thead>
                  <tbody>
                    {catParts.map((p) => {
                      const inDesign = bom.get(p.id) ?? 0;
                      const total = totalOf(p);
                      return (
                        <tr key={p.id}>
                          <td>
                            <input className="cell-input" value={p.mpn} onChange={(e) => onUpdatePart(p.id, { mpn: e.target.value })} />
                          </td>
                          <td className="dim">
                            {cat === 'other' ? (
                              <input
                                className="cell-input"
                                value={p.type}
                                title="Custom type"
                                onChange={(e) => onUpdatePart(p.id, { type: e.target.value || 'generic' })}
                              />
                            ) : (
                              partTypeLabel(p.type)
                            )}
                          </td>
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
                          <td className={inDesign ? '' : 'dim'}>{inDesign || '—'}</td>
                          <td>
                            <input
                              className="cell-input"
                              type="number"
                              min={0}
                              value={p.manualQty ?? ''}
                              placeholder="0"
                              onChange={(e) =>
                                onUpdatePart(p.id, { manualQty: e.target.value ? Math.max(0, Number(e.target.value)) : undefined })
                              }
                            />
                          </td>
                          <td className={total ? '' : 'dim'}><b>{total || '—'}</b></td>
                          <td className={total && p.cost ? '' : 'dim'}>
                            {total && p.cost ? (total * p.cost).toFixed(2) : '—'}
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
          <b>{totalQty}</b> item{totalQty === 1 ? '' : 's'} on the BOM (design + extra)
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
