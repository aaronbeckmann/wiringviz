import { useEffect } from 'react';
import { Handle, Position, useUpdateNodeInternals, type NodeProps } from '@xyflow/react';
import type { ConnectorData } from '../model';

export default function ConnectorNode({ id, data, selected }: NodeProps) {
  const d = data as unknown as ConnectorData;
  const side = d.side ?? 'right';
  const updateNodeInternals = useUpdateNodeInternals();

  // Handles move when pins are added/removed, the shell toggles, or the connector flips.
  useEffect(() => {
    updateNodeInternals(id);
  }, [id, d.pinCount, side, d.hasShell, updateNodeInternals]);

  const handleStyle =
    side === 'right' ? ({ top: '50%', right: -6, left: 'auto' } as const) : ({ top: '50%', left: -6 } as const);
  const handlePos = side === 'right' ? Position.Right : Position.Left;

  return (
    <div className={`connector-node ${selected ? 'is-selected' : ''}`}>
      <div className="connector-header">
        <span className="connector-label">{d.label}</span>
        {d.partNo ? <span className="connector-partno">{d.partNo}</span> : null}
      </div>
      <div className="connector-pins">
        {Array.from({ length: d.pinCount }, (_, i) => {
          const pin = String(i + 1);
          const name = d.pinLabels?.[pin] ?? '';
          const designation = d.pinDesignations?.[pin] || pin;
          return (
            <div key={pin} className={`pin-row side-${side}`}>
              <span className="pin-num" title={`Cavity ${designation}`}>{designation}</span>
              <span className="pin-name" title={name}>{name}</span>
              <Handle type="source" id={`pin-${pin}`} position={handlePos} style={handleStyle} />
            </div>
          );
        })}
        {d.hasShell && (
          <div className={`pin-row pin-shell side-${side}`}>
            <span className="pin-num">⏚</span>
            <span className="pin-name">shell</span>
            <Handle type="source" id="shell" position={handlePos} style={handleStyle} />
          </div>
        )}
      </div>
    </div>
  );
}
