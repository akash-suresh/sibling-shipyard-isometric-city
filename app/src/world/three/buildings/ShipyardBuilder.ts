import * as THREE from 'three';
import { MeshStandardNodeMaterial } from 'three/webgpu';
import { color, mx_noise_float, mx_fractal_noise_float, positionWorld, mix, float, uniform, positionLocal, normalLocal, vec3, step, fract } from 'three/tsl';
import type { Updatable } from '../SceneManager';
import { FontLoader, Font } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import { CELL_SIZE } from '../TerrainBuilder';
import { createTowerCrane, createExcavator, createChainlinkFence, createDumpTruck, createMaterialStacks } from './constructionProps';

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
  const globalTime = uniform(0);

  // --- Materials (TSL) ---
  const brickMat = new MeshStandardNodeMaterial({ flatShading: true });
  const bBase = color(0x9b3f2f);
  const bDark = color(0x6b2015);
  const bNoise = mx_fractal_noise_float(positionWorld.mul(0.8), 2);
  brickMat.colorNode = mix(bBase, bDark, bNoise.mul(0.5));
  brickMat.roughnessNode = float(0.85);

  const roofMat = new MeshStandardNodeMaterial({ flatShading: true });
  const rBase = color(0x222222);
  const rRust = color(0x332a22);
  const rNoise = mx_noise_float(positionWorld.mul(1.5));
  roofMat.colorNode = mix(rBase, rRust, rNoise.mul(0.4));
  roofMat.roughnessNode = float(0.6);
  roofMat.metalnessNode = float(0.2);

  const glassMat = new MeshStandardNodeMaterial({
    transparent: true,
    opacity: 0.8,
    flatShading: true
  });
  const gBase = color(0x88ccff);
  const gGlow = color(0xffeedd);
  const glowY = float(1.0);
  const glowPattern = step(0.1, fract(positionLocal.x.mul(3.0))).mul(step(0.1, fract(positionLocal.y.mul(3.0))));
  glassMat.colorNode = mix(gBase, gGlow, glowPattern.mul(0.5));
  glassMat.emissiveNode = mix(color(0x000000), color(0xffaa55).mul(0.8), glowPattern);
  glassMat.roughnessNode = float(0.2);
  glassMat.metalnessNode = float(0.8);

  const steelMat = new MeshStandardNodeMaterial({ flatShading: true });
  const sBase = color(0x333333);
  const sRust = color(0x4a3b30);
  const sNoise = mx_noise_float(positionWorld.mul(2.0));
  steelMat.colorNode = mix(sBase, sRust, sNoise.mul(0.6));
  steelMat.roughnessNode = float(0.5);
  steelMat.metalnessNode = float(0.9);

  const concreteMat = new MeshStandardNodeMaterial({ flatShading: true });
  concreteMat.colorNode = mix(color(0x777777), color(0x555555), mx_noise_float(positionWorld.mul(1.5)));
  concreteMat.roughnessNode = float(0.9);

  const smokeMat = new MeshStandardNodeMaterial({ transparent: true, depthWrite: false, flatShading: true });
  smokeMat.colorNode = color(0xd0d0d0);
  const smokeNoise = mx_fractal_noise_float(positionWorld.mul(0.8).add(vec3(0, globalTime.mul(-1.5), 0)), 3);
  smokeMat.opacityNode = mix(float(0.0), float(0.6), smokeNoise);
  smokeMat.positionNode = positionLocal.add(normalLocal.mul(smokeNoise.mul(0.8)));

  const monumentGroup = new THREE.Group();

  // --- STAGE 0.0 - 0.2: FOUNDATION ---
  const foundationGroup = new THREE.Group();
  
  const dockL = new THREE.Mesh(new THREE.BoxGeometry(6, 0.2, 22), concreteMat);
  dockL.position.set(-7, 0.1, 1);
  const dockR = new THREE.Mesh(new THREE.BoxGeometry(6, 0.2, 22), concreteMat);
  dockR.position.set(7, 0.1, 1);
  const dockB = new THREE.Mesh(new THREE.BoxGeometry(8, 0.2, 10), concreteMat);
  dockB.position.set(0, 0.1, -5);
  
  tagReveal(dockL, 0.0, 0.2);
  tagReveal(dockR, 0.0, 0.2);
  tagReveal(dockB, 0.0, 0.2);
  foundationGroup.add(dockL, dockR, dockB);

  const fence = createChainlinkFence(20.5, 20.5);
  tagTempProp(fence, 0.0, 0.8);
  foundationGroup.add(fence);
  
  const excavator = createExcavator();
  excavator.position.set(4, 0, -4);
  tagTempProp(excavator, 0.05, 0.35);
  foundationGroup.add(excavator);
  
  const truck = createDumpTruck();
  truck.position.set(-6, 0.1, 6);
  tagTempProp(truck, 0.1, 0.5);
  foundationGroup.add(truck);
  
  monumentGroup.add(foundationGroup);

  // --- STAGE 0.2 - 0.7: STRUCTURE ---
  const structureGroup = new THREE.Group();

  // 1. Central Hangar
  const hangarGroup = new THREE.Group();
  
  // Left and Right structural walls of central hangar
  const hangarWallGeo = new THREE.BoxGeometry(1, 6, 14);
  const leftHWall = new THREE.Mesh(hangarWallGeo, brickMat);
  leftHWall.position.set(-4.5, 3, 0);
  leftHWall.castShadow = true;
  
  const rightHWall = new THREE.Mesh(hangarWallGeo, brickMat);
  rightHWall.position.set(4.5, 3, 0);
  rightHWall.castShadow = true;
  
  hangarGroup.add(leftHWall, rightHWall);

  // Closed back wall
  const backWallShape = new THREE.Shape();
  backWallShape.moveTo(-4, 0);
  backWallShape.lineTo(4, 0);
  backWallShape.lineTo(4, 6);
  backWallShape.absarc(0, 6, 4, 0, Math.PI, false);
  backWallShape.lineTo(-4, 0);
  const backWallGeo = new THREE.ExtrudeGeometry(backWallShape, { depth: 0.5, bevelEnabled: false });
  const backWall = new THREE.Mesh(backWallGeo, brickMat);
  backWall.position.set(0, 0, -7.5);
  hangarGroup.add(backWall);

  // Massive Glass Window on the back wall
  const backGlassShape = new THREE.Shape();
  backGlassShape.moveTo(-3, 0);
  backGlassShape.lineTo(3, 0);
  backGlassShape.lineTo(3, 5);
  backGlassShape.absarc(0, 5, 3, 0, Math.PI, false);
  backGlassShape.lineTo(-3, 0);
  const backGlassGeo = new THREE.ExtrudeGeometry(backGlassShape, { depth: 0.2, bevelEnabled: false });
  const backGlass = new THREE.Mesh(backGlassGeo, glassMat);
  backGlass.position.set(0, 0.5, -7.4);
  hangarGroup.add(backGlass);

  // Front Arch Facade
  const frontWallShape = new THREE.Shape();
  frontWallShape.moveTo(-5, 0);
  frontWallShape.lineTo(5, 0);
  frontWallShape.lineTo(5, 6);
  frontWallShape.absarc(0, 6, 5, 0, Math.PI, false);
  frontWallShape.lineTo(-5, 0);
  
  const mainArchHole = new THREE.Path();
  mainArchHole.moveTo(-4, 0);
  mainArchHole.lineTo(-4, 6);
  mainArchHole.absarc(0, 6, 4, Math.PI, 0, true);
  mainArchHole.lineTo(4, 0);
  mainArchHole.lineTo(-4, 0);
  frontWallShape.holes.push(mainArchHole);

  const frontWallGeo = new THREE.ExtrudeGeometry(frontWallShape, { depth: 1.0, bevelEnabled: false });
  const frontWall = new THREE.Mesh(frontWallGeo, brickMat);
  frontWall.position.set(0, 0, 6.0); // flush with front of 14-depth walls
  frontWall.castShadow = true;
  hangarGroup.add(frontWall);

  // Barrel Vault Roof
  const roofShape = new THREE.Shape();
  roofShape.absarc(0, 0, 5, 0, Math.PI, false);
  roofShape.lineTo(-4, 0);
  roofShape.absarc(0, 0, 4, Math.PI, 0, true);
  roofShape.lineTo(5, 0);
  const roofGeo = new THREE.ExtrudeGeometry(roofShape, { depth: 15, bevelEnabled: false });
  const hangarRoof = new THREE.Mesh(roofGeo, roofMat);
  hangarRoof.position.set(0, 6, -7.5);
  hangarRoof.castShadow = true;
  hangarGroup.add(hangarRoof);

  // Slipway Ramp
  const rampGroup = new THREE.Group();
  const rampGeo = new THREE.PlaneGeometry(8, 10);
  rampGeo.rotateX(-Math.PI / 2);
  const ramp = new THREE.Mesh(rampGeo, concreteMat);
  ramp.position.set(0, 0, 0);
  
  const railGeo = new THREE.BoxGeometry(0.2, 0.1, 10);
  const rail1 = new THREE.Mesh(railGeo, steelMat);
  rail1.position.set(-2.5, 0.05, 0);
  const rail2 = new THREE.Mesh(railGeo, steelMat);
  rail2.position.set(2.5, 0.05, 0);
  rampGroup.add(ramp, rail1, rail2);
  
  rampGroup.rotation.x = Math.PI / 16; // tilt down
  rampGroup.position.set(0, -0.5, 3); // start slightly inside, plunge into river
  hangarGroup.add(rampGroup);

  tagReveal(hangarGroup, 0.2, 0.5);
  structureGroup.add(hangarGroup);


  // 2. Side Wings
  for (let side of [-1, 1]) {
    const wingGroup = new THREE.Group();
    const wX = side * 7; // Center of wing is 7 or -7. Width is 4. (Spans 5 to 9)

    // Solid core of the wing
    const wingCore = new THREE.Mesh(new THREE.BoxGeometry(4, 4, 12), brickMat);
    wingCore.position.set(wX, 2, 0);
    wingCore.castShadow = true;
    wingGroup.add(wingCore);

    // Cutout arches for colonnade on the outer and front faces (simulated via applied geometries or just detailed facades)
    // Actually, to make it simple and elegant, we'll build the arcade out of pillars and arches.
    const arcadeGroup = new THREE.Group();
    
    // 3 Arches along the front
    for (let i = 0; i < 3; i++) {
      const archFrontShape = new THREE.Shape();
      archFrontShape.moveTo(-0.6, 0);
      archFrontShape.lineTo(0.6, 0);
      archFrontShape.lineTo(0.6, 2.5);
      archFrontShape.lineTo(-0.6, 2.5);
      archFrontShape.lineTo(-0.6, 0);
      
      const aHole = new THREE.Path();
      aHole.moveTo(-0.4, 0);
      aHole.lineTo(-0.4, 1.5);
      aHole.absarc(0, 1.5, 0.4, Math.PI, 0, true);
      aHole.lineTo(0.4, 0);
      aHole.lineTo(-0.4, 0);
      archFrontShape.holes.push(aHole);
      
      const aGeo = new THREE.ExtrudeGeometry(archFrontShape, { depth: 0.5, bevelEnabled: false });
      const archMesh = new THREE.Mesh(aGeo, brickMat);
      archMesh.position.set(wX + (i-1)*1.2, 0, 6);
      arcadeGroup.add(archMesh);
    }
    
    // Glass behind the arcade
    const glassFacade = new THREE.Mesh(new THREE.BoxGeometry(3.6, 2, 0.2), glassMat);
    glassFacade.position.set(wX, 1, 5.8);
    arcadeGroup.add(glassFacade);

    wingGroup.add(arcadeGroup);

    // Wing Roof (Barrel Vault)
    const wRoofShape = new THREE.Shape();
    wRoofShape.absarc(0, 0, 2, 0, Math.PI, false);
    wRoofShape.lineTo(-1.8, 0);
    wRoofShape.absarc(0, 0, 1.8, Math.PI, 0, true);
    wRoofShape.lineTo(2, 0);
    const wRoofGeo = new THREE.ExtrudeGeometry(wRoofShape, { depth: 12.5, bevelEnabled: false });
    const wRoof = new THREE.Mesh(wRoofGeo, roofMat);
    wRoof.position.set(wX, 4, -6.25);
    wRoof.castShadow = true;
    wingGroup.add(wRoof);

    // Chimney
    const chimney = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.5, 3, 8), brickMat);
    chimney.position.set(wX, 6, 2);
    chimney.castShadow = true;
    wingGroup.add(chimney);

    // Smoke
    const smokeGeo = new THREE.SphereGeometry(1.2, 16, 16);
    const smoke = new THREE.Mesh(smokeGeo, smokeMat);
    smoke.position.set(wX, 8, 2);
    tagReveal(smoke, 0.8, 1.0); // Smoke appears at the end
    wingGroup.add(smoke);

    tagReveal(wingGroup, 0.4, 0.7);
    structureGroup.add(wingGroup);
  }

  monumentGroup.add(structureGroup);

  // --- STAGE 0.6 - 0.9: DETAILS & CRANES ---
  const detailsGroup = new THREE.Group();
  
  const craneData = createTowerCrane(10.0);
  const crane = craneData.group;
  crane.position.set(-10, 0, 6);
  tagTempProp(crane, 0.15, 0.85); // leaves eventually
  monumentGroup.add(crane);

  // Permanent Dock Cranes
  const dockCrane1 = createTowerCrane(5.0).group;
  dockCrane1.position.set(9, 0, 8);
  tagReveal(dockCrane1, 0.6, 0.8);
  detailsGroup.add(dockCrane1);

  const dockCrane2 = createTowerCrane(5.0).group;
  dockCrane2.position.set(-9, 0, 8);
  tagReveal(dockCrane2, 0.65, 0.85);
  detailsGroup.add(dockCrane2);

  const stacks = createMaterialStacks();
  stacks.position.set(7, 0, 4);
  tagReveal(stacks, 0.7, 0.9);
  detailsGroup.add(stacks);

  // Signage "SIBLING SHIPYARD"
  const whitePaintMat = new THREE.MeshStandardMaterial({
    color: 0xffffff, roughness: 0.9, flatShading: true, emissive: 0xffffff, emissiveIntensity: 0.3
  });

  const signGroup = new THREE.Group();
  tagReveal(signGroup, 0.75, 0.95);
  
  loadFont((font) => {
    const createDecal = (text: string, mat: THREE.Material) => {
      const geo = new TextGeometry(text, { font, size: 1.2, depth: 0.1, curveSegments: 2, bevelEnabled: false });
      geo.computeBoundingBox();
      return { mesh: new THREE.Mesh(geo, mat), width: geo.boundingBox!.max.x - geo.boundingBox!.min.x };
    };

    const text = "SIBLING  SHIPYARD";
    const tracking = 0.2;
    const wordGroup = new THREE.Group();
    let cursorX = 0;
    for (let i = 0; i < text.length; i++) {
      if (text[i] === ' ') { cursorX += 0.6; continue; }
      const { mesh, width } = createDecal(text[i], whitePaintMat);
      mesh.scale.set(0.7, 1.0, 1.0);
      mesh.position.set(cursorX, 0, 0);
      wordGroup.add(mesh);
      cursorX += (width * 0.7) + tracking;
    }
    wordGroup.position.x = -cursorX / 2;
    wordGroup.position.y = 7.1;
    wordGroup.position.z = 7.8;
    signGroup.add(wordGroup);
  });
  
  // A brick backing for the sign to mount on
  const signBacking = new THREE.Mesh(new THREE.BoxGeometry(11, 1.6, 0.4), brickMat);
  signBacking.position.set(0, 7.5, 7.6);
  signGroup.add(signBacking);
  
  // Place sign over the main arch
  signGroup.position.set(0, 0, 0);
  monumentGroup.add(signGroup);

  monumentGroup.scale.set(0.8, 0.8, 0.8);

  // Position and Orientation
  const plazaCenterX = 5.0 * CELL_SIZE; // Sits at world X=10, faces river at X=16
  const plazaCenterZ = 5 * CELL_SIZE;
  monumentGroup.position.set(plazaCenterX, 0, plazaCenterZ);
  
  // Rotate so the front (slipway) faces East (+X) into the river
  monumentGroup.rotation.y = Math.PI / 2;

  group.add(monumentGroup);

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

      if (currentProgress > 0.1 && currentProgress < 0.9) craneData.updatable.update(delta);
    }
  };

  updatable.update(0.01, 0);
  return { group, updatable };
}
