# Sibling Shipyard — Visual System v1

## Beauty target

`app/public/assets/style-guide/shipyard-zero-beauty-target-v1.png` is the near-final composition target for Shipyard Zero. The in-app **Beauty target** view displays it beside the current interactive prototype.

Use the target to judge composition, architectural depth, silhouette, density, landscaping, roads, lighting, and activity. It is not a production sprite and must not be used as a flattened interactive background.

## Locked reference

- **Projection:** 96 × 48 px isometric tile, 2:1 ratio
- **Anchor:** ground-contact center for every world asset
- **Light:** upper-left, approximately 10:30
- **Cast shadow:** lower-right, ink at 16% opacity
- **Geometry:** chunky modular masses, vertical verticals, grid-aligned diagonals
- **Detail floor:** no important feature smaller than 3 px at default zoom
- **Identity:** project accent occupies at most 15% of a building
- **Status:** always communicated through form or activity as well as colour

The executable source of truth is `app/src/design/visualTokens.ts`. The in-app **Visual system** view renders these rules through PixiJS at the production camera.

The catalog is divided into **Overview, Terrain, Buildings, Props, States, and Motion**. Each section composes the same factories used by the World. Desktop uses an 800 × 620 artboard; phone layouts reflow onto a dedicated 350 × 720 artboard so labels remain legible rather than shrinking the desktop sheet.

## Canonical scale

| Asset | Default size |
|---|---|
| Person | 18 px tall |
| Tree | 42 px tall |
| Compact vehicle | 54 px long × 24 px high |
| Crane | 104 px tall |
| Building floor | 24 px tall |
| Standard footprint | 2 × 2 tiles |

## Project silhouettes

The reusable building archetypes are `workshop`, `studio`, and `tower`. Both the World and Visual system instantiate them through the same data-driven factory; project IDs never select a renderer.

The reusable parts inventory is:

- Modules: `lab-floor`, `beta-floor`, `office-floor`, `tower-floor`, `sky-wing`
- Roofs: `crane`, `beacon`, `antenna`

Ordered and repeated module keys change the building mass. The Buildings catalog renders these exact production factories, while Progression keeps lifecycle treatments separate.

- **Orion:** low horizontal workshop, incomplete form, crane and scaffold language
- **Spark:** compact office, warm beacon, small live-world activity
- **Nexus:** tall stepped mass, visible growth wing, antenna

The silhouettes must remain distinguishable with labels and accent colours removed.

## State language

| State | Required non-colour cue |
|---|---|
| Hover | slight lift and label reveal |
| Selected | ground ring and camera focus |
| Building | crane, incomplete form, materials |
| Live | lit windows or beacon plus visitors |
| Growing | added architectural mass plus activity |
| Shipping | outbound crate and directional arrow |
| Paused | lowered flag and quiet marker |
| Archived | closed vault plus overgrowth |
| Incident | response cone plus smoke |

## Stage progression

Stage is a permanent achievement layer around a project's unique identity building. It is independent from temporary status and transient milestone animation.

| Stage | Permanent plot cue |
|---|---|
| Idea | claimed plot, survey stakes, translucent plan |
| Experiment | tiny workshop and prototype rig |
| Prototype | work pad, test frame, crates |
| Shipped | finished entrance, landscaping, visitor and flag |
| Growing | added utility mass and expansion marker |
| Landmark | formal plaza, monument and civic banner |

The World composes `identity building + stage treatment + status treatment + milestone layer`. The Visual system enumerates every stage and status using those production factories.

## Environment grammar

The production town is composed from one validated `shipyard-zero` layout manifest. It currently contains 90 terrain cells, 14 connected road cells, 8 water cells, one bridge, 22 placed props, three project plots, and two actor routes. The Layout catalog section visualises the same rendered manifest with diagnostic anchors and footprints.

- Roads are composed from terminus, straight, corner, and junction connections.
- Water is an opaque tile system with directional banks; the Shipyard Zero canal crosses the road through the shared bridge component.
- Trees, shrubs, benches, lamps, project signs, flowers, people, and service vehicles use ground-contact anchors and appear in the executable catalog.
- Ambient routes follow traversable roads and bridges rather than interpolating through buildings or water.

## Motion grammar

- Each mounted Pixi canvas owns one ticker-driven logical clock.
- Render factories are passive and expose update functions; they never create private animation loops.
- Logical time advances only in Play mode, freezes in Paused mode, and uses an intentional settled frame in Reduced mode.
- Orion uses crane/worker motion and a deterministic construction sequence; Spark uses a soft occupancy beacon; Nexus uses a restrained antenna packet signal.
- Camera focus, project ambience, actors, and construction playback all use the canvas ticker. No `requestAnimationFrame` remains under `app/src/world`.

## Approval gate

Approve the sheet only when:

1. All three projects are recognisable without labels or accents.
2. People, vehicles, doors, floors, trees, roads, and cranes share one scale.
3. Every face and shadow follows the global light direction.
4. Temporary states remain identifiable in grayscale.
5. Hover and selected treatments work on every terrain value.
6. Grid joins show no seams at roads or island edges.
7. Important details survive at 50% display scale.
8. Reduced-motion final states communicate the same outcome.

Only add new variants when they are required by a real World composition and can appear through the same production factory in the Visual system catalog.
