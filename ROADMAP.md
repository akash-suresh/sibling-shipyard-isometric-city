# Sibling Shipyard — Product Roadmap

## Vision

Sibling Shipyard is a miniature civilisation shaped by the projects Akash and Skanda create. A project begins as a plot, earns architecture through progress, and leaves a visible history in the world.

The core feeling is **Silicon Valley's playful visual storytelling + Monument Valley's geometry and calm + a restrained product interface**.

## Product principles

1. **The world is the interface.** Status and progress appear in the scene before they appear as text.
2. **Projects earn architecture.** Growth means new identity and surroundings, not merely taller towers.
3. **Present state and history are different.** Temporary activity communicates current status; permanent architecture records achievements.
4. **Make a construction kit, not bespoke scenes.** Common projects use reusable pieces; landmarks may earn custom art.
5. **Reward curiosity.** Tiny movements and details should make a short pause in the world worthwhile.
6. **Keep the UI quiet.** Project information supports the world instead of covering it.

## Progression vocabulary

| Stage | World expression |
|---|---|
| 0 · Idea | Marked plot, survey stakes, blueprint or hologram |
| 1 · Experiment | Tiny workshop, one light, prototype equipment |
| 2 · Prototype | Recognisable structure, multiple rooms, visible identity |
| 3 · Shipped | Proper building, connected road, landscaping, visitors |
| 4 · Growing | New wings, rooftop systems, denser activity and infrastructure |
| 5 · Landmark | Distinctive architecture that represents the project |

## Status vocabulary

| Status | Temporary expression |
|---|---|
| Building | Crane, scaffolding, workers, deliveries |
| Shipping | Brighter lights and concentrated activity |
| Live | Calm operation, visitors, cared-for landscape |
| Growing | Increased traffic and active expansion |
| Paused | Quiet scene, fewer lights, no construction |
| Archived | Beautiful but dormant and lightly overgrown |
| Incident | Playful smoke, flicker, or tiny response vehicle |

## Milestones

```mermaid
flowchart LR
    M0["M0 · Foundation"] --> M1["M1 · First world"]
    M1 --> M2["M2 · Shipyard Zero"]
    M2 --> M3["M3 · Construction kit"]
    M3 --> M4["M4 · Living world"]
    M4 --> M5["M5 · History"]
```

### M0 · Foundation — S

Lock the product language, rendering boundary, first data contract, and visual constraints.

**Done when:** these source-of-truth documents agree and Shipyard Zero has testable acceptance criteria.

### M1 · First world — M

Render one floating island and one building with pan, zoom, hover identification, and click-to-focus.

**Done when:** a first-time viewer can discover and focus the building without instruction.

### M2 · Shipyard Zero — M — critical path

Add Orion, Spark, and Nexus in three distinct states, load them from JSON, show project detail, and play one physical milestone upgrade.

**Done when:** changing Orion's milestone data produces a visible construction sequence and the concept is understandable without narration.

### M3 · Construction kit — L

Extract reusable bases, floors, roofs, signs, landscaping, status effects, and event animations.

**Done when:** a fourth ordinary project can be added from data without editing scene code or commissioning a bespoke scene.

### M4 · Living world — L

Add ambient people, vehicles, deliveries, machines, richer landscaping, and temporary world events.

**Done when:** the world remains readable and performant while activity responds to every supported status. **(COMPLETED)**

### M5 · History — L

Persist milestone history and let visitors scrub through earlier world states.

**Done when:** moving the timeline backward deterministically reconstructs an earlier Shipyard and returning to today restores the current state.

## Long-term vision — rough, not committed

- Civilisation eras: Plot → Settlement → Campus → City → Metropolis
- Roads and bridges that express relationships between projects
- GitHub, release, user, and revenue signals mapped to reviewed milestones
- Expanding islands, districts, weather, celebrations, and unique landmarks
- A durable visual archive of experiments, failures, launches, and growth

## Permanent non-goals

- A conventional dashboard with a decorative city beside it
- Photorealistic rendering or a realistic physics simulation
- A handcrafted scene for every project
- Automated external integrations before the manual data loop feels valuable

