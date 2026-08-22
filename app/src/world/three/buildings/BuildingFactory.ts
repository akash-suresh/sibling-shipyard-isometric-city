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

      const wrapperGroup = new THREE.Group();
      // Center of a 4x4 cell grid area starting at project.grid
      wrapperGroup.position.set(project.grid.x * CELL_SIZE + 4, 0, project.grid.y * CELL_SIZE + 4);
      wrapperGroup.userData = { projectId: project.id, projectName: project.name };

      if (project.building.archetype === 'workshop') {
        result = buildWorkshop(config);
        result.group.scale.set(0.6, 0.6, 0.6); 
      } else if (project.building.archetype === 'studio') {
        result = buildStudio(config);
        result.group.scale.set(1.0, 1.0, 1.0); // Exactly 8x8 units (4x4 cells)
      } else if (project.building.archetype === 'tower') {
        result = buildTower(config);
        result.group.scale.set(1.333, 1.333, 1.333); // 6x6 * 1.333 = 8x8 units (4x4 cells)
      } else {
        return;
      }

      wrapperGroup.add(result.group);
      
      const roofSign = createBuildingSign(project, false);
      roofSign.scale.set(0.18, 0.18, 0.18); // Much bigger roof logo!
      roofSign.rotation.y = Math.PI / 4;
      
      const groundSign = createBuildingSign(project, true); // Force text on grass
      groundSign.scale.set(0.08, 0.08, 0.08); 
      
      if (project.building.archetype === 'workshop') {
        roofSign.position.set(0, 7.5, -2); // Relative to wrapper origin
        groundSign.position.set(2, 0.6, 3.5); 
        roofSign.userData = { revealStart: 0.8, revealEnd: 0.9, baseScale: roofSign.scale.clone() };
        roofSign.scale.setScalar(0);
        wrapperGroup.add(roofSign);
      } else if (project.building.archetype === 'studio') {
        if (!project.logo) {
          roofSign.position.set(0, 5.0, 0); 
          roofSign.userData = { revealStart: 0.8, revealEnd: 0.9, baseScale: roofSign.scale.clone() };
          roofSign.scale.setScalar(0);
          wrapperGroup.add(roofSign);
        }
        
        // Move ground sign to the front center
        groundSign.position.set(0, 0.6, 3.5);
      } else if (project.building.archetype === 'tower') {
        roofSign.position.set(0, 13.5, 0); // Need to account for tower's unscaled height
        // Move ground sign to the front right, away from the building core
        groundSign.position.set(2.5, 0.6, 3.5); 
        roofSign.userData = { revealStart: 0.9, revealEnd: 1.0, baseScale: roofSign.scale.clone() };
        roofSign.scale.setScalar(0);
        wrapperGroup.add(roofSign);
      }
      
      wrapperGroup.add(groundSign);

      const buildingUpdatables: Updatable[] = [];
      const statusUpdatables = applyStatusEffects(wrapperGroup, project.status);
      buildingUpdatables.push(...statusUpdatables);

      const stageUpdatables = applyStageEffects(wrapperGroup, project.stage);
      buildingUpdatables.push(...stageUpdatables);
      if (result.updatable) {
        buildingUpdatables.push(result.updatable);
      }

      this.cache.set(project.id, {
        group: wrapperGroup,
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
