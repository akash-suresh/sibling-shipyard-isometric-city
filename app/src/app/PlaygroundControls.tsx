import { useState, useEffect } from "react";
import {
  buildingArchetypes,
  projectStages,
  projectStatuses,
} from "../data/types";
import type {
  ProjectDefinition,
  BuildingArchetype,
  ProjectStage,
  ProjectStatus,
} from "../data/types";
import type { TownLayout } from "../world/layout/townLayout";

interface PlaygroundControlsProps {
  projects: ProjectDefinition[];
  setProjects: (projects: ProjectDefinition[]) => void;
  layout: TownLayout;
  setLayout: (layout: TownLayout) => void;
}

export function PlaygroundControls({ projects, setProjects, layout, setLayout }: PlaygroundControlsProps) {
  const [selectedId, setSelectedId] = useState<string>(projects[0]?.id || "");
  const [isPathBuilderMode, setIsPathBuilderMode] = useState(false);

  const selected = projects.find((p) => p.id === selectedId);

  const updateProject = (id: string, updates: Partial<ProjectDefinition>) => {
    setProjects(
      projects.map((p) => {
        if (p.id === id) {
          return {
            ...p,
            ...updates,
            building: { ...p.building, ...(updates.building || {}) },
            grid: { ...p.grid, ...(updates.grid || {}) },
            overrides: { ...p.overrides, ...(updates.overrides || {}) },
          };
        }
        return p;
      })
    );
  };

  useEffect(() => {
    const handleDragEnd = (e: any) => {
      const { projectId, elementId, position } = e.detail;
      const project = projects.find(p => p.id === projectId);
      if (project) {
        updateProject(projectId, {
          overrides: {
            ...project.overrides,
            [elementId]: { x: position.x, y: position.y, z: position.z }
          }
        });
      }
    };
    
    const handleTerrainClick = (e: any) => {
      if (!isPathBuilderMode) return;
      const { x, y } = e.detail;
      
      const isPath = layout.paths.find(p => p.x === x && p.y === y);
      const newPaths = isPath 
        ? layout.paths.filter(p => p.x !== x || p.y !== y)
        : [...layout.paths, { x, y }];
        
      setLayout({ ...layout, paths: newPaths });
    };

    window.addEventListener('shipyard-drag-end', handleDragEnd);
    window.addEventListener('shipyard-terrain-click', handleTerrainClick);
    return () => {
      window.removeEventListener('shipyard-drag-end', handleDragEnd);
      window.removeEventListener('shipyard-terrain-click', handleTerrainClick);
    };
  }, [projects, layout, isPathBuilderMode]);

  const updateSelected = (updates: Partial<ProjectDefinition>) => {
    if (selected) {
      updateProject(selected.id, updates);
    }
  };

  return (
    <aside className="playground-controls" style={{ zIndex: 10, background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(10px)', padding: '1rem', borderLeft: '1px solid #ccc', position: 'absolute', right: 0, top: 0, bottom: 0, width: '320px', overflowY: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>City Editor</h2>
        <button 
          onClick={() => setIsPathBuilderMode(!isPathBuilderMode)}
          style={{ background: isPathBuilderMode ? '#3b82f6' : '#eee', color: isPathBuilderMode ? 'white' : 'black', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          {isPathBuilderMode ? 'Path Mode: ON' : 'Path Mode: OFF'}
        </button>
      </div>

      <div className="control-group">
        <h3>Select Project</h3>
        <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)} style={{ width: '100%', padding: '0.5rem', marginBottom: '1rem' }}>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>{p.name} ({p.id})</option>
          ))}
        </select>
      </div>

      {selected && (
        <>
          <div className="control-group">
            <h3>Name</h3>
            <input 
              type="text" 
              value={selected.name} 
              onChange={(e) => updateSelected({ name: e.target.value })}
              style={{ width: '100%', padding: '0.5rem', marginBottom: '1rem' }}
            />
          </div>

          <div className="control-group">
            <h3>Grid Position (X, Y)</h3>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
              <input 
                type="number" 
                value={selected.grid.x} 
                onChange={(e) => updateSelected({ grid: { ...selected.grid, x: parseInt(e.target.value) || 0 } })}
                style={{ width: '50%', padding: '0.5rem' }}
              />
              <input 
                type="number" 
                value={selected.grid.y} 
                onChange={(e) => updateSelected({ grid: { ...selected.grid, y: parseInt(e.target.value) || 0 } })}
                style={{ width: '50%', padding: '0.5rem' }}
              />
            </div>
          </div>

          <div className="control-group">
            <h3>Archetype</h3>
            <div className="segmented-control" style={{ marginBottom: '1rem' }}>
              {buildingArchetypes.map((arch) => (
                <button
                  key={arch}
                  onClick={() => updateSelected({ building: { ...selected.building, archetype: arch as BuildingArchetype } })}
                  aria-pressed={selected.building.archetype === arch}
                  style={{ display: 'block', width: '100%', padding: '0.5rem', marginBottom: '0.2rem' }}
                >
                  {arch}
                </button>
              ))}
            </div>
          </div>

          <div className="control-group">
            <h3>Lifecycle Stage</h3>
            <select
              value={selected.stage}
              onChange={(e) => updateSelected({ stage: e.target.value as ProjectStage })}
              style={{ width: '100%', padding: '0.5rem', marginBottom: '1rem' }}
            >
              {projectStages.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div className="control-group">
            <h3>Status</h3>
            <select
              value={selected.status}
              onChange={(e) => updateSelected({ status: e.target.value as ProjectStatus })}
              style={{ width: '100%', padding: '0.5rem', marginBottom: '1rem' }}
            >
              {projectStatuses.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div className="control-group">
            <h3>Accent Color</h3>
            <div className="color-picker-wrap" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <input
                type="color"
                value={selected.building.accent}
                onChange={(e) => updateSelected({ building: { ...selected.building, accent: e.target.value } })}
              />
              <code>{selected.building.accent}</code>
            </div>
          </div>
          
          <button 
            style={{ marginTop: '2rem', width: '100%', padding: '0.75rem', background: '#3b82f6', color: 'white', borderRadius: '4px', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}
            onClick={async () => {
              try {
                const resProjects = await fetch('/api/save-projects', {
                  method: 'POST',
                  body: JSON.stringify(projects)
                });
                const resLayout = await fetch('/api/save-layout', {
                  method: 'POST',
                  body: JSON.stringify(layout)
                });
                if (resProjects.ok && resLayout.ok) {
                  alert("Projects and layout saved to disk!");
                } else {
                  alert("Failed to save data!");
                }
              } catch (e) {
                console.error(e);
                alert("Failed to save data: " + String(e));
              }
            }}
          >
            Save to Disk
          </button>
        </>
      )}
    </aside>
  );
}
