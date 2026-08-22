import * as THREE from 'three';
import { MeshStandardNodeMaterial } from 'three/webgpu';
import { color, mx_noise_float, positionWorld, mix, float, uniform, positionLocal, fract, step } from 'three/tsl';
import type { Updatable } from '../SceneManager';
import { FontLoader, Font } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import { CELL_SIZE } from '../TerrainBuilder';

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
  neonMat.emissiveNode = color(configAccent).mul(2.0); // Glowing neon

  const darkMetalMat = new MeshStandardNodeMaterial({ flatShading: true });
  darkMetalMat.colorNode = mix(color(0x2a2a2e), color(0x151518), mx_noise_float(positionWorld.mul(3.0)));
  darkMetalMat.roughnessNode = float(0.4);
  darkMetalMat.metalnessNode = float(0.8);

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

  // Foundation
  const pad = new THREE.Mesh(new THREE.BoxGeometry(8, 0.2, 8), concreteMat);
  pad.position.y = 0.1;
  pad.receiveShadow = true;
  bGroup.add(pad);

  // Left & Right Parapet Walls
  const wallG = new THREE.BoxGeometry(0.4, 4.4, 7.6);
  const wL = new THREE.Mesh(wallG, darkMetalMat); wL.position.set(-3.6, 2.3, 0); wL.castShadow = true;
  const wR = new THREE.Mesh(wallG, darkMetalMat); wR.position.set(3.6, 2.3, 0); wR.castShadow = true;
  bGroup.add(wL, wR);

  // Back Wall
  const wallB = new THREE.Mesh(new THREE.BoxGeometry(6.8, 4.2, 0.4), darkMetalMat);
  wallB.position.set(0, 2.2, -3.6);
  wallB.castShadow = true;
  bGroup.add(wallB);

  // Front Wall (with massive garage opening)
  const frontShape = new THREE.Shape();
  frontShape.moveTo(-3.4, 0);
  frontShape.lineTo(3.4, 0);
  frontShape.lineTo(3.4, 3.2);
  frontShape.lineTo(-3.4, 3.2);
  frontShape.lineTo(-3.4, 0);
  
  const garageHole = new THREE.Path();
  garageHole.moveTo(-2.8, 0);
  garageHole.lineTo(-2.8, 2.5);
  garageHole.lineTo(2.8, 2.5);
  garageHole.lineTo(2.8, 0);
  garageHole.lineTo(-2.8, 0);
  frontShape.holes.push(garageHole);

  const frontG = new THREE.ExtrudeGeometry(frontShape, { depth: 0.4, bevelEnabled: false });
  const wF = new THREE.Mesh(frontG, darkMetalMat);
  wF.position.set(0, 0.2, 3.4); 
  wF.castShadow = true;
  bGroup.add(wF);

  // Saw-Tooth Roof
  const roofGroup = new THREE.Group();
  for(let i=0; i<3; i++) {
    const zFront = 3.4 - i * 2.266;
    const zBack = 3.4 - (i+1) * 2.266;
    const zCenter = (zFront + zBack) / 2;
    
    // Solid sloped panel
    const panel = new THREE.Mesh(new THREE.BoxGeometry(6.8, 0.2, 2.5), darkMetalMat);
    panel.rotation.x = -Math.atan2(1, 2.266);
    panel.position.set(0, 3.7, zCenter);
    panel.castShadow = true;
    roofGroup.add(panel);
    
    // Vertical skylight glass
    if (i < 2) {
      const glass = new THREE.Mesh(new THREE.BoxGeometry(6.8, 1.0, 0.1), tintedGlassMat);
      glass.position.set(0, 3.7, zBack);
      roofGroup.add(glass);
    }
  }
  bGroup.add(roofGroup);

  // Neon Trim
  const trimG = new THREE.BoxGeometry(0.1, 0.1, 7.6);
  const tL = new THREE.Mesh(trimG, neonMat); tL.position.set(-3.85, 4.4, 0);
  const tR = new THREE.Mesh(trimG, neonMat); tR.position.set(3.85, 4.4, 0);
  bGroup.add(tL, tR);

  // --- Interior High-Tech R&D ---
  const interiorGroup = new THREE.Group();
  interiorGroup.position.set(0, 0.2, 0);

  // Glowing Prototype Orb
  const orb = new THREE.Mesh(new THREE.IcosahedronGeometry(0.8, 1), neonMat);
  orb.position.set(0, 1.2, 0);
  interiorGroup.add(orb);

  // Core housing below orb
  const coreBase = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.8, 0.4, 16), steelMat);
  coreBase.position.set(0, 0.2, 0);
  interiorGroup.add(coreBase);

  // Robotic Assembly Arms
  const armBaseG = new THREE.CylinderGeometry(0.3, 0.4, 0.6);
  const lowerArmG = new THREE.BoxGeometry(0.2, 1.8, 0.2);
  const upperArmG = new THREE.BoxGeometry(0.15, 1.2, 0.15);

  const createRoboticArm = (x: number, z: number, rotY: number, angle1: number, angle2: number) => {
    const arm = new THREE.Group();
    arm.position.set(x, 0, z);
    arm.rotation.y = rotY;

    const base = new THREE.Mesh(armBaseG, darkMetalMat);
    base.position.y = 0.3;
    arm.add(base);

    const lower = new THREE.Mesh(lowerArmG, steelMat);
    lower.position.y = 1.0;
    lower.rotation.x = angle1;
    arm.add(lower);

    const upper = new THREE.Mesh(upperArmG, neonMat); // Glowing upper arm/laser
    upper.position.set(0, 1.8, Math.sin(angle1)*0.9);
    upper.rotation.x = angle2;
    arm.add(upper);

    return arm;
  };

  interiorGroup.add(createRoboticArm(-2.2, 1, Math.PI/4, Math.PI/6, -Math.PI/3));
  interiorGroup.add(createRoboticArm(2.2, -1, -Math.PI*0.75, Math.PI/4, -Math.PI/4));

  bGroup.add(interiorGroup);

  // --- Floating Holographic Sign ---
  const signGroup = new THREE.Group();
  loadFont((font) => {
    const geo = new TextGeometry(config.name, { font, size: 1.5, depth: 0.2, curveSegments: 2, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.05 });
    geo.computeBoundingBox();
    const mesh = new THREE.Mesh(geo, neonMat);
    mesh.position.set(- (geo.boundingBox!.max.x - geo.boundingBox!.min.x)/2, 5.5, 2.0);
    signGroup.add(mesh);
  });
  bGroup.add(signGroup);

  group.add(bGroup);
  
  // Center appropriately 
  // 1% is at grid x=4, y=26. The layout engine places the pivot at world X=8, Y=52.
  // The foundation is 8x8 units (4x4 cells). The pivot is at the bottom-left corner of the building.
  // Wait, `TownLayout` typically passes the grid coordinate as the bottom-left corner of the footprint.
  // We need to offset the center of the building to `+4` in X and Z.
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
      
      // Animate prototype orb hovering
      orb.position.y = 1.2 + Math.sin((time || 0) * 2.0) * 0.1;
      orb.rotation.y = (time || 0) * 0.5;

      // Animate neon opacity slightly pulsating
      neonMat.emissiveNode = color(configAccent).mul(1.5 + Math.sin((time || 0) * 3.0) * 0.5);
    }
  };

  updatable.update(0.01, 0);
  return { group, updatable };
}
