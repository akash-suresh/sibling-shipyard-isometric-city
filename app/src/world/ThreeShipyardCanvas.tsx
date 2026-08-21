import * as THREE from "three";
import { useEffect, useRef, useState } from "react";
import { SceneManager } from "./three/SceneManager";
import { TerrainBuilder } from "./three/TerrainBuilder";
import { DecorBuilder } from "./three/DecorBuilder";
import { shipyardZeroLayout } from "./layout/townLayout";
import { BuildingFactory } from "./three/buildings/BuildingFactory";
import type { ProjectDefinition } from "../data/types";
import { AmbientLife } from "./three/actors/AmbientLife";
import { SelectionManager } from "./three/interaction/SelectionManager";

export function ThreeShipyardCanvas({ 
  projects, 
  isNightMode = false,
  globalProgress
}: { 
  projects: ProjectDefinition[], 
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

  useEffect(() => {
    if (!hostRef.current) return;

    const manager = new SceneManager(hostRef.current);
    sceneManagerRef.current = manager;
    buildingFactoryRef.current = new BuildingFactory();

    const terrainBuilder = new TerrainBuilder(manager.scene);
    const { group: terrain, updatables: terrainUpdatables } = terrainBuilder.buildFromLayout(shipyardZeroLayout);
    manager.worldGroup.add(terrain);
    terrainUpdatables.forEach(u => manager.registerUpdatable(u));

    const decorBuilder = new DecorBuilder(manager.scene);
    const decor = decorBuilder.placeDecor(shipyardZeroLayout);
    manager.worldGroup.add(decor);

    manager.worldGroup.add(buildingsContainerRef.current);

    const ambientLife = new AmbientLife(shipyardZeroLayout, manager.worldGroup);
    manager.registerUpdatable(ambientLife);

    const selectionManager = new SelectionManager(manager.camera, manager.scene, buildingsContainerRef.current, manager.renderer.domElement);
    selectionManager.onSelect((id, pos) => {
      setSelectedProjectId(id);
      if (id && pos) {
        manager.cameraControls.focusOn(pos, 800); // 800ms tween
      }
    });
    manager.registerUpdatable(selectionManager);

    return () => {
      selectionManager.dispose();
      ambientLife.dispose();
      manager.unregisterUpdatable(selectionManager);
      manager.unregisterUpdatable(ambientLife);
      terrainUpdatables.forEach(u => manager.unregisterUpdatable(u));
      manager.dispose();
      sceneManagerRef.current = null;
    };
  }, []);

  const buildingFactoryRef = useRef<BuildingFactory>(new BuildingFactory());

  // Update buildings when projects prop changes
  useEffect(() => {
    const manager = sceneManagerRef.current;
    if (!manager) return;

    // Build new buildings
    const factory = buildingFactoryRef.current;
    const { group: buildingsGroup, updatables } = factory.createBuildings(projects, shipyardZeroLayout);
    
    // Unregister old updatables and register new ones
    buildingUpdatablesRef.current.forEach(u => manager.unregisterUpdatable(u));
    updatables.forEach(u => manager.registerUpdatable(u));
    buildingUpdatablesRef.current = updatables;
    
    // Replace the buildings in the container
    buildingsContainerRef.current.clear();
    buildingsContainerRef.current.add(buildingsGroup);

  }, [projects]);


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
