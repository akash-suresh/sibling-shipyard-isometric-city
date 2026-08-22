import * as THREE from 'three';
import { MeshStandardNodeMaterial } from 'three/webgpu';
import { color, mx_noise_float, positionWorld, positionLocal, normalLocal, vec3, smoothstep, mix, float, time } from 'three/tsl';
import type { TownLayout } from '../layout/townLayout';
import { visualTokens } from '../../design/visualTokens';
import { createCrowdSystem } from './actors/CrowdSystem';

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

    // Procedural TSL Grass
    const grassMat = new MeshStandardNodeMaterial({ flatShading: true });
    const grassNoise = mx_noise_float(positionWorld.mul(0.4));
    grassMat.colorNode = mix(color(p.grassLight), color('#56a64b'), grassNoise); // Blend with slightly darker green
    
    const dirtMat = new THREE.MeshStandardMaterial({ color: p.soil });
    const roadMat = new THREE.MeshStandardMaterial({ color: p.road });
    const whiteMat = new THREE.MeshStandardMaterial({ color: p.roadMarking });
    
    // Procedural TSL Water (Flowing river with foam!)
    const waterMat = new MeshStandardNodeMaterial({ transparent: true, opacity: 0.9, flatShading: true });
    const t = time.mul(0.5); // time
    const waterNoise = mx_noise_float(positionWorld.mul(0.5).add(vec3(t, float(0), t)));
    const foam = smoothstep(0.7, 0.9, waterNoise);
    waterMat.colorNode = mix(color(p.water), color(0xffffff), foam.mul(0.5)); // White foam tips
    const elevation = waterNoise.mul(0.2);
    waterMat.positionNode = positionLocal.add(normalLocal.mul(elevation));
    waterMat.roughnessNode = float(0.1);

    const bridgeMat = new THREE.MeshStandardMaterial({ color: p.metal });
    const concreteMat = new THREE.MeshStandardMaterial({ color: p.plaza });

    const width = layout.width * CELL_SIZE;
    const depth = layout.height * CELL_SIZE;
    
    const islandMats = [dirtMat, dirtMat, grassMat as any, dirtMat, dirtMat, dirtMat];
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
          const waterGeo = new THREE.PlaneGeometry(CELL_SIZE, CELL_SIZE, 4, 4); // Subdivided for TSL vertex displacement
          const waterMesh = new THREE.Mesh(waterGeo, waterMat as any);
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
      const bGroup = new THREE.Group();
      bGroup.position.set(bridge.grid.x * CELL_SIZE, 0, bridge.grid.y * CELL_SIZE);
      
      const isX = bridge.axis === "x";
      
      const brickMat = new THREE.MeshStandardMaterial({ color: 0x7a3e3e, roughness: 0.9, flatShading: true });
      const roadMat = new THREE.MeshStandardMaterial({ color: 0x555555, flatShading: true });
      const steelMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.8, flatShading: true });

      for (let side of [-1, 1]) {
        const bankGroup = new THREE.Group();
        
        for (let zSide of [-1, 1]) {
           const base = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.4, 1.2), brickMat);
           base.position.set(side * 1.4, 0.2, zSide * 1.4);
           base.castShadow = true;
           bankGroup.add(base);

           const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.8, 3.8, 0.8), brickMat);
           pillar.position.set(side * 1.4, 2.3, zSide * 1.4);
           pillar.castShadow = true;
           bankGroup.add(pillar);

           const cap = new THREE.Mesh(new THREE.ConeGeometry(0.6, 1.2, 4), steelMat);
           cap.position.set(side * 1.4, 4.8, zSide * 1.4);
           cap.rotation.y = Math.PI / 4;
           bankGroup.add(cap);
        }

        const arch = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.8, 2.0), brickMat);
        arch.position.set(side * 1.4, 3.8, 0);
        arch.castShadow = true;
        bankGroup.add(arch);

        const basculeGroup = new THREE.Group();
        basculeGroup.position.set(side * 1.0, 0.1, 0); 
        
        const deck = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.2, CELL_SIZE), roadMat);
        deck.position.set(side * -0.55, 0, 0);
        deck.castShadow = true;
        basculeGroup.add(deck);

        const railG = new THREE.BoxGeometry(1.1, 0.4, 0.1);
        const r1 = new THREE.Mesh(railG, steelMat); r1.position.set(side * -0.55, 0.3, 0.95); basculeGroup.add(r1);
        const r2 = new THREE.Mesh(railG, steelMat); r2.position.set(side * -0.55, 0.3, -0.95); basculeGroup.add(r2);
        
        const cw = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.6, CELL_SIZE), steelMat);
        cw.position.set(side * 0.3, -0.2, 0);
        basculeGroup.add(cw);

        basculeGroup.rotation.z = side * Math.PI / 3; 
        bankGroup.add(basculeGroup);

        if (!isX) {
           bankGroup.rotation.y = Math.PI / 2;
        }
        bGroup.add(bankGroup);
      }
      group.add(bGroup);
    });

    // --- DIORAMA CRUST FOUNDATION ---
    const crustDepth = 1.5;
    const crustGeo = new THREE.BoxGeometry(width, crustDepth, depth);
    const crustMat = new THREE.MeshStandardMaterial({ color: p.rock, flatShading: true });
    const crustMesh = new THREE.Mesh(crustGeo, crustMat);
    crustMesh.position.set(width / 2 - CELL_SIZE / 2, -2 - crustDepth / 2, depth / 2 - CELL_SIZE / 2);
    group.add(crustMesh);

    // --- WATER ANIMATION ---
    updatables.push({
      update(delta: number, time: number) {
        // Handled by TSL
      }
    });

    group.position.set(-width / 2 + CELL_SIZE / 2, 0, -depth / 2 + CELL_SIZE / 2);

    return { group, updatables };
  }
}
