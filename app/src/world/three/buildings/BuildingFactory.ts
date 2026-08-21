import * as THREE from 'three';
import type { ProjectDefinition } from '../../../data/types';
import type { TownLayout } from '../../layout/townLayout';
import { CELL_SIZE } from '../TerrainBuilder';
import { buildWorkshop, type BuildingResult as WorkshopResult } from './WorkshopBuilder';
import { buildStudio } from './StudioBuilder';
import { buildTower, type BuildingResult } from './TowerBuilder';
import type { Updatable } from '../SceneManager';
import { applyStatusEffects } from '../effects/StatusEffects';
import { applyStageEffects } from '../effects/StageEffects';
import { createBuildingSign } from './BuildingSign';

export class BuildingFactory {
  private cache = new Map<string, { group: THREE.Group, updatables: Updatable[], result: BuildingResult, archetype: string }>();

  createBuildings(projects: ProjectDefinition[], layout: TownLayout): { group: THREE.Group, updatables: Updatable[], newUpdatables: Updatable[], removedUpdatables: Updatable[] } {
    const group = new THREE.Group();
    const updatables: Updatable[] = [];
    const newUpdatables: Updatable[] = [];
    const removedUpdatables: Updatable[] = [];

    const currentIds = new Set<string>();

    projects.forEach(project => {
      currentIds.add(project.id);
      const cached = this.cache.get(project.id);

      // If it exists and hasn't changed archetype, update it!
      if (cached && cached.archetype === project.building.archetype) {
        // Update its position
        cached.group.position.set(project.grid.x * CELL_SIZE, 0, project.grid.y * CELL_SIZE);
        
        // Update its internal stage if it supports it
        if (cached.result.updatable && (cached.result.updatable as any).setStage) {
          (cached.result.updatable as any).setStage(project.stage);
        }
        
        group.add(cached.group);
        updatables.push(...cached.updatables);
        return;
      }

      // Otherwise, build it from scratch
      if (cached) {
        removedUpdatables.push(...cached.updatables);
      }

      let result: any;
      const config = {
        name: project.name,
        accent: project.building.accent,
        status: project.status,
        stage: project.stage,
        logo: project.logo // Pass logo for builders to use!
      };

      if (project.building.archetype === 'workshop') {
        result = buildWorkshop(config);
        result.group.scale.set(0.6, 0.6, 0.6); 
      } else if (project.building.archetype === 'studio') {
        result = buildStudio(config);
        result.group.scale.set(1.2, 1.2, 1.2);
      } else if (project.building.archetype === 'tower') {
        result = buildTower(config);
        result.group.scale.set(1.4, 1.4, 1.4); // Made tower 40% bigger!
      } else {
        return;
      }

      result.group.position.set(project.grid.x * CELL_SIZE, 0, project.grid.y * CELL_SIZE);
      result.group.userData = { projectId: project.id, projectName: project.name };
      
      const roofSign = createBuildingSign(project, false);
      roofSign.scale.set(0.18, 0.18, 0.18); // Much bigger roof logo!
      roofSign.rotation.y = Math.PI / 4;
      
      const groundSign = createBuildingSign(project, true); // Force text on grass
      groundSign.scale.set(0.08, 0.08, 0.08); 
      
      if (project.building.archetype === 'workshop') {
        roofSign.position.set(0, 4.5, 0);
        groundSign.position.set(2, 0.6, 3.5);
        roofSign.userData = { revealStart: 0.8, revealEnd: 0.9, baseScale: roofSign.scale.clone() };
        roofSign.scale.setScalar(0);
        result.group.add(roofSign);
      } else if (project.building.archetype === 'studio') {
        // Skip adding the billboard if a logo is provided; the Studio paints it on its terrace!
        if (!project.logo) {
          roofSign.position.set(0, 6.0, 0);
          roofSign.userData = { revealStart: 0.8, revealEnd: 0.9, baseScale: roofSign.scale.clone() };
          roofSign.scale.setScalar(0);
          result.group.add(roofSign);
        }
        // Move ground sign ahead of the footpath, onto the grass
        groundSign.position.set(4.0, 0.6, 7.0);
      } else if (project.building.archetype === 'tower') {
        roofSign.position.set(0, 9.5, 0);
        // Move ground sign further to the front (+Z and +X) into the grass
        groundSign.position.set(4.5, 0.6, 4.5); 
        roofSign.userData = { revealStart: 0.9, revealEnd: 1.0, baseScale: roofSign.scale.clone() };
        roofSign.scale.setScalar(0);
        result.group.add(roofSign);
      }
      
      result.group.add(groundSign);

      const buildingUpdatables: Updatable[] = [];
      const statusUpdatables = applyStatusEffects(result.group, project.status);
      buildingUpdatables.push(...statusUpdatables);

      const stageUpdatables = applyStageEffects(result.group, project.stage);
      buildingUpdatables.push(...stageUpdatables);
      if (result.updatable) {
        buildingUpdatables.push(result.updatable);
      }

      this.cache.set(project.id, {
        group: result.group,
        updatables: buildingUpdatables,
        result: result,
        archetype: project.building.archetype
      });

      group.add(result.group);
      updatables.push(...buildingUpdatables);
      newUpdatables.push(...buildingUpdatables);
    });

    const width = layout.width * CELL_SIZE;
    const depth = layout.height * CELL_SIZE;
    group.position.set(-width / 2 + CELL_SIZE / 2, 0, -depth / 2 + CELL_SIZE / 2);

    return { group, updatables, newUpdatables, removedUpdatables };
  }
}
