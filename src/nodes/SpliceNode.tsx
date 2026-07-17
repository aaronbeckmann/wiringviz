import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { SpliceData } from '../model';

export default function SpliceNode({ data, selected }: NodeProps) {
  const d = data as unknown as SpliceData;
  return (
    <div className={`splice-node ${selected ? 'is-selected' : ''}`}>
      <div className="splice-dot">
        <Handle
          type="source"
          id="splice"
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
      </div>
      <div className="splice-label">{d.label}</div>
    </div>
  );
}
