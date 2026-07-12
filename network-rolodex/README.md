# Network Rolodex

A visualization-first tool to understand the **shape** of your professional
network. Import your contacts and explore them re-projected through different
lenses — the same people, grouped and colored several different ways.

No backend; all state lives in `localStorage`. Sample data (~40 contacts across
industries and cities) loads on first run, so every view is populated
immediately.

## Two ways to run it

**1. Interactive prototype (fastest — no build)** — `prototype.html` is a
single, dependency-free file. Open it in any browser, or view the hosted
version. It has the fullest, most polished UX (see the lenses below), a custom
canvas force-graph, light/dark theming, keyboard shortcuts (1–5), and JSON/CSV
export. This is the version to open when you want to *see and critique* the
tool.

**2. React + Vite app (structured source)** — the `src/` tree is the componentized
implementation, good for extending the data/inference layer.

```bash
npm install
npm run dev      # http://localhost:5173
```

## The lenses

One shared contact store; each lens only changes how contacts are grouped,
colored, and laid out — never the underlying data. Selection is continuous:
click a person in any lens and they stay highlighted when you switch. (The
Overview and Circles lenses are in `prototype.html`.)

- **Overview** — "network at a glance": hero readouts, industry composition,
  strength distribution, top cities, a live mini-constellation, and generated
  highlights (including who *bridges the most circles*). Click an industry or a
  city to drill straight into it.
- **Industry** — force-clustered graph, one labeled cluster per inferred
  industry, node size = relationship strength; hover for detail, pan/zoom, focus
  a cluster from the legend.
- **Geographic** — grouped region/city clusters (cards) with top-cities and
  concentration readouts. *Map-ready:* contacts carry a reserved `latLng` and the
  layout is isolated so a real map drops in without touching the rest of the app.
- **Circles** — the **social lens**. People cluster by *shared context* (tags
  like college, climbing, founder); someone in two circles sits between them,
  surfacing overlap and natural introducers. Built on multi-hub membership in the
  force engine.
- **Rolodex** — searchable, sortable table of every connection; click a row to
  inspect/correct, or a tag to filter to that circle.

Each view carries a compact insight panel that surfaces the "so what," not just
dots on a screen.

## Importing your own network (local & private)

Everything is parsed **in your browser** — nothing is uploaded. Open **Import**,
then drop your export files (several at once is fine — each is auto-detected):

- **LinkedIn** — Settings & Privacy → Data privacy → *Get a copy of your data* →
  **Connections** → drop `Connections.csv`. The professional layer (name,
  company, title). City isn't in the export; add it later.
- **Instagram** — Settings → Accounts Center → *Your information & permissions* →
  Download your information → **Followers & following**, format **JSON** → drop
  `followers_1.json` and `following.json`. People you both follow are tagged
  **mutual**; close friends tagged **close-friend**. Usernames only, so these
  start as handles to enrich later.
- **Manual** — the **+ Add** button.

Imports **dedupe and merge** across sources (and against existing contacts) by
normalized name, so the same person from LinkedIn + Instagram becomes one node
carrying both `linkedin` and `instagram` tags. Back up anytime via
**Export JSON / CSV**.

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

## Roadmap

Done: the social/circles lens (shared-context clustering). Still ahead, each
with a clear extension point and no rewrite required — a real geocoded map,
LLM-based industry/region classification, recency/CRM signals, and
intro-pathfinding ("who can introduce me to someone at X").
