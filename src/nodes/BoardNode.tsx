import { NodeResizer, type NodeProps } from '@xyflow/react';
import type { BoardData } from '../model';

export default function BoardNode({ data, selected }: NodeProps) {
  const d = data as unknown as BoardData;
  const color = d.color || '#4f6ef7';
  return (
    <div
      className={`board-node ${selected ? 'is-selected' : ''}`}
      style={{ borderColor: color, background: `${color}14` }}
    >
      <NodeResizer isVisible={selected} minWidth={180} minHeight={120} lineStyle={{ borderColor: color }} />
      <div className="board-label" style={{ background: color }}>
        {d.label}
      </div>
    </div>
  );
}
