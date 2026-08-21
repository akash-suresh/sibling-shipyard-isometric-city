import * as THREE from 'three';
import type { Updatable } from '../SceneManager';
import { visualTokens } from '../../../design/visualTokens';
import { createTowerCrane, createChainlinkFence, createFoundationPit, createDumpTruck, createExcavator } from './constructionProps';

export interface BuildingResult {
  group: THREE.Group;
  updatable?: Updatable;
}

export function buildTower(config: {
  name: string;
  accent: string;
  status: string;
  stage: string;
}): BuildingResult {
  const group = new THREE.Group();
  
  // Materials
  const p = visualTokens.palette;
  const concreteMat = new THREE.MeshLambertMaterial({ color: p.concrete, flatShading: true });
  const plazaMat = new THREE.MeshLambertMaterial({ color: p.plaza, flatShading: true });
  const glassMat = new THREE.MeshLambertMaterial({ color: p.glass, emissive: 0x332200, flatShading: true });
  glassMat.userData.isWindow = true;
  const windowMat = new THREE.MeshLambertMaterial({ color: 0x111111, emissive: 0x332200, flatShading: true });
  windowMat.userData.isWindow = true;
  const accentColor = parseInt(config.accent.replace('#', '0x'), 16) || p.nexus;
  const accentMat = new THREE.MeshLambertMaterial({ color: accentColor, flatShading: true });
  const steelMat = new THREE.MeshLambertMaterial({ color: p.metal, flatShading: true });
  const antennaMat = new THREE.MeshLambertMaterial({ color: p.metal, flatShading: true });
  const packetMat = new THREE.MeshLambertMaterial({ color: 0x00ffff, emissive: 0x00ffff, emissiveIntensity: 2, flatShading: true });
  const craneMat = new THREE.MeshLambertMaterial({ color: p.crane, flatShading: true });
  
  // 7. Base Plaza
  const plazaSize = 5;
  const plazaGeo = new THREE.BoxGeometry(plazaSize, 0.1, plazaSize);
  const plaza = new THREE.Mesh(plazaGeo, plazaMat);
  plaza.position.y = 0.05;
  plaza.receiveShadow = true;
  group.add(plaza);
  
  // Benches on plaza
  const benchMat = new THREE.MeshStandardMaterial({ color: 0x8D6E63, roughness: 0.8 });
  const benchGeo = new THREE.BoxGeometry(0.6, 0.1, 0.3);
  for (let i = 0; i < 3; i++) {
    const bench = new THREE.Mesh(benchGeo, benchMat);
    const angle = (i / 3) * Math.PI * 2;
    bench.position.set(Math.cos(angle) * 3, 0.15, Math.sin(angle) * 3);
    bench.rotation.y = -angle;
    bench.castShadow = true;
    group.add(bench);
  }
  
  // Corporate sculpture (rotating later)
  const sculpture = new THREE.Mesh(new THREE.OctahedronGeometry(0.4), accentMat);
  sculpture.position.set(-2, 1, 2);
  sculpture.castShadow = true;
  group.add(sculpture);
  
  // People (simple capsules)
  const personMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.8 });
  const personGeo = new THREE.CapsuleGeometry(0.1, 0.3, 4, 8);
  for (let i = 0; i < 3; i++) {
    const person = new THREE.Mesh(personGeo, personMat);
    person.position.set(Math.random() * 4 - 2, 0.25, Math.random() * 4 - 2);
    person.castShadow = true;
    group.add(person);
  }

  // 1. Foundation
  const foundationSize = 4;
  const stageIndex = Math.max(0, ["idea", "prototype", "shipped", "landmark"].indexOf(config.stage));

  if (stageIndex === 0 && config.status === "building") {
    const pit = createFoundationPit(foundationSize + 0.5, foundationSize + 0.5);
    group.add(pit);
  } else {
    const foundation = new THREE.Mesh(new THREE.BoxGeometry(foundationSize, 0.4, foundationSize), concreteMat);
    foundation.position.y = 0.3; // 0.1 + 0.2
    foundation.castShadow = true;
    foundation.receiveShadow = true;
    group.add(foundation);
  }

  // 2. Main tower - wedding cake
  const numFloors = [1, 3, 5, 5][stageIndex] || 1; // 1 to 5 floors
  const floorHeight = 1.5;
  let currentY = 0.5; // Top of foundation
  
  // 8. Entrance on ground floor
  const entranceWidth = 1.2;
  const entranceHeight = 1.0;
  const entrance = new THREE.Mesh(new THREE.BoxGeometry(entranceWidth, entranceHeight, 0.2), glassMat);
  entrance.position.set(0, currentY + entranceHeight/2, foundationSize/2 + 0.05);
  group.add(entrance);
  const trim = new THREE.Mesh(new THREE.BoxGeometry(entranceWidth + 0.2, entranceHeight + 0.1, 0.1), accentMat);
  trim.position.set(0, currentY + entranceHeight/2, foundationSize/2);
  group.add(trim);

  // Tower floors
  for (let f = 0; f < numFloors; f++) {
    const floorSize = 3.6 - (f * 0.4); // Decreases each floor
    
    // Choose material
    const isUpper = f >= 2;
    const wallMat = isUpper ? glassMat : concreteMat;
    
    // Floor main block
    const floorBlock = new THREE.Mesh(new THREE.BoxGeometry(floorSize, floorHeight, floorSize), wallMat);
    floorBlock.position.y = currentY + floorHeight / 2;
    floorBlock.castShadow = true;
    floorBlock.receiveShadow = true;
    group.add(floorBlock);
    
    // Thin floor-plate line
    const plate = new THREE.Mesh(new THREE.BoxGeometry(floorSize + 0.1, 0.05, floorSize + 0.1), steelMat);
    plate.position.y = currentY;
    plate.castShadow = true;
    group.add(plate);
    
    // Windows on all sides
    const winWidth = 0.4;
    const winHeight = 0.8;
    const numWindows = Math.floor(floorSize / 0.8);
    for (let side = 0; side < 4; side++) {
      for (let w = 0; w < numWindows; w++) {
        const windowPane = new THREE.Mesh(new THREE.PlaneGeometry(winWidth, winHeight), windowMat);
        const offset = (w - (numWindows-1)/2) * 0.6;
        const dist = floorSize / 2 + 0.01;
        
        if (side === 0) { // front
          windowPane.position.set(offset, currentY + floorHeight/2, dist);
        } else if (side === 1) { // back
          windowPane.position.set(offset, currentY + floorHeight/2, -dist);
          windowPane.rotation.y = Math.PI;
        } else if (side === 2) { // right
          windowPane.position.set(dist, currentY + floorHeight/2, offset);
          windowPane.rotation.y = Math.PI / 2;
        } else if (side === 3) { // left
          windowPane.position.set(-dist, currentY + floorHeight/2, offset);
          windowPane.rotation.y = -Math.PI / 2;
        }
        
        group.add(windowPane);
      }
    }
    
    // 3. Sky-wing on a specific floor (e.g. floor 3)
    if (f === 3) {
      const wingWidth = 1.5;
      const wingLength = 2.5;
      const wing = new THREE.Mesh(new THREE.BoxGeometry(wingWidth, floorHeight * 0.8, wingLength), glassMat);
      wing.position.set(floorSize/2 + wingWidth/2, currentY + floorHeight/2, 0);
      wing.castShadow = true;
      wing.receiveShadow = true;
      group.add(wing);
    }
    
    // 5. NEXUS Signage on upper facade (e.g., floor 4)
    if (f === 4) {
      let signTex: THREE.CanvasTexture;
      if (typeof document !== 'undefined') {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 128;
        const context = canvas.getContext('2d');
        if (context) {
          context.fillStyle = config.accent;
          context.fillRect(0, 0, canvas.width, canvas.height);
          context.fillStyle = '#FFFFFF';
          context.font = 'bold 80px sans-serif';
          context.textAlign = 'center';
          context.textBaseline = 'middle';
          context.fillText('NEXUS', canvas.width / 2, canvas.height / 2);
        }
        signTex = new THREE.CanvasTexture(canvas);
        signTex.colorSpace = THREE.SRGBColorSpace;
      } else {
        // Fallback for non-DOM environments if tests run in node
        const dummyCanvas = {} as HTMLCanvasElement;
        signTex = new THREE.CanvasTexture(dummyCanvas);
      }
      
      const signMatTex = new THREE.MeshStandardMaterial({ map: signTex, roughness: 0.5 });
      const signWidth = floorSize * 0.8;
      const signHeight = signWidth * (128/512);
      const signMesh = new THREE.Mesh(new THREE.PlaneGeometry(signWidth, signHeight), signMatTex);
      signMesh.position.set(0, currentY + floorHeight/2, floorSize/2 + 0.02);
      group.add(signMesh);
    }
    
    currentY += floorHeight;
  }
  
  // Roof plate
  const roofSize = 3.6 - ((numFloors-1) * 0.4);
  const roofPlate = new THREE.Mesh(new THREE.BoxGeometry(roofSize + 0.1, 0.05, roofSize + 0.1), steelMat);
  roofPlate.position.y = currentY;
  roofPlate.castShadow = true;
  group.add(roofPlate);
  
  // 4. Rooftop communications array
  const packets: THREE.Mesh[] = [];
  if (stageIndex >= 3) { // Landmark
    const antennaHeight = 3.0;
    const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, antennaHeight), antennaMat);
    antenna.position.set(-0.5, currentY + antennaHeight/2, -0.5);
    antenna.castShadow = true;
    group.add(antenna);
    
    // Satellite dish
    const dish = new THREE.Mesh(new THREE.SphereGeometry(0.4, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2), antennaMat);
    dish.rotation.x = -Math.PI / 4;
    dish.position.set(0.5, currentY + 0.5, -0.5);
    dish.castShadow = true;
    group.add(dish);
    
    // Animated data packets
    for (let i = 0; i < 3; i++) {
      const packet = new THREE.Mesh(new THREE.SphereGeometry(0.08), packetMat);
      antenna.add(packet);
      packet.position.set(0, (i - 1) * (antennaHeight / 3), 0);
      packets.push(packet);
    }
  }
  
  // 6. Construction VFX
  let craneAnim: Updatable | undefined;
  if (config.status === "building") {
    // Fence around the plaza
    const fence = createChainlinkFence(plazaSize + 0.2, plazaSize + 0.2);
    fence.position.y = 0.1;
    group.add(fence);
    
    // Massive tower crane
    const craneHeight = Math.max(4.0, currentY + 2.0);
    const crane = createTowerCrane(craneHeight);
    crane.group.position.set(-plazaSize/2 - 0.5, 0.1, -plazaSize/2 - 0.5);
    group.add(crane.group);
    craneAnim = crane.updatable;
    
    // Dump truck and excavator
    if (stageIndex >= 1) {
      const truck = createDumpTruck();
      truck.position.set(plazaSize/2 - 0.5, 0.1, plazaSize/2 - 1.0);
      truck.rotation.y = Math.PI / 4;
      group.add(truck);
      
      const excavator = createExcavator();
      excavator.position.set(-plazaSize/2 + 1.0, 0.1, plazaSize/2 - 0.5);
      group.add(excavator);
    }
  }

  // Updatable implementation
  const updatable: Updatable = {
    update: (deltaTime: number) => {
      sculpture.rotation.y += deltaTime * 0.5;
      sculpture.rotation.x += deltaTime * 0.3;
      
      packets.forEach((packet) => {
        packet.position.y += deltaTime * 2.0;
        if (packet.position.y > 1.5) { // antennaHeight / 2
          packet.position.y = -1.5;
        }
      });
      
      if (craneAnim) {
        craneAnim.update(deltaTime, 0); // time doesn't matter for crane update logic
      }
    }
  };

  return { group, updatable };
}
