# Views, saving & export

## Schematic

The canvas. Pan by dragging empty space, zoom with the mouse wheel, use the
minimap (bottom right) for orientation and the controls (bottom left) for
zoom / fit / lock. Multi-select with a rubber band drag or Shift-click.

## Connections

The full wiring table — one row per wire:

- **From / To** — `Container › Connector.Designation (signal)`; splices and
  terminals are named with their kind.
- **Color** swatch (with stripe), **gauge**, **length**, **wire part**.
- **Cable** with kind tag, **Twisted with** partners.
- **Net** — computed electrical net. Splices merge nets; diodes and resistors
  separate them.

**Click a row** to jump to that wire on the schematic.

## Parts

Part library + BOM. See the *Parts & BOM* chapter.

## Assembly

A Markdown editor with live preview for writing the harness's **assembly
instructions** — cutting lists, crimping steps, checklists. The text is part of
the project: it autosaves and travels with JSON export/import.

## Manual

You're reading it.

## Saving & files

| Action | Behaviour |
| --- | --- |
| Autosave | Continuous, to local storage (browser or desktop app) |
| Export JSON | Full project file (`*.harness.json`) — nodes, wires, cables, parts |
| Import | Restores a JSON export exactly |
| Export PNG | High-resolution image of the whole schematic (layout helpers hidden) |
| Export PDF | Full documentation: schematic drawing, connections table, BOM with total cost, and the assembly instructions (typeset from your Markdown) |
| New / Load demo | Replace the current project (asks first) |

## Running Wiring Viz

| How | Command |
| --- | --- |
| Web (dev) | `npm run dev` |
| Desktop app | `npm run app` — or build a portable exe with `npm run app:dist` |
| Docker | `docker compose up` → http://localhost:8080 |
