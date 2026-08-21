import * as THREE from 'three';
import type { TownLayout } from '../layout/townLayout';
import { visualTokens } from '../../design/visualTokens';

export const CELL_SIZE = 2;

export class TerrainBuilder {
  scene: THREE.Scene;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  buildFromLayout(layout: TownLayout): { group: THREE.Group, updatables: any[] } {
    const group = new THREE.Group();
    const updatables: any[] = [];
    const p = visualTokens.palette;

    const grassMat = new THREE.MeshLambertMaterial({ color: p.grassLight });
    const dirtMat = new THREE.MeshLambertMaterial({ color: p.soil });
    const roadMat = new THREE.MeshLambertMaterial({ color: p.road });
    const whiteMat = new THREE.MeshLambertMaterial({ color: p.roadMarking });
    
    // Solid, stylized water block
    const waterMat = new THREE.MeshLambertMaterial({ color: p.water });

    const bridgeMat = new THREE.MeshLambertMaterial({ color: p.metal });
    const concreteMat = new THREE.MeshLambertMaterial({ color: p.plaza });

    const width = layout.width * CELL_SIZE;
    const depth = layout.height * CELL_SIZE;
    
    const islandMats = [dirtMat, dirtMat, grassMat, dirtMat, dirtMat, dirtMat];
    const terrainGeo = new THREE.BoxGeometry(CELL_SIZE, 2, CELL_SIZE);
    
    const waterMeshes: { mesh: THREE.Mesh, ix: number, iy: number }[] = [];
    
    const roadSet = new Set(layout.roads.map(p => `${p.x},${p.y}`));
    const waterSet = new Set(layout.water.map(p => `${p.x},${p.y}`));
    const plazaSet = new Set(layout.plazas.map(p => `${p.x},${p.y}`));
    const pathSet = new Set(layout.paths.map(p => `${p.x},${p.y}`));

    for (let x = 0; x < layout.width; x++) {
      for (let y = 0; y < layout.height; y++) {
        const key = `${x},${y}`;
        const worldX = x * CELL_SIZE;
        const worldZ = y * CELL_SIZE;

        if (waterSet.has(key)) {
          const waterGeo = new THREE.PlaneGeometry(CELL_SIZE, CELL_SIZE);
          const waterMesh = new THREE.Mesh(waterGeo, waterMat);
          waterMesh.rotation.x = -Math.PI / 2;
          waterMesh.position.set(worldX, -0.2, worldZ);
          waterMesh.receiveShadow = true;
          group.add(waterMesh);
          waterMeshes.push({ mesh: waterMesh, ix: x, iy: y });
          
          const dirtMesh = new THREE.Mesh(new THREE.BoxGeometry(CELL_SIZE, 1, CELL_SIZE), dirtMat);
          dirtMesh.position.set(worldX, -1.5, worldZ);
          dirtMesh.receiveShadow = true;
          group.add(dirtMesh);
        } else {
          const cellMesh = new THREE.Mesh(terrainGeo, islandMats);
          cellMesh.position.set(worldX, -1, worldZ);
          cellMesh.receiveShadow = true;
          cellMesh.castShadow = true;
          group.add(cellMesh);
        }

        if (roadSet.has(key)) {
          const roadMesh = new THREE.Mesh(new THREE.BoxGeometry(CELL_SIZE, 0.05, CELL_SIZE), roadMat);
          roadMesh.position.set(worldX, 0.025, worldZ);
          roadMesh.receiveShadow = true;
          group.add(roadMesh);
          
          const dash = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.02, CELL_SIZE * 0.4), whiteMat);
          dash.position.set(worldX, 0.06, worldZ);
          group.add(dash);
        }
        
        if (plazaSet.has(key)) {
          const plazaMesh = new THREE.Mesh(new THREE.BoxGeometry(CELL_SIZE, 0.05, CELL_SIZE), concreteMat);
          plazaMesh.position.set(worldX, 0.025, worldZ);
          plazaMesh.receiveShadow = true;
          group.add(plazaMesh);
        }

        if (pathSet.has(key)) {
          const pathMesh = new THREE.Mesh(new THREE.BoxGeometry(CELL_SIZE * 0.8, 0.08, CELL_SIZE * 0.8), concreteMat);
          pathMesh.position.set(worldX, 0.04, worldZ);
          pathMesh.receiveShadow = true;
          group.add(pathMesh);
        }
      }
    }

    layout.bridges.forEach(bridge => {
      const bridgeMesh = new THREE.Mesh(new THREE.BoxGeometry(CELL_SIZE, 0.2, CELL_SIZE), bridgeMat);
      bridgeMesh.position.set(bridge.grid.x * CELL_SIZE, 0.1, bridge.grid.y * CELL_SIZE);
      bridgeMesh.castShadow = true;
      bridgeMesh.receiveShadow = true;
      group.add(bridgeMesh);
    });

    // --- DIORAMA CRUST FOUNDATION ---
    const crustDepth = 4;
    const crustGeo = new THREE.BoxGeometry(width, crustDepth, depth);
    const crustMat = new THREE.MeshLambertMaterial({ color: p.rock, flatShading: true });
    const crustMesh = new THREE.Mesh(crustGeo, crustMat);
    crustMesh.position.set(width / 2 - CELL_SIZE / 2, -2 - crustDepth / 2, depth / 2 - CELL_SIZE / 2);
    group.add(crustMesh);

    // --- WATER ANIMATION ---
    updatables.push({
      update(delta: number, time: number) {
        waterMeshes.forEach(w => {
          // Choppy stylized wave effect
          const offset = Math.sin(time * 2 + w.ix * 0.5 + w.iy * 0.5) * 0.05;
          w.mesh.position.y = -0.2 + offset;
          
          // Slight tilt
          w.mesh.rotation.x = -Math.PI / 2 + Math.cos(time * 1.5 + w.ix * 0.3) * 0.02;
          w.mesh.rotation.y = Math.sin(time * 1.2 + w.iy * 0.4) * 0.02;
        });
      }
    });

    group.position.set(-width / 2 + CELL_SIZE / 2, 0, -depth / 2 + CELL_SIZE / 2);

    return { group, updatables };
  }
}
