import * as THREE from 'three';
import { MeshStandardNodeMaterial } from 'three/webgpu';
import { color, mx_noise_float, mx_fractal_noise_float, positionWorld, mix, float, uniform, positionLocal, fract, step } from 'three/tsl';
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

  const woodMat = new MeshStandardNodeMaterial({ flatShading: true });
  woodMat.colorNode = mix(color(0x6b4c3a), color(0x4a3325), mx_noise_float(positionWorld.mul(2.0)));
  woodMat.roughnessNode = float(0.9);

  const whitePaintMat = new THREE.MeshStandardMaterial({
    color: 0xffffff, roughness: 0.9, flatShading: true, emissive: 0xffffff, emissiveIntensity: 0.3
  });

  const monumentGroup = new THREE.Group();

  // --- STAGE 0.0 - 0.2: FOUNDATION ---
  const foundationGroup = new THREE.Group();
  
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
  
  const hangarWallGeo = new THREE.BoxGeometry(1, 6, 15.5);
  const leftHWall = new THREE.Mesh(hangarWallGeo, brickMat);
  leftHWall.position.set(-4.5, 3, 0.25);
  leftHWall.castShadow = true;
  
  const rightHWall = new THREE.Mesh(hangarWallGeo, brickMat);
  rightHWall.position.set(4.5, 3, 0.25);
  rightHWall.castShadow = true;
  
  hangarGroup.add(leftHWall, rightHWall);

  // Back Wall with Arch (allows river to flow through)
  const backWallShape = new THREE.Shape();
  backWallShape.moveTo(-5, 0);
  backWallShape.lineTo(5, 0);
  backWallShape.lineTo(5, 6);
  backWallShape.absarc(0, 6, 5, 0, Math.PI, false);
  backWallShape.lineTo(-5, 0);
  
  const backArchHole = new THREE.Path();
  backArchHole.moveTo(-4, 0);
  backArchHole.lineTo(-4, 6);
  backArchHole.absarc(0, 6, 4, Math.PI, 0, true);
  backArchHole.lineTo(4, 0);
  backArchHole.lineTo(-4, 0);
  backWallShape.holes.push(backArchHole);
  
  const backWallGeo = new THREE.ExtrudeGeometry(backWallShape, { depth: 1.0, bevelEnabled: false });
  const backWall = new THREE.Mesh(backWallGeo, brickMat);
  backWall.position.set(0, 0, -7.5);
  backWall.castShadow = true;
  hangarGroup.add(backWall);

  const backGlassShape = new THREE.Shape();
  backGlassShape.absarc(0, 6, 3.8, 0, Math.PI, false);
  const backGlassGeo = new THREE.ExtrudeGeometry(backGlassShape, { depth: 0.2, bevelEnabled: false });
  const backGlass = new THREE.Mesh(backGlassGeo, glassMat);
  backGlass.position.set(0, 0, -6.9);
  hangarGroup.add(backGlass);

  // Front Wall with Arch
  const frontWallShape = new THREE.Shape();
  frontWallShape.moveTo(-5, 0);
  frontWallShape.lineTo(5, 0);
  frontWallShape.lineTo(5, 6);
  frontWallShape.absarc(0, 6, 5, 0, Math.PI, false);
  frontWallShape.lineTo(-5, 0);
  
  const frontArchHole = new THREE.Path();
  frontArchHole.moveTo(-4, 0);
  frontArchHole.lineTo(-4, 6);
  frontArchHole.absarc(0, 6, 4, Math.PI, 0, true);
  frontArchHole.lineTo(4, 0);
  frontArchHole.lineTo(-4, 0);
  frontWallShape.holes.push(frontArchHole);

  const frontWallGeo = new THREE.ExtrudeGeometry(frontWallShape, { depth: 1.0, bevelEnabled: false });
  const frontWall = new THREE.Mesh(frontWallGeo, brickMat);
  frontWall.position.set(0, 0, 7.0); // Spans 7.0 to 8.0, perfectly flush with roof
  frontWall.castShadow = true;
  hangarGroup.add(frontWall);

  // Barrel Vault Roof
  const roofShape = new THREE.Shape();
  roofShape.absarc(0, 0, 5.2, 0, Math.PI, false); // overhang slightly on the sides
  roofShape.lineTo(-4, 0);
  roofShape.absarc(0, 0, 4, Math.PI, 0, true);
  roofShape.lineTo(5.2, 0);
  const roofGeo = new THREE.ExtrudeGeometry(roofShape, { depth: 15, bevelEnabled: false });
  const hangarRoof = new THREE.Mesh(roofGeo, roofMat);
  hangarRoof.position.set(0, 6, -8.0); // overhang on the back and front
  hangarRoof.castShadow = true;
  hangarGroup.add(hangarRoof);

  // Internal Steel Trusses
  const trussGroup = new THREE.Group();
  const trussGeo = new THREE.CylinderGeometry(4.0, 4.0, 0.3, 24, 1, true, 0, Math.PI);
  for (let z = -5; z <= 4; z += 3) {
      const truss = new THREE.Mesh(trussGeo, steelMat);
      truss.rotation.z = Math.PI / 2;
      truss.rotation.x = Math.PI / 2;
      truss.position.set(0, 6, z);
      trussGroup.add(truss);
  }
  hangarGroup.add(trussGroup);

  // Slipway Track (Steel rails + wood ties plunging into river)
  const trackGroup = new THREE.Group();
  const railG = new THREE.BoxGeometry(0.3, 0.4, 18);
  const track1 = new THREE.Mesh(railG, steelMat); track1.position.set(-2, 0.2, 0);
  const track2 = new THREE.Mesh(railG, steelMat); track2.position.set(2, 0.2, 0);
  for (let tz = -8; tz <= 8; tz += 1) {
      const tie = new THREE.Mesh(new THREE.BoxGeometry(5, 0.2, 0.4), woodMat);
      tie.position.set(0, 0.1, tz);
      trackGroup.add(tie);
  }
  trackGroup.add(track1, track2);
  trackGroup.rotation.x = Math.PI / 32; // Gentle slope down
  trackGroup.position.set(0, -0.2, 0);
  hangarGroup.add(trackGroup);

  tagReveal(hangarGroup, 0.2, 0.5);
  structureGroup.add(hangarGroup);


  // 2. Side Wings
  for (let side of [-1, 1]) {
    const wingGroup = new THREE.Group();
    const wX = side * 7;

    const wingCore = new THREE.Mesh(new THREE.BoxGeometry(4, 4, 12), brickMat);
    wingCore.position.set(wX, 2, -0.5);
    wingCore.castShadow = true;
    wingGroup.add(wingCore);

    const arcadeGroup = new THREE.Group();
    for (let i = 0; i < 3; i++) {
      const archFrontShape = new THREE.Shape();
      archFrontShape.moveTo(-0.6, 0);
      archFrontShape.lineTo(0.6, 0);
      archFrontShape.lineTo(0.6, 4.0);
      archFrontShape.lineTo(-0.6, 4.0);
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
      archMesh.position.set(wX + (i-1)*1.2, 0, 5.5);
      arcadeGroup.add(archMesh);
    }
    
    const glassFacade = new THREE.Mesh(new THREE.BoxGeometry(3.6, 2, 0.2), glassMat);
    glassFacade.position.set(wX, 1, 5.3);
    arcadeGroup.add(glassFacade);

    wingGroup.add(arcadeGroup);

    // Warm Industrial Night Lights under the arcade
    const light = new THREE.PointLight(0xffaa55, 0); 
    light.distance = 8;
    light.userData.isStreetlight = true; 
    light.position.set(wX, 3.0, 5.0); 
    wingGroup.add(light);

    const wRoofShape = new THREE.Shape();
    wRoofShape.absarc(0, 0, 2.1, 0, Math.PI, false);
    wRoofShape.lineTo(-1.8, 0);
    wRoofShape.absarc(0, 0, 1.8, Math.PI, 0, true);
    wRoofShape.lineTo(2.1, 0);
    const wRoofGeo = new THREE.ExtrudeGeometry(wRoofShape, { depth: 13.5, bevelEnabled: false });
    const wRoof = new THREE.Mesh(wRoofGeo, roofMat);
    wRoof.position.set(wX, 4, -7.0);
    wRoof.castShadow = true;
    wingGroup.add(wRoof);

    // Chimney (No smoke, clean industrial look)
    const chimney = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.5, 3, 8), brickMat);
    chimney.position.set(wX, 6, 2);
    chimney.castShadow = true;
    wingGroup.add(chimney);

    tagReveal(wingGroup, 0.4, 0.7);
    structureGroup.add(wingGroup);
  }

  // Wooden Boardwalk and Mooring Bollards alongside the slipway track
  for (let side of [-1, 1]) {
    const bwGroup = new THREE.Group();
    const plank = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.15, 16), woodMat);
    plank.position.set(side * 3.5, 0.05, 1.5);
    bwGroup.add(plank);
    
    for (let bz = -5; bz <= 9; bz += 2) {
      const bollard = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.15, 0.6), steelMat);
      bollard.position.set(side * 2.9, 0.3, bz);
      bwGroup.add(bollard);
    }
    hangarGroup.add(bwGroup);
  }

  monumentGroup.add(structureGroup);

  // --- STAGE 0.6 - 0.9: DETAILS & CRANES ---
  const detailsGroup = new THREE.Group();
  
  const craneData = createTowerCrane(10.0);
  const crane = craneData.group;
  crane.position.set(-10, 0, 6);
  tagTempProp(crane, 0.15, 0.85);
  monumentGroup.add(crane);

  const dockCrane1 = createTowerCrane(5.0).group;
  dockCrane1.position.set(12, 0, 10);
  tagReveal(dockCrane1, 0.6, 0.8);
  detailsGroup.add(dockCrane1);

  const dockCrane2 = createTowerCrane(5.0).group;
  dockCrane2.position.set(-12, 0, 10);
  tagReveal(dockCrane2, 0.65, 0.85);
  detailsGroup.add(dockCrane2);

  const stacks = createMaterialStacks();
  stacks.position.set(7, 0, 3);
  tagReveal(stacks, 0.7, 0.9);
  detailsGroup.add(stacks);

  // Signage "SIBLING SHIPYARD"
  const signGroup = new THREE.Group();
  tagReveal(signGroup, 0.75, 0.95);
  
  loadFont((font) => {
    const createDecal = (text: string, mat: THREE.Material) => {
      const geo = new TextGeometry(text, { font, size: 0.8, depth: 0.1, curveSegments: 2, bevelEnabled: false }); // Scaled down text
      geo.computeBoundingBox();
      return { mesh: new THREE.Mesh(geo, mat), width: geo.boundingBox!.max.x - geo.boundingBox!.min.x };
    };

    const text = "SIBLING  SHIPYARD";
    const tracking = 0.2;
    const wordGroup = new THREE.Group();
    let cursorX = 0;
    for (let i = 0; i < text.length; i++) {
      if (text[i] === ' ') { cursorX += 0.5; continue; }
      const { mesh, width } = createDecal(text[i], whitePaintMat);
      mesh.scale.set(0.8, 1.0, 1.0);
      mesh.position.set(cursorX, 0, 0);
      wordGroup.add(mesh);
      cursorX += (width * 0.8) + tracking;
    }
    wordGroup.position.x = -cursorX / 2;
    wordGroup.position.y = 7.1;
    wordGroup.position.z = 8.4; // Flush with backing
    signGroup.add(wordGroup);

    // Secondary Nameboard on Right Wing
    const smallGeo = new TextGeometry("EST. 2026", { font, size: 0.35, depth: 0.05, curveSegments: 1, bevelEnabled: false });
    smallGeo.computeBoundingBox();
    const smallMesh = new THREE.Mesh(smallGeo, whitePaintMat);
    smallMesh.position.set(- (smallGeo.boundingBox!.max.x - smallGeo.boundingBox!.min.x)/2, -0.15, 0.1);
    
    const smallBacking = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.6, 0.2), concreteMat);
    smallBacking.position.set(7, 3.2, 5.9); // Embedded flush into the brick core above arcade
    smallBacking.add(smallMesh);
    detailsGroup.add(smallBacking);
  });
  
  // A wider brick backing for the main sign
  const signBacking = new THREE.Mesh(new THREE.BoxGeometry(13, 1.6, 0.4), brickMat);
  signBacking.position.set(0, 7.5, 8.2); // Flush with front wall (Z=8.0)
  signGroup.add(signBacking);
  
  signGroup.position.set(0, 0, 0);
  monumentGroup.add(signGroup);
  monumentGroup.add(detailsGroup);

  monumentGroup.scale.set(0.8, 0.8, 0.8);

  // Position and Orientation
  const plazaCenterX = 8.0 * CELL_SIZE; // Sits exactly on the river at X=16
  const plazaCenterZ = 4.0 * CELL_SIZE;
  monumentGroup.position.set(plazaCenterX, 0, plazaCenterZ);
  
  // Rotate so the front (slipway) faces South (+Z) straight down the river
  monumentGroup.rotation.y = 0;

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
