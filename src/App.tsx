import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ConnectionMode,
  Panel,
  addEdge,
  useNodesState,
  useEdgesState,
  useReactFlow,
  getNodesBounds,
  getViewportForBounds,
  type Connection,
  type Edge,
  type Node,
  type OnSelectionChangeParams,
} from '@xyflow/react';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import '@xyflow/react/dist/style.css';
import './App.css';

import { EdgeHoverContext } from './hoverContext';

import ConnectorNode from './nodes/ConnectorNode';
import BoardNode from './nodes/BoardNode';
import SpliceNode from './nodes/SpliceNode';
import {
  BranchPointNode,
  DiodeNode,
  GroupNode,
  LayoutPointNode,
  NoteNode,
  ResistorNode,
  TerminalNode,
} from './nodes/MiscNodes';
import WireEdge from './edges/WireEdge';
import Palette, { type PaletteItem } from './components/Palette';
import Inspector from './components/Inspector';
import ConnectionsTable from './components/ConnectionsTable';
import PartsView from './components/PartsView';
import AssemblyView from './components/AssemblyView';
import ManualView from './components/ManualView';
import TitleBar from './components/TitleBar';
import Toolbar, { type ViewMode } from './components/Toolbar';
import { demoProject } from './demo';
import {
  BOARD_COLORS,
  CABLE_COLORS,
  CABLE_KINDS,
  CONTAINER_TYPES,
  PART_TYPES,
  STORAGE_KEY,
  computeBom,
  computeNets,
  defaultWireData,
  describeEnd,
  distToSegment,
  nextLabel,
  uid,
  type Cable,
  type ConnectorData,
  type Part,
  type Project,
  type WireData,
  type XY,
} from './model';

const nodeTypes = {
  connector: ConnectorNode,
  board: BoardNode,
  splice: SpliceNode,
  terminal: TerminalNode,
  diode: DiodeNode,
  resistor: ResistorNode,
  layoutpoint: LayoutPointNode,
  branchpoint: BranchPointNode,
  group: GroupNode,
  note: NoteNode,
};
const edgeTypes = { wire: WireEdge };

const isContainer = (n: Node) => CONTAINER_TYPES.includes(n.type ?? '');

const sortContainersFirst = (nds: Node[]) => [...nds.filter(isContainer), ...nds.filter((n) => !isContainer(n))];

/**
 * Legacy migration: layout points used to be standalone nodes wired in the
 * middle of a run. Convert each one with exactly two wires into a single wire
 * with a bend point at the old node position.
 */
function convertLegacyLayoutPoints(nodes: Node[], edges: Edge[]): { nodes: Node[]; edges: Edge[] } {
  for (const lp of nodes.filter((n) => n.type === 'layoutpoint')) {
    const attached = edges.filter((e) => e.source === lp.id || e.target === lp.id);
    if (attached.length !== 2) continue;
    const [e1, e2] = attached;
    const aEnd = e1.source === lp.id ? { node: e1.target, handle: e1.targetHandle } : { node: e1.source, handle: e1.sourceHandle };
    const bEnd = e2.source === lp.id ? { node: e2.target, handle: e2.targetHandle } : { node: e2.source, handle: e2.sourceHandle };
    const d1 = (e1.data ?? {}) as WireData;
    const bend: XY = { x: lp.position.x + 8, y: lp.position.y + 8 };
    const merged: Edge = {
      ...e1,
      id: uid(),
      source: aEnd.node,
      sourceHandle: aEnd.handle,
      target: bEnd.node,
      targetHandle: bEnd.handle,
      data: { ...e1.data, points: [...(d1.points ?? []), bend] },
    };
    edges = edges.filter((e) => e !== e1 && e !== e2).concat(merged);
    nodes = nodes.filter((n) => n !== lp);
  }
  return { nodes, edges };
}

/** Fill in fields that older saves / imports may not have. */
function normalizeProject(p: Project): Project {
  const { nodes, edges } = convertLegacyLayoutPoints(p.nodes ?? [], p.edges ?? []);
  return {
    ...p,
    cables: (p.cables ?? []).map((c) => ({ ...c, kind: c.kind ?? 'cable' })),
    parts: p.parts ?? [],
    assembly: p.assembly ?? '',
    nodes: sortContainersFirst(nodes),
    edges,
  };
}

function loadInitial(): Project {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const p = JSON.parse(raw) as Project;
      if (Array.isArray(p.nodes) && Array.isArray(p.edges)) {
        return normalizeProject(p);
      }
    }
  } catch {
    // corrupted save — fall back to demo
  }
  return demoProject();
}

const nodeSize = (n: Node) => ({
  w: n.width ?? n.measured?.width ?? 0,
  h: n.height ?? n.measured?.height ?? 0,
});

function HarnessApp() {
  const initial = useRef<Project>(loadInitial());
  const [projectName, setProjectName] = useState(initial.current.name || 'Untitled harness');
  const [cables, setCables] = useState<Cable[]>(initial.current.cables ?? []);
  const [parts, setParts] = useState<Part[]>(initial.current.parts ?? []);
  const [assembly, setAssembly] = useState<string>(initial.current.assembly ?? '');
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>(initial.current.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(initial.current.edges);
  const [view, setView] = useState<ViewMode>(() => {
    const v = new URLSearchParams(window.location.search).get('view');
    return v === 'connections' || v === 'parts' || v === 'manual' || v === 'assembly' ? v : 'schematic';
  });
  const [selected, setSelected] = useState<{ nodeId: string | null; edgeId: string | null }>({
    nodeId: null,
    edgeId: null,
  });
  /** drag: move components freely; wire: full-body pads (splice/terminal) start wires. */
  const [mode, setMode] = useState<'drag' | 'wire'>('drag');
  /** wire whose layout points are shown (kept for 3 s after the pointer leaves) */
  const [hoveredEdgeId, setHoveredEdgeId] = useState<string | null>(null);
  const hoverTimer = useRef<number | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const rf = useReactFlow();

  // Refit once after first paint so the initial framing is correct.
  useEffect(() => {
    const t = setTimeout(() => rf.fitView({ padding: 0.15, maxZoom: 1.2 }), 200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------- autosave ----------
  useEffect(() => {
    const t = setTimeout(() => {
      const project: Project = { version: 1, name: projectName, nodes, edges, cables, parts, assembly };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(project));
      } catch {
        // storage full — ignore
      }
    }, 400);
    return () => clearTimeout(t);
  }, [projectName, nodes, edges, cables, parts, assembly]);

  // ---------- wiring ----------
  const onConnect = useCallback(
    (c: Connection) => {
      if (c.source === c.target && c.sourceHandle === c.targetHandle) return;
      setEdges((eds) => addEdge({ ...c, type: 'wire', data: defaultWireData(eds) as unknown as Edge['data'] }, eds));
    },
    [setEdges],
  );

  const onSelectionChange = useCallback((params: OnSelectionChangeParams) => {
    setSelected({ nodeId: params.nodes[0]?.id ?? null, edgeId: params.edges[0]?.id ?? null });
  }, []);

  // ---------- palette: add nodes ----------
  const buildNode = useCallback(
    (item: PaletteItem, position: { x: number; y: number }, all: Node[]): Node => {
      if (item.kind === 'board') {
        const count = all.filter((n) => n.type === 'board').length;
        return {
          id: uid(),
          type: 'board',
          position,
          width: 420,
          height: 280,
          data: { label: nextLabel(all, 'board'), color: BOARD_COLORS[count % BOARD_COLORS.length] },
        };
      }
      if (item.kind === 'group') {
        return {
          id: uid(),
          type: 'group',
          position,
          width: 360,
          height: 240,
          data: { label: nextLabel(all, 'group') },
        };
      }
      if (item.kind === 'note') {
        return { id: uid(), type: 'note', position, data: { text: 'New note — edit the text in the inspector.' } };
      }
      if (item.kind === 'splice') {
        return { id: uid(), type: 'splice', position, data: { label: nextLabel(all, 'splice'), partId: null } };
      }
      if (item.kind === 'terminal') {
        return { id: uid(), type: 'terminal', position, data: { label: nextLabel(all, 'terminal'), partId: null } };
      }
      if (item.kind === 'diode') {
        return { id: uid(), type: 'diode', position, data: { label: nextLabel(all, 'diode'), partId: null } };
      }
      if (item.kind === 'resistor') {
        return {
          id: uid(),
          type: 'resistor',
          position,
          data: { label: nextLabel(all, 'resistor'), value: '', partId: null },
        };
      }
      if (item.kind === 'branchpoint') {
        return { id: uid(), type: 'branchpoint', position, data: { label: nextLabel(all, 'branchpoint') } };
      }
      return {
        id: uid(),
        type: 'connector',
        position,
        data: {
          label: nextLabel(all, 'connector'),
          pinCount: item.pinCount,
          side: 'right',
          pinLabels: {},
          partId: null,
          accessories: [],
        },
      };
    },
    [],
  );

  /** If a non-container node lands inside a board/group, attach it (relative coords). */
  const attachToBoard = useCallback((node: Node, all: Node[]): Node => {
    if (isContainer(node)) return node;
    const board = all
      .filter(isContainer)
      .find((b) => {
        const { w, h } = nodeSize(b);
        return (
          node.position.x > b.position.x &&
          node.position.x < b.position.x + w &&
          node.position.y > b.position.y &&
          node.position.y < b.position.y + h
        );
      });
    if (!board) return node;
    return {
      ...node,
      parentId: board.id,
      position: { x: node.position.x - board.position.x, y: node.position.y - board.position.y },
    };
  }, []);

  const addItem = useCallback(
    (item: PaletteItem, screenPos?: { x: number; y: number }) => {
      const rect = wrapperRef.current?.getBoundingClientRect();
      const at = screenPos ?? {
        x: (rect?.left ?? 0) + (rect?.width ?? 600) / 2 + (Math.random() * 80 - 40),
        y: (rect?.top ?? 0) + (rect?.height ?? 400) / 2 + (Math.random() * 80 - 40),
      };
      const pos = rf.screenToFlowPosition(at);
      setNodes((nds) => sortContainersFirst([...nds, attachToBoard(buildNode(item, pos, nds), nds)]));
      setView('schematic');
    },
    [rf, setNodes, buildNode, attachToBoard],
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      const raw = e.dataTransfer.getData('application/x-harness');
      if (!raw) return;
      e.preventDefault();
      try {
        const item = JSON.parse(raw) as PaletteItem;
        addItem(item, { x: e.clientX, y: e.clientY });
      } catch {
        // bad payload — ignore
      }
    },
    [addItem],
  );

  // ---------- drag connectors onto / off boards ----------
  const onNodeDragStop = useCallback(
    (_e: unknown, _node: Node, draggedNodes: Node[]) => {
      const draggedIds = new Set(draggedNodes.map((n) => n.id));
      setNodes((nds) => {
        let changed = false;
        const boards = nds.filter(isContainer);
        const next = nds.map((n) => {
          if (!draggedIds.has(n.id) || isContainer(n)) return n;
          const parent = n.parentId ? nds.find((p) => p.id === n.parentId) : undefined;
          const abs = parent
            ? { x: n.position.x + parent.position.x, y: n.position.y + parent.position.y }
            : n.position;
          const { w, h } = nodeSize(n);
          const cx = abs.x + w / 2;
          const cy = abs.y + h / 2;
          const board = boards.find((b) => {
            const s = nodeSize(b);
            return cx > b.position.x && cx < b.position.x + s.w && cy > b.position.y && cy < b.position.y + s.h;
          });
          if ((board?.id ?? undefined) === n.parentId) return n;
          changed = true;
          return {
            ...n,
            parentId: board?.id,
            position: board ? { x: abs.x - board.position.x, y: abs.y - board.position.y } : abs,
          };
        });
        return changed ? sortContainersFirst(next) : nds;
      });
    },
    [setNodes],
  );

  // ---------- layout-point visibility: hover with a 3 s grace period ----------
  const onEdgeMouseEnter = useCallback((_e: React.MouseEvent, edge: Edge) => {
    if (hoverTimer.current) {
      window.clearTimeout(hoverTimer.current);
      hoverTimer.current = null;
    }
    setHoveredEdgeId(edge.id);
  }, []);

  const onEdgeMouseLeave = useCallback(() => {
    if (hoverTimer.current) window.clearTimeout(hoverTimer.current);
    hoverTimer.current = window.setTimeout(() => setHoveredEdgeId(null), 3000);
  }, []);

  // ---------- layout points: double-click a wire to add a bend ----------
  const onEdgeDoubleClick = useCallback(
    (event: React.MouseEvent, edge: Edge) => {
      event.stopPropagation();
      const p = rf.screenToFlowPosition({ x: event.clientX, y: event.clientY });
      const handleCoord = (nodeId: string, handleId?: string | null): XY | null => {
        const n = rf.getInternalNode(nodeId);
        if (!n) return null;
        const all = [...(n.internals.handleBounds?.source ?? []), ...(n.internals.handleBounds?.target ?? [])];
        const h = all.find((x) => x.id === handleId) ?? all[0];
        if (!h) return null;
        return {
          x: n.internals.positionAbsolute.x + h.x + h.width / 2,
          y: n.internals.positionAbsolute.y + h.y + h.height / 2,
        };
      };
      const a = handleCoord(edge.source, edge.sourceHandle);
      const b = handleCoord(edge.target, edge.targetHandle);
      if (!a || !b) return;
      setEdges((eds) =>
        eds.map((e) => {
          if (e.id !== edge.id) return e;
          const pts = [...(((e.data ?? {}) as WireData).points ?? [])];
          const seq = [a, ...pts, b];
          let best = 0;
          let bestD = Infinity;
          for (let i = 0; i < seq.length - 1; i++) {
            const dist = distToSegment(p, seq[i], seq[i + 1]);
            if (dist < bestD) {
              bestD = dist;
              best = i;
            }
          }
          pts.splice(best, 0, p);
          return { ...e, data: { ...e.data, points: pts } };
        }),
      );
    },
    [rf, setEdges],
  );

  // ---------- keyboard: R rotates, V = drag mode, W = wire mode ----------
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (document.activeElement?.tagName ?? '').toUpperCase();
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.key === 'v' || e.key === 'V') {
        setMode('drag');
        return;
      }
      if (e.key === 'w' || e.key === 'W') {
        setMode('wire');
        return;
      }
      if (e.key !== 'r' && e.key !== 'R') return;
      setNodes((nds) =>
        nds.map((n) => {
          if (!n.selected) return n;
          if (n.type === 'connector') {
            const side = (n.data as ConnectorData).side === 'left' ? 'right' : 'left';
            return { ...n, data: { ...n.data, side } };
          }
          if (n.type === 'diode') {
            return { ...n, data: { ...n.data, flip: !(n.data as { flip?: boolean }).flip } };
          }
          return n;
        }),
      );
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [setNodes]);

  // ---------- inspector updates ----------
  const updateNodeData = useCallback(
    (id: string, patch: Record<string, unknown>) => {
      setNodes((nds) => nds.map((n) => (n.id === id ? { ...n, data: { ...n.data, ...patch } } : n)));
      // removing the shell also removes wires attached to it
      if (patch.hasShell === false) {
        setEdges((eds) =>
          eds.filter(
            (e) => !((e.source === id && e.sourceHandle === 'shell') || (e.target === id && e.targetHandle === 'shell')),
          ),
        );
      }
    },
    [setNodes, setEdges],
  );

  const setPinCount = useCallback(
    (id: string, count: number) => {
      updateNodeData(id, { pinCount: count });
      setEdges((eds) =>
        eds.filter((e) => {
          const over = (nid: string, h?: string | null) =>
            nid === id && !!h && parseInt(h.replace('pin-', ''), 10) > count;
          return !(over(e.source, e.sourceHandle) || over(e.target, e.targetHandle));
        }),
      );
    },
    [updateNodeData, setEdges],
  );

  const updateEdgeData = useCallback(
    (id: string, patch: Partial<WireData>) => {
      setEdges((eds) => eds.map((e) => (e.id === id ? { ...e, data: { ...e.data, ...patch } } : e)));
    },
    [setEdges],
  );

  // ---------- cables ----------
  const addCable = useCallback((name: string) => {
    const id = uid();
    setCables((cs) => [
      ...cs,
      { id, name, hex: CABLE_COLORS[cs.length % CABLE_COLORS.length], kind: 'cable' as const },
    ]);
    return id;
  }, []);

  const updateCable = useCallback((id: string, patch: Partial<Cable>) => {
    setCables((cs) => cs.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  }, []);

  const deleteCable = useCallback(
    (id: string) => {
      setCables((cs) => cs.filter((c) => c.id !== id));
      setEdges((eds) =>
        eds.map((e) =>
          (e.data as WireData | undefined)?.cableId === id ? { ...e, data: { ...e.data, cableId: null } } : e,
        ),
      );
    },
    [setEdges],
  );

  // ---------- parts library ----------
  const addPart = useCallback((part: Omit<Part, 'id'>) => {
    const id = uid();
    setParts((ps) => [...ps, { id, ...part }]);
    return id;
  }, []);

  const createPartInline = useCallback((type: string, mpn: string) => addPart({ type, mpn }), [addPart]);

  const updatePart = useCallback((id: string, patch: Partial<Part>) => {
    setParts((ps) => ps.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  }, []);

  /** Delete a part and scrub every reference to it. */
  const deletePart = useCallback(
    (id: string) => {
      setParts((ps) => ps.filter((p) => p.id !== id));
      setNodes((nds) =>
        nds.map((n) => {
          const d = n.data as { partId?: string | null; accessories?: { partId: string; qty: number }[] };
          if (d.partId !== id && !d.accessories?.some((a) => a.partId === id)) return n;
          return {
            ...n,
            data: {
              ...n.data,
              partId: d.partId === id ? null : d.partId,
              accessories: d.accessories?.filter((a) => a.partId !== id),
            },
          };
        }),
      );
      setEdges((eds) =>
        eds.map((e) => {
          const d = e.data as WireData | undefined;
          if (d?.partId !== id && !d?.coverings?.includes(id)) return e;
          return {
            ...e,
            data: {
              ...e.data,
              partId: d?.partId === id ? null : d?.partId,
              coverings: d?.coverings?.filter((c) => c !== id),
            },
          };
        }),
      );
      setCables((cs) =>
        cs.map((c) =>
          c.partId === id || c.coverings?.includes(id)
            ? { ...c, partId: c.partId === id ? null : c.partId, coverings: c.coverings?.filter((x) => x !== id) }
            : c,
        ),
      );
    },
    [setNodes, setEdges],
  );

  // ---------- project load / import / export ----------
  const loadProject = useCallback(
    (raw: Project) => {
      const p = normalizeProject(raw);
      setProjectName(p.name || 'Untitled harness');
      setCables(p.cables);
      setParts(p.parts);
      setAssembly(p.assembly ?? '');
      setNodes(p.nodes);
      setEdges(p.edges);
      setSelected({ nodeId: null, edgeId: null });
      setTimeout(() => rf.fitView({ padding: 0.15, maxZoom: 1.2 }), 60);
    },
    [rf, setNodes, setEdges],
  );

  const onNew = useCallback(() => {
    if (!window.confirm('Start a new empty project? The current project will be replaced.')) return;
    loadProject({ version: 1, name: 'Untitled harness', nodes: [], edges: [], cables: [], parts: [], assembly: '' });
  }, [loadProject]);

  const onDemo = useCallback(() => {
    if (!window.confirm('Load the demo project? The current project will be replaced.')) return;
    loadProject(demoProject());
  }, [loadProject]);

  const onExportJson = useCallback(() => {
    const project: Project = { version: 1, name: projectName, nodes, edges, cables, parts, assembly };
    const blob = new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' });
    downloadUrl(URL.createObjectURL(blob), `${safeFileName(projectName)}.harness.json`);
  }, [projectName, nodes, edges, cables, parts, assembly]);

  const onImport = useCallback(
    async (file: File) => {
      try {
        const p = JSON.parse(await file.text()) as Project;
        if (!Array.isArray(p.nodes) || !Array.isArray(p.edges)) throw new Error('bad file');
        loadProject(p);
      } catch {
        window.alert('Could not read this file — expected a JSON export from Wiring Viz.');
      }
    },
    [loadProject],
  );

  /** Snapshot the schematic as PNG. Layout helpers (bend diamonds) are excluded. */
  const renderSchematicPng = useCallback(async () => {
    const flowNodes = rf.getNodes();
    if (flowNodes.length === 0) return null;
    const el = document.querySelector<HTMLElement>('.react-flow__viewport');
    if (!el) return null;
    const bounds = getNodesBounds(flowNodes);
    const width = Math.min(3200, Math.ceil(bounds.width) + 120);
    const height = Math.min(3200, Math.ceil(bounds.height) + 120);
    const vp = getViewportForBounds(bounds, width, height, 0.3, 2, 0.07);
    const dataUrl = await toPng(el, {
      backgroundColor: '#f4f5f8',
      width,
      height,
      pixelRatio: 2,
      filter: (n) => !(n instanceof HTMLElement && n.classList.contains('wire-bend')),
      style: {
        width: `${width}px`,
        height: `${height}px`,
        transform: `translate(${vp.x}px, ${vp.y}px) scale(${vp.zoom})`,
      },
    });
    return { dataUrl, width, height };
  }, [rf]);

  const onExportPng = useCallback(async () => {
    try {
      const img = await renderSchematicPng();
      if (img) downloadUrl(img.dataUrl, `${safeFileName(projectName)}.png`);
    } catch {
      window.alert('PNG export failed in this browser. You can still export JSON.');
    }
  }, [renderSchematicPng, projectName]);

  /** Full documentation PDF: schematic drawing + connections table + BOM. */
  const onExportPdf = useCallback(async () => {
    try {
      const img = await renderSchematicPng();
      const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();

      // page 1: schematic
      doc.setFontSize(16);
      doc.text(projectName || 'Wiring Viz project', 40, 42);
      doc.setFontSize(9);
      doc.setTextColor(120);
      doc.text(
        `Wiring Viz · ${new Date().toISOString().slice(0, 10)} · ${edges.length} wires · ` +
          `${nodes.filter((n) => n.type === 'connector').length} connectors · ${cables.length} cables`,
        40,
        58,
      );
      doc.setTextColor(0);
      if (img) {
        const maxW = pageW - 80;
        const maxH = pageH - 110;
        const s = Math.min(maxW / img.width, maxH / img.height);
        doc.addImage(img.dataUrl, 'PNG', 40, 74, img.width * s, img.height * s);
      }

      // page 2: connections
      const nets = computeNets(nodes, edges);
      const cableById = new Map(cables.map((c) => [c.id, c]));
      const partById = new Map(parts.map((p) => [p.id, p]));
      doc.addPage();
      doc.setFontSize(13);
      doc.text('Connections', 40, 42);
      autoTable(doc, {
        startY: 54,
        margin: { left: 40, right: 40 },
        styles: { fontSize: 8 },
        headStyles: { fillColor: [28, 35, 51] },
        head: [['#', 'Wire', 'From', 'To', 'Color', 'Gauge', 'Length', 'Part', 'Cable', 'Net']],
        body: edges.map((e, i) => {
          const d = (e.data ?? {}) as WireData;
          const cable = d.cableId ? cableById.get(d.cableId) : undefined;
          return [
            String(i + 1),
            d.name ?? '',
            describeEnd(nodes, e.source, e.sourceHandle),
            describeEnd(nodes, e.target, e.targetHandle),
            `${d.color}${d.stripe ? `/${d.stripe}` : ''}`,
            d.gauge ?? '',
            d.length ?? '',
            d.partId ? (partById.get(d.partId)?.mpn ?? '') : '',
            cable ? `${cable.name}${cable.kind !== 'cable' ? ` (${CABLE_KINDS[cable.kind]})` : ''}` : '',
            nets.get(e.id) ?? '',
          ];
        }),
      });

      // page 3: BOM
      const bom = computeBom(nodes, edges, cables);
      let total = 0;
      const bomRows = parts.map((p) => {
        const qty = (bom.get(p.id) ?? 0) + (p.manualQty ?? 0);
        const ext = qty * (p.cost ?? 0);
        total += ext;
        return [
          p.mpn,
          PART_TYPES[p.type]?.label ?? p.type,
          p.manufacturer ?? '',
          p.description ?? '',
          String(qty),
          p.cost != null ? p.cost.toFixed(2) : '',
          qty && p.cost != null ? ext.toFixed(2) : '',
        ];
      });
      doc.addPage();
      doc.setFontSize(13);
      doc.text('Parts & BOM', 40, 42);
      autoTable(doc, {
        startY: 54,
        margin: { left: 40, right: 40 },
        styles: { fontSize: 8 },
        headStyles: { fillColor: [28, 35, 51] },
        head: [['Part number', 'Type', 'Manufacturer', 'Description', 'Qty', 'Cost', 'Ext. cost']],
        body: bomRows,
        foot: [['', '', '', '', '', 'Total', total.toFixed(2)]],
        footStyles: { fillColor: [238, 241, 254], textColor: [28, 35, 51], fontStyle: 'bold' },
      });

      doc.save(`${safeFileName(projectName)}.pdf`);
    } catch {
      window.alert('PDF export failed in this browser. You can still export PNG or JSON.');
    }
  }, [renderSchematicPng, projectName, nodes, edges, cables, parts]);

  const selectWireFromTable = useCallback(
    (edgeId: string) => {
      setView('schematic');
      setEdges((eds) => eds.map((e) => ({ ...e, selected: e.id === edgeId })));
      setNodes((nds) => nds.map((n) => (n.selected ? { ...n, selected: false } : n)));
      setSelected({ nodeId: null, edgeId });
      const edge = edges.find((e) => e.id === edgeId);
      if (edge) {
        setTimeout(
          () => rf.fitView({ nodes: [{ id: edge.source }, { id: edge.target }], padding: 0.4, duration: 350 }),
          60,
        );
      }
    },
    [edges, rf, setEdges, setNodes],
  );

  return (
    <div className="app">
      <TitleBar />
      <Toolbar
        projectName={projectName}
        onRename={setProjectName}
        view={view}
        onViewChange={setView}
        onNew={onNew}
        onDemo={onDemo}
        onImport={onImport}
        onExportJson={onExportJson}
        onExportPng={onExportPng}
        onExportPdf={onExportPdf}
      />
      <div className="main">
        <Palette onAdd={(item) => addItem(item)} />
        <div
          className={`canvas-wrap mode-${mode}`}
          ref={wrapperRef}
          onDrop={onDrop}
          onDragOver={(e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
          }}
        >
          <EdgeHoverContext.Provider value={hoveredEdgeId}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onSelectionChange={onSelectionChange}
            onNodeDragStop={onNodeDragStop}
            onEdgeDoubleClick={onEdgeDoubleClick}
            onEdgeMouseEnter={onEdgeMouseEnter}
            onEdgeMouseLeave={onEdgeMouseLeave}
            zoomOnDoubleClick={false}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            connectionMode={ConnectionMode.Loose}
            connectionRadius={26}
            connectionLineStyle={{ stroke: '#94a3b8', strokeWidth: 2.5, strokeDasharray: '6 4' }}
            defaultEdgeOptions={{ type: 'wire' }}
            deleteKeyCode={['Delete', 'Backspace']}
            snapToGrid
            snapGrid={[8, 8]}
            minZoom={0.15}
            maxZoom={2.5}
            fitView
            fitViewOptions={{ padding: 0.15, maxZoom: 1.2 }}
          >
            <Panel position="top-left" className="mode-panel">
              <div className="seg">
                <button
                  type="button"
                  className={mode === 'drag' ? 'is-active' : ''}
                  title="Move components (V)"
                  onClick={() => setMode('drag')}
                >
                  ⬚ Move
                </button>
                <button
                  type="button"
                  className={mode === 'wire' ? 'is-active' : ''}
                  title="Draw wires from splices & terminals (W)"
                  onClick={() => setMode('wire')}
                >
                  ⌁ Wire
                </button>
              </div>
            </Panel>
            <Background variant={BackgroundVariant.Dots} gap={20} size={1.4} color="#d3d8e0" />
            <Controls position="bottom-left" />
            <MiniMap
              position="bottom-right"
              pannable
              zoomable
              nodeColor={(n) =>
                n.type === 'board'
                  ? `${(n.data as { color?: string }).color ?? '#4f6ef7'}55`
                  : n.type === 'group'
                    ? '#cbd5e155'
                    : n.type === 'note'
                      ? '#fbbf24'
                      : '#94a3b8'
              }
            />
          </ReactFlow>
          </EdgeHoverContext.Provider>
          {view === 'connections' && (
            <ConnectionsTable
              nodes={nodes}
              edges={edges}
              cables={cables}
              parts={parts}
              onSelectWire={selectWireFromTable}
            />
          )}
          {view === 'parts' && (
            <PartsView
              parts={parts}
              nodes={nodes}
              edges={edges}
              cables={cables}
              onAddPart={addPart}
              onUpdatePart={updatePart}
              onDeletePart={deletePart}
            />
          )}
          {view === 'assembly' && <AssemblyView value={assembly} onChange={setAssembly} />}
          {view === 'manual' && <ManualView />}
        </div>
        <Inspector
          nodes={nodes}
          edges={edges}
          cables={cables}
          parts={parts}
          selectedNodeId={selected.nodeId}
          selectedEdgeId={selected.edgeId}
          onUpdateNodeData={updateNodeData}
          onSetPinCount={setPinCount}
          onUpdateEdgeData={updateEdgeData}
          onAddCable={addCable}
          onUpdateCable={updateCable}
          onDeleteCable={deleteCable}
          onCreatePart={createPartInline}
        />
      </div>
    </div>
  );
}

function downloadUrl(url: string, filename: string) {
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
}

const safeFileName = (name: string) => (name.trim() || 'harness').replace(/[^\w\- ]+/g, '').replace(/\s+/g, '-');

export default function App() {
  return (
    <ReactFlowProvider>
      <HarnessApp />
    </ReactFlowProvider>
  );
}
