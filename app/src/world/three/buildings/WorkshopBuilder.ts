import * as THREE from 'three';
import type { Updatable } from '../SceneManager';
import { visualTokens } from '../../../design/visualTokens';

export interface BuildingResult {
  group: THREE.Group;
  updatable?: Updatable;  // if the building has animation
}

class WorkshopAnimation implements Updatable {
  constructor(
    private craneHead: THREE.Group,
    private warnLightMat: THREE.MeshLambertMaterial
  ) {}

  private time = 0;

  update(deltaTime: number): void {
    this.time += deltaTime;
    // Slow constant rotation (~0.1 rad/s)
    this.craneHead.rotation.y += 0.1 * deltaTime;
    // Pulsing construction warning light
    this.warnLightMat.emissiveIntensity = 0.4 + Math.sin(this.time * 4) * 0.6;
  }
}

export function buildWorkshop(config: {
  name: string;
  modules: string[];
  roof?: string;
  accent: string;  // hex color like '#FF9800'
  status: string;
}): BuildingResult {
  const group = new THREE.Group();
  const p = visualTokens.palette;
  
  // Materials
  const concreteMat = new THREE.MeshLambertMaterial({ color: p.concrete, flatShading: true });
  const darkConcreteMat = new THREE.MeshLambertMaterial({ color: p.concreteShadow, flatShading: true });
  const steelMat = new THREE.MeshLambertMaterial({ color: p.metal, flatShading: true });
  const constructionYellowMat = new THREE.MeshLambertMaterial({ color: p.crane, flatShading: true });
  const scaffoldOrangeMat = new THREE.MeshLambertMaterial({ color: p.craneShadow, flatShading: true });
  const windowMat = new THREE.MeshLambertMaterial({ color: p.glass, emissive: 0x332510, emissiveIntensity: 0.8, flatShading: true });
  const workerMat = new THREE.MeshLambertMaterial({ color: 0xCDDC39, flatShading: true }); // hi-vis green/yellow
  const hatMat = new THREE.MeshLambertMaterial({ color: 0xFFC107, flatShading: true });
  const woodMat = new THREE.MeshLambertMaterial({ color: p.soil, flatShading: true });

  // 1. Concrete work pad
  const padW = 3.8;
  const padD = 3.8;
  const pad = new THREE.Mesh(new THREE.BoxGeometry(padW, 0.1, padD), concreteMat);
  pad.position.y = 0.05;
  pad.receiveShadow = true;
  group.add(pad);

  // 2. Completed lower floors
  const floorW = 2.4;
  const floorH = 1.0;
  const floorD = 2.4;

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

  // 3. Exposed steel frame upper floor
  const frameGroup = new THREE.Group();
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

  // 4. Scaffolding
  const scaffoldGroup = new THREE.Group();
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

  // 5. Tower crane
  const craneGroup = new THREE.Group();
  craneGroup.position.set(-0.6, 0.1, -0.6);
  group.add(craneGroup);
  
  const towerHeight = 4.0;
  const tower = new THREE.Mesh(new THREE.BoxGeometry(0.3, towerHeight, 0.3), constructionYellowMat);
  tower.position.y = towerHeight / 2;
  tower.castShadow = true;
  tower.receiveShadow = true;
  craneGroup.add(tower);
  
  const craneHead = new THREE.Group();
  craneHead.position.y = towerHeight;
  craneGroup.add(craneHead);
  
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.6), concreteMat);
  cabin.position.set(0.3, 0.2, 0);
  cabin.castShadow = true;
  craneHead.add(cabin);
  
  const jibLength = 3.5;
  const jib = new THREE.Mesh(new THREE.BoxGeometry(jibLength, 0.2, 0.2), constructionYellowMat);
  jib.position.set(jibLength / 2 - 0.15, 0.3, 0);
  jib.castShadow = true;
  craneHead.add(jib);
  
  const counterJibLen = 1.2;
  const counterJib = new THREE.Mesh(new THREE.BoxGeometry(counterJibLen, 0.2, 0.2), constructionYellowMat);
  counterJib.position.set(-counterJibLen / 2 - 0.15, 0.3, 0);
  counterJib.castShadow = true;
  craneHead.add(counterJib);
  
  const weight = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.4, 0.3), darkConcreteMat);
  weight.position.set(-counterJibLen, 0.6, 0);
  weight.castShadow = true;
  craneHead.add(weight);
  
  const apex = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.15, 0.6, 4), constructionYellowMat);
  apex.position.set(0, 0.7, 0);
  apex.rotation.y = Math.PI / 4;
  craneHead.add(apex);
  
  // Cables
  const matLine = new THREE.LineBasicMaterial({ color: 0x333333 });
  const lineGeo1 = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 1.0, 0), new THREE.Vector3(jibLength - 0.3, 0.4, 0)]);
  craneHead.add(new THREE.Line(lineGeo1, matLine));
  const lineGeo2 = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 1.0, 0), new THREE.Vector3(-counterJibLen + 0.1, 0.4, 0)]);
  craneHead.add(new THREE.Line(lineGeo2, matLine));
  
  const cableGeo = new THREE.CylinderGeometry(0.005, 0.005, 2.5);
  const cable = new THREE.Mesh(cableGeo, darkConcreteMat);
  cable.position.set(jibLength - 0.3, -0.9, 0);
  craneHead.add(cable);

  // Warning light
  const warnLightMat = new THREE.MeshLambertMaterial({ color: 0xff3300, emissive: 0xff3300, emissiveIntensity: 1, flatShading: true });
  const warnLight = new THREE.Mesh(new THREE.SphereGeometry(0.06), warnLightMat);
  warnLight.position.set(0, 1.05, 0);
  craneHead.add(warnLight);

  // 6. Construction equipment
  const excavator = new THREE.Group();
  excavator.position.set(1.0, 0.1, 1.0);
  excavator.rotation.y = -Math.PI / 6;
  group.add(excavator);
  
  const tracks = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.15, 0.6), darkConcreteMat);
  tracks.position.y = 0.075;
  tracks.castShadow = true;
  excavator.add(tracks);
  
  const excBody = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.3, 0.5), constructionYellowMat);
  excBody.position.set(0, 0.3, -0.05);
  excBody.castShadow = true;
  excavator.add(excBody);
  
  const excCab = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.3, 0.25), windowMat);
  excCab.position.set(0.125, 0.6, 0.05);
  excCab.castShadow = true;
  excavator.add(excCab);
  
  const excArm = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.7, 0.08), constructionYellowMat);
  excArm.position.set(-0.1, 0.5, 0.3);
  excArm.rotation.x = -Math.PI / 6;
  excArm.castShadow = true;
  excavator.add(excArm);

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

  // 7. Workers
  function createWorker(x: number, z: number, rot: number) {
    const worker = new THREE.Group();
    
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.15), workerMat);
    body.position.y = 0.075;
    body.castShadow = true;
    worker.add(body);
    
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.04), new THREE.MeshLambertMaterial({color: 0xFFCC80, flatShading: true}));
    head.position.y = 0.19;
    head.castShadow = true;
    worker.add(head);
    
    const hat = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.02), hatMat);
    hat.position.y = 0.22;
    hat.castShadow = true;
    worker.add(hat);
    
    worker.position.set(x, 0.1, z);
    worker.rotation.y = rot;
    return worker;
  }
  
  group.add(createWorker(0.4, 1.5, Math.PI));
  group.add(createWorker(-0.9, 0.5, Math.PI/2));
  group.add(createWorker(1.2, -0.6, -Math.PI/4));

  // 8. Construction fence
  const fenceGroup = new THREE.Group();
  fenceGroup.position.y = 0.1;
  group.add(fenceGroup);
  
  const fW = padW - 0.1;
  const fD = padD - 0.1;
  const fThickness = 0.04;
  const fHeight = 0.3;
  
  const fenceMat = scaffoldOrangeMat;
  
  const fenceFront = new THREE.Mesh(new THREE.BoxGeometry(fW, fHeight, fThickness), fenceMat);
  fenceFront.position.set(0, fHeight / 2, fD / 2);
  fenceFront.castShadow = true;
  fenceGroup.add(fenceFront);
  
  const fenceBack = new THREE.Mesh(new THREE.BoxGeometry(fW, fHeight, fThickness), fenceMat);
  fenceBack.position.set(0, fHeight / 2, -fD / 2);
  fenceBack.castShadow = true;
  fenceGroup.add(fenceBack);
  
  const fenceLeft = new THREE.Mesh(new THREE.BoxGeometry(fThickness, fHeight, fD), fenceMat);
  fenceLeft.position.set(-fW / 2, fHeight / 2, 0);
  fenceLeft.castShadow = true;
  fenceGroup.add(fenceLeft);
  
  const fenceRight = new THREE.Mesh(new THREE.BoxGeometry(fThickness, fHeight, fD), fenceMat);
  fenceRight.position.set(fW / 2, fHeight / 2, 0);
  fenceRight.castShadow = true;
  fenceGroup.add(fenceRight);

  // 9. ORION signage
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
  const signMat = new THREE.MeshLambertMaterial({ map: signTex, flatShading: true });
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.3), signMat);
  sign.position.set(0, fHeight / 2 + 0.1, fD / 2 + 0.025);
  fenceGroup.add(sign);

  return {
    group,
    updatable: new WorkshopAnimation(craneHead, warnLightMat)
  };
}
