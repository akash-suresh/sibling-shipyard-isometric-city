import * as THREE from 'three';
import type { Updatable } from '../SceneManager';
import { visualTokens } from '../../../design/visualTokens';

export interface BuildingResult {
  group: THREE.Group;
  updatable?: Updatable;  // if the building has animation
}

import { createWorker, createExcavator, createTowerCrane, createChainlinkFence, createFoundationPit } from './constructionProps';

export function buildWorkshop(config: {
  name: string;
  accent: string;
  status: string;
  stage: string;
}): BuildingResult {
  const group = new THREE.Group();
  const p = visualTokens.palette;
  
  // Materials
  const concreteMat = new THREE.MeshStandardMaterial({ color: p.concrete, flatShading: true });
  const darkConcreteMat = new THREE.MeshStandardMaterial({ color: p.concreteShadow, flatShading: true });
  const steelMat = new THREE.MeshStandardMaterial({ color: p.metal, flatShading: true });
  const constructionYellowMat = new THREE.MeshStandardMaterial({ color: p.crane, flatShading: true });
  const scaffoldOrangeMat = new THREE.MeshStandardMaterial({ color: p.craneShadow, flatShading: true });
  const windowMat = new THREE.MeshStandardMaterial({ color: p.glass, emissive: 0x332510, emissiveIntensity: 0.8, flatShading: true });
  windowMat.userData.isWindow = true;
  const workerMat = new THREE.MeshStandardMaterial({ color: 0xCDDC39, flatShading: true }); // hi-vis green/yellow
  const hatMat = new THREE.MeshStandardMaterial({ color: 0xFFC107, flatShading: true });
  const woodMat = new THREE.MeshStandardMaterial({ color: p.soil, flatShading: true });

  const stageIndex = Math.max(0, ["idea", "prototype", "shipped", "landmark"].indexOf(config.stage));

  const padW = 3.8;
  const padD = 3.8;
  if (stageIndex === 0 && config.status === "building") {
    const pit = createFoundationPit(padW + 0.2, padD + 0.2);
    group.add(pit);
  } else {
    const pad = new THREE.Mesh(new THREE.BoxGeometry(padW, 0.1, padD), concreteMat);
    pad.position.y = 0.05;
    pad.receiveShadow = true;
    group.add(pad);
  }

  // 2. Completed lower floors
  const floorW = 2.4;
  const floorH = 1.0;
  const floorD = 2.4;

  if (stageIndex >= 1) {
    const floor1 = new THREE.Group();
    floor1.position.y = 0.1; // on top of pad
    const core = new THREE.Mesh(new THREE.BoxGeometry(floorW, floorH, floorD), concreteMat);
    core.position.y = floorH / 2;
    core.castShadow = true;
    core.receiveShadow = true;
    floor1.add(core);

    // Windows
    for (let i = -0.8; i <= 0.8; i += 0.8) {
      const winFront = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.7, 0.05), windowMat);
      winFront.position.set(i, floorH / 2, floorD / 2 + 0.01);
      floor1.add(winFront);
      
      const winRight = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.7, 0.5), windowMat);
      winRight.position.set(floorW / 2 + 0.01, floorH / 2, i);
      floor1.add(winRight);
    }
    group.add(floor1);
  }

  // 3. Exposed steel frame upper floor
  const frameGroup = new THREE.Group();
  if (stageIndex >= 2) {
    frameGroup.position.y = 0.1 + floorH; // on top of floor 1
    group.add(frameGroup);

    const colPositions = [-1.1, 0, 1.1];
    for (const x of colPositions) {
      for (const z of colPositions) {
        const col = new THREE.Mesh(new THREE.BoxGeometry(0.1, floorH, 0.1), steelMat);
        col.position.set(x, floorH / 2, z);
        col.castShadow = true;
        col.receiveShadow = true;
        frameGroup.add(col);
      }
    }
    
    // Beams
    for (const x of colPositions) {
      const beam = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 2.4), steelMat);
      beam.position.set(x, floorH, 0);
      beam.castShadow = true;
      beam.receiveShadow = true;
      frameGroup.add(beam);
    }
    for (const z of colPositions) {
      const beam = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.1, 0.1), steelMat);
      beam.position.set(0, floorH, z);
      beam.castShadow = true;
      beam.receiveShadow = true;
      frameGroup.add(beam);
    }
  }

  // 4. Scaffolding
  const scaffoldGroup = new THREE.Group();
  if (stageIndex >= 3) {
    frameGroup.add(scaffoldGroup);
    
    for (let x = -1.2; x <= 1.2; x += 0.6) {
      const pipe = new THREE.Mesh(new THREE.BoxGeometry(0.04, floorH + 0.2, 0.04), scaffoldOrangeMat);
      pipe.position.set(x, floorH / 2, 1.3);
      pipe.castShadow = true;
      scaffoldGroup.add(pipe);
    }
    for (let y = 0.3; y <= floorH; y += 0.3) {
      const pipe = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.04, 0.04), scaffoldOrangeMat);
      pipe.position.set(0, y, 1.3);
      pipe.castShadow = true;
      scaffoldGroup.add(pipe);
    }
    for (let z = -1.2; z <= 1.2; z += 0.6) {
      const pipe = new THREE.Mesh(new THREE.BoxGeometry(0.04, floorH + 0.2, 0.04), scaffoldOrangeMat);
      pipe.position.set(1.3, floorH / 2, z);
      pipe.castShadow = true;
      scaffoldGroup.add(pipe);
    }
    for (let y = 0.3; y <= floorH; y += 0.3) {
      const pipe = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 2.5), scaffoldOrangeMat);
      pipe.position.set(1.3, y, 0);
      pipe.castShadow = true;
      scaffoldGroup.add(pipe);
    }
  }

  // 5. Tower crane
  let updatable: Updatable | undefined;
  if (stageIndex >= 2 && config.status === "building") {
    const crane = createTowerCrane(4.0);
    // Move to top-right (isometric right) so it is not hidden behind the structure
    crane.group.position.set(1.5, 0.1, -1.5);
    group.add(crane.group);
    updatable = crane.updatable;
  }

  // 6. Construction equipment
  if (stageIndex >= 1 && config.status === "building") {
    const excavator = createExcavator();
    group.add(excavator);
  }

  // Pallets & materials
  for (let i = 0; i < 2; i++) {
    const pallet = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.05, 0.3), woodMat);
    pallet.position.set(-1.2, 0.125, 1.0 - i * 0.5);
    pallet.castShadow = true;
    group.add(pallet);
    
    if (i === 0) {
      for(let b = 0; b < 3; b++) {
         const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.4), steelMat);
         beam.rotation.x = Math.PI / 2;
         beam.position.set(-1.2 + (b-1)*0.05, 0.16, 1.0);
         beam.castShadow = true;
         group.add(beam);
      }
    } else {
      const bricks = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.25, 0.25), concreteMat);
      bricks.position.set(-1.2, 0.275, 1.0 - i * 0.5);
      bricks.castShadow = true;
      group.add(bricks);
    }
  }


  
  if (stageIndex >= 1 && config.status === "building") {
    group.add(createWorker(0.4, 1.5, Math.PI));
    group.add(createWorker(-0.9, 0.5, Math.PI/2));
    group.add(createWorker(1.2, -0.6, -Math.PI/4));
  }

  // 8. Construction fence
  if (config.status === "building") {
    const fenceGroup = createChainlinkFence(padW - 0.1, padD - 0.1);
    fenceGroup.position.y = 0.1;
    group.add(fenceGroup);
    
    // 9. ORION signage
    const fHeight = 0.3;
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = config.accent;
      ctx.fillRect(0, 0, 512, 128);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 80px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(config.name.toUpperCase(), 256, 64);
    }
    
    const signTex = new THREE.CanvasTexture(canvas);
    signTex.colorSpace = THREE.SRGBColorSpace;
    const signMat = new THREE.MeshStandardMaterial({ map: signTex, flatShading: true });
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.3), signMat);
    sign.position.set(0, fHeight / 2 + 0.1, (padD - 0.1) / 2 + 0.025);
    fenceGroup.add(sign);
  }

  return {
    group,
    updatable
  };
}
