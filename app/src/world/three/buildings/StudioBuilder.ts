import * as THREE from 'three';
import { MeshStandardNodeMaterial } from 'three/webgpu';
import { color, mx_noise_float, mx_fractal_noise_float, positionWorld, vec3, mix, float, step, fract, positionLocal } from 'three/tsl';
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
  obj.scale.set(0, 0, 0); // Initially hidden
}

function tagTempProp(obj: THREE.Object3D, start: number, end: number) {
  obj.userData.isTempProp = true;
  obj.userData.revealStart = start;
  obj.userData.revealEnd = end;
  obj.userData.baseScale = obj.scale.clone();
  obj.scale.set(0, 0, 0); // Initially hidden
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

  // --- TSL Materials ---
  const glassMat = new MeshStandardNodeMaterial({ transparent: true, opacity: 0.7, flatShading: true });
  const gridX = step(0.05, fract(positionLocal.x.mul(2.0)));
  const gridY = step(0.05, fract(positionLocal.y.mul(2.0)));
  const gridZ = step(0.05, fract(positionLocal.z.mul(2.0)));
  const isWindow = gridX.mul(gridY).mul(gridZ);
  glassMat.colorNode = mix(color(0x112244), color(0x55aaff), isWindow.mul(0.6));
  glassMat.emissiveNode = mix(color(0x000000), color(0x55aaff).mul(0.3), isWindow);
  glassMat.roughnessNode = float(0.1);
  glassMat.metalnessNode = float(0.9);

  const solidMat = new MeshStandardNodeMaterial({ flatShading: true }); // White tech walls
  const wBase = color(0xf5f5f5);
  const wNoise = mx_noise_float(positionWorld.mul(1.5));
  solidMat.colorNode = mix(wBase, color(0xdddddd), wNoise.mul(0.2));
  solidMat.roughnessNode = float(0.7);

  const accentColor = parseInt(config.accent.replace('#', '0x'), 16) || p.nexus;
  const accentMat = new MeshStandardNodeMaterial({ flatShading: true });
  accentMat.colorNode = color(accentColor);
  accentMat.roughnessNode = float(0.3);

  const roofMat = new MeshStandardNodeMaterial({ flatShading: true });
  roofMat.colorNode = color(0x666666);
  roofMat.roughnessNode = float(0.9);

  const steelMat = new MeshStandardNodeMaterial({ flatShading: true });
  const sBase = color(0x333333);
  const sNoise = mx_noise_float(positionWorld.mul(2.5));
  steelMat.colorNode = mix(sBase, color(0x111111), sNoise.mul(0.5));
  steelMat.roughnessNode = float(0.4);
  steelMat.metalnessNode = float(0.8);

  const woodMat = new MeshStandardNodeMaterial({ flatShading: true });
  woodMat.colorNode = color(0x8b5a2b);
  woodMat.roughnessNode = float(0.8);

  const hvacMat = new MeshStandardNodeMaterial({ flatShading: true });
  hvacMat.colorNode = color(0xaaaaaa);
  hvacMat.roughnessNode = float(0.6);
  hvacMat.metalnessNode = float(0.5);

  const rotatingElements: THREE.Object3D[] = [];
  const animatableProps: THREE.Object3D[] = [];

  const width = 8;
  const depth = 8;
  const floorHeight = 3;

  // --- STAGE 0.0 - 0.2: FOUNDATION & PIT ---
  const constructionGroup = new THREE.Group();
  
  const pit = createFoundationPit(width + 0.5, depth + 0.5);
  tagTempProp(pit, 0.0, 0.2);
  constructionGroup.add(pit);

  const fence = createChainlinkFence(width + 1.5, depth + 1.5);
  tagTempProp(fence, 0.0, 0.7);
  constructionGroup.add(fence);

  const excavator = createExcavator();
  excavator.position.set(-width / 2 + 1, 0, -depth / 2 + 1);
  tagTempProp(excavator, 0.05, 0.3);
  constructionGroup.add(excavator);
  
  const truck = createDumpTruck();
  truck.position.set(width / 2 - 1, 0.1, depth / 2 + 2);
  tagTempProp(truck, 0.1, 0.6);
  constructionGroup.add(truck);
  
  const stacks = createMaterialStacks();
  stacks.position.set(-width / 2 - 1, 0, depth / 2 - 1);
  tagTempProp(stacks, 0.0, 0.75);
  constructionGroup.add(stacks);

  const craneData = createTowerCrane(10.0);
  const crane = craneData.group;
  crane.position.set(width / 2 + 1, 0, -depth / 2 - 1);
  tagTempProp(crane, 0.15, 0.8);
  constructionGroup.add(crane);
  
  group.add(constructionGroup);

  const foundation = new THREE.Mesh(new THREE.BoxGeometry(width, 0.2, depth), solidMat);
  foundation.position.y = 0.1;
  tagReveal(foundation, 0.1, 0.2);
  group.add(foundation);

  // --- STAGE 0.2 - 0.5: SKELETON ---
  const skeletonGroup = new THREE.Group();
  for (let y = 0; y < 2; y++) {
    for (let x = -width/2 + 0.2; x <= width/2; x += 2) {
      for (let z = -depth/2 + 0.2; z <= depth/2; z += 2) {
        if (y === 1 && (x > 0 && z > 0)) continue; // L-shape cutout
        
        const col = new THREE.Mesh(new THREE.BoxGeometry(0.1, floorHeight, 0.1), steelMat);
        col.position.set(x, 0.2 + y * floorHeight + floorHeight/2, z);
        tagReveal(col, 0.2 + (y * 0.1) + ((x + z + width) / (width * 4)) * 0.1, 0.35 + (y * 0.1));
        skeletonGroup.add(col);
      }
    }
  }
  group.add(skeletonGroup);

  // --- STAGE 0.4 - 0.7: FACADE ---
  const facadeGroup = new THREE.Group();
  
  // F1
  const f1Glass = new THREE.Mesh(new THREE.BoxGeometry(width - 0.2, floorHeight, depth - 0.2), glassMat);
  f1Glass.position.y = 0.2 + floorHeight/2;
  tagReveal(f1Glass, 0.4, 0.5);
  facadeGroup.add(f1Glass);

  const f1Frame = new THREE.Mesh(new THREE.BoxGeometry(width, 0.3, depth), accentMat);
  f1Frame.position.y = 0.2 + floorHeight;
  tagReveal(f1Frame, 0.45, 0.55);
  facadeGroup.add(f1Frame);

  const interiorFloor = new THREE.Mesh(new THREE.BoxGeometry(width - 0.5, 0.1, depth - 0.5), solidMat);
  interiorFloor.position.y = 0.2 + floorHeight;
  tagReveal(interiorFloor, 0.45, 0.55);
  facadeGroup.add(interiorFloor);

  // F2
  const f2Glass1 = new THREE.Mesh(new THREE.BoxGeometry(width/2, floorHeight, depth), glassMat);
  f2Glass1.position.set(-width/4, 0.2 + floorHeight + floorHeight/2, 0);
  tagReveal(f2Glass1, 0.5, 0.6);
  
  const f2Glass2 = new THREE.Mesh(new THREE.BoxGeometry(width/2, floorHeight, depth/2), glassMat);
  f2Glass2.position.set(width/4, 0.2 + floorHeight + floorHeight/2, -depth/4);
  tagReveal(f2Glass2, 0.55, 0.65);
  facadeGroup.add(f2Glass1, f2Glass2);

  const roof2_1 = new THREE.Mesh(new THREE.BoxGeometry(width/2, 0.2, depth), roofMat);
  roof2_1.position.set(-width/4, 0.2 + floorHeight * 2, 0);
  tagReveal(roof2_1, 0.6, 0.7);
  
  const roof2_2 = new THREE.Mesh(new THREE.BoxGeometry(width/2, 0.2, depth/2), roofMat);
  roof2_2.position.set(width/4, 0.2 + floorHeight * 2, -depth/4);
  tagReveal(roof2_2, 0.6, 0.7);
  facadeGroup.add(roof2_1, roof2_2);

  const deck = new THREE.Mesh(new THREE.BoxGeometry(width/2, 0.1, depth/2), woodMat);
  deck.position.set(width/4, 0.2 + floorHeight, depth/4);
  tagReveal(deck, 0.65, 0.75);
  facadeGroup.add(deck);

  group.add(facadeGroup);

  // --- STAGE 0.7 - 1.0: DETAILS ---
  const detailsGroup = new THREE.Group();
  
  const hvac = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.8, 1.5), hvacMat);
  hvac.position.set(-2, 0.2 + floorHeight * 2 + 0.4, -2);
  tagReveal(hvac, 0.7, 0.8);
  
  const hvac2 = new THREE.Mesh(new THREE.BoxGeometry(1, 0.8, 1.5), hvacMat);
  hvac2.position.set(-2, 0.2 + floorHeight * 2 + 0.4, 1);
  tagReveal(hvac2, 0.75, 0.85);
  detailsGroup.add(hvac, hvac2);

  const bench = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.5, 0.5), accentMat);
  bench.position.set(width/4, 0.2 + floorHeight + 0.25, depth/4);
  tagReveal(bench, 0.8, 0.9);
  detailsGroup.add(bench);

  if (config.logo) {
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(config.logo, (texture) => {
      const aspect = texture.image.width / texture.image.height;
      const logoW = 3;
      const logoD = logoW / aspect;
      const paintedLogo = new THREE.Mesh(
        new THREE.PlaneGeometry(logoW, logoD),
        new THREE.MeshStandardMaterial({ map: texture, transparent: true })
      );
      paintedLogo.rotation.x = -Math.PI / 2;
      paintedLogo.position.set(-width/4, 0.2 + floorHeight * 2 + 0.11, 0);
      tagReveal(paintedLogo, 0.85, 0.95);
      detailsGroup.add(paintedLogo);
    });
  }

  // Floating accent sculpture
  const sculpture = new THREE.Mesh(new THREE.OctahedronGeometry(0.5), accentMat);
  sculpture.position.set(width/4 + 1, 0.2 + floorHeight + 1.5, depth/4 + 1);
  tagReveal(sculpture, 0.9, 1.0);
  detailsGroup.add(sculpture);
  rotatingElements.push(sculpture);
  animatableProps.push(sculpture);

  group.add(detailsGroup);


  // --- ANIMATOR ENGINE ---
  const stageMap: Record<string, number> = {
    idea: 0.2,       // Foundation & Pit
    prototype: 0.45, // Skeleton up
    shipped: 0.75,   // Facade installed
    landmark: 1.0    // Detailed
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
      animatableProps.forEach(el => el.position.y = (0.2 + floorHeight + 1.5) + Math.sin((time || 0) * 2) * 0.1);
    }
  };

  updatable.update(0.01, 0); // initial tick
  
  return { group, updatable };
}
