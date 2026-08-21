import * as THREE from 'three';
import type { Updatable } from '../SceneManager';
import { visualTokens } from '../../../design/visualTokens';

export interface BuildingResult {
  group: THREE.Group;
  updatable?: Updatable;
}

export function buildStudio(config: {
  name: string;
  modules: string[];
  roof?: string;
  accent: string;
  status: string;
}): BuildingResult {
  const group = new THREE.Group();

  // Materials
  const p = visualTokens.palette;
  const concreteMat = new THREE.MeshLambertMaterial({ color: p.concrete, flatShading: true });
  const wallMat = new THREE.MeshLambertMaterial({ color: p.structure, flatShading: true });
  const glassMat = new THREE.MeshLambertMaterial({ color: p.glass, emissive: 0x332200, flatShading: true });
  const accentColor = new THREE.Color(config.accent || p.spark);
  const accentMat = new THREE.MeshLambertMaterial({ color: accentColor, flatShading: true });
  const doorwayMat = new THREE.MeshLambertMaterial({ color: 0x222222, flatShading: true });
  const hvacMat = new THREE.MeshLambertMaterial({ color: p.metal, flatShading: true });
  const bushMat = new THREE.MeshLambertMaterial({ color: p.hedge, flatShading: true });
  const pathMat = new THREE.MeshLambertMaterial({ color: p.sidewalk, flatShading: true });
  const woodMat = new THREE.MeshLambertMaterial({ color: p.soil, flatShading: true });
  const cartMat = new THREE.MeshLambertMaterial({ color: 0xFF5722, flatShading: true });
  const wheelMat = new THREE.MeshLambertMaterial({ color: 0x222222, flatShading: true });
  const beaconMat = new THREE.MeshLambertMaterial({ color: p.activeLight, emissive: p.activeLight, emissiveIntensity: 1, flatShading: true });

  // 1. Building base
  const baseW = 9, baseH = 0.4, baseD = 7;
  const baseMesh = new THREE.Mesh(new THREE.BoxGeometry(baseW, baseH, baseD), concreteMat);
  baseMesh.position.set(0, baseH / 2, 0);
  baseMesh.castShadow = true;
  baseMesh.receiveShadow = true;
  group.add(baseMesh);

  // 2. Main building body
  const numFloors = config.modules.length > 0 ? Math.max(2, config.modules.length + 1) : 3;
  const floorH = 2.5;
  const buildW = 10;
  const buildD = 8;
  const totalH = numFloors * floorH;

  const buildingBody = new THREE.Group();
  buildingBody.position.set(0, baseH, 0);
  group.add(buildingBody);

  for (let f = 0; f < numFloors; f++) {
    const yOffset = f * floorH;
    
    // Core floor block
    const core = new THREE.Mesh(new THREE.BoxGeometry(buildW, floorH, buildD), wallMat);
    core.position.set(0, yOffset + floorH / 2, 0);
    core.castShadow = true;
    core.receiveShadow = true;
    buildingBody.add(core);

    // Windows (front and sides)
    // Front windows (z = buildD/2)
    for (let x = -3.5; x <= 3.5; x += 1.5) {
      if (f === 0 && x >= -1 && x <= 1) continue; // Skip window at entrance
      const win = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.8, 0.1), glassMat);
      win.position.set(x, yOffset + floorH / 2, buildD / 2 + 0.01);
      buildingBody.add(win);
    }
    
    // Left & Right windows
    for (let z = -2.5; z <= 2.5; z += 1.5) {
      // Right
      const winR = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.8, 1.2), glassMat);
      winR.position.set(buildW / 2 + 0.01, yOffset + floorH / 2, z);
      buildingBody.add(winR);
      
      // Left
      const winL = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.8, 1.2), glassMat);
      winL.position.set(-buildW / 2 - 0.01, yOffset + floorH / 2, z);
      buildingBody.add(winL);
    }

    // Floor plate line
    if (f < numFloors - 1) {
      const plateLine = new THREE.Mesh(new THREE.BoxGeometry(buildW + 0.2, 0.1, buildD + 0.2), concreteMat);
      plateLine.position.set(0, yOffset + floorH, 0);
      plateLine.castShadow = true;
      buildingBody.add(plateLine);
    }
  }

  // 3. Entrance
  const entranceGroup = new THREE.Group();
  entranceGroup.position.set(0, 0, buildD / 2);
  buildingBody.add(entranceGroup);

  // Protruding section
  const entranceW = 4, entranceD = 1;
  const entBody = new THREE.Mesh(new THREE.BoxGeometry(entranceW, floorH, entranceD), wallMat);
  entBody.position.set(0, floorH / 2, entranceD / 2);
  entBody.castShadow = true;
  entBody.receiveShadow = true;
  entranceGroup.add(entBody);

  // Awning
  const awning = new THREE.Mesh(new THREE.BoxGeometry(entranceW + 0.4, 0.2, entranceD + 1), accentMat);
  awning.position.set(0, floorH, entranceD / 2 + 0.5);
  awning.castShadow = true;
  entranceGroup.add(awning);

  // Doorway (recessed)
  const doorway = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 0.2), doorwayMat);
  doorway.position.set(0, 1, entranceD + 0.01);
  entranceGroup.add(doorway);

  // Welcome mat/plaza
  const matMesh = new THREE.Mesh(new THREE.BoxGeometry(3, 0.05, 2), accentMat);
  matMesh.position.set(0, baseH + 0.025, buildD / 2 + 1);
  group.add(matMesh);

  // 4. Rooftop features
  const roofY = totalH;
  const roofGroup = new THREE.Group();
  roofGroup.position.set(0, roofY, 0);
  buildingBody.add(roofGroup);

  // Parapet
  const parapetWMesh = new THREE.Mesh(new THREE.BoxGeometry(buildW, 0.4, 0.2), wallMat);
  parapetWMesh.position.set(0, 0.2, buildD / 2 - 0.1);
  roofGroup.add(parapetWMesh);
  
  const parapetW2 = new THREE.Mesh(new THREE.BoxGeometry(buildW, 0.4, 0.2), wallMat);
  parapetW2.position.set(0, 0.2, -buildD / 2 + 0.1);
  roofGroup.add(parapetW2);

  const parapetD = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.4, buildD), wallMat);
  parapetD.position.set(buildW / 2 - 0.1, 0.2, 0);
  roofGroup.add(parapetD);
  
  const parapetD2 = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.4, buildD), wallMat);
  parapetD2.position.set(-buildW / 2 + 0.1, 0.2, 0);
  roofGroup.add(parapetD2);

  // HVAC
  const hvac = new THREE.Mesh(new THREE.BoxGeometry(2, 1, 2), hvacMat);
  hvac.position.set(-2, 0.5, -1);
  hvac.castShadow = true;
  roofGroup.add(hvac);

  const hvac2 = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.8, 1.5), hvacMat);
  hvac2.position.set(2, 0.4, -2);
  hvac2.castShadow = true;
  roofGroup.add(hvac2);

  // Beacon
  const updatables: Updatable[] = [];
  let timeElapsed = 0;

  if (config.roof === 'beacon') {
    const beaconBase = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.5, 0.6), hvacMat);
    beaconBase.position.set(0, 0.3, 1);
    beaconBase.castShadow = true;
    roofGroup.add(beaconBase);

    const beaconLight = new THREE.Mesh(new THREE.SphereGeometry(0.6, 16, 16), beaconMat);
    beaconLight.position.set(0, 0.9, 1);
    roofGroup.add(beaconLight);

    updatables.push({
      update(deltaTime: number) {
        timeElapsed += deltaTime;
        beaconMat.emissiveIntensity = 0.5 + 0.5 * Math.sin(Math.PI * timeElapsed);
      }
    });
  }

  // 5. SPARK signage
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
  const signMat = new THREE.MeshStandardMaterial({ map: signTex });
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(4, 1), signMat);
  sign.position.set(0, totalH - 1, buildD / 2 + 0.02);
  buildingBody.add(sign);

  // 6. Landscaping
  
  // Walkway
  const path = new THREE.Mesh(new THREE.BoxGeometry(2, 0.05, 4), pathMat);
  path.position.set(0, 0.025, baseD / 2 + 2);
  path.receiveShadow = true;
  group.add(path);

  // Bushes on base
  const bushPositions = [
    [-3, 4.5], [3, 4.5], [-4, 3], [4, 3]
  ];
  bushPositions.forEach(pos => {
    const bush = new THREE.Mesh(new THREE.SphereGeometry(0.5, 8, 8), bushMat);
    bush.position.set(pos[0], baseH + 0.4, pos[1]);
    bush.castShadow = true;
    group.add(bush);
  });

  // Bench
  const bench = new THREE.Group();
  const seat = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.1, 0.5), woodMat);
  seat.position.y = 0.3;
  seat.castShadow = true;
  bench.add(seat);
  const back = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.5, 0.1), woodMat);
  back.position.set(0, 0.55, -0.2);
  back.castShadow = true;
  bench.add(back);
  bench.position.set(3, baseH, 4);
  bench.rotation.y = -Math.PI / 8;
  group.add(bench);

  // Planter
  const planterMat = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.8 });
  const p1 = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.4, 1.5), planterMat);
  p1.position.set(-3, baseH + 0.2, 4);
  p1.castShadow = true;
  group.add(p1);
  const p1Bush = new THREE.Mesh(new THREE.BoxGeometry(1, 0.6, 1), bushMat);
  p1Bush.position.set(-3, baseH + 0.5, 4);
  p1Bush.castShadow = true;
  group.add(p1Bush);

  // 7. Visitors
  function createPerson(x: number, z: number, rot: number, color: number, yOffset: number) {
    const personGroup = new THREE.Group();
    const bodyMat = new THREE.MeshStandardMaterial({ color });
    const headMat = new THREE.MeshStandardMaterial({ color: 0xFFCC80 });
    
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.7), bodyMat);
    body.position.y = 0.35;
    body.castShadow = true;
    personGroup.add(body);
    
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.15), headMat);
    head.position.y = 0.8;
    head.castShadow = true;
    personGroup.add(head);
    
    personGroup.position.set(x, yOffset, z);
    personGroup.rotation.y = rot;
    return personGroup;
  }
  
  group.add(createPerson(1.5, 4.5, -Math.PI / 4, 0x2196F3, baseH));
  group.add(createPerson(1, 6, -Math.PI / 2, 0xE91E63, 0));

  // 8. Coffee cart
  const cartGroup = new THREE.Group();
  cartGroup.position.set(-4, 0, 7);
  group.add(cartGroup);

  const cartBody = new THREE.Mesh(new THREE.BoxGeometry(2, 1.5, 1.5), cartMat);
  cartBody.position.y = 0.95;
  cartBody.castShadow = true;
  cartGroup.add(cartBody);
  
  const cartRoof = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.1, 2.2), new THREE.MeshStandardMaterial({ color: 0xFFFFFF }));
  cartRoof.position.y = 1.75;
  cartRoof.castShadow = true;
  cartGroup.add(cartRoof);

  for (let wx of [-0.6, 0.6]) {
    for (let wz of [-0.8, 0.8]) {
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.1), wheelMat);
      wheel.rotation.x = Math.PI / 2;
      wheel.position.set(wx, 0.25, wz);
      wheel.castShadow = true;
      cartGroup.add(wheel);
    }
  }

  const finalUpdatable: Updatable = {
    update(deltaTime: number) {
      updatables.forEach(u => u.update(deltaTime));
    }
  };

  return {
    group,
    updatable: updatables.length > 0 ? finalUpdatable : undefined
  };
}
