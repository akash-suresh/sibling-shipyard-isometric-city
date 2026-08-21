import * as THREE from "three";
import { useEffect, useRef } from "react";
import { SceneManager, type Updatable } from "./three/SceneManager";
import { buildWorkshop } from "./three/buildings/WorkshopBuilder";
import { buildStudio } from "./three/buildings/StudioBuilder";
import { buildTower } from "./three/buildings/TowerBuilder";
import { applyStatusEffects } from "./three/effects/StatusEffects";
import { applyStageEffects } from "./three/effects/StageEffects";
import type {
  BuildingArchetype,
  ProjectStage,
  ProjectStatus,
} from "../data/types";

interface PlaygroundCanvasProps {
  archetype: BuildingArchetype;
  stage: ProjectStage;
  status: ProjectStatus;
  accent: string;
}

export function PlaygroundCanvas({
  archetype,
  stage,
  status,
  accent,
}: PlaygroundCanvasProps) {
  const host = useRef<HTMLDivElement>(null);
  const sceneManagerRef = useRef<SceneManager | null>(null);
  const updatablesRef = useRef<Updatable[]>([]);

  useEffect(() => {
    if (!host.current) return;
    const mount = host.current;

    const sm = new SceneManager(mount);
    sceneManagerRef.current = sm;

    // Place a small patch of terrain (e.g. 4x4 grass/concrete BoxGeometry)
    const terrainGeo = new THREE.BoxGeometry(4, 0.5, 4);
    const terrainMat = new THREE.MeshStandardMaterial({ color: 0x88aa66 });
    const terrain = new THREE.Mesh(terrainGeo, terrainMat);
    terrain.position.y = -0.25;
    terrain.receiveShadow = true;
    sm.worldGroup.add(terrain);

    return () => {
      sm.dispose();
      sceneManagerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const sm = sceneManagerRef.current;
    if (!sm) return;

    // Clean up previous building and updatables
    const childrenToRemove = sm.worldGroup.children.filter(
      (child) => child.name === "playground-building"
    );
    childrenToRemove.forEach((child) => sm.worldGroup.remove(child));

    updatablesRef.current.forEach((u) => sm.unregisterUpdatable(u));
    updatablesRef.current = [];

    const config = {
      name: "Playground",
      accent: accent,
      status: status,
      stage: stage,
    };

    let result;
    if (archetype === "workshop") {
      result = buildWorkshop(config);
      result.group.scale.set(0.6, 0.6, 0.6);
    } else if (archetype === "studio") {
      result = buildStudio(config);
      result.group.scale.set(0.75, 0.75, 0.75);
    } else if (archetype === "tower") {
      result = buildTower(config);
      result.group.scale.set(1.0, 1.0, 1.0);
    } else {
      return;
    }

    result.group.name = "playground-building";
    result.group.position.set(0, 0, 0);

    sm.worldGroup.add(result.group);

    const updatables: Updatable[] = [];
    if (result.updatable) {
      updatables.push(result.updatable);
    }

    const statusUpdatables = applyStatusEffects(result.group, status);
    updatables.push(...statusUpdatables);

    const stageUpdatables = applyStageEffects(result.group, stage);
    updatables.push(...stageUpdatables);

    updatables.forEach((u) => sm.registerUpdatable(u));
    updatablesRef.current = updatables;

  }, [archetype, stage, status, accent]);

  return <div className="canvas-host" ref={host} style={{ width: "100%", height: "100%" }} aria-hidden="true" />;
}
