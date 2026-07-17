import { useContext } from 'react';
import { BaseEdge, Position, ViewportPortal, useReactFlow, type EdgeProps } from '@xyflow/react';
import { EdgeHoverContext } from '../hoverContext';
import { WIRE_COLORS, type WireData, type XY } from '../model';

const STUB = 24; // straight lead-out from a pin before the first corner
const RADIUS = 18; // corner rounding

/** Handles that sit on a node's center (splice, terminal): approach from the facing side. */
const CENTER_HANDLES = new Set(['splice', 't', 'lp']);

/** Path through anchor points with rounded corners. */
function roundedPath(P: XY[], radius = RADIUS): string {
  let d = `M ${P[0].x} ${P[0].y}`;
  for (let i = 1; i < P.length - 1; i++) {
    const p0 = P[i - 1];
    const p1 = P[i];
    const p2 = P[i + 1];
    const l1 = Math.hypot(p1.x - p0.x, p1.y - p0.y) || 1;
    const l2 = Math.hypot(p2.x - p1.x, p2.y - p1.y) || 1;
    const r1 = Math.min(radius, l1 / 2);
    const r2 = Math.min(radius, l2 / 2);
    const a = { x: p1.x - ((p1.x - p0.x) / l1) * r1, y: p1.y - ((p1.y - p0.y) / l1) * r1 };
    const b = { x: p1.x + ((p2.x - p1.x) / l2) * r2, y: p1.y + ((p2.y - p1.y) / l2) * r2 };
    d += ` L ${a.x} ${a.y} Q ${p1.x} ${p1.y} ${b.x} ${b.y}`;
  }
  d += ` L ${P[P.length - 1].x} ${P[P.length - 1].y}`;
  return d;
}

/** Drop consecutive (nearly) duplicate anchors. */
function dedupe(P: XY[]): XY[] {
  const out: XY[] = [];
  for (const p of P) {
    const last = out[out.length - 1];
    if (!last || Math.abs(last.x - p.x) > 0.5 || Math.abs(last.y - p.y) > 0.5) out.push(p);
  }
  return out;
}

/**
 * Corner(s) that connect p to q using only 0/45/90° segments:
 * long axis first, then the 45° diagonal.
 */
function corners45(p: XY, q: XY): XY[] {
  const dx = q.x - p.x;
  const dy = q.y - p.y;
  const adx = Math.abs(dx);
  const ady = Math.abs(dy);
  if (adx < 0.5 || ady < 0.5 || Math.abs(adx - ady) < 0.5) return []; // already 0/45/90°
  if (adx > ady) return [{ x: q.x - Math.sign(dx) * ady, y: p.y }]; // horizontal, then diagonal
  return [{ x: p.x, y: q.y - Math.sign(dy) * adx }]; // vertical, then diagonal
}

/** Symmetric 45° auto-route between the two stub ends (no user layout points). */
function autoRoute(A: XY, B: XY, dirS: number, dirT: number): XY[] {
  const dx = B.x - A.x;
  const dy = B.y - A.y;
  const adx = Math.abs(dx);
  const ady = Math.abs(dy);
  const sgnx = Math.sign(dx) || 1;
  const sgny = Math.sign(dy) || 1;
  // stubs point along the travel direction on both ends?
  const facing = dirS * dx >= 0 && dirT * -dx >= 0;
  if (facing && adx >= ady) {
    const run = (adx - ady) / 2;
    return [
      { x: A.x + sgnx * run, y: A.y },
      { x: A.x + sgnx * (run + ady), y: B.y },
    ];
  }
  if (facing) {
    const half = adx / 2;
    return [
      { x: A.x + sgnx * half, y: A.y + sgny * half },
      { x: A.x + sgnx * half, y: B.y - sgny * half },
    ];
  }
  // target behind the exit direction: orthogonal loop through the vertical middle
  const my = (A.y + B.y) / 2;
  return [
    { x: A.x, y: my },
    { x: B.x, y: my },
  ];
}

/** Nearest point on the polyline to p (for the label leader arrow). */
function nearestOnPolyline(P: XY[], p: XY): XY {
  let best: XY = P[0];
  let bestD = Infinity;
  for (let i = 0; i < P.length - 1; i++) {
    const a = P[i];
    const b = P[i + 1];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const l2 = dx * dx + dy * dy;
    const t = l2 === 0 ? 0 : Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / l2));
    const q = { x: a.x + t * dx, y: a.y + t * dy };
    const dist = Math.hypot(p.x - q.x, p.y - q.y);
    if (dist < bestD) {
      bestD = dist;
      best = q;
    }
  }
  return best;
}

/** Point halfway along a polyline (for the label). */
function midpointOf(P: XY[]): XY {
  let total = 0;
  const lens: number[] = [];
  for (let i = 0; i < P.length - 1; i++) {
    const l = Math.hypot(P[i + 1].x - P[i].x, P[i + 1].y - P[i].y);
    lens.push(l);
    total += l;
  }
  let rest = total / 2;
  for (let i = 0; i < lens.length; i++) {
    if (rest <= lens[i] && lens[i] > 0) {
      const t = rest / lens[i];
      return { x: P[i].x + (P[i + 1].x - P[i].x) * t, y: P[i].y + (P[i + 1].y - P[i].y) * t };
    }
    rest -= lens[i];
  }
  return P[0];
}

export default function WireEdge(props: EdgeProps) {
  const { id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, selected } = props;
  const d = (props.data ?? {}) as WireData;
  const rf = useReactFlow();
  const hoveredEdgeId = useContext(EdgeHoverContext);
  // layout helpers appear on hover/selection and fade out afterwards
  const bendsVisible = selected || hoveredEdgeId === id;

  const points = d.points ?? [];
  const S: XY = { x: sourceX, y: sourceY };
  const T: XY = { x: targetX, y: targetY };

  // Stub directions: from handle side; center handles face the other endpoint.
  let dirS = sourcePosition === Position.Left ? -1 : 1;
  let dirT = targetPosition === Position.Left ? -1 : 1;
  if (CENTER_HANDLES.has(props.sourceHandleId ?? '')) dirS = Math.sign(targetX - sourceX) || 1;
  if (CENTER_HANDLES.has(props.targetHandleId ?? '')) dirT = Math.sign(sourceX - targetX) || 1;

  const A: XY = { x: S.x + STUB * dirS, y: S.y };
  const B: XY = { x: T.x + STUB * dirT, y: T.y };

  let anchors: XY[];
  if (points.length > 0) {
    anchors = [S, A];
    let prev = A;
    for (const q of [...points, B]) {
      anchors.push(...corners45(prev, q), q);
      prev = q;
    }
    anchors.push(T);
  } else {
    anchors = [S, A, ...autoRoute(A, B, dirS, dirT), B, T];
  }
  anchors = dedupe(anchors);

  const path = roundedPath(anchors);
  const mid = midpointOf(anchors);
  // default label spot: above the cable
  const home: XY = { x: mid.x, y: mid.y - 16 };
  const off = d.labelOffset ?? { x: 0, y: 0 };
  const labelPos: XY = { x: home.x + off.x, y: home.y + off.y };

  // leader arrow from a far-away label back to the nearest spot on the cable
  const near = nearestOnPolyline(anchors, labelPos);
  const labelDist = Math.hypot(labelPos.x - near.x, labelPos.y - near.y);
  const showLeader = labelDist > 35;
  let leader: { line: string; head: string } | null = null;
  if (showLeader) {
    const ux = (near.x - labelPos.x) / labelDist;
    const uy = (near.y - labelPos.y) / labelDist;
    const start = { x: labelPos.x + ux * 10, y: labelPos.y + uy * 10 };
    const tip = { x: near.x - ux * 2, y: near.y - uy * 2 };
    const bx = tip.x - ux * 7;
    const by = tip.y - uy * 7;
    leader = {
      line: `M ${start.x} ${start.y} L ${bx} ${by}`,
      head: `${tip.x},${tip.y} ${bx + -uy * 3.5},${by + ux * 3.5} ${bx + uy * 3.5},${by + -ux * 3.5}`,
    };
  }

  const color = WIRE_COLORS[d.color]?.hex ?? '#64748b';
  const stripe = d.stripe ? WIRE_COLORS[d.stripe]?.hex : undefined;
  const showLabel = Boolean(d.name) || selected;

  /** Drag a layout point; double-click removes it. */
  const onBendPointerDown = (e: React.PointerEvent, idx: number) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    e.preventDefault();
    const move = (ev: PointerEvent) => {
      const p = rf.screenToFlowPosition({ x: ev.clientX, y: ev.clientY });
      rf.setEdges((eds) =>
        eds.map((ed) => {
          if (ed.id !== id) return ed;
          const pts = [...(((ed.data ?? {}) as WireData).points ?? [])];
          pts[idx] = { x: p.x, y: p.y };
          return { ...ed, data: { ...ed.data, points: pts } };
        }),
      );
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  /** Drag the label; double-click snaps it back above the cable. */
  const onLabelPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    e.preventDefault();
    const move = (ev: PointerEvent) => {
      const p = rf.screenToFlowPosition({ x: ev.clientX, y: ev.clientY });
      rf.setEdges((eds) =>
        eds.map((ed) =>
          ed.id === id
            ? { ...ed, data: { ...ed.data, labelOffset: { x: p.x - home.x, y: p.y - home.y } } }
            : ed,
        ),
      );
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  const removeBend = (idx: number) => {
    rf.setEdges((eds) =>
      eds.map((ed) => {
        if (ed.id !== id) return ed;
        const pts = (((ed.data ?? {}) as WireData).points ?? []).filter((_, i) => i !== idx);
        return { ...ed, data: { ...ed.data, points: pts } };
      }),
    );
  };

  return (
    <>
      {selected && (
        <path d={path} fill="none" stroke="#4f6ef7" strokeWidth={9} strokeOpacity={0.28} strokeLinecap="round" />
      )}
      {/* casing so light wires (white/yellow) stay visible */}
      <path d={path} fill="none" stroke="#7d8694" strokeWidth={4.5} strokeLinecap="round" />
      <BaseEdge id={id} path={path} style={{ stroke: color, strokeWidth: 3 }} />
      {stripe && (
        <path
          d={path}
          fill="none"
          stroke={stripe}
          strokeWidth={3}
          strokeDasharray="7 7"
          strokeLinecap="butt"
          pointerEvents="none"
        />
      )}
      {showLabel && leader && (
        <g pointerEvents="none">
          <path d={leader.line} fill="none" stroke="#8b95a5" strokeWidth={1.4} />
          <polygon points={leader.head} fill="#8b95a5" />
        </g>
      )}
      {/* Labels and bend handles go through ViewportPortal: it stacks above every
          edge's interaction stroke, so they stay clickable under crossing wires. */}
      {(showLabel || points.length > 0) && (
        <ViewportPortal>
          {showLabel && (
            <div
              className={`wire-label nodrag nopan ${selected ? 'is-selected' : ''}`}
              title="Drag to move · double-click to reset"
              style={{ transform: `translate(-50%, -50%) translate(${labelPos.x}px, ${labelPos.y}px)` }}
              onPointerDown={onLabelPointerDown}
              onDoubleClick={(e) => {
                e.stopPropagation();
                rf.setEdges((eds) =>
                  eds.map((ed) => (ed.id === id ? { ...ed, data: { ...ed.data, labelOffset: undefined } } : ed)),
                );
              }}
            >
              <span className="wire-swatch" style={{ background: color }}>
                {stripe && <span className="wire-swatch-stripe" style={{ background: stripe }} />}
              </span>
              <span>
                {d.name || `${d.color}${d.stripe ? `/${d.stripe}` : ''}`}
                {d.gauge ? <span className="wire-gauge"> · {d.gauge}</span> : null}
              </span>
            </div>
          )}
          {points.map((p, i) => (
            <div
              key={i}
              className={`wire-bend nodrag nopan ${selected ? 'is-selected' : ''} ${bendsVisible ? 'is-visible' : ''}`}
              title="Drag to move · double-click to remove"
              style={{ transform: `translate(-50%, -50%) translate(${p.x}px, ${p.y}px) rotate(45deg)` }}
              onPointerDown={(e) => onBendPointerDown(e, i)}
              onDoubleClick={(e) => {
                e.stopPropagation();
                removeBend(i);
              }}
            />
          ))}
        </ViewportPortal>
      )}
    </>
  );
}
