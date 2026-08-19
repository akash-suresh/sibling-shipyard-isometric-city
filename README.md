# Sibling Shipyard Inc.

Sibling Shipyard is a living, stylized world of everything Akash and Skanda are building. Projects become evolving isometric buildings, milestones alter the landscape, and the Shipyard grows into a visual history of the work.

> The world is the interface.

The first target is **Shipyard Zero**: one floating island, three projects, and one milestone-driven building upgrade. It should prove that exploring and changing the world feels delightful before we scale the content or systems.

## Current build

The interactive foundation lives in `app/`:

- Programmatic PixiJS isometric town with Orion, Spark, and Nexus
- Validated, data-driven terrain, roads, water, bridges, decor, project plots, and actor routes
- Reusable building archetypes, stackable modules, roof features, lifecycle stages, statuses, and interaction chrome
- Deterministic milestone construction, ambient motion, drag/zoom, selection, and reduced-motion behavior
- A live Visual system catalog covering Overview, Terrain, Layout, Buildings, Progression, Props, States, and Motion
- Automated validation and rendering contracts across the production component kit

Run it with `cd app`, `npm install`, then `npm run dev`.

The next phase is a visual-quality pass: refine the procedural terrain and building grammar, deepen town life, and establish screenshot-based desktop/mobile review gates without abandoning the reusable PixiJS system.

## Source of truth

- [ROADMAP.md](ROADMAP.md) — product outcomes and milestone sequence
- [DESIGN.md](DESIGN.md) — visual language and interaction rules
- [ARCHITECTURE.md](ARCHITECTURE.md) — technical boundaries and data contracts
- [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md) — build order for Shipyard Zero

## Locked foundation

- React + TypeScript + Vite for the application shell
- PixiJS for the WebGL/canvas world
- Fixed 2.5D isometric projection with layered vector-style sprites
- Local JSON as the initial content source
- Data-driven buildings, states, and milestone events

## Proposed repository shape

```text
sibling-shipyard/
├── README.md
├── ROADMAP.md
├── DESIGN.md
├── ARCHITECTURE.md
├── IMPLEMENTATION_PLAN.md
├── app/
│   ├── public/assets/
│   ├── src/
│   │   ├── app/
│   │   ├── world/
│   │   │   ├── camera/
│   │   │   ├── entities/
│   │   │   ├── projection/
│   │   │   ├── rendering/
│   │   │   └── systems/
│   │   ├── ui/
│   │   └── data/
│   └── tests/
├── assets/
│   ├── buildings/
│   ├── environment/
│   ├── props/
│   └── style-guide/
└── world/
    ├── projects.json
    └── milestones.json
```

The folders are the intended boundary, not a requirement to create every module up front. Start with the smallest files needed by the vertical slice.
