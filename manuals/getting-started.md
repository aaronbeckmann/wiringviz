# Getting started

**Wiring Viz** is a schematic editor for wiring harnesses: boards, connectors, wires,
splices, cables and a parts library with a live BOM.

## The workflow

1. **Place components** — drag boards, connectors, terminals, splices, diodes and
   resistors from the left palette onto the canvas (or click a palette card to drop
   one in the middle of the view).
2. **Draw wires** — drag from one pin to another. Every wire gets a color, gauge and
   optional stripe; edit them in the right-hand inspector.
3. **Organize** — group wires into cables, bundles or twisted pairs; drop connectors
   onto boards or groups so they move together.
4. **Assign parts** — build your part library in the **Parts** view and assign parts
   from each component's inspector.
5. **Review & export** — check every connection in the **Connections** view, then
   export JSON (re-importable) or PNG (image of the schematic).

## The three panels

| Panel | What it does |
| --- | --- |
| **Palette** (left) | Component library — drag items onto the canvas |
| **Canvas** (center) | The schematic. Pan with the mouse, zoom with the wheel |
| **Inspector** (right) | Properties of whatever is selected; project overview when nothing is |

## Move mode vs. Wire mode

The toggle in the top-left corner of the canvas switches between:

- **⬚ Move (V)** — drag any component around. This is the default.
- **⌁ Wire (W)** — splices and terminals (whose whole body is a connection pad)
  become wire sources; they get a dashed highlight.

Connector pins draw wires in *both* modes, and you can always *finish* a wire on a
splice or terminal regardless of mode.

## Saving

Your project **autosaves continuously** to the browser (or app) storage. Use
**Export JSON** for backups and sharing — **Import** restores them exactly,
including parts and cables. **New** and **Load demo** replace the current project
(after confirmation).
