# Wires & routing

## Drawing a wire

Drag from a pin (or splice/terminal pad in Wire mode) to another pin. New wires cycle
through the standard color sequence automatically.

## Wire properties (inspector)

| Property | Notes |
| --- | --- |
| Name | Shown on the label, e.g. `+5V` |
| Color | 12 standard codes (BK, WH, GY, RD, OG, YE, GN, BU, VT, BN, PK, TQ) |
| Stripe | Optional second color, rendered as a dashed overlay (`RD/WH`) |
| Gauge | 30–10 AWG |
| Length | Free text, e.g. `250 mm` |
| Wire part | Part from the library, counted in the BOM |
| Cable / bundle | Group assignment (see *Cables & bundles*) |
| Coverings | Heatshrink, tape, tubing… applied to this wire |

## 45° routing

Wires route **only at multiples of 45°** — they leave each pin with a short straight
stub, then run horizontal / vertical / diagonal with smoothly rounded corners.
Segments between your layout points are decomposed into legal 45° legs
automatically, so the wire never runs at an odd angle no matter where you put a bend.

## Layout points (bends)

- **Double-click a wire** to add a layout point where you clicked.
- **Drag** the diamond to route the wire.
- **Double-click a diamond** to remove it; the wire inspector has **Delete all**.
- Layout points are stored with the wire and survive save/export.

Layout points stay hidden until you **hover the wire** (or select it), and fade out
about **3 seconds** after the pointer leaves. They are pure editing helpers — PNG
and PDF exports never include them.

## Labels

Wire labels sit above the cable at its halfway point.

- **Drag a label** anywhere — its offset is remembered.
- If the label is far from its wire, a thin **leader arrow** points from the label
  back to the nearest spot on the wire.
- **Double-click a label** to snap it back home.

## Deleting

Select a wire and press **Delete** (or Backspace). Reducing a connector's pin count
deletes wires attached to removed pins; unchecking Shell deletes shell wires.
