import type { Edge, Node } from '@xyflow/react';
import type { Part, Project } from './model';

/**
 * Sample project: a controller PCB powered by a power PCB (inter-board),
 * an off-board I2C sensor pigtail (grouped) with a ground splice, battery
 * leads with an inline protection diode, a chassis ground ring terminal,
 * a layout point routing SCL, a branch point marker and a note.
 */
export function demoProject(): Project {
  const nodes: Node[] = [
    {
      id: 'b1',
      type: 'board',
      position: { x: 40, y: 80 },
      width: 400,
      height: 330,
      data: { label: 'Controller PCB', color: '#10b981' },
    },
    {
      id: 'b2',
      type: 'board',
      position: { x: 640, y: 40 },
      width: 340,
      height: 220,
      data: { label: 'Power PCB', color: '#4f6ef7' },
    },
    {
      id: 'g1',
      type: 'group',
      position: { x: 610, y: 400 },
      width: 340,
      height: 210,
      data: { label: 'Sensor pigtail' },
    },
    {
      id: 'j1',
      type: 'connector',
      parentId: 'b1',
      position: { x: 235, y: 48 },
      data: {
        label: 'J1',
        partNo: 'logic',
        pinCount: 6,
        side: 'right',
        pinLabels: { '1': 'VCC', '2': 'GND', '3': 'SDA', '4': 'SCL', '5': 'TX', '6': 'RX' },
        partId: 'p-jstgh6',
        accessories: [{ partId: 'p-contact', qty: 6 }],
      },
    },
    {
      id: 'j4',
      type: 'connector',
      parentId: 'b1',
      position: { x: 235, y: 235 },
      data: {
        label: 'J4',
        partNo: 'power in',
        pinCount: 2,
        side: 'right',
        pinLabels: { '1': '+5V', '2': 'GND' },
        partId: 'p-jstxh2',
        accessories: [],
      },
    },
    {
      id: 'j3',
      type: 'connector',
      parentId: 'b2',
      position: { x: 26, y: 68 },
      data: {
        label: 'J3',
        partNo: 'power out',
        pinCount: 2,
        side: 'left',
        pinLabels: { '1': '+5V OUT', '2': 'GND' },
        partId: 'p-jstxh2',
        accessories: [],
      },
    },
    {
      id: 'j5',
      type: 'connector',
      parentId: 'b2',
      position: { x: 218, y: 68 },
      data: {
        label: 'J5',
        partNo: 'batt in',
        pinCount: 2,
        side: 'right',
        pinLabels: { '1': 'VIN+', '2': 'VIN-' },
        partId: 'p-xt30pb',
        accessories: [{ partId: 'p-lock', qty: 1 }],
      },
    },
    {
      id: 'cn2',
      type: 'connector',
      parentId: 'g1',
      position: { x: 60, y: 40 },
      data: {
        label: 'CN2',
        partNo: 'sensor',
        pinCount: 4,
        side: 'left',
        pinLabels: { '1': 'VCC', '2': 'GND', '3': 'SDA', '4': 'SCL' },
        partId: 'p-sh4',
        accessories: [],
      },
    },
    {
      id: 'bt1',
      type: 'connector',
      position: { x: 1200, y: 100 },
      data: {
        label: 'BT1',
        partNo: 'battery',
        pinCount: 2,
        side: 'left',
        pinLabels: { '1': 'BAT+', '2': 'BAT-' },
        pinDesignations: { '1': '+', '2': '−' },
        partId: 'p-xt30f',
        accessories: [],
      },
    },
    {
      id: 'd1',
      type: 'diode',
      position: { x: 1075, y: 105 },
      data: { label: 'D1', partId: 'p-ss34', flip: true },
    },
    {
      id: 's1',
      type: 'splice',
      position: { x: 500, y: 350 },
      data: { label: 'S1', partId: 'p-solder' },
    },
    {
      id: 't1',
      type: 'terminal',
      position: { x: 460, y: 470 },
      data: { label: 'T1', termType: 'ring', signal: 'CHASSIS GND', partId: 'p-ring', coverings: [] },
    },
    {
      id: 'bp1',
      type: 'branchpoint',
      position: { x: 520, y: 160 },
      data: { label: 'BP1' },
    },
    {
      id: 'note1',
      type: 'note',
      position: { x: 1120, y: 220 },
      data: {
        text: 'Battery leads twisted, 2A fuse before production. D1 protects against reverse polarity.',
        color: 'yellow',
        align: 'left',
        width: 190,
      },
    },
  ];

  const w = (
    id: string,
    source: string,
    sourceHandle: string,
    target: string,
    targetHandle: string,
    data: Record<string, unknown>,
  ): Edge => ({ id, source, sourceHandle, target, targetHandle, type: 'wire', data });

  const edges: Edge[] = [
    w('w1', 'j3', 'pin-1', 'j4', 'pin-1', { name: '+5V', color: 'RD', stripe: null, gauge: '20 AWG', length: '120 mm', cableId: 'c-pwr', partId: 'p-w20' }),
    w('w2', 'j3', 'pin-2', 'j4', 'pin-2', { name: 'GND', color: 'BK', stripe: null, gauge: '20 AWG', length: '120 mm', cableId: 'c-pwr', partId: 'p-w20', labelOffset: { x: -12, y: -76 } }),
    w('w3', 'j1', 'pin-1', 'cn2', 'pin-1', { name: 'VCC', color: 'RD', stripe: 'WH', gauge: '26 AWG', length: '180 mm', cableId: 'c-i2c', partId: 'p-w26' }),
    w('w4', 'j1', 'pin-2', 's1', 'splice', { name: 'GND', color: 'BK', stripe: null, gauge: '26 AWG', length: '120 mm', cableId: 'c-i2c', partId: 'p-w26' }),
    w('w5', 's1', 'splice', 'cn2', 'pin-2', { name: 'GND', color: 'BK', stripe: null, gauge: '26 AWG', length: '80 mm', cableId: 'c-i2c', partId: 'p-w26' }),
    w('w6', 'j1', 'pin-3', 'cn2', 'pin-3', { name: 'SDA', color: 'BU', stripe: null, gauge: '26 AWG', length: '180 mm', cableId: 'c-i2c', partId: 'p-w26' }),
    w('w7', 'j1', 'pin-4', 'cn2', 'pin-4', { name: 'SCL', color: 'YE', stripe: null, gauge: '26 AWG', length: '190 mm', cableId: 'c-i2c', partId: 'p-w26', points: [{ x: 596, y: 262 }, { x: 596, y: 500 }] }),
    w('w8a', 'bt1', 'pin-1', 'd1', 'a', { name: 'BAT+', color: 'RD', stripe: null, gauge: '18 AWG', length: '60 mm', cableId: 'c-bat', partId: 'p-w18', coverings: ['p-hs'] }),
    w('w8b', 'd1', 'k', 'j5', 'pin-1', { name: 'BAT+', color: 'RD', stripe: null, gauge: '18 AWG', length: '90 mm', cableId: 'c-bat', partId: 'p-w18' }),
    w('w9', 'bt1', 'pin-2', 'j5', 'pin-2', { name: 'BAT-', color: 'BK', stripe: null, gauge: '18 AWG', length: '150 mm', cableId: 'c-bat', partId: 'p-w18' }),
    w('w10', 's1', 'splice', 't1', 't', { name: 'CHASSIS', color: 'GN', stripe: 'YE', gauge: '22 AWG', length: '60 mm', cableId: null, partId: 'p-w22' }),
  ];

  const parts: Part[] = [
    { id: 'p-jstgh6', type: 'connector', mpn: 'GHR-06V-S', manufacturer: 'JST', description: 'GH series 6-pos housing, 1.25 mm', cavities: 6, cost: 0.18 },
    { id: 'p-jstxh2', type: 'connector', mpn: 'XHP-2', manufacturer: 'JST', description: 'XH series 2-pos housing, 2.5 mm', cavities: 2, cost: 0.06 },
    { id: 'p-xt30pb', type: 'connector', mpn: 'XT30PW-M', manufacturer: 'AMASS', description: 'XT30 right-angle PCB male', cavities: 2, cost: 0.45 },
    { id: 'p-xt30f', type: 'connector', mpn: 'XT30U-F', manufacturer: 'AMASS', description: 'XT30 female, cable mount', cavities: 2, cost: 0.4 },
    { id: 'p-sh4', type: 'connector', mpn: 'SHR-04V-S-B', manufacturer: 'JST', description: 'SH series 4-pos housing, 1.0 mm', cavities: 4, cost: 0.12 },
    { id: 'p-w26', type: 'wire', mpn: 'UL1571-26', description: 'Hook-up wire 26 AWG, PVC', cost: 0.05 },
    { id: 'p-w22', type: 'wire', mpn: 'UL1007-22', description: 'Hook-up wire 22 AWG, PVC', cost: 0.05 },
    { id: 'p-w20', type: 'wire', mpn: 'UL1007-20', description: 'Hook-up wire 20 AWG, PVC', cost: 0.06 },
    { id: 'p-w18', type: 'wire', mpn: 'SIL-18', description: 'Silicone wire 18 AWG', cost: 0.12 },
    { id: 'p-solder', type: 'splice', mpn: 'D-406-0001', manufacturer: 'TE', description: 'SolderSleeve splice', cost: 0.35 },
    { id: 'p-ss34', type: 'diode', mpn: 'SS34', description: 'Schottky 3 A 40 V (reverse protection)', cost: 0.08 },
    { id: 'p-cable4', type: 'cable', mpn: 'B4C-26', description: '4-core 26 AWG jacketed cable', cost: 0.9 },
    { id: 'p-contact', type: 'contact', mpn: 'SSHL-002T-P0.2', manufacturer: 'JST', description: 'GH crimp contact 26–30 AWG', cost: 0.03 },
    { id: 'p-lock', type: 'lock', mpn: 'XT30-CPA', description: 'Connector position assurance clip', cost: 0.05 },
    { id: 'p-hs', type: 'heatshrink', mpn: 'HS-3:1-6', description: 'Heatshrink 3:1, Ø6 mm (over D1)', cost: 0.04 },
    { id: 'p-sleeve', type: 'braided-sleeve', mpn: 'PET-6', description: 'Braided sleeve Ø6 mm', cost: 0.2 },
    { id: 'p-ring', type: 'ring-terminal', mpn: 'RNB-1.25-4', description: 'Ring terminal M4, 22–16 AWG', cost: 0.04 },
  ];

  return {
    version: 1,
    name: 'Demo — sensor harness',
    nodes,
    edges,
    cables: [
      { id: 'c-pwr', name: 'Power jumper', hex: '#f59e0b', kind: 'cable', partId: null, coverings: ['p-sleeve'] },
      { id: 'c-i2c', name: 'Sensor I2C', hex: '#0ea5e9', kind: 'cable', partId: 'p-cable4', coverings: [] },
      { id: 'c-bat', name: 'Battery leads', hex: '#ef4444', kind: 'twisted', partId: null, coverings: [] },
    ],
    parts,
  };
}
