import * as THREE from 'three';
import { visualTokens } from '../../../design/visualTokens';
import type { Updatable } from '../SceneManager';

const p = visualTokens.palette;

// Shared Materials
const concreteMat = new THREE.MeshStandardMaterial({ color: p.concrete, flatShading: true });
const darkConcreteMat = new THREE.MeshStandardMaterial({ color: p.concreteShadow, flatShading: true });
const steelMat = new THREE.MeshStandardMaterial({ color: p.metal, flatShading: true });
const constructionYellowMat = new THREE.MeshStandardMaterial({ color: p.crane, flatShading: true });
const scaffoldOrangeMat = new THREE.MeshStandardMaterial({ color: p.craneShadow, flatShading: true });
const windowMat = new THREE.MeshStandardMaterial({ color: p.glass, emissive: 0x332510, emissiveIntensity: 0.8, flatShading: true });
const workerMat = new THREE.MeshStandardMaterial({ color: 0xCDDC39, flatShading: true }); // hi-vis green/yellow
const hatMat = new THREE.MeshStandardMaterial({ color: 0xFFC107, flatShading: true });

export function createWorker(x: number, z: number, rot: number) {
  const worker = new THREE.Group();
  
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.15), workerMat);
  body.position.y = 0.075;
  body.castShadow = true;
  worker.add(body);
  
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.04), new THREE.MeshStandardMaterial({color: 0xFFCC80, flatShading: true}));
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

export function createExcavator() {
  const excavator = new THREE.Group();
  excavator.position.set(1.0, 0.1, 1.0);
  excavator.rotation.y = -Math.PI / 6;
  
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
  return excavator;
}

export function createDumpTruck() {
  const truck = new THREE.Group();
  
  const chassis = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.1, 1.2), darkConcreteMat);
  chassis.position.y = 0.15;
  chassis.castShadow = true;
  truck.add(chassis);

  const cab = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.3, 0.4), constructionYellowMat);
  cab.position.set(0, 0.35, 0.4);
  cab.castShadow = true;
  truck.add(cab);

  const cabWindow = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.15, 0.2), windowMat);
  cabWindow.position.set(0, 0.4, 0.45);
  truck.add(cabWindow);

  const bed = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.25, 0.7), steelMat);
  bed.position.set(0, 0.3, -0.2);
  bed.castShadow = true;
  truck.add(bed);
  
  return truck;
}

export function createTowerCrane(towerHeight: number = 4.0): { group: THREE.Group, updatable: Updatable } {
  const craneGroup = new THREE.Group();
  
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
  
  const cableGeo = new THREE.CylinderGeometry(0.005, 0.005, towerHeight * 0.6);
  const cable = new THREE.Mesh(cableGeo, darkConcreteMat);
  cable.position.set(jibLength - 0.3, -towerHeight * 0.3, 0);
  craneHead.add(cable);

  const payload = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.2, 0.8), steelMat);
  payload.position.set(jibLength - 0.3, -towerHeight * 0.6 - 0.1, 0);
  payload.castShadow = true;
  craneHead.add(payload);

  // Warning light
  const warnLightMat = new THREE.MeshStandardMaterial({ color: 0xff3300, emissive: 0xff3300, emissiveIntensity: 1, flatShading: true });
  const warnLight = new THREE.Mesh(new THREE.SphereGeometry(0.06), warnLightMat);
  warnLight.position.set(0, 1.05, 0);
  craneHead.add(warnLight);

  const updatable = {
    time: 0,
    update(deltaTime: number): void {
      this.time += deltaTime;
      craneHead.rotation.y += 0.1 * deltaTime;
      warnLightMat.emissiveIntensity = 0.4 + Math.sin(this.time * 4) * 0.6;
    }
  };

  return { group: craneGroup, updatable };
}

export function createChainlinkFence(width: number, depth: number) {
  const fenceGroup = new THREE.Group();
  const fThickness = 0.04;
  const fHeight = 0.3;
  const fenceMat = scaffoldOrangeMat; // chainlink or orange scaffold
  
  const fenceFront = new THREE.Mesh(new THREE.BoxGeometry(width, fHeight, fThickness), fenceMat);
  fenceFront.position.set(0, fHeight / 2, depth / 2);
  fenceFront.castShadow = true;
  fenceGroup.add(fenceFront);
  
  const fenceBack = new THREE.Mesh(new THREE.BoxGeometry(width, fHeight, fThickness), fenceMat);
  fenceBack.position.set(0, fHeight / 2, -depth / 2);
  fenceBack.castShadow = true;
  fenceGroup.add(fenceBack);
  
  const fenceLeft = new THREE.Mesh(new THREE.BoxGeometry(fThickness, fHeight, depth), fenceMat);
  fenceLeft.position.set(-width / 2, fHeight / 2, 0);
  fenceLeft.castShadow = true;
  fenceGroup.add(fenceLeft);
  
  const fenceRight = new THREE.Mesh(new THREE.BoxGeometry(fThickness, fHeight, depth), fenceMat);
  fenceRight.position.set(width / 2, fHeight / 2, 0);
  fenceRight.castShadow = true;
  fenceGroup.add(fenceRight);
  
  return fenceGroup;
}

export function createFoundationPit(width: number, depth: number) {
  const pitGroup = new THREE.Group();
  
  // 1. Dug out dirt pit (sunken plane)
  const dirtGeo = new THREE.PlaneGeometry(width, depth);
  const dirtMat = new THREE.MeshStandardMaterial({ color: 0x4a3b2c, flatShading: true }); // dark soil
  const dirt = new THREE.Mesh(dirtGeo, dirtMat);
  dirt.rotation.x = -Math.PI / 2;
  dirt.position.y = 0.01;
  dirt.receiveShadow = true;
  pitGroup.add(dirt);
  
  // 2. Concrete pad in the center
  const padW = width * 0.8;
  const padD = depth * 0.8;
  const padGeo = new THREE.BoxGeometry(padW, 0.05, padD);
  const pad = new THREE.Mesh(padGeo, concreteMat);
  pad.position.y = 0.025;
  pad.receiveShadow = true;
  pitGroup.add(pad);
  
  // 3. Wooden forms around the concrete pad
  const formMat = new THREE.MeshStandardMaterial({ color: p.soil, flatShading: true }); // wood
  const fThickness = 0.05;
  const fHeight = 0.1;
  
  const formFront = new THREE.Mesh(new THREE.BoxGeometry(padW, fHeight, fThickness), formMat);
  formFront.position.set(0, fHeight/2, padD/2);
  pitGroup.add(formFront);
  
  const formBack = new THREE.Mesh(new THREE.BoxGeometry(padW, fHeight, fThickness), formMat);
  formBack.position.set(0, fHeight/2, -padD/2);
  pitGroup.add(formBack);
  
  const formLeft = new THREE.Mesh(new THREE.BoxGeometry(fThickness, fHeight, padD), formMat);
  formLeft.position.set(-padW/2, fHeight/2, 0);
  pitGroup.add(formLeft);
  
  const formRight = new THREE.Mesh(new THREE.BoxGeometry(fThickness, fHeight, padD), formMat);
  formRight.position.set(padW/2, fHeight/2, 0);
  pitGroup.add(formRight);
  
  // 4. Rebar sticking up
  const rebarGeo = new THREE.CylinderGeometry(0.01, 0.01, 0.3);
  const rebarMat = steelMat;
  
  for(let x = -padW/2 + 0.2; x < padW/2; x += 0.4) {
    for(let z = -padD/2 + 0.2; z < padD/2; z += 0.4) {
      if (Math.random() > 0.3) {
        const rebar = new THREE.Mesh(rebarGeo, rebarMat);
        rebar.position.set(x, 0.15, z);
        rebar.castShadow = true;
        pitGroup.add(rebar);
      }
    }
  }

  return pitGroup;
}
