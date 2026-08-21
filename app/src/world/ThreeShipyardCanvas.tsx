import { useEffect, useRef } from "react";
import { SceneManager } from "./three/SceneManager";
import { TerrainBuilder } from "./three/TerrainBuilder";
import { DecorBuilder } from "./three/DecorBuilder";
import { shipyardZeroLayout } from "./layout/townLayout";
import { BuildingFactory } from "./three/buildings/BuildingFactory";
import type { ProjectDefinition } from "../data/types";
import { AmbientLife } from "./three/actors/AmbientLife";
import { SelectionManager } from "./three/interaction/SelectionManager";

export function ThreeShipyardCanvas({ projects }: { projects: ProjectDefinition[] }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const sceneManagerRef = useRef<SceneManager | null>(null);

  useEffect(() => {
    if (!hostRef.current) return;

    const manager = new SceneManager(hostRef.current);
    sceneManagerRef.current = manager;

    const terrainBuilder = new TerrainBuilder(manager.scene);
    const { group: terrain, updatables: terrainUpdatables } = terrainBuilder.buildFromLayout(shipyardZeroLayout);
    manager.worldGroup.add(terrain);
    terrainUpdatables.forEach(u => manager.registerUpdatable(u));

    const decorBuilder = new DecorBuilder(manager.scene);
    const decor = decorBuilder.placeDecor(shipyardZeroLayout);
    manager.worldGroup.add(decor);

    const buildingFactory = new BuildingFactory();
    const { group: buildingsGroup, updatables } = buildingFactory.createBuildings(projects, shipyardZeroLayout);
    manager.worldGroup.add(buildingsGroup);

    updatables.forEach(u => manager.registerUpdatable(u));

    const ambientLife = new AmbientLife(shipyardZeroLayout, manager.worldGroup);
    manager.registerUpdatable(ambientLife);

    const selectionManager = new SelectionManager(manager.camera, manager.scene, buildingsGroup, manager.renderer.domElement);
    selectionManager.onSelect((id) => console.log('Selected:', id));
    manager.registerUpdatable(selectionManager);

    return () => {
      selectionManager.dispose();
      ambientLife.dispose();
      manager.unregisterUpdatable(selectionManager);
      manager.unregisterUpdatable(ambientLife);
      updatables.forEach(u => manager.unregisterUpdatable(u));
      terrainUpdatables.forEach(u => manager.unregisterUpdatable(u));
      manager.dispose();
      sceneManagerRef.current = null;
    };
  }, []);

  return <div className="canvas-host" ref={hostRef} style={{ width: "100%", height: "100%" }} aria-hidden="true" />;
}
