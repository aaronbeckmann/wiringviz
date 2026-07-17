# Cables, bundles & twisted wires

Wire groups organize related wires. Create one from the **wire inspector**
(*Cable / bundle → + New cable…*) or from the project overview panel (*+ Add* when
nothing is selected).

## The three kinds

| Kind | Meaning |
| --- | --- |
| **Cable** | Wires in a common jacket (cores of a multi-core cable) |
| **Bundle** | Loose wires routed together (tied / taped) |
| **Twisted wires** | Wires twisted together — usually a pair |

Change the kind with the dropdown next to the group's name in the project overview.

## Assigning wires

Select a wire → *Cable / bundle* dropdown → pick a group. The group row in the
overview shows how many wires it holds (`5w`).

## Group properties

Each group can carry:

- a **cable part** from the library (e.g. a 4-core jacketed cable) — counted once
  in the BOM,
- **coverings** (braided sleeve, corrugated tubing …) — also counted in the BOM.

## Twisted pairs in the Connections view

Wires that belong to a *twisted* group get a `TW` tag in the Cable column and a
**"Twisted with"** column listing their partner wires, so twisted pairs are easy
to verify during review.

## Shields

For shielded cables, enable **Shell** on the connector that terminates the shield
and wire the shell row to a ground pin, splice or terminal.
