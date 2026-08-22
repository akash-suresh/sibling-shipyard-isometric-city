import * as THREE from 'three';
import { MeshStandardNodeMaterial } from 'three/webgpu';
import { color, mx_fractal_noise_float, mx_noise_float, positionWorld, vec3, smoothstep, mix, float, positionLocal, fract, step } from 'three/tsl';
import type { Updatable } from '../SceneManager';
import { visualTokens } from '../../../design/visualTokens';
import { 
  createExcavator, 
  createTowerCrane, 
  createDumpTruck, 
  createWorker,
  createChainlinkFence,
  createFoundationPit,
  createMaterialStacks
} from "./constructionProps";
import { createBuildingSign } from './BuildingSign';

export interface BuildingResult {
  group: THREE.Group;
  updatable?: Updatable;
}

// Easing function
function easeOutElastic(x: number): number {
  const c4 = (2 * Math.PI) / 3;
  return x === 0 ? 0 : x === 1 ? 1 : Math.pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * c4) + 1;
}

// Add metadata to a mesh/group for timeline animation
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

export function buildTower(config: {
  name: string;
  accent: string;
  status: string;
  stage: string;
}): BuildingResult {
  const group = new THREE.Group();
  
  // 1. Materials (The 4-Material Rule)
  const p = visualTokens.palette;
  // TSL Procedural Concrete
  const concreteMat = new MeshStandardNodeMaterial({ flatShading: true });
  const cBase = color(0xcccccc);
  const cSoot = color(0x555555);
  const cTone = mx_fractal_noise_float( positionWorld.mul( 0.05 ), 2 ).mul( 0.15 );
  const cStreak = mx_fractal_noise_float( vec3( positionWorld.x.mul( 1.5 ), positionWorld.y.mul( 0.1 ), positionWorld.z.mul( 1.5 ) ), 2 );
  const cDirt = smoothstep( -0.1, 0.45, cStreak ).mul(0.4);
  concreteMat.colorNode = mix(cBase, cSoot, cDirt).add(cTone);
  concreteMat.roughnessNode = float(0.9);

  // TSL Procedural Steel
  const steelMat = new MeshStandardNodeMaterial({ flatShading: true });
  const sBase = color(0x444455);
  const sRust = color(0x332211);
  const sNoise = mx_noise_float( positionWorld.mul( 0.5 ) );
  steelMat.colorNode = mix(sBase, sRust, sNoise.mul(0.3));
  steelMat.roughnessNode = float(0.4);
  steelMat.metalnessNode = float(0.8);

  // TSL Procedural Tech Glass
  const accentColor = parseInt(config.accent.replace('#', '0x'), 16) || p.nexus;
  const glassMat = new MeshStandardNodeMaterial({ 
    transparent: true, 
    opacity: 0.9, 
    flatShading: true
  });
  
  // Create a glowing grid for windows using positionLocal
  // Multiplying by 2 means each 1 unit box gets 2 windows
  const gridX = step(0.1, fract(positionLocal.x.mul(3.0)));
  const gridY = step(0.1, fract(positionLocal.y.mul(3.0)));
  const gridZ = step(0.1, fract(positionLocal.z.mul(3.0)));
  
  // The window is lit if it's NOT on a grid line
  // By multiplying all three, we ensure it only lights up in the center of the "panes"
  const isWindow = gridX.mul(gridY).mul(gridZ);
  
  glassMat.colorNode = mix(color(0x112233), color(accentColor), isWindow.mul(0.3));
  // The emissive glow is controlled by the window grid
  glassMat.emissiveNode = mix(color(0x000000), color(accentColor).mul(0.5), isWindow);
  glassMat.roughnessNode = float(0.1);
  glassMat.metalnessNode = float(0.9);
  const accentMat = new THREE.MeshStandardMaterial({ color: accentColor, flatShading: true, emissive: accentColor, emissiveIntensity: 0.5 }); // Emissive Accent
  
  // Base constants
  const plazaSize = 6;
  const foundationSize = 4.5;
  const numFloors = 5;
  const floorHeight = 1.6;

  // Track dynamic elements for the updatable
  const rotatingElements: THREE.Object3D[] = [];
  const animatableProps: THREE.Object3D[] = [];

  // --- STAGE 0.0 - 0.2: FOUNDATION & PLAZA ---
  const plazaGeo = new THREE.BoxGeometry(plazaSize, 0.1, plazaSize);
  const plaza = new THREE.Mesh(plazaGeo, concreteMat);
  plaza.position.y = 0.05;
  plaza.receiveShadow = true;
  tagReveal(plaza, 0.0, 0.1);
  group.add(plaza);

  const foundation = new THREE.Mesh(new THREE.BoxGeometry(foundationSize, 0.4, foundationSize), concreteMat);
  foundation.position.y = 0.3; 
  foundation.castShadow = true; foundation.receiveShadow = true;
  tagReveal(foundation, 0.05, 0.15);
  group.add(foundation);

  // --- STAGE 0.0 - 0.2: FOUNDATION & CRANE ---
  const constructionGroup = new THREE.Group();
  
  const pit = createFoundationPit(plazaSize, plazaSize);
  tagTempProp(pit, 0.0, 0.2); // Pit is filled in once skeleton rises
  constructionGroup.add(pit);

  const fence = createChainlinkFence(plazaSize + 0.2, plazaSize + 0.2);
  tagTempProp(fence, 0.0, 0.6); // Fence stays until mostly done
  constructionGroup.add(fence);

  const craneData = createTowerCrane(9.0); // Taller than the building, but not ridiculous
  const crane = craneData.group;
  crane.position.set(2.5, 0, -2.5); // Push it slightly further out
  crane.scale.set(1.4, 1.4, 1.4); // Scale the structure slightly
  tagTempProp(crane, 0.1, 0.75); // Crane leaves when skin is done
  constructionGroup.add(crane);
  // We can also let the crane use its own internal updatable for spinning its head!
  // rotatingElements.push(crane); // We don't need this, we'll use craneData.updatable

  const truck = createDumpTruck();
  truck.position.set(2, 0, 2);
  tagTempProp(truck, 0.05, 0.4);
  constructionGroup.add(truck);
  
  const stacks = createMaterialStacks();
  stacks.position.set(-2.5, 0, 2.5); // Place them on the grass
  tagTempProp(stacks, 0.0, 0.8); // Show during most of construction
  constructionGroup.add(stacks);
  
  // (Temp billboard removed per user request)
  
  group.add(constructionGroup);

  // --- STAGE 0.2 - 0.5: SKELETAL FRAME ---
  const frameGroup = new THREE.Group();
  let currentY = 0.5;
  for (let f = 0; f < numFloors; f++) {
    const floorSize = 4.0 - (f * 0.4); 
    
    // Core pillar
    const core = new THREE.Mesh(new THREE.BoxGeometry(floorSize * 0.5, floorHeight, floorSize * 0.5), concreteMat);
    core.position.y = currentY + floorHeight / 2;
    core.castShadow = true;
    tagReveal(core, 0.2 + (f * 0.05), 0.3 + (f * 0.05));
    frameGroup.add(core);

    // Steel columns
    for (let x of [-1, 1]) {
      for (let z of [-1, 1]) {
        const col = new THREE.Mesh(new THREE.BoxGeometry(0.1, floorHeight, 0.1), steelMat);
        col.position.set(x * (floorSize/2 - 0.1), currentY + floorHeight / 2, z * (floorSize/2 - 0.1));
        col.castShadow = true;
        tagReveal(col, 0.25 + (f * 0.05), 0.35 + (f * 0.05));
        frameGroup.add(col);
      }
    }

    currentY += floorHeight;
  }
  group.add(frameGroup);

  // --- STAGE 0.4 - 0.7: GLASS SKIN ---
  const skinGroup = new THREE.Group();
  currentY = 0.5;
  for (let f = 0; f < numFloors; f++) {
    const floorSize = 4.0 - (f * 0.4); 
    
    // Glass block surrounding the frame
    const glassFloor = new THREE.Mesh(new THREE.BoxGeometry(floorSize, floorHeight - 0.1, floorSize), glassMat);
    glassFloor.position.y = currentY + floorHeight / 2;
    glassFloor.castShadow = true;
    tagReveal(glassFloor, 0.4 + (f * 0.05), 0.55 + (f * 0.05));
    skinGroup.add(glassFloor);

    // Floor plate separator
    const plate = new THREE.Mesh(new THREE.BoxGeometry(floorSize + 0.1, 0.1, floorSize + 0.1), steelMat);
    plate.position.y = currentY;
    plate.castShadow = true;
    tagReveal(plate, 0.4 + (f * 0.05), 0.5 + (f * 0.05));
    skinGroup.add(plate);

    currentY += floorHeight;
  }
  group.add(skinGroup);

  // --- STAGE 0.7 - 0.9: ROOFTOP CLUTTER (eBoy style) ---
  const roofGroup = new THREE.Group();
  const roofSize = 4.0 - ((numFloors - 1) * 0.4);
  roofGroup.position.y = currentY;

  // Roof plate
  const roofPlate = new THREE.Mesh(new THREE.BoxGeometry(roofSize + 0.1, 0.1, roofSize + 0.1), steelMat);
  tagReveal(roofPlate, 0.7, 0.8);
  roofGroup.add(roofPlate);

  // HVAC Units
  for(let i=0; i<3; i++) {
    const hvac = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.3, 0.6), concreteMat);
    hvac.position.set(-roofSize/2 + 0.5 + (i*0.5), 0.2, -roofSize/2 + 0.5);
    hvac.castShadow = true;
    tagReveal(hvac, 0.75 + (i*0.02), 0.85);
    roofGroup.add(hvac);
  }

  // Communications Array
  const antennaGroup = new THREE.Group();
  antennaGroup.position.set(roofSize/2 - 0.5, 0.05, -roofSize/2 + 0.5); // Moved to back-right corner to not obscure logo
  tagReveal(antennaGroup, 0.8, 0.9);
  
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.1, 2), steelMat);
  mast.position.y = 1;
  mast.castShadow = true;
  antennaGroup.add(mast);

  const dish = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 8, 0, Math.PI * 2, 0, Math.PI / 2), concreteMat);
  dish.rotation.x = -Math.PI / 4;
  dish.position.y = 0.5;
  dish.castShadow = true;
  antennaGroup.add(dish);
  rotatingElements.push(dish); // Spin the dish

  roofGroup.add(antennaGroup);
  group.add(roofGroup);

  // --- STAGE 0.9 - 1.0: LIFE & ACCENTS ---
  const lifeGroup = new THREE.Group();
  
  // Corporate floating sculpture on the plaza
  const sculpture = new THREE.Mesh(new THREE.OctahedronGeometry(0.4), accentMat);
  sculpture.position.set(-2, 1, 2);
  sculpture.castShadow = true;
  tagReveal(sculpture, 0.9, 1.0);
  lifeGroup.add(sculpture);
  rotatingElements.push(sculpture);
  animatableProps.push(sculpture);

  group.add(lifeGroup);


  // --- ANIMATOR ENGINE ---
  const stageMap: Record<string, number> = {
    idea: 0.2,       // Foundation & Pit
    prototype: 0.45, // Skeleton up
    shipped: 1.0,    // Skin up and temp props gone
    landmark: 1.0    // Clutter & Life
  };
  
  let targetProgress = stageMap[config.stage] || 0.2;
  let currentProgress = targetProgress; // Start fully built on page load

  const updatable: Updatable & { setStage?: (stage: string) => void, setProgress?: (p: number) => void } = {
    setStage: (stage: string) => {
      targetProgress = stageMap[stage] || 0.2;
    },
    setProgress: (progress: number) => {
      targetProgress = progress;
      currentProgress = progress; // Instant jump for scrubbing
    },
    update: (delta, time) => {
      // Linear scrub for smooth elastic playback
      const speed = 0.3; // ~3.3 seconds for full 0 to 1 transition
      if (currentProgress < targetProgress) {
         currentProgress = Math.min(targetProgress, currentProgress + delta * speed);
      } else if (currentProgress > targetProgress) {
         currentProgress = Math.max(targetProgress, currentProgress - delta * speed);
      }

      // 1. Reveal/Hide logic
      group.traverse((child) => {
        if (child.userData.revealStart !== undefined) {
          const { revealStart, revealEnd, baseScale, isTempProp } = child.userData;
          
          if (isTempProp) {
            // Temp props pop in over 0.05 progress, stay at 1.0, then fade out over 0.05
            if (currentProgress < revealStart) {
              child.scale.setScalar(0);
            } else if (currentProgress >= revealStart && currentProgress <= revealEnd) {
              const t = Math.min(1.0, (currentProgress - revealStart) / 0.05);
              const scale = easeOutElastic(t);
              child.scale.copy(baseScale).multiplyScalar(scale);
            } else {
              const t = 1.0 - Math.min(1.0, (currentProgress - revealEnd) / 0.05);
              child.scale.copy(baseScale).multiplyScalar(Math.max(0, t));
            }
          } else {
            // Normal building components (grow over the entire start -> end window)
            if (currentProgress < revealStart) {
              child.scale.setScalar(0);
            } else if (currentProgress > revealEnd) {
              child.scale.copy(baseScale);
            } else {
              const t = (currentProgress - revealStart) / (revealEnd - revealStart);
              const scale = easeOutElastic(t);
              child.scale.copy(baseScale).multiplyScalar(scale);
            }
          }
        }
      });

      // 2. Ambient Animations
      if (currentProgress > 0.1 && currentProgress < 0.8) {
         craneData.updatable.update(delta);
      }

      rotatingElements.forEach(el => {
        el.rotation.y += delta * 0.5;
      });

      animatableProps.forEach(el => {
        // Bobbing up and down
        el.position.y = 1 + Math.sin((time || 0) * 2) * 0.1;
      });
    }
  };

  return { group, updatable };
}
