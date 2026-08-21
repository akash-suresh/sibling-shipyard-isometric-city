import { useState } from "react";
import { PlaygroundCanvas } from "../world/PlaygroundCanvas";
import {
  buildingArchetypes,
  buildingModuleKinds,
  projectStages,
  projectStatuses,
  roofFeatureKinds,
  buildingPartCompatibility,
} from "../data/types";
import type {
  BuildingArchetype,
  BuildingModuleKind,
  ProjectStage,
  ProjectStatus,
  RoofFeatureKind,
} from "../data/types";

export function PlaygroundControls() {
  const [archetype, setArchetype] = useState<BuildingArchetype>("workshop");
  const [modules, setModules] = useState<BuildingModuleKind[]>([]);
  const [roof, setRoof] = useState<RoofFeatureKind | "none">("none");
  const [stage, setStage] = useState<ProjectStage>("idea");
  const [status, setStatus] = useState<ProjectStatus>("building");
  const [accent, setAccent] = useState<string>("#6c7bd9");

  const compatibleModules = buildingPartCompatibility[archetype].modules;
  const compatibleRoofs = buildingPartCompatibility[archetype].roofs;

  const handleArchetypeChange = (newArchetype: BuildingArchetype) => {
    setArchetype(newArchetype);
    // Clear incompatible modules and roof
    setModules([]);
    setRoof("none");
  };

  const toggleModule = (mod: BuildingModuleKind) => {
    setModules((prev) =>
      prev.includes(mod) ? prev.filter((m) => m !== mod) : [...prev, mod],
    );
  };

  return (
    <div className="playground-view">
      <PlaygroundCanvas
        archetype={archetype}
        modules={modules}
        roof={roof}
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
          <h3>Modules</h3>
          <div className="toggle-list">
            {buildingModuleKinds.map((mod) => {
              const isCompatible = compatibleModules.includes(mod as any);
              return (
                <label key={mod} className={isCompatible ? "" : "disabled"}>
                  <input
                    type="checkbox"
                    checked={modules.includes(mod)}
                    onChange={() => toggleModule(mod)}
                    disabled={!isCompatible}
                  />
                  {mod}
                </label>
              );
            })}
          </div>
        </div>

        <div className="control-group">
          <h3>Roof Feature</h3>
          <select
            value={roof}
            onChange={(e) =>
              setRoof(e.target.value as RoofFeatureKind | "none")
            }
          >
            <option value="none">None</option>
            {compatibleRoofs.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
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
