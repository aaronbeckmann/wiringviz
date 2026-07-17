# Components

Everything you can place on the canvas, and what it's for.

## Connector

The workhorse. A connector has 1–64 cavities, each with:

- a **designation** — what's printed in the little box (defaults to 1, 2, 3…;
  editable to A1, B2, +, − …),
- a **signal label** — e.g. `VCC`, `SDA`.

Options in the inspector:

- **Pins face** left or right — or press **R** with the connector selected to flip it.
- **Shell** — adds an extra `⏚ shell` row for cable shields / chassis connections.
- **Connector part** — assign a housing from the part library. If the part's cavity
  count doesn't match the pin count, a warning appears.
- **Accessories** — attach contacts, cavity seals, locks, dust covers, boots and
  backshells with quantities; they are counted in the BOM.

A **jumper wire** (pin to pin on the same connector) is allowed — just drag between
the two pins.

## Terminal

A single termination point: **ferrule, ring, spade, male/female quick connect, or
loose wire end** — pick the type in the inspector, give it a signal name, and assign
a terminal part. Attach one or more wires to its pad (Wire mode).

## Splice

Joins any number of wires into **one electrical net**. The Connections view shows all
wires through a splice with the same net number. Assign a splice part (e.g. a solder
sleeve) and coverings.

## Diode & Resistor

Inline two-pad components. Wires attached to opposite pads stay **separate nets**
(the component sits between them).

- Diode: **A** = anode, **K** = cathode. Flip the direction with **R** or the
  inspector toggle.
- Resistor: has a free-text value field (e.g. `120 Ω`).

## Board / PCB and Group

Resizable containers. Drop a component inside and it **moves with the container**;
drag it out to detach. Boards have a color; groups are neutral organizational frames
(e.g. "Sensor pigtail"). Container names prefix endpoints in the Connections view:
`Power PCB › J3.1`.

## Branch point

A documentation marker for where the physical harness trunk splits into branches.
Wires don't connect to it.

## Note

A sticky note. Set text, color, width and text alignment in the inspector. Notes
never appear in the Connections view or BOM.
