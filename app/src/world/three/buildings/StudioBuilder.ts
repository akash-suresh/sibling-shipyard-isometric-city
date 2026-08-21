import * as THREE from 'three';
import type { Updatable } from '../SceneManager';
import { visualTokens } from '../../../design/visualTokens';
import { createTowerCrane, createExcavator, createChainlinkFence, createFoundationPit, createDumpTruck } from './constructionProps';

export interface BuildingResult {
  group: THREE.Group;
  updatable?: Updatable;
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

  // Timeline configuration
  const stageMap: Record<string, number> = {
    idea: 0.15,      // Foundation & Pit
    prototype: 0.45, // Skeleton up
    shipped: 0.75,   // Facade installed
    landmark: 1.0    // Detailed
  };
  
  let targetProgress = stageMap[config.stage] || 0.2;
  let currentProgress = targetProgress;

  // Materials
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x55aaff, transparent: true, opacity: 0.6, metalness: 0.9, roughness: 0.1, flatShading: true });
  const solidMat = new THREE.MeshStandardMaterial({ color: 0xf5f5f5, flatShading: true }); // White tech walls
  const accentMat = new THREE.MeshStandardMaterial({ color: config.accent, flatShading: true });
  const roofMat = new THREE.MeshStandardMaterial({ color: 0x666666, flatShading: true });
  const steelMat = new THREE.MeshStandardMaterial({ color: 0x444444, flatShading: true });
  const woodMat = new THREE.MeshStandardMaterial({ color: 0x8b5a2b, flatShading: true });
  const hvacMat = new THREE.MeshStandardMaterial({ color: 0xaaaaaa, flatShading: true });

  const constructionGroup = new THREE.Group();
  const finishedGroup = new THREE.Group();
  
  // Dimensions
  const width = 8;
  const depth = 8;
  const floorHeight = 3;

  // 1. Pit and Foundation (Idea)
  const pit = createFoundationPit(width + 0.5, depth + 0.5);
  const foundation = new THREE.Mesh(new THREE.BoxGeometry(width, 0.2, depth), solidMat);
  foundation.position.y = 0.1;

  // 2. Steel Skeleton (Prototype)
  const skeletonGroup = new THREE.Group();
  for (let y = 0; y < 2; y++) {
    for (let x = -width/2 + 0.2; x <= width/2; x += 2) {
      for (let z = -depth/2 + 0.2; z <= depth/2; z += 2) {
        if (y === 1 && (x > 0 && z > 0)) continue; // L-shape cutout for patio on floor 2
        
        const col = new THREE.Mesh(new THREE.BoxGeometry(0.1, floorHeight, 0.1), steelMat);
        col.position.set(x, 0.2 + y * floorHeight + floorHeight/2, z);
        skeletonGroup.add(col);
      }
    }
  }

  // 3. Facade & Walls (Shipped)
  const facadeGroup = new THREE.Group();
  
  // Floor 1 (Full box)
  const f1Glass = new THREE.Mesh(new THREE.BoxGeometry(width - 0.2, floorHeight, depth - 0.2), glassMat);
  
  // Mullions for F1
  for(let x=-width/2 + 1; x<=width/2 - 1; x+=2) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.1, floorHeight, depth), steelMat);
    m.position.set(x, 0.2 + floorHeight/2, 0);
    facadeGroup.add(m);
  }
  for(let z=-depth/2 + 1; z<=depth/2 - 1; z+=2) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(width, floorHeight, 0.1), steelMat);
    m.position.set(0, 0.2 + floorHeight/2, z);
    facadeGroup.add(m);
  }
  f1Glass.position.y = 0.2 + floorHeight/2;
  const f1Frame = new THREE.Mesh(new THREE.BoxGeometry(width, 0.3, depth), accentMat);
  f1Frame.position.y = 0.2 + floorHeight;
  facadeGroup.add(f1Glass, f1Frame);

  // Interior floor so it's not empty
  const interiorFloor = new THREE.Mesh(new THREE.BoxGeometry(width - 0.5, 0.1, depth - 0.5), solidMat);
  interiorFloor.position.y = 0.2 + floorHeight;
  facadeGroup.add(interiorFloor);


  // Floor 2 (L-Shape)
  const f2Glass1 = new THREE.Mesh(new THREE.BoxGeometry(width/2, floorHeight, depth), glassMat);
  f2Glass1.position.set(-width/4, 0.2 + floorHeight + floorHeight/2, 0);
  const f2Glass2 = new THREE.Mesh(new THREE.BoxGeometry(width/2, floorHeight, depth/2), glassMat);
  f2Glass2.position.set(width/4, 0.2 + floorHeight + floorHeight/2, -depth/4);
  facadeGroup.add(f2Glass1, f2Glass2);
  
  // Mullions for F2 Glass 1
  for(let x=-width/2 + 1; x<=0 - 1; x+=2) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.1, floorHeight, depth), steelMat);
    m.position.set(x, 0.2 + floorHeight*1.5, 0);
    facadeGroup.add(m);
  }
  for(let z=-depth/2 + 1; z<=depth/2 - 1; z+=2) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(width/2, floorHeight, 0.1), steelMat);
    m.position.set(-width/4, 0.2 + floorHeight*1.5, z);
    facadeGroup.add(m);
  }


  // Roof & Patio
  const roof2_1 = new THREE.Mesh(new THREE.BoxGeometry(width/2, 0.2, depth), roofMat);
  roof2_1.position.set(-width/4, 0.2 + floorHeight * 2, 0);
  const roof2_2 = new THREE.Mesh(new THREE.BoxGeometry(width/2, 0.2, depth/2), roofMat);
  roof2_2.position.set(width/4, 0.2 + floorHeight * 2, -depth/4);
  facadeGroup.add(roof2_1, roof2_2);
  
  // Patio Deck (Wood)
  const deck = new THREE.Mesh(new THREE.BoxGeometry(width/2, 0.1, depth/2), woodMat);
  deck.position.set(width/4, 0.2 + floorHeight, depth/4);
  facadeGroup.add(deck);

  // 4. Details (Landmark)
  const detailsGroup = new THREE.Group();
  
  // AC Units on Roof
  const hvac = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.8, 1.5), hvacMat);
  hvac.position.set(-2, 0.2 + floorHeight * 2 + 0.4, -2);
  const hvac2 = new THREE.Mesh(new THREE.BoxGeometry(1, 0.8, 1.5), hvacMat);
  hvac2.position.set(-2, 0.2 + floorHeight * 2 + 0.4, 1);
  detailsGroup.add(hvac, hvac2);

  // Patio Furniture
  const bench = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.5, 0.5), accentMat);
  bench.position.set(width/4, 0.2 + floorHeight + 0.25, depth/4);
  detailsGroup.add(bench);
  
  // Logo on patio deck or roof
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
      detailsGroup.add(paintedLogo);
    });
  }

  finishedGroup.add(pit, foundation, skeletonGroup, facadeGroup, detailsGroup);
  group.add(finishedGroup);

  // 5. Construction Equipment
  const crane = createTowerCrane(10.0);
  crane.group.position.set(width/2 + 1, 0, -depth/2 - 1);
  const truck = createDumpTruck();
  truck.position.set(-width/2 - 1, 0.1, depth/2 + 1);
  const fence = createChainlinkFence(width + 1, depth + 1);
  fence.position.y = 0.1;
  
  constructionGroup.add(crane.group, truck, fence);
  group.add(constructionGroup);

  // --- Animation & Visibility Logic ---
  const tagTempProp = (obj: THREE.Object3D, revealStart: number, revealEnd: number) => {
    obj.userData = { revealStart, revealEnd, baseScale: obj.scale.clone() };
  };

  tagTempProp(pit, 0.0, 0.2);
  tagTempProp(foundation, 0.1, 1.0);
  tagTempProp(skeletonGroup, 0.2, 0.75); // skeleton shrinks away after shipped
  tagTempProp(facadeGroup, 0.5, 0.75); // facade finishes growing at shipped
  tagTempProp(detailsGroup, 0.75, 0.9);
  tagTempProp(constructionGroup, 0.0, 0.95);

  const updatable: Updatable & { setStage?: (stage: string) => void, setProgress?: (p: number) => void } = {
    setStage: (stage: string) => {
      targetProgress = stageMap[stage] || 0.2;
    },
    setProgress: (progress: number) => {
      targetProgress = progress;
      currentProgress = progress; // instant
    },
    update: (delta, time) => {
      const speed = 0.5;
      if (currentProgress < targetProgress) {
        currentProgress = Math.min(targetProgress, currentProgress + delta * speed);
      } else if (currentProgress > targetProgress) {
        currentProgress = Math.max(targetProgress, currentProgress - delta * speed);
      }

      const p = currentProgress;
      
      const checkAndScale = (obj: THREE.Object3D) => {
        if (obj.userData.revealStart !== undefined) {
          const { revealStart, revealEnd, baseScale } = obj.userData;
          if (p >= revealStart && p <= revealEnd) {
            const t = (p - revealStart) / (revealEnd - revealStart);
            obj.scale.copy(baseScale).multiplyScalar(THREE.MathUtils.clamp(t * 1.5, 0, 1));
          } else if (p > revealEnd) {
             if (revealEnd < 0.99) {
                const t = (p - revealEnd) / 0.1;
                obj.scale.copy(baseScale).multiplyScalar(THREE.MathUtils.clamp(1 - t * 1.5, 0, 1));
             } else {
                obj.scale.copy(baseScale);
             }
          } else {
            obj.scale.setScalar(0.001);
          }
        }
      };

      finishedGroup.children.forEach(checkAndScale);
      checkAndScale(constructionGroup);
      
      if (crane.updatable) crane.updatable.update(delta, time);
    }
  };

  updatable.update(0.1, 0); // initial tick

  return {
    group,
    updatable
  };
}
