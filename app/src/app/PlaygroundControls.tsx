import { useState } from "react";
import { PlaygroundCanvas } from "../world/PlaygroundCanvas";
import {
  buildingArchetypes,
  projectStages,
  projectStatuses,
} from "../data/types";
import type {
  BuildingArchetype,
  ProjectStage,
  ProjectStatus,
} from "../data/types";

export function PlaygroundControls() {
  const [archetype, setArchetype] = useState<BuildingArchetype>("workshop");
  const [stage, setStage] = useState<ProjectStage>("idea");
  const [status, setStatus] = useState<ProjectStatus>("building");
  const [accent, setAccent] = useState<string>("#6c7bd9");

  const handleArchetypeChange = (newArchetype: BuildingArchetype) => {
    setArchetype(newArchetype);
  };

  return (
    <div className="playground-view">
      <PlaygroundCanvas
        archetype={archetype}
        stage={stage}
        status={status}
        accent={accent}
      />

      <aside className="playground-controls">
        <h2>Building Playground</h2>

        <div className="control-group">
          <h3>Archetype</h3>
          <div className="segmented-control">
            {buildingArchetypes.map((arch) => (
              <button
                key={arch}
                onClick={() => handleArchetypeChange(arch)}
                aria-pressed={archetype === arch}
              >
                {arch}
              </button>
            ))}
          </div>
        </div>

        <div className="control-group">
          <h3>Lifecycle Stage</h3>
          <select
            value={stage}
            onChange={(e) => setStage(e.target.value as ProjectStage)}
          >
            {projectStages.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div className="control-group">
          <h3>Status</h3>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as ProjectStatus)}
          >
            {projectStatuses.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div className="control-group">
          <h3>Accent Color</h3>
          <div className="color-picker-wrap">
            <input
              type="color"
              value={accent}
              onChange={(e) => setAccent(e.target.value)}
            />
            <code>{accent}</code>
          </div>
        </div>
      </aside>
    </div>
  );
}
