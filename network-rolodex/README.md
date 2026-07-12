# Network Rolodex

A visualization-first tool to understand the **shape** of your professional
network. Import your contacts and explore them re-projected through different
lenses — the same people, grouped and colored three different ways.

This is a **v1 prototype**: React + Vite, no backend, all state in `localStorage`.

## Run it

```bash
npm install
npm run dev      # http://localhost:5173
```

Sample data (~40 contacts across industries and cities) loads on first run, so
every view is populated immediately. Your edits/imports persist in the browser.

## The three lenses

One shared contact store; each lens only changes how contacts are grouped,
colored, and laid out — never the underlying data.

- **Industry** — force-clustered graph, one labeled cluster per inferred
  industry, node size = relationship strength.
- **Geographic** — grouped region/city clusters (cards) with a top-cities and
  concentration readout. *Map-ready:* contacts carry a reserved `latLng` and the
  layout is isolated to one component so a real map drops in without touching the
  rest of the app.
- **Rolodex** — searchable, sortable table of every connection with all
  attributes and group memberships; click any row to inspect or correct.

Each view carries a compact insight panel that surfaces the "so what," not just
dots on a screen.

## Importing

- **LinkedIn** — export your connections (Settings → Data privacy → Get a copy of
  your data → Connections) and drop the `Connections.csv` into **Import CSV**.
  City/region aren't in LinkedIn's export, so add those per contact afterward.
- **Manual** — the **+ Add** button.

## Derived, but overridable

`industry` and `region` are auto-inferred from title/company/location by keyword
rules. Any correction you make in the detail panel sets a `userOverride` flag and
sticks — re-inference never clobbers a value you set by hand.

## Architecture / where Phase 2 plugs in

Everything meant to grow later is deliberately isolated:

| Concern | File | Phase 2 swap |
|---|---|---|
| Industry/region classification | `src/lib/inference.js` | replace the two `infer*` functions with an LLM classifier — signatures stay |
| Graph construction | `src/lib/graph.js` | add contact↔contact links for social/mutual clustering |
| Geographic layout | `src/components/GeographicView.jsx` | swap the card grid for a real map over `latLng` |
| Color tokens | `src/theme.js` (+ `src/index.css`) | one place for the palette |

Reserved-but-unused fields (`latLng`, `lastContacted`) already travel with each
contact, so the real map and a recency/CRM layer are additive.

## Out of scope for v1

Social/mutual-connection clustering, real geocoded map, LLM classification,
recency/CRM, intro-pathfinding — all have clear extension points and none require
a rewrite.
