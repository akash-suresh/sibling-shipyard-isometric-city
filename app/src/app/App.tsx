import { useCallback, useState } from "react"
import milestoneData from "../data/milestones.json"
import { projects } from "../data/loadProjects"
import { completeMilestone, startMilestone, type MilestoneState } from "../world/events/milestoneState"
import { ReferenceSheetCanvas, type CatalogMotionMode } from "../world/ReferenceSheetCanvas"
import { ShipyardCanvas } from "../world/ShipyardCanvas"
import { catalogSections, type CatalogSection } from "../world/rendering/createReferenceSheet"
import type { MilestoneDefinition } from "../data/types"

const publicBeta = milestoneData[0] as MilestoneDefinition

export function App() {
  const [view, setView] = useState<"world" | "target" | "reference">("world")
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [milestone, setMilestone] = useState<MilestoneState>({ status: "ready", playCount: 0 })
  const [catalogMotion, setCatalogMotion] = useState<CatalogMotionMode>(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "reduced" : "play")
  const [catalogSection, setCatalogSection] = useState<CatalogSection>("overview")
  const selectProject = useCallback((id: string) => setSelectedId(id), [])
  const finishMilestone = useCallback(() => setMilestone(completeMilestone), [])
  const selected = projects.find((project) => project.id === selectedId)

  const playPublicBeta = () => {
    setSelectedId(publicBeta.projectId)
    setMilestone(startMilestone)
  }

  return (
    <main>
      <header className="masthead">
        <p>AKASH × SKANDA</p>
        <h1>Sibling Shipyard</h1>
        <span>Things we're building.</span>
      </header>

      <div className="view-switch" role="group" aria-label="Shipyard view">
        <button onClick={() => setView("world")} aria-pressed={view === "world"}>World</button>
        <button onClick={() => setView("target")} aria-pressed={view === "target"}>Beauty target</button>
        <button onClick={() => setView("reference")} aria-pressed={view === "reference"}>Visual system</button>
      </div>

      {view === "world" ? (
        <ShipyardCanvas
          projects={projects}
          selectedProjectId={selectedId}
          milestoneProjectId={publicBeta.projectId}
          milestoneResultingModules={publicBeta.resultingModules}
          milestonePlayCount={milestone.playCount}
          onSelect={selectProject}
          onMilestoneComplete={finishMilestone}
        />
      ) : view === "reference" ? (
        <>
          <nav className="catalog-section-nav" aria-label="Visual system sections">
            {catalogSections.map((section) => <button key={section} onClick={() => setCatalogSection(section)} aria-pressed={catalogSection === section}>{section}</button>)}
          </nav>
          <ReferenceSheetCanvas motionMode={catalogMotion} section={catalogSection} />
          {catalogSection === "motion" && <div className="motion-controls" role="group" aria-label="Catalog motion">
            {(["play", "paused", "reduced"] as const).map((mode) => (
              <button key={mode} onClick={() => setCatalogMotion(mode)} aria-pressed={catalogMotion === mode}>{mode}</button>
            ))}
          </div>}
          <section className="reference-summary" aria-label="Visual system summary">
            <span>{catalogSection}</span><span>Production components</span><span>Shared with World</span>
          </section>
        </>
      ) : (
        <figure className="beauty-target">
          <img src="/assets/style-guide/shipyard-zero-beauty-target-v1.png" alt="Near-final visual target for Shipyard Zero, showing Orion under construction, Spark live, and Nexus growing on a compact isometric island" />
          <figcaption>Shipyard Zero · beauty target v1</figcaption>
        </figure>
      )}

      {view === "world" && <nav className="project-nav" aria-label="Explore projects">
        {projects.map((project) => (
          <button key={project.id} onClick={() => selectProject(project.id)} aria-pressed={selectedId === project.id}>
            <span>{project.name}</span>
            <small>{project.status}</small>
          </button>
        ))}
      </nav>}

      {view === "world" && selected && (
        <aside className="project-card" aria-live="polite">
          <button className="close" onClick={() => setSelectedId(null)} aria-label="Close project details">×</button>
          <p className="eyebrow">{selected.stage} · {selected.status}</p>
          <h2>{selected.name}</h2>
          <p>{selected.summary}</p>
          <dl>
            <div><dt>Latest</dt><dd>{selected.latestMilestone}</dd></div>
            <div><dt>Next</dt><dd>{selected.nextMilestone}</dd></div>
          </dl>
          {selected.id === publicBeta.projectId && (
            <div className="milestone-action">
              <button onClick={playPublicBeta} disabled={milestone.status === "playing"}>
                {milestone.status === "playing" ? "Construction in progress…" : milestone.status === "complete" ? "Replay construction" : "Reach Public Beta"}
              </button>
              {milestone.status === "complete" && (
                <p className="milestone-reveal"><strong>{publicBeta.title}</strong><span>{publicBeta.date}</span></p>
              )}
            </div>
          )}
        </aside>
      )}

      <p className="hint">{view === "world" ? "Drag to explore · Scroll to zoom · Select a project" : view === "target" ? "Visual target · not the interactive renderer yet" : "Live component catalog · v1"}</p>
    </main>
  )
}
