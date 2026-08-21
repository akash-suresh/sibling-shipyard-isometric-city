import * as THREE from 'three';
import type { ProjectDefinition } from '../../../data/types';
import type { TownLayout } from '../../layout/townLayout';
import { CELL_SIZE } from '../TerrainBuilder';
import { buildWorkshop, type BuildingResult } from './WorkshopBuilder';
import { buildStudio } from './StudioBuilder';
import { buildTower } from './TowerBuilder';
import type { Updatable } from '../SceneManager';
import { applyStatusEffects } from '../effects/StatusEffects';
import { applyStageEffects } from '../effects/StageEffects';
import { createBuildingSign } from './BuildingSign';

export class BuildingFactory {
  createBuildings(projects: ProjectDefinition[], layout: TownLayout): { group: THREE.Group, updatables: Updatable[] } {
    const group = new THREE.Group();
    const updatables: Updatable[] = [];

    projects.forEach(project => {
      let result: BuildingResult;

      const config = {
        name: project.name,
        modules: project.building.modules,
        roof: project.building.roof,
        accent: project.building.accent,
        status: project.status
      };

      if (project.building.archetype === 'workshop') {
        result = buildWorkshop(config);
        result.group.scale.set(0.6, 0.6, 0.6); // Sprawling, but fills plot
      } else if (project.building.archetype === 'studio') {
        result = buildStudio(config);
        result.group.scale.set(0.75, 0.75, 0.75); // Medium office
      } else if (project.building.archetype === 'tower') {
        result = buildTower(config);
        result.group.scale.set(1.0, 1.0, 1.0); // Tall imposing tower
      } else {
        return;
      }

      result.group.position.set(project.grid.x * CELL_SIZE, 0, project.grid.y * CELL_SIZE);
      result.group.userData = { projectId: project.id, projectName: project.name };
      
      // Add Roof Sign (Iteration 12)
      const roofSign = createBuildingSign(project);
      roofSign.scale.set(0.1, 0.1, 0.1);
      roofSign.rotation.y = Math.PI / 4;
      
      // Add Ground Sign (Iteration 13)
      const groundSign = roofSign.clone();
      groundSign.scale.set(0.08, 0.08, 0.08); // slightly smaller for ground
      
      // Archetype specific sign placement
      if (project.building.archetype === 'workshop') {
        roofSign.position.set(0, 4.5, 0);
        groundSign.position.set(2, 0.5, 2);
      } else if (project.building.archetype === 'studio') {
        roofSign.position.set(0, 5, 0);
        groundSign.position.set(5, 0.5, 5);
      } else if (project.building.archetype === 'tower') {
        roofSign.position.set(0, 8, 0);
        groundSign.position.set(3, 0.5, 3);
      }
      
      result.group.add(roofSign);
      result.group.add(groundSign);

      group.add(result.group);

      const statusUpdatables = applyStatusEffects(result.group, project.status);
      updatables.push(...statusUpdatables);

      const stageUpdatables = applyStageEffects(result.group, project.stage);
      updatables.push(...stageUpdatables);
      if (result.updatable) {
        updatables.push(result.updatable);
      }

      // Add Growth Animation
      let targetScaleX = 1;
      let targetScaleY = 1;
      let targetScaleZ = 1;
      
      if (project.building.archetype === 'workshop') {
        targetScaleX = targetScaleY = targetScaleZ = 2.5; // Massively chunky
      } else if (project.building.archetype === 'studio') {
        targetScaleX = targetScaleY = targetScaleZ = 2.5; 
      } else if (project.building.archetype === 'tower') {
        targetScaleX = targetScaleY = targetScaleZ = 3.2; // Massive tower
      }

      result.group.scale.set(0, 0, 0); // Start tiny

      updatables.push({
        update(delta: number, time: number) {
          if (time > 1.5) {
            result.group.scale.set(targetScaleX, targetScaleY, targetScaleZ);
            return;
          }
          // Elastic ease out
          const t = time / 1.5;
          const p = 0.3;
          let ease = 1;
          if (t === 0) ease = 0;
          else if (t < 1) {
            ease = Math.pow(2, -10 * t) * Math.sin((t - p / 4) * (2 * Math.PI) / p) + 1;
          }
          
          result.group.scale.set(
            targetScaleX * ease,
            targetScaleY * ease,
            targetScaleZ * ease
          );
        }
      });
    });

    const width = layout.width * CELL_SIZE;
    const depth = layout.height * CELL_SIZE;
    group.position.set(-width / 2 + CELL_SIZE / 2, 0, -depth / 2 + CELL_SIZE / 2);

    return { group, updatables };
  }
}
