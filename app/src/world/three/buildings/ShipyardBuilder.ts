import * as THREE from 'three';
import { MeshStandardNodeMaterial } from 'three/webgpu';
import { color, mx_noise_float, mx_fractal_noise_float, positionWorld, mix, float, step, fract, positionLocal, smoothstep } from 'three/tsl';
import type { Updatable } from '../SceneManager';
import { FontLoader, Font } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import { CELL_SIZE } from '../TerrainBuilder';
import { createTowerCrane, createExcavator, createChainlinkFence, createFoundationPit, createMaterialStacks } from './constructionProps';

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

function easeOutElastic(x: number): number {
  const c4 = (2 * Math.PI) / 3;
  return x === 0 ? 0 : x === 1 ? 1 : Math.pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * c4) + 1;
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

export function buildShipyard(config: { stage?: string } = {}): BuildingResult {
  const group = new THREE.Group();

  // --- Materials (TSL) ---
  const brickMat = new MeshStandardNodeMaterial({ flatShading: true });
  const bBase = color(0x9b3f2f);
  const bDark = color(0x6b2015);
  const bNoise = mx_fractal_noise_float(positionWorld.mul(0.8), 2);
  brickMat.colorNode = mix(bBase, bDark, bNoise.mul(0.5));
  brickMat.roughnessNode = float(0.85);

  const glassMat = new MeshStandardNodeMaterial({
    transparent: true,
    opacity: 0.8,
    flatShading: true
  });
  const gBase = color(0x88ccff);
  const gGlow = color(0xffeedd);
  const glowY = smoothstep(0.0, 3.0, positionLocal.y);
  const glowPattern = step(0.1, fract(positionLocal.x.mul(2.0)));
  glassMat.colorNode = mix(gBase, gGlow, glowPattern.mul(glowY).mul(0.5));
  glassMat.emissiveNode = mix(color(0x000000), color(0xffaa55).mul(0.8), glowPattern.mul(glowY));
  glassMat.roughnessNode = float(0.2);
  glassMat.metalnessNode = float(0.8);

  const steelMat = new MeshStandardNodeMaterial({ flatShading: true });
  const sBase = color(0x333333);
  const sRust = color(0x4a3b30);
  const sNoise = mx_noise_float(positionWorld.mul(2.0));
  steelMat.colorNode = mix(sBase, sRust, sNoise.mul(0.6));
  steelMat.roughnessNode = float(0.5);
  steelMat.metalnessNode = float(0.9);

  const monumentGroup = new THREE.Group();

  // --- Foundation (STAGE 0.0 - 0.2) ---
  const foundationGroup = new THREE.Group();
  const pit = createFoundationPit(12, 18);
  tagTempProp(pit, 0.0, 0.2);
  foundationGroup.add(pit);

  const fence = createChainlinkFence(12.5, 18.5);
  tagTempProp(fence, 0.0, 0.8);
  foundationGroup.add(fence);
  
  const excavator = createExcavator();
  excavator.position.set(-4, 0, -4);
  tagTempProp(excavator, 0.05, 0.35);
  foundationGroup.add(excavator);
  
  const stacks = createMaterialStacks();
  stacks.position.set(4, 0, 6);
  tagTempProp(stacks, 0.1, 0.85);
  foundationGroup.add(stacks);

  monumentGroup.add(foundationGroup);

  // --- Structure (STAGE 0.2 - 0.7) ---
  const shape = new THREE.Shape();
  shape.moveTo(-5, 0);
  shape.lineTo(-2, 0);
  shape.quadraticCurveTo(-1.5, 3.5, 0, 4.0);
  shape.quadraticCurveTo(1.5, 3.5, 2, 0);
  shape.lineTo(5, 0);
  shape.lineTo(5, 2.5);
  shape.quadraticCurveTo(1.5, 4.0, 0, 4.5);
  shape.quadraticCurveTo(-1.5, 4.0, -5, 2.5);
  shape.lineTo(-5, 0);

  const extrudeSettings = { steps: 1, depth: 16, bevelEnabled: true, bevelThickness: 0.1, bevelSize: 0.1, bevelSegments: 2 };
  const viaductGeo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  viaductGeo.translate(0, 0, -8);
  const viaduct = new THREE.Mesh(viaductGeo, brickMat);
  viaduct.castShadow = true;
  viaduct.receiveShadow = true;
  tagReveal(viaduct, 0.2, 0.5);
  monumentGroup.add(viaduct);

  // Interior Trusses
  for (let z = -7; z <= 7; z += 3) {
    const trussGroup = new THREE.Group();
    const beam1 = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.2, 0.2), steelMat);
    beam1.position.set(-3.25, 3.2, z);
    const beam2 = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.2, 0.2), steelMat);
    beam2.position.set(3.25, 3.2, z);
    const arch = new THREE.Mesh(new THREE.TorusGeometry(3.5, 0.1, 8, 16, Math.PI), steelMat);
    arch.position.set(0, 0.5, z);
    trussGroup.add(beam1, beam2, arch);
    tagReveal(trussGroup, 0.3, 0.6);
    monumentGroup.add(trussGroup);
  }

  const glassShape = new THREE.Shape();
  glassShape.moveTo(-1.9, 0);
  glassShape.quadraticCurveTo(-1.5, 3.4, 0, 3.9);
  glassShape.quadraticCurveTo(1.5, 3.4, 1.9, 0);
  glassShape.lineTo(-1.9, 0);

  const glassExtrudeSettings = { steps: 1, depth: 0.2, bevelEnabled: false };
  const glassFront = new THREE.Mesh(new THREE.ExtrudeGeometry(glassShape, glassExtrudeSettings), glassMat);
  glassFront.position.z = 7.9;
  tagReveal(glassFront, 0.5, 0.7);
  
  const glassBack = new THREE.Mesh(new THREE.ExtrudeGeometry(glassShape, glassExtrudeSettings), glassMat);
  glassBack.position.z = -8.1;
  tagReveal(glassBack, 0.5, 0.7);
  
  monumentGroup.add(glassFront, glassBack);

  for (let z = -6; z <= 6; z += 3) {
    for (let side of [-1, 1]) {
      const arch = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 0.5, 16), glassMat);
      arch.rotation.x = Math.PI / 2;
      arch.rotation.z = Math.PI / 2;
      arch.position.set(side * 5.0, 1.2, z);
      tagReveal(arch, 0.55, 0.75);
      monumentGroup.add(arch);
    }
  }

  // --- Roof & Cranes ---
  const craneData = createTowerCrane(12.0);
  const crane = craneData.group;
  crane.position.set(6, 0, -5);
  tagTempProp(crane, 0.15, 0.85);
  monumentGroup.add(crane);

  const whitePaintMat = new THREE.MeshStandardMaterial({
    color: 0xffffff, roughness: 0.9, flatShading: true, transparent: true, opacity: 0.9, side: THREE.DoubleSide
  });

  const signGroup = new THREE.Group();
  tagReveal(signGroup, 0.7, 0.9);
  monumentGroup.add(signGroup);

  loadFont((font) => {
    const createDecal = (text: string, mat: THREE.Material) => {
      const geo = new TextGeometry(text, { font, size: 1.2, depth: 0.02, curveSegments: 2, bevelEnabled: false });
      geo.computeBoundingBox();
      return { mesh: new THREE.Mesh(geo, mat), width: geo.boundingBox!.max.x - geo.boundingBox!.min.x };
    };

    const text = "SIBLING  SHIPYARD";
    const tracking = 0.3;
    const wordGroup = new THREE.Group();
    let cursorX = 0;
    for (let i = 0; i < text.length; i++) {
      if (text[i] === ' ') { cursorX += 0.6; continue; }
      const { mesh, width } = createDecal(text[i], whitePaintMat);
      mesh.scale.set(0.7, 1.3, 1.0);
      mesh.position.set(cursorX, 0, 0);
      wordGroup.add(mesh);
      cursorX += (width * 0.7) + tracking;
    }
    wordGroup.position.x = -cursorX / 2;
    const layoutGroup = new THREE.Group();
    layoutGroup.add(wordGroup);
    layoutGroup.rotation.x = -Math.PI / 2;
    layoutGroup.rotation.z = Math.PI / 2;
    signGroup.position.set(2.5, 3.7, 0);
    signGroup.rotation.z = -0.41;
    signGroup.add(layoutGroup);
  });

  monumentGroup.scale.set(0.9, 0.9, 0.9);
  const plazaCenterX = 2.5 * CELL_SIZE;
  const plazaCenterZ = 5 * CELL_SIZE; // Moved slightly north (was 6)
  monumentGroup.position.set(plazaCenterX, 0, plazaCenterZ);
  group.add(monumentGroup);

  // --- Animation Engine ---
  const stageMap: Record<string, number> = { idea: 0.2, prototype: 0.45, shipped: 0.75, landmark: 1.0 };
  let targetProgress = stageMap[config.stage || 'landmark'] || 0.2;
  let currentProgress = targetProgress;

  const updatable: Updatable & { setStage?: (stage: string) => void, setProgress?: (p: number) => void } = {
    setStage: (stage: string) => { targetProgress = stageMap[stage] || 0.2; },
    setProgress: (progress: number) => { targetProgress = progress; currentProgress = progress; },
    update: (delta, time) => {
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

      if (currentProgress > 0.1 && currentProgress < 0.9) craneData.updatable.update(delta);
    }
  };

  updatable.update(0.01, 0);
  return { group, updatable };
}
