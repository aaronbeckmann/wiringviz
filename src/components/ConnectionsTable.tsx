import { useMemo } from 'react';
import type { Edge, Node } from '@xyflow/react';
import { CABLE_KINDS, computeNets, describeEnd, WIRE_COLORS, type Cable, type Part, type WireData } from '../model';

export default function ConnectionsTable({ nodes, edges, cables, parts, onSelectWire }: {
  nodes: Node[];
  edges: Edge[];
  cables: Cable[];
  parts: Part[];
  onSelectWire: (edgeId: string) => void;
}) {
  const nets = useMemo(() => computeNets(nodes, edges), [nodes, edges]);
  const cableById = useMemo(() => new Map(cables.map((c) => [c.id, c])), [cables]);
  const partById = useMemo(() => new Map(parts.map((p) => [p.id, p])), [parts]);

  const rows = edges.map((e, i) => {
    const d = (e.data ?? {}) as WireData;
    const cable = d.cableId ? cableById.get(d.cableId) : undefined;
    const twistedWith =
      cable?.kind === 'twisted'
        ? edges
            .filter((o) => o.id !== e.id && (o.data as WireData | undefined)?.cableId === cable.id)
            .map((o, j) => (o.data as WireData | undefined)?.name || `wire ${edges.indexOf(o) + 1}` || `#${j}`)
        : [];
    return { e, d, i, cable, twistedWith, net: nets.get(e.id) ?? '—' };
  });

  return (
    <div className="connections-view">
      <div className="connections-header">
        <h2>Connections</h2>
        <span className="connections-sub">
          {edges.length} wire{edges.length === 1 ? '' : 's'} ·{' '}
          {new Set([...nets.values()]).size} net{new Set([...nets.values()]).size === 1 ? '' : 's'} ·{' '}
          {cables.length} cable{cables.length === 1 ? '' : 's'}
        </span>
      </div>
      {edges.length === 0 ? (
        <div className="connections-empty">
          No wires yet — switch to the Schematic view and drag from one pin to another.
        </div>
      ) : (
        <div className="connections-scroll">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Wire</th>
                <th>From</th>
                <th>To</th>
                <th>Color</th>
                <th>Gauge</th>
                <th>Length</th>
                <th>Part</th>
                <th>Cable</th>
                <th>Twisted with</th>
                <th>Net</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ e, d, i, cable, twistedWith, net }) => {
                const color = WIRE_COLORS[d.color];
                const stripe = d.stripe ? WIRE_COLORS[d.stripe] : undefined;
                return (
                  <tr key={e.id} onClick={() => onSelectWire(e.id)} title="Click to show on schematic">
                    <td className="dim">{i + 1}</td>
                    <td>{d.name || <span className="dim">—</span>}</td>
                    <td>{describeEnd(nodes, e.source, e.sourceHandle)}</td>
                    <td>{describeEnd(nodes, e.target, e.targetHandle)}</td>
                    <td>
                      <span className="table-swatch" style={{ background: color?.hex ?? '#999' }}>
                        {stripe && <span className="table-swatch-stripe" style={{ background: stripe.hex }} />}
                      </span>
                      {d.color}
                      {d.stripe ? `/${d.stripe}` : ''}
                    </td>
                    <td>{d.gauge || <span className="dim">—</span>}</td>
                    <td>{d.length || <span className="dim">—</span>}</td>
                    <td>{d.partId ? partById.get(d.partId)?.mpn ?? '?' : <span className="dim">—</span>}</td>
                    <td>
                      {cable ? (
                        <span title={CABLE_KINDS[cable.kind]}>
                          <span className="cable-dot" style={{ background: cable.hex }} /> {cable.name}
                          {cable.kind !== 'cable' && (
                            <span className="kind-tag">{cable.kind === 'twisted' ? 'TW' : 'BND'}</span>
                          )}
                        </span>
                      ) : (
                        <span className="dim">—</span>
                      )}
                    </td>
                    <td>{twistedWith.length > 0 ? twistedWith.join(', ') : <span className="dim">—</span>}</td>
                    <td className="dim">{net}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
