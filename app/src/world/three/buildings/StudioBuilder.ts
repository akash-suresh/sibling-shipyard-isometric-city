import * as THREE from 'three';
import { MeshStandardNodeMaterial } from 'three/webgpu';
import { color, mx_noise_float, mx_fractal_noise_float, positionWorld, vec3, mix, float, step, fract, positionLocal, smoothstep } from 'three/tsl';
import type { Updatable } from '../SceneManager';
import { visualTokens } from '../../../design/visualTokens';
import { createTowerCrane, createExcavator, createChainlinkFence, createFoundationPit, createDumpTruck, createMaterialStacks } from './constructionProps';

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

export function buildStudio(config: {
  name: string;
  accent: string;
  status: string;
  stage: string;
  logo?: string;
}): BuildingResult {
  const group = new THREE.Group();
  const p = visualTokens.palette;

  // --- DISTINCTIVE TSL MATERIALS FOR STUDIO ---
  // 1. Dark Charcoal Brick (Ground Floor)
  const brickMat = new MeshStandardNodeMaterial({ flatShading: true });
  const dBase = color(0x222224);
  const dNoise = mx_fractal_noise_float(positionWorld.mul(3.0), 3);
  brickMat.colorNode = mix(dBase, color(0x1a1a1c), dNoise.mul(0.6));
  brickMat.roughnessNode = float(0.9);

  // 2. Rich Timber / Terracotta Cladding (Cantilevered Top Floor)
  const timberMat = new MeshStandardNodeMaterial({ flatShading: true });
  const tBase = color(0x8a4b38); // Warm reddish brown
  const tStripe = mx_noise_float(vec3(positionWorld.x.mul(10.0), positionWorld.y.mul(0.5), positionWorld.z.mul(10.0)));
  timberMat.colorNode = mix(tBase, color(0x6b3626), tStripe.mul(0.4));
  timberMat.roughnessNode = float(0.7);

  // 3. Warm Glowing Studio Glass (Unlike the cold blue tower glass)
  const glassMat = new MeshStandardNodeMaterial({ transparent: true, opacity: 0.8, flatShading: true });
  const gBase = color(0x332211);
  const gGlow = color(0xffcc88);
  const isWindow = step(0.1, fract(positionLocal.x.mul(1.5))).mul(step(0.1, fract(positionLocal.y.mul(1.5))));
  glassMat.colorNode = mix(gBase, gGlow, isWindow.mul(0.7));
  glassMat.emissiveNode = mix(color(0x000000), color(0xffaa44).mul(0.6), isWindow);
  glassMat.roughnessNode = float(0.15);
  glassMat.metalnessNode = float(0.8);

  // 4. Accent Metal (For frames and beams)
  const accentColor = parseInt(config.accent.replace('#', '0x'), 16) || 0xdd4433;
  const accentMat = new MeshStandardNodeMaterial({ flatShading: true });
  accentMat.colorNode = color(accentColor);
  accentMat.roughnessNode = float(0.4);
  accentMat.metalnessNode = float(0.6);
  
  // 5. Green Roof foliage
  const grassMat = new MeshStandardNodeMaterial({ flatShading: true });
  grassMat.colorNode = mix(color(0x3a5a2a), color(0x2d4c1e), mx_noise_float(positionWorld.mul(4.0)));
  grassMat.roughnessNode = float(0.9);

  const rotatingElements: THREE.Object3D[] = [];
  const animatableProps: THREE.Object3D[] = [];

  const width = 8;
  const depth = 8;

  // --- STAGE 0.0 - 0.2: FOUNDATION & CONSTRUCTION SITE ---
  const constructionGroup = new THREE.Group();
  
  const pit = createFoundationPit(width + 0.5, depth + 0.5);
  tagTempProp(pit, 0.0, 0.2);
  constructionGroup.add(pit);

  const fence = createChainlinkFence(width + 1.5, depth + 1.5);
  tagTempProp(fence, 0.0, 0.7);
  constructionGroup.add(fence);

  const excavator = createExcavator();
  excavator.position.set(-width / 2 + 1, 0, depth / 2 + 0.5);
  tagTempProp(excavator, 0.05, 0.4);
  constructionGroup.add(excavator);
  
  const truck = createDumpTruck();
  truck.position.set(width / 2 - 1, 0.1, depth / 2 + 1.5);
  tagTempProp(truck, 0.1, 0.6);
  constructionGroup.add(truck);
  
  const stacks = createMaterialStacks();
  stacks.position.set(-width / 2 - 1, 0, -depth / 2 + 1);
  tagTempProp(stacks, 0.0, 0.75);
  constructionGroup.add(stacks);

  // Smaller crane for a 2-story building
  const craneData = createTowerCrane(7.0);
  const crane = craneData.group;
  crane.position.set(width / 2 + 1, 0, -depth / 2 - 1);
  tagTempProp(crane, 0.15, 0.85);
  constructionGroup.add(crane);
  
  group.add(constructionGroup);

  // Base Pad
  const foundation = new THREE.Mesh(new THREE.BoxGeometry(width - 0.5, 0.2, depth - 0.5), brickMat);
  foundation.position.y = 0.1;
  tagReveal(foundation, 0.1, 0.2);
  group.add(foundation);

  // --- STAGE 0.2 - 0.5: STRUCTURAL BASE (Ground Floor) ---
  const groundGroup = new THREE.Group();
  
  // A recessed dark brick core
  const coreW = width - 2.5;
  const coreD = depth - 1.5;
  const coreH = 2.0;
  const core = new THREE.Mesh(new THREE.BoxGeometry(coreW, coreH, coreD), brickMat);
  core.position.set(0, 0.2 + coreH/2, -0.5);
  core.castShadow = true;
  tagReveal(core, 0.2, 0.35);
  groundGroup.add(core);

  // Ground floor windows inset into the core
  const gWindow = new THREE.Mesh(new THREE.BoxGeometry(coreW - 0.5, coreH - 0.5, coreD + 0.1), glassMat);
  gWindow.position.set(0, 0.2 + coreH/2, -0.5);
  tagReveal(gWindow, 0.3, 0.45);
  groundGroup.add(gWindow);

  // Pillars to support the cantilever
  const p1 = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, coreH), accentMat);
  p1.position.set(-width/2 + 0.8, 0.2 + coreH/2, depth/2 - 0.8);
  tagReveal(p1, 0.3, 0.4);
  const p2 = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, coreH), accentMat);
  p2.position.set(width/2 - 0.8, 0.2 + coreH/2, depth/2 - 0.8);
  tagReveal(p2, 0.3, 0.4);
  groundGroup.add(p1, p2);

  group.add(groundGroup);

  // --- STAGE 0.4 - 0.7: CANTILEVER TOP (Studio Space) ---
  const topGroup = new THREE.Group();
  
  const topW = width;
  const topD = depth;
  const topH = 2.5;
  const topY = 0.2 + coreH + topH/2;

  // The main wooden cladding box, cantilevered forward over the pillars
  const studioBox = new THREE.Mesh(new THREE.BoxGeometry(topW, topH, topD), timberMat);
  studioBox.position.set(0, topY, 0);
  studioBox.castShadow = true;
  tagReveal(studioBox, 0.4, 0.6);
  topGroup.add(studioBox);

  // Massive panoramic window at the front
  const panoWindow = new THREE.Mesh(new THREE.BoxGeometry(topW - 0.4, topH - 0.4, topD + 0.1), glassMat);
  panoWindow.position.set(0, topY, 0.05); // slight offset to clip through the front
  tagReveal(panoWindow, 0.5, 0.65);
  topGroup.add(panoWindow);

  // Angular accent frame wrapping the front window
  const frameGeo = new THREE.BoxGeometry(topW + 0.2, topH + 0.2, 0.6);
  const frame = new THREE.Mesh(frameGeo, accentMat);
  frame.position.set(0, topY, topD/2 - 0.1);
  
  // Carve out the center of the frame (using simple overlapping boxes for a fake boolean look in isometric)
  const frameInner = new THREE.Mesh(new THREE.BoxGeometry(topW - 0.4, topH - 0.4, 0.8), glassMat);
  frameInner.position.set(0, topY, topD/2 - 0.1);
  
  tagReveal(frame, 0.55, 0.7);
  topGroup.add(frame);

  group.add(topGroup);

  // --- STAGE 0.7 - 1.0: ROOFTOP & DETAILS ---
  const detailsGroup = new THREE.Group();
  const roofY = 0.2 + coreH + topH;

  // Sleek white/grey roof suitable for printing a logo
  const roofBaseMat = new MeshStandardNodeMaterial({ flatShading: true });
  roofBaseMat.colorNode = color(0xdddddd);
  roofBaseMat.roughnessNode = float(0.8);

  const roofGeo = new THREE.BoxGeometry(topW - 0.5, 0.1, topD - 0.5);
  
  if (config.logo) {
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(config.logo, (texture) => {
      // Create a material specifically for the logo roof
      const logoMat = new THREE.MeshStandardMaterial({ 
        map: texture, 
        roughness: 0.8,
        flatShading: true 
      });
      const plainMat = new THREE.MeshStandardMaterial({ color: 0xdddddd, roughness: 0.8, flatShading: true });
      // Use the logo mat on the top face (face index 2 for BoxGeometry usually)
      const mats = [plainMat, plainMat, logoMat, plainMat, plainMat, plainMat];
      const flatRoof = new THREE.Mesh(roofGeo, mats);
      flatRoof.position.set(0, roofY + 0.05, 0);
      tagReveal(flatRoof, 0.65, 0.75);
      detailsGroup.add(flatRoof);
    });
  } else {
    const flatRoof = new THREE.Mesh(roofGeo, roofBaseMat);
    flatRoof.position.set(0, roofY + 0.05, 0);
    tagReveal(flatRoof, 0.65, 0.75);
    detailsGroup.add(flatRoof);
  }

  // Floating geometric art piece on the ground
  const sculpture = new THREE.Mesh(new THREE.IcosahedronGeometry(0.4), accentMat);
  sculpture.position.set(-width/2 + 1.5, 1.0, depth/2 - 1.5);
  sculpture.castShadow = true;
  tagReveal(sculpture, 0.85, 0.95);
  detailsGroup.add(sculpture);
  rotatingElements.push(sculpture);
  animatableProps.push(sculpture);

  group.add(detailsGroup);

  // --- ANIMATOR ENGINE ---
  const stageMap: Record<string, number> = {
    idea: 0.2,       
    prototype: 0.45, 
    shipped: 0.75,   
    landmark: 1.0    
  };
  
  let targetProgress = stageMap[config.stage] || 0.2;
  let currentProgress = targetProgress;

  const updatable: Updatable & { setStage?: (stage: string) => void, setProgress?: (p: number) => void } = {
    setStage: (stage: string) => {
      targetProgress = stageMap[stage] || 0.2;
    },
    setProgress: (progress: number) => {
      targetProgress = progress;
      currentProgress = progress; // Instant jump
    },
    update: (delta, time) => {
      const speed = 0.3;
      if (currentProgress < targetProgress) {
        currentProgress = Math.min(targetProgress, currentProgress + delta * speed);
      } else if (currentProgress > targetProgress) {
        currentProgress = Math.max(targetProgress, currentProgress - delta * speed);
      }

      group.traverse((child) => {
        if (child.userData.revealStart !== undefined) {
          const { revealStart, revealEnd, baseScale, isTempProp } = child.userData;
          if (isTempProp) {
            if (currentProgress < revealStart) {
              child.scale.setScalar(0);
            } else if (currentProgress >= revealStart && currentProgress <= revealEnd) {
              const t = Math.min(1.0, (currentProgress - revealStart) / 0.05);
              child.scale.copy(baseScale).multiplyScalar(easeOutElastic(t));
            } else {
              const t = 1.0 - Math.min(1.0, (currentProgress - revealEnd) / 0.05);
              child.scale.copy(baseScale).multiplyScalar(Math.max(0, t));
            }
          } else {
            if (currentProgress < revealStart) {
              child.scale.setScalar(0);
            } else if (currentProgress > revealEnd) {
              child.scale.copy(baseScale);
            } else {
              const t = (currentProgress - revealStart) / (revealEnd - revealStart);
              child.scale.copy(baseScale).multiplyScalar(easeOutElastic(t));
            }
          }
        }
      });

      if (currentProgress > 0.1 && currentProgress < 0.9) {
        craneData.updatable.update(delta);
      }

      rotatingElements.forEach(el => el.rotation.y += delta * 0.5);
      animatableProps.forEach(el => el.position.y = 1.0 + Math.sin((time || 0) * 2) * 0.1);
    }
  };

  updatable.update(0.01, 0); 
  
  return { group, updatable };
}
