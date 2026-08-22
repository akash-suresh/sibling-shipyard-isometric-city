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
      
      const whitePaintMat = new THREE.MeshStandardMaterial({ color: 0xeeeeee, roughness: 0.8, flatShading: true });
      const roadMat = new THREE.MeshStandardMaterial({ color: 0x555555, flatShading: true });
      const steelMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.8, flatShading: true });
      const brickMat = new THREE.MeshStandardMaterial({ color: 0x7a3e3e, roughness: 0.9 });

      for (let side of [-1, 1]) {
        const bankGroup = new THREE.Group();
        const rotAngle = side * -Math.PI / 3.5; // Open angle
        
        // Brick abutments on the banks
        const abutment = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.4, 2.8), brickMat);
        abutment.position.set(side * 1.6, 0.2, 0);
        bankGroup.add(abutment);

        // Vertical Posts (Hameistijlen)
        for (let zSide of [-1, 1]) {
           const post = new THREE.Mesh(new THREE.BoxGeometry(0.25, 3.2, 0.25), whitePaintMat);
           post.position.set(side * 1.2, 1.8, zSide * 1.2);
           post.castShadow = true;
           bankGroup.add(post);
           
           const base = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.4), whitePaintMat);
           base.position.set(side * 1.2, 0.4, zSide * 1.2);
           bankGroup.add(base);
        }

        // Top cross beam
        const topBeam = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.25, 2.6), whitePaintMat);
        topBeam.position.set(side * 1.2, 3.3, 0);
        bankGroup.add(topBeam);

        // Deck (Val)
        const deckGroup = new THREE.Group();
        deckGroup.position.set(side * 1.0, 0.2, 0); 

        const deck = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.15, CELL_SIZE), roadMat);
        deck.position.set(side * -0.6, 0, 0); 
        deck.castShadow = true;
        deckGroup.add(deck);

        const railG = new THREE.BoxGeometry(1.2, 0.2, 0.05);
        const r1 = new THREE.Mesh(railG, whitePaintMat); r1.position.set(side * -0.6, 0.15, 0.95); deckGroup.add(r1);
        const r2 = new THREE.Mesh(railG, whitePaintMat); r2.position.set(side * -0.6, 0.15, -0.95); deckGroup.add(r2);
        
        deckGroup.rotation.z = rotAngle;
        bankGroup.add(deckGroup);

        // Balance Mechanism (Balans)
        const balansGroup = new THREE.Group();
        balansGroup.position.set(side * 1.2, 3.4, 0); // Pivots on top beam
        
        const beamGeo = new THREE.BoxGeometry(2.4, 0.2, 0.15); 
        const arm1 = new THREE.Mesh(beamGeo, whitePaintMat);
        arm1.position.set(side * -0.2, 0, 1.2); 
        balansGroup.add(arm1);
        const arm2 = new THREE.Mesh(beamGeo, whitePaintMat);
        arm2.position.set(side * -0.2, 0, -1.2);
        balansGroup.add(arm2);

        // Counterweight (Ballastkist)
        const cw = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.6, 2.6), whitePaintMat);
        cw.position.set(side * 1.0, -0.3, 0); // Heavy box at the back
        balansGroup.add(cw);

        // Hangers (connecting front of balans to front of deck)
        for (let zSide of [-1, 1]) {
           const hanger = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 3.2), steelMat);
           hanger.position.set(side * -1.1, -1.6, zSide * 1.2);
           hanger.rotation.z = -rotAngle; 
           balansGroup.add(hanger);
        }

        balansGroup.rotation.z = rotAngle;
        bankGroup.add(balansGroup);

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
