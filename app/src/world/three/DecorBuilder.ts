import * as THREE from 'three';
import type { TownLayout } from '../layout/townLayout';
import { CELL_SIZE } from './TerrainBuilder';
import { visualTokens } from '../../design/visualTokens';
import { createVoxelText } from './utils/VoxelText';

export class DecorBuilder {
  scene: THREE.Scene;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  placeDecor(layout: TownLayout): THREE.Group {
    const group = new THREE.Group();
    const p = visualTokens.palette;

    const dirtMat = new THREE.MeshLambertMaterial({ color: p.soil, flatShading: true });
    const grassMat = new THREE.MeshLambertMaterial({ color: p.hedge, flatShading: true });
    const poleMat = new THREE.MeshLambertMaterial({ color: p.metal, flatShading: true });
    const lampMat = new THREE.MeshLambertMaterial({ color: p.activeLight, emissive: p.activeLight, emissiveIntensity: 1, flatShading: true });
    const woodMat = new THREE.MeshLambertMaterial({ color: p.soil, flatShading: true });
    const shrubMat = new THREE.MeshLambertMaterial({ color: p.hedgeShadow, flatShading: true });
    const flowerMat = new THREE.MeshLambertMaterial({ color: 0xE91E63, flatShading: true });
    const signMat = new THREE.MeshLambertMaterial({ color: p.water, flatShading: true });

    layout.decor.forEach(decor => {
      const worldX = decor.grid.x * CELL_SIZE + (decor.offset?.x || 0) * 0.02;
      const worldZ = decor.grid.y * CELL_SIZE + (decor.offset?.y || 0) * 0.02;

      const mesh = new THREE.Group();
      mesh.position.set(worldX, 0, worldZ);

      switch (decor.kind) {
        case "tree": {
          const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.2, 1), dirtMat);
          trunk.position.y = 0.5;
          trunk.castShadow = true;
          mesh.add(trunk);

          const canopy = new THREE.Mesh(new THREE.SphereGeometry(0.6, 8, 8), grassMat);
          canopy.position.y = 1.25;
          canopy.castShadow = true;
          mesh.add(canopy);
          break;
        }
        case "lamp": {
          const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.5), poleMat);
          pole.position.y = 0.75;
          pole.castShadow = true;
          mesh.add(pole);

          const light = new THREE.Mesh(new THREE.SphereGeometry(0.15), lampMat);
          light.position.y = 1.6;
          mesh.add(light);
          break;
        }
        case "bench": {
          const seat = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.1, 0.4), woodMat);
          seat.position.y = 0.2;
          seat.castShadow = true;
          mesh.add(seat);

          const back = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.4, 0.1), woodMat);
          back.position.set(0, 0.45, -0.15);
          back.castShadow = true;
          mesh.add(back);
          break;
        }
        case "shrub": {
          const shrub = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 8), shrubMat);
          shrub.position.y = 0.3;
          shrub.castShadow = true;
          mesh.add(shrub);
          break;
        }
        case "flowers": {
          for (let i = 0; i < 3; i++) {
            const flower = new THREE.Mesh(new THREE.SphereGeometry(0.05), flowerMat);
            flower.position.set((Math.random() - 0.5) * 0.4, 0.05, (Math.random() - 0.5) * 0.4);
            mesh.add(flower);
          }
          break;
        }
        case "sign": {
          const post = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.6), poleMat);
          post.position.y = 0.3;
          post.castShadow = true;
          mesh.add(post);

          const board = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.3, 0.05), signMat);
          board.position.set(0, 0.6, 0.03);
          board.castShadow = true;
          mesh.add(board);
          break;
        }
      }

      group.add(mesh);
    });

    // --- SIBLING SHIPYARD MONUMENT ---
    const monumentGroup = new THREE.Group();
    
    // Create text
    const textMat = new THREE.MeshLambertMaterial({ color: p.nexus, flatShading: true });
    const line1 = createVoxelText("SIBLING", textMat, { letterSpacing: 1 });
    const line2 = createVoxelText("SHIPYARD", textMat, { letterSpacing: 1 });
    
    // Position lines relative to each default voxel size
    // Voxel height is 5
    line1.position.set(0, 7, 0);
    line2.position.set(0, 0, 0);
    
    // Center the text group
    const line1Width = 7 * 5; // approx 7 chars * (4 + 1 spacing)
    const line2Width = 8 * 5; // approx 8 chars * 5
    line1.position.x = -line1Width / 2;
    line2.position.x = -line2Width / 2;

    monumentGroup.add(line1, line2);

    // Scale down to fit the plaza (increased to make it massive)
    monumentGroup.scale.set(0.4, 0.4, 0.4);

    // Give it a sleek base
    const baseGeo = new THREE.BoxGeometry(7, 0.5, 2.5);
    const baseMat = new THREE.MeshLambertMaterial({ color: p.metal, flatShading: true });
    const baseMesh = new THREE.Mesh(baseGeo, baseMat);
    baseMesh.position.y = 0.25;
    baseMesh.castShadow = true;
    monumentGroup.add(baseMesh);

    // Ensure text casts shadows
    monumentGroup.traverse(child => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    // Position monument in the center of the 5x5 plaza (9, 8)
    const plazaCenterX = 9 * CELL_SIZE;
    const plazaCenterZ = 8 * CELL_SIZE;
    monumentGroup.position.set(plazaCenterX, 0, plazaCenterZ);
    // Rotate to face the camera (isometric camera looks from bottom right)
    monumentGroup.rotation.y = Math.PI / 4;
    group.add(monumentGroup);

    const width = layout.width * CELL_SIZE;
    const depth = layout.height * CELL_SIZE;
    group.position.set(-width / 2 + CELL_SIZE / 2, 0, -depth / 2 + CELL_SIZE / 2);

    return group;
  }
}
