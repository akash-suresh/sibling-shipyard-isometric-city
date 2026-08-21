import { useCallback, useState } from "react";
import milestoneData from "../data/milestones.json";
import { projects } from "../data/loadProjects";
import {
  completeMilestone,
  startMilestone,
  type MilestoneState,
} from "../world/events/milestoneState";
import { ThreeShipyardCanvas } from "../world/ThreeShipyardCanvas";
import { PlaygroundControls } from "./PlaygroundControls";
import type { MilestoneDefinition } from "../data/types";

const publicBeta = milestoneData[0] as MilestoneDefinition;

export function App() {
  const [view, setView] = useState<
    "world" | "target" | "playground"
  >("world");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [milestone, setMilestone] = useState<MilestoneState>({
    status: "ready",
    playCount: 0,
  });
  const [isNightMode, setIsNightMode] = useState(false);
  
  const selectProject = useCallback((id: string) => setSelectedId(id), []);
  const finishMilestone = useCallback(
    () => setMilestone(completeMilestone),
    [],
  );
  const selected = projects.find((project) => project.id === selectedId);

  const playPublicBeta = () => {
    setSelectedId(publicBeta.projectId);
    setMilestone(startMilestone);
  };

  return (
    <main>
      <header className="masthead">
        <p>AKASH × SKANDA</p>
        <h1>Sibling Shipyard</h1>
        <span>Things we're building.</span>
      </header>

      <button 
        onClick={() => setIsNightMode(!isNightMode)}
        style={{ position: 'absolute', right: '40px', bottom: '40px', zIndex: 10, padding: '12px 24px', borderRadius: '12px', background: isNightMode ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.8)', color: isNightMode ? '#fff' : '#333', border: '1px solid rgba(128,128,128,0.2)', cursor: 'pointer', fontWeight: 600, backdropFilter: 'blur(12px)' }}
      >
        {isNightMode ? '☀️ Day' : '🌙 Night'}
      </button>

      <div className="view-switch" role="group" aria-label="Shipyard view">
        <button
          onClick={() => setView("world")}
          aria-pressed={view === "world"}
        >
          World
        </button>
        <button
          onClick={() => setView("playground")}
          aria-pressed={view === "playground"}
        >
          Playground
        </button>
        <button
          onClick={() => setView("target")}
          aria-pressed={view === "target"}
        >
          Beauty target
        </button>
      </div>

      {view === "world" ? (
        <ThreeShipyardCanvas projects={projects} isNightMode={isNightMode} />
      ) : view === "playground" ? (
        <PlaygroundControls />
      ) : (
        <figure className="beauty-target">
          <img
            src="/assets/style-guide/shipyard-zero-beauty-target-v1.png"
            alt="Near-final visual target for Shipyard Zero, showing Orion under construction, Spark live, and Nexus growing on a compact isometric island"
          />
          <figcaption>Shipyard Zero · beauty target v1</figcaption>
        </figure>
      )}

      {view === "world" && (
        <nav className="project-nav" aria-label="Explore projects">
          {projects.map((project) => (
            <button
              key={project.id}
              onClick={() => selectProject(project.id)}
              aria-pressed={selectedId === project.id}
            >
              <span>{project.name}</span>
              <small>{project.status}</small>
            </button>
          ))}
        </nav>
      )}

      {view === "world" && selected && (
        <aside className="project-card" aria-live="polite">
          <button
            className="close"
            onClick={() => setSelectedId(null)}
            aria-label="Close project details"
          >
            ×
          </button>
          <p className="eyebrow">
            {selected.stage} · {selected.status}
          </p>
          <h2>{selected.name}</h2>
          <p>{selected.summary}</p>
          <dl>
            <div>
              <dt>Latest</dt>
              <dd>{selected.latestMilestone}</dd>
            </div>
            <div>
              <dt>Next</dt>
              <dd>{selected.nextMilestone}</dd>
            </div>
          </dl>
          {selected.id === publicBeta.projectId && (
            <div className="milestone-action">
              <button
                onClick={playPublicBeta}
                disabled={milestone.status === "playing"}
              >
                {milestone.status === "playing"
                  ? "Construction in progress…"
                  : milestone.status === "complete"
                    ? "Replay construction"
                    : "Reach Public Beta"}
              </button>
              {milestone.status === "complete" && (
                <p className="milestone-reveal">
                  <strong>{publicBeta.title}</strong>
                  <span>{publicBeta.date}</span>
                </p>
              )}
            </div>
          )}
        </aside>
      )}

      <p className="hint">
        {view === "world"
          ? "Drag to explore · Scroll to zoom · Select a project"
          : view === "target"
            ? "Visual target · not the interactive renderer yet"
            : "Playground"}
      </p>
    </main>
  );
}
