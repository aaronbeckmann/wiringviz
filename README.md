# Wiring Viz

A wiring / harness visualizer.
Draw connectors, pins, wires, splices and boards on a schematic canvas; review
everything in a connections (netlist) table; manage a parts library with live BOM;
export as JSON or PNG. Runs as a web app, a desktop (Electron) app or in Docker.

The built-in **Manual** tab renders the user guides from [`manuals/`](manuals/)
(getting started, components, wires & routing, cables, parts & BOM, views, shortcuts).

## Run it (web)

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build in dist/
```

## Desktop app (Electron)

```bash
npm run app       # build + launch as a desktop window
npm run app:dist  # build a portable Windows exe
```

The desktop app uses a **custom title bar** (frameless window with its own
minimize / maximize / close buttons, drag anywhere on the dark bar, double-click to
maximize) — implemented via `electron/preload.cjs` + IPC in `electron/main.cjs`.

`app:dist` writes to `%LOCALAPPDATA%\WiringViz-release\Wiring Viz 1.0.0.exe`
(not the project folder — OneDrive-synced folders like Desktop block electron-builder's
directory renames with EPERM). A copy of the exe is also in `release/`.

Note: launching the exe from a VS Code terminal fails silently because VS Code sets
`ELECTRON_RUN_AS_NODE=1`; start it from Explorer or a regular terminal (the `app`
script clears the variable itself).

## Docker (web app)

```bash
docker compose up --build   # http://localhost:8080
# or
docker build -t wiring-viz . && docker run -p 8080:80 wiring-viz
```

Multi-stage build (`node:22-alpine` → `nginx:alpine`); Electron's binary download is
skipped inside the image via `ELECTRON_SKIP_BINARY_DOWNLOAD=1`.

CI (`.github/workflows/build.yml`) typechecks + builds the web app on every push/PR
and builds the Docker image, pushing it to GHCR on `main`:
`ghcr.io/aaronbeckmann/wiringviz:latest`.

## Components

- **Connector** — 1–64 pins, editable signal labels **and cavity designations** (A1, B2…),
  left/right facing (press **R** to flip), optional **shell** connection, accessories,
  jumper wires (pin to pin on the same connector) supported.
- **Terminal** — all six types: ferrule, ring, spade, male/female quick connect, loose wire end;
  editable signal name; coverings.
- **Wire** — drag pin → pin; solid color + optional stripe, AWG gauge, length, name, wire part,
  coverings. A pin can hold several wires (daisy chains).
- **Layout point** — **double-click a wire** to add a bend, drag it to route the wire,
  double-click the bend to remove it ("Delete all" in the wire inspector).
- **Splice** — joins any number of wires into one electrical net; splice part + coverings.
- **Branch point** — marker for where the physical harness trunk splits (layout-view concept;
  documentation marker here).
- **Cable / Bundle / Twisted wires** — group wires from the wire inspector; each group has a kind,
  an optional cable part and coverings. Twisted wires get a **"Twisted with"** column in the
  connections view.
- **Diode** — inline 2-pad component (anode/cathode); flip with **R** or the inspector; coverings.
- **Resistor** — inline 2-pad component with value; coverings.
- **Board / PCB** and **Group** — resizable containers; components dropped inside move with them.
- **Note** — annotation with color, width and text-alignment options.

## Parts library + BOM

The **Parts** view manages a project part library and shows a live BOM (quantities from
assignments, extended cost):

- *Component parts*: connector (with cavity-count check), wire, splice, diode, resistor, cable, generic.
- *Accessories*: contact, cavity seal, lock, dust cover, boot, backshell — attach to connectors with quantities.
- *Coverings*: heatshrink, tape, corrugated tubing, spiral wrap, tubing, braided sleeve — attach to wires and cables.
- *Terminals*: ferrule, ring terminal, spade terminal, quick connect — assign to terminal components.

## Views & persistence

- **Schematic**: pan/zoom canvas, snap-to-grid, minimap, multi-select, Delete key.
- **Connections**: full wiring table — from/to (board › connector.pin), color, gauge, length,
  wire part, cable, computed net (splices and layout points merge nets). Click a row to jump to that wire.
- **Parts**: library + BOM (see above).
- Autosaves to localStorage; Import / Export JSON; Export PNG. **Load demo** shows every component type.

## Project structure

```
src/
  model.ts                 data model, wire colors, part types, nets, BOM
  demo.ts                  sample project (uses every component type)
  App.tsx                  layout, state, wiring logic, import/export
  nodes/                   ConnectorNode, BoardNode, SpliceNode, MiscNodes (terminal,
                           diode, resistor, layout point, branch point, group, note)
  edges/WireEdge.tsx       colored wire rendering (stripe, label)
  components/              Palette, Inspector, ConnectionsTable, PartsView, Toolbar
```
