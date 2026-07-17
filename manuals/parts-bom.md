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

The **Used** column counts every assignment in the design (accessory quantities
included); **Ext. cost** = used × cost. The bar at the bottom shows the **total
item count and total cost**, and warns when used parts have no cost yet.

Deleting a part removes it from every component that referenced it.
