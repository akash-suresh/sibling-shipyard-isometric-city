import * as THREE from "three";
import { useEffect, useRef, useState } from "react";
import { SceneManager } from "./three/SceneManager";
import { TerrainBuilder } from "./three/TerrainBuilder";
import { DecorBuilder } from "./three/DecorBuilder";
import { buildShipyard } from "./three/buildings/ShipyardBuilder";

import { BuildingFactory } from "./three/buildings/BuildingFactory";
import type { ProjectDefinition } from "../data/types";
import { AmbientLife } from "./three/actors/AmbientLife";
import { SelectionManager } from "./three/interaction/SelectionManager";

import type { TownLayout } from "./layout/townLayout";

export function ThreeShipyardCanvas({ 
  projects, 
  layout,
  isNightMode = false,
  globalProgress
}: { 
  projects: ProjectDefinition[], 
  layout: TownLayout,
  isNightMode?: boolean,
  globalProgress?: number
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const sceneManagerRef = useRef<SceneManager | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  useEffect(() => {
    if (sceneManagerRef.current) {
      sceneManagerRef.current.setNightMode(isNightMode);
    }
  }, [isNightMode]);

  useEffect(() => {
    if (sceneManagerRef.current && globalProgress !== undefined) {
      sceneManagerRef.current.setGlobalProgress(globalProgress);
    }
  }, [globalProgress]);

  const buildingsContainerRef = useRef<THREE.Group>(new THREE.Group());
  const buildingUpdatablesRef = useRef<import('./three/SceneManager').Updatable[]>([]);

  const terrainContainerRef = useRef<THREE.Group>(new THREE.Group());
  const terrainUpdatablesRef = useRef<import('./three/SceneManager').Updatable[]>([]);
  const decorContainerRef = useRef<THREE.Group>(new THREE.Group());
  const ambientLifeRef = useRef<AmbientLife | null>(null);
  
  useEffect(() => {
    if (!hostRef.current) return;

    const manager = new SceneManager(hostRef.current);
    sceneManagerRef.current = manager;
    buildingFactoryRef.current = new BuildingFactory();

    manager.worldGroup.add(terrainContainerRef.current);
    manager.worldGroup.add(decorContainerRef.current);
    manager.worldGroup.add(buildingsContainerRef.current);

    const { group: shipyard, updatable: shipyardUpdatable } = buildShipyard();
    const width = 32 * 2; // Hardcoded default for shipyard placement
    const depth = 32 * 2;
    shipyard.position.set(-width / 2 + 1, 0, -depth / 2 + 1);
    manager.worldGroup.add(shipyard);
    if (shipyardUpdatable) {
      manager.registerUpdatable(shipyardUpdatable);
    }

    const selectionManager = new SelectionManager(manager.camera, manager.scene, buildingsContainerRef.current, manager.renderer.domElement, manager.cameraControls);
    selectionManager.onSelect((id, pos) => {
      setSelectedProjectId(id);
      if (id && pos) {
        manager.cameraControls.focusOn(pos, 800);
      }
    });
    selectionManager.onDragEnd((projectId, elementId, position) => {
      // Create a custom event to notify PlaygroundControls
      const event = new CustomEvent('shipyard-drag-end', {
        detail: { projectId, elementId, position }
      });
      window.dispatchEvent(event);
    });
    manager.registerUpdatable(selectionManager);

    return () => {
      selectionManager.dispose();
      manager.unregisterUpdatable(selectionManager);
      manager.dispose();
      sceneManagerRef.current = null;
    };
  }, []);

  // Update layout (terrain, decor, ambient life)
  useEffect(() => {
    const manager = sceneManagerRef.current;
    if (!manager) return;

    terrainUpdatablesRef.current.forEach(u => manager.unregisterUpdatable(u));
    if (ambientLifeRef.current) {
      ambientLifeRef.current.dispose();
      manager.unregisterUpdatable(ambientLifeRef.current);
    }

    terrainContainerRef.current.clear();
    decorContainerRef.current.clear();

    const terrainBuilder = new TerrainBuilder(manager.scene);
    const { group: terrain, updatables: terrainUpdatables } = terrainBuilder.buildFromLayout(layout);
    terrainContainerRef.current.add(terrain);
    terrainUpdatables.forEach(u => manager.registerUpdatable(u));
    terrainUpdatablesRef.current = terrainUpdatables;

    const decorBuilder = new DecorBuilder(manager.scene);
    const decor = decorBuilder.placeDecor(layout);
    decorContainerRef.current.add(decor);

    const ambientLife = new AmbientLife(layout, manager.worldGroup);
    manager.registerUpdatable(ambientLife);
    ambientLifeRef.current = ambientLife;
    
  }, [layout]);

  const buildingFactoryRef = useRef<BuildingFactory>(new BuildingFactory());

  // Update buildings when projects prop changes
  useEffect(() => {
    const manager = sceneManagerRef.current;
    if (!manager) return;

    // Build new buildings
    const factory = buildingFactoryRef.current;
    const { group: buildingsGroup, updatables } = factory.createBuildings(projects, layout);
    
    // Unregister old updatables and register new ones
    buildingUpdatablesRef.current.forEach(u => manager.unregisterUpdatable(u));
    updatables.forEach(u => manager.registerUpdatable(u));
    buildingUpdatablesRef.current = updatables;
    
    // Replace the buildings in the container
    buildingsContainerRef.current.clear();
    buildingsContainerRef.current.add(buildingsGroup);

  }, [projects, layout]);


  const selectedProject = selectedProjectId ? projects.find(p => p.id === selectedProjectId) : null;

  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      <div className="canvas-host" ref={hostRef} style={{ width: "100%", height: "100%" }} aria-hidden="true" />
      {selectedProject && (
        <div style={{
          position: 'absolute',
          bottom: '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(255, 255, 255, 0.7)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          padding: '24px',
          borderRadius: '16px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.4)',
          width: '320px',
          pointerEvents: 'none',
          animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        }}>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: 700, color: '#1a1a1a' }}>
            {selectedProject.name}
          </h3>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            <span style={{ padding: '4px 8px', background: 'rgba(0,0,0,0.05)', borderRadius: '4px', fontSize: '12px', fontWeight: 600 }}>{selectedProject.stage.toUpperCase()}</span>
            <span style={{ padding: '4px 8px', background: 'rgba(0,0,0,0.05)', borderRadius: '4px', fontSize: '12px', fontWeight: 600 }}>{selectedProject.status.toUpperCase()}</span>
          </div>
          <p style={{ margin: 0, fontSize: '14px', color: '#666', lineHeight: 1.4 }}>
            This project is currently in the {selectedProject.stage} stage. The team is making great progress.
          </p>
        </div>
      )}
    </div>
  );
}
