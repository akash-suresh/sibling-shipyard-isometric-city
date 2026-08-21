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
import type { MilestoneDefinition, ProjectDefinition } from "../data/types";

const publicBeta = milestoneData[0] as MilestoneDefinition;

export function App() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [projectsState, setProjectsState] = useState<ProjectDefinition[]>(projects);
  const [milestone, setMilestone] = useState<MilestoneState>({
    status: "ready",
    playCount: 0,
  });
  const [isNightMode, setIsNightMode] = useState(false);
  
  // Secret developer mode via ?playground in the URL
  const isPlayground = new URLSearchParams(window.location.search).has('playground');
  
  const selectProject = useCallback((id: string) => setSelectedId(id), []);
  const finishMilestone = useCallback(
    () => setMilestone(completeMilestone),
    [],
  );
  const selected = projectsState.find((project) => project.id === selectedId);

  const playPublicBeta = () => {
    setSelectedId(publicBeta.projectId);
    setMilestone(startMilestone);
  };

  return (
    <main>
      <header className="masthead">
        <h1>Sibling Shipyard</h1>
        <span>Things we're building.</span>
      </header>

      <button 
        className="night-toggle"
        onClick={() => setIsNightMode(!isNightMode)}
        aria-pressed={isNightMode}
      >
        {isNightMode ? '☀️ Day' : '🌙 Night'}
      </button>

      <div className="hint" style={{position: 'fixed', bottom: 16, right: 16, fontSize: '0.8rem', color: '#666', pointerEvents: 'none', zIndex: 10}}>
        Drag to explore · Scroll to zoom · Select a project
      </div>

      <ThreeShipyardCanvas projects={projectsState} isNightMode={isNightMode} />
      {isPlayground && (
        <PlaygroundControls projects={projectsState} setProjects={setProjectsState} />
      )}

      <nav className="project-nav" aria-label="Explore projects">
        {projectsState.map((project) => (
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

      {selected && (
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
    </main>
  );
}
