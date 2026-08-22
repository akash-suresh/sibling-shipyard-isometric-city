import * as THREE from 'three';
import { MeshStandardNodeMaterial } from 'three/webgpu';
import { color, mx_noise_float, positionWorld, mix, float, uniform, positionLocal, fract, step } from 'three/tsl';
import type { Updatable } from '../SceneManager';
import { FontLoader, Font } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import { CELL_SIZE } from '../TerrainBuilder';
import { createExcavator, createTowerCrane, createChainlinkFence, createMaterialStacks } from './constructionProps';

let cachedFont: Font | null = null;
const loader = new FontLoader();
function loadFont(callback: (font: Font) => void) {
  if (cachedFont) {
    callback(cachedFont);
    return;
  }
  loader.load('/fonts/helvetiker_bold.typeface.json', (font) => {
    cachedFont = font;
    callback(font);
  });
}

export interface BuildingResult {
  group: THREE.Group;
  updatable?: Updatable;
}

function tagReveal(obj: THREE.Object3D, start: number, end: number) {
  obj.userData.revealStart = start;
  obj.userData.revealEnd = end;
  obj.userData.baseScale = obj.scale.clone();
  obj.scale.set(0, 0, 0);
}

function tagTempProp(obj: THREE.Object3D, start: number, end: number) {
  obj.userData.isTempProp = true;
  obj.userData.revealStart = start;
  obj.userData.revealEnd = end;
  obj.userData.baseScale = obj.scale.clone();
  obj.scale.set(0, 0, 0);
}

function easeOutElastic(x: number): number {
  const c4 = (2 * Math.PI) / 3;
  return x === 0 ? 0 : x === 1 ? 1 : Math.pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * c4) + 1;
}

export function buildWorkshop(config: {
  name: string;
  accent: string;
  status: string;
  stage: string;
}): BuildingResult {
  const group = new THREE.Group();
  const globalTime = uniform(0);

  // --- TSL Materials ---
  const configAccent = new THREE.Color(config.accent);
  
  const neonMat = new MeshStandardNodeMaterial({ flatShading: true });
  neonMat.colorNode = color(configAccent);
  neonMat.emissiveNode = color(configAccent).mul(2.0);

  const darkMetalMat = new MeshStandardNodeMaterial({ flatShading: true });
  darkMetalMat.colorNode = mix(color(0x45454a), color(0x2a2a2e), mx_noise_float(positionWorld.mul(3.0)));
  darkMetalMat.roughnessNode = float(0.4);
  darkMetalMat.metalnessNode = float(0.8);

  const wallMat = new MeshStandardNodeMaterial({ flatShading: true });
  wallMat.colorNode = mix(color(0x55555a), color(0x3a3a3e), mx_noise_float(positionWorld.mul(4.0)));
  wallMat.roughnessNode = float(0.7);

  const tintedGlassMat = new MeshStandardNodeMaterial({ transparent: true, opacity: 0.7, flatShading: true });
  tintedGlassMat.colorNode = color(0x050510);
  tintedGlassMat.emissiveNode = mix(color(0x000000), color(configAccent).mul(0.3), step(0.9, fract(positionLocal.y.mul(5.0))));
  tintedGlassMat.roughnessNode = float(0.1);
  tintedGlassMat.metalnessNode = float(0.9);

  const concreteMat = new MeshStandardNodeMaterial({ flatShading: true });
  concreteMat.colorNode = mix(color(0x444444), color(0x333333), mx_noise_float(positionWorld.mul(2.0)));
  concreteMat.roughnessNode = float(0.9);

  const steelMat = new MeshStandardNodeMaterial({ flatShading: true });
  steelMat.colorNode = color(0x666666);
  steelMat.metalnessNode = float(1.0);
  steelMat.roughnessNode = float(0.3);

  // --- Architecture ---
  const bGroup = new THREE.Group();

  // 1. Foundation (Always present)
  const foundationGroup = new THREE.Group();
  const padOuter = new THREE.Mesh(new THREE.BoxGeometry(8.4, 0.4, 8.4), concreteMat);
  padOuter.position.y = 0.2;
  padOuter.receiveShadow = true;
  foundationGroup.add(padOuter);
  
  const padInner = new THREE.Mesh(new THREE.BoxGeometry(7.8, 0.45, 7.8), steelMat);
  padInner.position.y = 0.225;
  padInner.receiveShadow = true;
  foundationGroup.add(padInner);
  bGroup.add(foundationGroup);

  // Temporary Props (Idea / Prototype stages)
  const fence = createChainlinkFence(8.5, 8.5);
  fence.position.y = 0.4;
  tagTempProp(fence, 0.0, 0.6);
  bGroup.add(fence);
  
  const excavator = createExcavator();
  excavator.position.set(2, 0.4, 2);
  tagTempProp(excavator, 0.05, 0.35);
  bGroup.add(excavator);

  const stacks = createMaterialStacks();
  stacks.position.set(-3, 0.4, 2);
  tagTempProp(stacks, 0.1, 0.5);
  bGroup.add(stacks);

  const craneData = createTowerCrane(8.0);
  const crane = craneData.group;
  crane.position.set(-4, 0.4, -4);
  tagTempProp(crane, 0.2, 0.7);
  bGroup.add(crane);

  // 2. Structural Skeleton & Interior (Prototype)
  const skeletonGroup = new THREE.Group();
  for (let x of [-3.8, 3.8]) {
    for (let z of [-3.8, 3.8]) {
      const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.4, 4.4, 0.4), darkMetalMat);
      pillar.position.set(x, 2.65, z); // 0.45 + 2.2 = 2.65
      pillar.castShadow = true;
      skeletonGroup.add(pillar);
    }
  }
  
  // Skeleton Beams
  const beamX = new THREE.Mesh(new THREE.BoxGeometry(8.0, 0.4, 0.4), darkMetalMat);
  beamX.position.set(0, 4.65, -3.8); skeletonGroup.add(beamX.clone());
  beamX.position.set(0, 4.65, 3.8); skeletonGroup.add(beamX);
  
  const beamZ = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 8.0), darkMetalMat);
  beamZ.position.set(-3.8, 4.65, 0); skeletonGroup.add(beamZ.clone());
  beamZ.position.set(3.8, 4.65, 0); skeletonGroup.add(beamZ);

  tagReveal(skeletonGroup, 0.25, 0.45);
  bGroup.add(skeletonGroup);

  const interiorGroup = new THREE.Group();
  interiorGroup.position.set(0, 0.45, 0); // sit on inner pad

  const interiorLight = new THREE.PointLight(configAccent, 2.0, 15);
  interiorLight.position.set(0, 2.0, 1.0);
  interiorGroup.add(interiorLight);

  // Glowing prototype orb
  const orb = new THREE.Mesh(new THREE.IcosahedronGeometry(0.8, 1), neonMat);
  orb.position.set(0, 1.2, 0);
  interiorGroup.add(orb);

  // Floor glowing ring
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.5, 0.05, 16, 32), neonMat);
  ring.rotation.x = Math.PI / 2;
  ring.position.set(0, 0.02, 0); 
  interiorGroup.add(ring);

  const createRoboticArm = (x: number, z: number, rotY: number, angle1: number, angle2: number) => {
    const arm = new THREE.Group();
    arm.position.set(x, 0, z);
    arm.rotation.y = rotY;

    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.5, 0.4, 16), darkMetalMat);
    base.position.y = 0.2;
    arm.add(base);

    const j1 = new THREE.Mesh(new THREE.SphereGeometry(0.25, 16, 16), steelMat);
    j1.position.y = 0.5;
    arm.add(j1);

    const lowerPivot = new THREE.Group();
    lowerPivot.position.y = 0.5;
    lowerPivot.rotation.x = angle1;
    arm.add(lowerPivot);
    
    const lower = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1.4, 0.2), steelMat);
    lower.position.set(0, 0.7, 0);
    lowerPivot.add(lower);

    const j2 = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 16), steelMat);
    j2.position.set(0, 1.4, 0);
    lowerPivot.add(j2);

    const upperPivot = new THREE.Group();
    upperPivot.position.set(0, 1.4, 0);
    upperPivot.rotation.x = angle2;
    lowerPivot.add(upperPivot);
    
    const upper = new THREE.Mesh(new THREE.BoxGeometry(0.15, 1.0, 0.15), darkMetalMat);
    upper.position.set(0, 0.5, 0);
    upperPivot.add(upper);

    const pincer = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.1, 0.4), neonMat);
    pincer.position.set(0, 1.1, 0);
    upperPivot.add(pincer);

    return arm;
  };

  interiorGroup.add(createRoboticArm(-2.2, 1, Math.PI/4, Math.PI/6, -Math.PI/3));
  interiorGroup.add(createRoboticArm(2.2, -1, -Math.PI*0.75, Math.PI/4, -Math.PI/4));

  tagReveal(interiorGroup, 0.35, 0.55);
  bGroup.add(interiorGroup);

  // 3. Exterior Walls & Roof (Shipped)
  const shellGroup = new THREE.Group();
  
  const addRibs = (wall: THREE.Mesh, width: number, isZ: boolean) => {
    const numRibs = Math.floor(width / 0.8);
    for (let i = 0; i <= numRibs; i++) {
      const rib = new THREE.Mesh(new THREE.BoxGeometry(0.3, 4.0, 0.1), steelMat);
      const pos = -width/2 + (i * width / numRibs);
      if (isZ) {
         rib.position.set(0, 0, pos);
         rib.scale.set(1.5, 1, 1); 
      } else {
         rib.position.set(pos, 0, 0);
         rib.scale.set(1, 1, 1.5);
      }
      wall.add(rib);
    }
  };

  const wL = new THREE.Mesh(new THREE.BoxGeometry(0.2, 4.0, 7.6), wallMat);
  wL.position.set(-3.7, 2.45, 0);
  addRibs(wL, 7.6, true);
  shellGroup.add(wL);

  const wR = new THREE.Mesh(new THREE.BoxGeometry(0.2, 4.0, 7.6), wallMat);
  wR.position.set(3.7, 2.45, 0);
  addRibs(wR, 7.6, true);
  shellGroup.add(wR);

  const wB = new THREE.Mesh(new THREE.BoxGeometry(7.2, 4.0, 0.2), wallMat);
  wB.position.set(0, 2.45, -3.7);
  addRibs(wB, 7.2, false);
  shellGroup.add(wB);

  // Front Garage Face
  const frontShape = new THREE.Shape();
  frontShape.moveTo(-3.6, 0);
  frontShape.lineTo(3.6, 0);
  frontShape.lineTo(3.6, 4.0);
  frontShape.lineTo(-3.6, 4.0);
  frontShape.lineTo(-3.6, 0);
  
  const garageHole = new THREE.Path();
  garageHole.moveTo(-2.8, 0);
  garageHole.lineTo(-2.8, 2.6);
  garageHole.lineTo(2.8, 2.6);
  garageHole.lineTo(2.8, 0);
  garageHole.lineTo(-2.8, 0);
  frontShape.holes.push(garageHole);

  const frontG = new THREE.ExtrudeGeometry(frontShape, { depth: 0.2, bevelEnabled: false });
  const wF = new THREE.Mesh(frontG, wallMat);
  wF.position.set(0, 0.45, 3.6); // Z=3.6 to 3.8
  
  for (let x of [-3.4, -3.0, 3.0, 3.4]) {
     const rib = new THREE.Mesh(new THREE.BoxGeometry(0.1, 4.0, 0.3), steelMat);
     rib.position.set(x, 2.0, 0.1); 
     wF.add(rib);
  }
  shellGroup.add(wF);

  // Saw-Tooth Roof
  const roofGroup = new THREE.Group();
  for(let i=0; i<3; i++) {
    const zFront = 3.6 - i * 2.4;
    const zBack = 3.6 - (i+1) * 2.4;
    const zCenter = (zFront + zBack) / 2;
    
    const panel = new THREE.Mesh(new THREE.BoxGeometry(7.2, 0.2, 2.6), darkMetalMat);
    panel.rotation.x = -Math.atan2(1, 2.4);
    panel.position.set(0, 3.9, zCenter);
    
    // Panel struts
    for (let x = -3.2; x <= 3.2; x += 1.6) {
       const strut = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.3, 2.6), steelMat);
       strut.position.set(x, 0, 0); 
       panel.add(strut);
    }
    roofGroup.add(panel);
    
    if (i < 2) {
      const glass = new THREE.Mesh(new THREE.BoxGeometry(7.2, 1.0, 0.1), tintedGlassMat);
      glass.position.set(0, 3.9, zBack);
      roofGroup.add(glass);
    }
  }
  shellGroup.add(roofGroup);

  tagReveal(shellGroup, 0.45, 0.7);
  bGroup.add(shellGroup);

  // 4. Neon Accents & Signage (Landmark)
  const accentGroup = new THREE.Group();
  
  const trimG = new THREE.BoxGeometry(0.1, 0.1, 7.6);
  const tL = new THREE.Mesh(trimG, neonMat); tL.position.set(-3.85, 4.5, 0);
  const tR = new THREE.Mesh(trimG, neonMat); tR.position.set(3.85, 4.5, 0);
  accentGroup.add(tL, tR);

  tagReveal(accentGroup, 0.75, 0.95);
  bGroup.add(accentGroup);

  group.add(bGroup);
  bGroup.position.set(4, 0, 4);

  // --- Animation Engine ---
  const stageMap: Record<string, number> = { idea: 0.2, prototype: 0.45, shipped: 0.75, landmark: 1.0 };
  let targetProgress = stageMap[config.stage || 'landmark'] || 0.2;
  let currentProgress = targetProgress;

  const updatable: Updatable & { setStage?: (stage: string) => void, setProgress?: (p: number) => void } = {
    setStage: (stage: string) => { targetProgress = stageMap[stage] || 0.2; },
    setProgress: (progress: number) => { targetProgress = progress; currentProgress = progress; },
    update: (delta, time) => {
      globalTime.value = time || 0;
      
      const speed = 0.3;
      if (currentProgress < targetProgress) currentProgress = Math.min(targetProgress, currentProgress + delta * speed);
      else if (currentProgress > targetProgress) currentProgress = Math.max(targetProgress, currentProgress - delta * speed);

      group.traverse((child) => {
        if (child.userData.revealStart !== undefined) {
          const { revealStart, revealEnd, baseScale, isTempProp } = child.userData;
          if (isTempProp) {
            if (currentProgress < revealStart) child.scale.setScalar(0);
            else if (currentProgress >= revealStart && currentProgress <= revealEnd) {
              const t = Math.min(1.0, (currentProgress - revealStart) / 0.05);
              child.scale.copy(baseScale).multiplyScalar(easeOutElastic(t));
            } else {
              const t = 1.0 - Math.min(1.0, (currentProgress - revealEnd) / 0.05);
              child.scale.copy(baseScale).multiplyScalar(Math.max(0, t));
            }
          } else {
            if (currentProgress < revealStart) child.scale.setScalar(0);
            else if (currentProgress > revealEnd) child.scale.copy(baseScale);
            else {
              const t = (currentProgress - revealStart) / (revealEnd - revealStart);
              child.scale.copy(baseScale).multiplyScalar(easeOutElastic(t));
            }
          }
        }
      });

      orb.position.y = 1.6 + Math.sin((time || 0) * 2.0) * 0.15;
      orb.rotation.y = (time || 0) * 1.0;
      orb.rotation.x = (time || 0) * 0.5;
      neonMat.emissiveNode = color(configAccent).mul(1.5 + Math.sin((time || 0) * 4.0) * 0.5);

      if (currentProgress > 0.1 && currentProgress < 0.8) craneData.updatable.update(delta);
    }
  };

  updatable.update(0.01, 0);
  return { group, updatable };
}
