# Parts & BOM

The **Parts** view manages the project's part library and doubles as the live
**bill of materials**.

## Part types

| Category | Types |
| --- | --- |
| Component parts | Connector, Wire, Splice, Diode, Resistor, Cable, Generic |
| Accessories | Contact, Cavity seal, Lock, Dust cover, Boot, Backshell |
| Coverings | Heatshrink, Tape, Corrugated tubing, Spiral wrap, Tubing, Braided sleeve |
| Terminals | Ferrule, Ring terminal, Spade terminal, Quick connect |

## Creating parts

- In the Parts view: choose a type, enter the part number, **Add part**.
- Inline anywhere: every part dropdown has **"+ New part…"**.

Edit manufacturer, description, cost — and for connectors the **cavity count** —
directly in the table cells.

### Custom types & BOM-only parts

Pick **Custom type…** in the add form to create parts with any type you like
(*Zip tie*, *Fuse*, *Label*…). They are grouped under **Other parts** and never
appear on the schematic — they exist purely for the BOM.

## Assigning parts

| Assign to | Where |
| --- | --- |
| Connector housing | Connector inspector (cavity mismatch is flagged) |
| Wire | Wire inspector |
| Splice / Diode / Resistor / Terminal | Their inspectors |
| Cable / bundle | Project overview panel |
| Accessories (with quantity) | Connector inspector → Accessories |
| Coverings | Wire, cable, splice, diode, resistor and terminal inspectors |

## The BOM

Every part has two quantities:

- **In design** — counted automatically from schematic assignments (accessory
  quantities included). Read-only.
- **Extra** — a number you type yourself: spares, zip ties, fuses, labels, tape…
  anything the harness needs that isn't drawn.

**Total = In design + Extra**, and **Ext. cost = Total × cost**. The bar at the
bottom shows the overall item count and total cost, and warns when used parts
have no cost yet. The PDF export uses the same totals.

Deleting a part removes it from every component that referenced it.
