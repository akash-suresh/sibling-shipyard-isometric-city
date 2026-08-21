import * as THREE from 'three';
import type { TownLayout } from '../layout/townLayout';
import { CELL_SIZE } from './TerrainBuilder';
import { visualTokens } from '../../design/visualTokens';
import { FontLoader, Font } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';

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

export class DecorBuilder {
  scene: THREE.Scene;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  placeDecor(layout: TownLayout): THREE.Group {
    const group = new THREE.Group();
    const p = visualTokens.palette;

    const dirtMat = new THREE.MeshStandardMaterial({ color: p.soil, flatShading: true });
    const grassMat = new THREE.MeshStandardMaterial({ color: p.hedge, flatShading: true });
    const poleMat = new THREE.MeshStandardMaterial({ color: p.metal, flatShading: true });
    const lampMat = new THREE.MeshStandardMaterial({ color: p.activeLight, emissive: p.activeLight, emissiveIntensity: 1, flatShading: true });
    const woodMat = new THREE.MeshStandardMaterial({ color: p.soil, flatShading: true });
    const shrubMat = new THREE.MeshStandardMaterial({ color: p.hedgeShadow, flatShading: true });
    const flowerMat = new THREE.MeshStandardMaterial({ color: 0xE91E63, flatShading: true });
    const signMat = new THREE.MeshStandardMaterial({ color: p.water, flatShading: true });

    layout.decor.forEach(decor => {
      const worldX = decor.grid.x * CELL_SIZE + (decor.offset?.x || 0) * 0.02;
      const worldZ = decor.grid.y * CELL_SIZE + (decor.offset?.y || 0) * 0.02;

      const mesh = new THREE.Group();
      mesh.position.set(worldX, 0, worldZ);

      switch (decor.kind) {
        case "tree": {
          const trunk = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1, 0.2), dirtMat);
          trunk.position.y = 0.5;
          trunk.castShadow = true;
          mesh.add(trunk);

          const canopy1 = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.2, 1.2), grassMat);
          canopy1.position.y = 1.3;
          canopy1.castShadow = true;
          const canopy2 = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 0.8), grassMat);
          canopy2.position.set(0.3, 1.7, -0.3);
          canopy2.castShadow = true;
          mesh.add(canopy1, canopy2);
          break;
        }
        case "lamp": {
          const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.5), poleMat);
          pole.position.y = 0.75;
          pole.castShadow = true;
          mesh.add(pole);

          const light = new THREE.Mesh(new THREE.SphereGeometry(0.15), lampMat);
          light.position.y = 1.6;
          light.userData.isWindow = true; // Make it glow at night
          mesh.add(light);
          
          const pointLight = new THREE.PointLight(0xffeedd, 0.0, 12.0);
          pointLight.position.y = 1.6;
          pointLight.userData.isStreetlight = true;
          mesh.add(pointLight);
          break;
        }
        case "bench": {
          const seat = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.1, 0.4), woodMat);
          seat.position.y = 0.2;
          seat.castShadow = true;
          mesh.add(seat);

          const back = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.4, 0.1), woodMat);
          back.position.set(0, 0.45, -0.15);
          back.castShadow = true;
          mesh.add(back);
          break;
        }
        case "shrub": {
          const shrub = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.6, 0.6), shrubMat);
          shrub.position.y = 0.3;
          shrub.castShadow = true;
          mesh.add(shrub);
          break;
        }
        case "flowers": {
          for (let i = 0; i < 3; i++) {
            const flower = new THREE.Mesh(new THREE.SphereGeometry(0.05), flowerMat);
            flower.position.set((Math.random() - 0.5) * 0.4, 0.05, (Math.random() - 0.5) * 0.4);
            mesh.add(flower);
          }
          break;
        }
        case "sign": {
          const post = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.6), poleMat);
          post.position.y = 0.3;
          post.castShadow = true;
          mesh.add(post);

          const board = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.3, 0.05), signMat);
          board.position.set(0, 0.6, 0.03);
          board.castShadow = true;
          mesh.add(board);
          break;
        }
      }

      group.add(mesh);
    });

    // --- SIBLING SHIPYARD MONUMENT (Coal Drops Yard style) ---
    const monumentGroup = new THREE.Group();
    const brickMat = new THREE.MeshStandardMaterial({ color: 0x9b3f2f, flatShading: true }); // Richer, redder Victorian brick
    const roofMat = new THREE.MeshStandardMaterial({ color: 0x222222, flatShading: true }); // Dark slate roof
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x88ccff, transparent: true, opacity: 0.6, flatShading: true });
    
    // Create the kissing viaducts cross-section
    const shape = new THREE.Shape();
    shape.moveTo(-5, 0); // Left outer base
    shape.lineTo(-2, 0); // Left inner base (the river will flow right between -2 and 2!)
    shape.quadraticCurveTo(-1.5, 3.5, 0, 4.0); // Swoop up to center kiss
    shape.quadraticCurveTo(1.5, 3.5, 2, 0); // Swoop down to right inner base
    shape.lineTo(5, 0); // Right outer base
    shape.lineTo(5, 2.5); // Right outer wall
    shape.quadraticCurveTo(1.5, 4.0, 0, 4.5); // Right roof swoop up
    shape.quadraticCurveTo(-1.5, 4.0, -5, 2.5); // Left roof swoop down
    shape.lineTo(-5, 0); // Back to start
    
    const extrudeSettings = {
      steps: 1,
      depth: 16, // Longer to span more of the river
      bevelEnabled: true,
      bevelThickness: 0.1,
      bevelSize: 0.1,
      bevelSegments: 2
    };

    const viaductGeo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    // Center the extrusion on Z
    viaductGeo.translate(0, 0, -8);
    const viaduct = new THREE.Mesh(viaductGeo, brickMat);
    viaduct.castShadow = true;
    viaduct.receiveShadow = true;
    monumentGroup.add(viaduct);

    // Add large glass facades closing off the front and back of the swoops
    const glassShape = new THREE.Shape();
    glassShape.moveTo(-1.9, 0);
    glassShape.quadraticCurveTo(-1.5, 3.4, 0, 3.9);
    glassShape.quadraticCurveTo(1.5, 3.4, 1.9, 0);
    glassShape.lineTo(-1.9, 0);

    const glassExtrudeSettings = { steps: 1, depth: 0.2, bevelEnabled: false };
    const glassFront = new THREE.Mesh(new THREE.ExtrudeGeometry(glassShape, glassExtrudeSettings), glassMat);
    glassFront.position.z = 7.9;
    const glassBack = new THREE.Mesh(new THREE.ExtrudeGeometry(glassShape, glassExtrudeSettings), glassMat);
    glassBack.position.z = -8.1;
    monumentGroup.add(glassFront, glassBack);

    // Add some archways along the brick viaducts for that classic look
    for (let z = -6; z <= 6; z += 3) {
      for (let side of [-1, 1]) {
        // Cutout arches along the outer walls
        const arch = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 0.5, 16), glassMat);
        arch.rotation.x = Math.PI / 2;
        arch.rotation.z = Math.PI / 2;
        arch.position.set(side * 5.0, 1.2, z);
        monumentGroup.add(arch);
      }
    }

    // Add the "SIBLING SHIPYARD" sign PAINTED on the roof (1800s old-school style)
    const whitePaintMat = new THREE.MeshStandardMaterial({ 
      color: 0xffffff, 
      roughness: 0.9, 
      flatShading: true,
      transparent: true,
      opacity: 0.9, // Slightly faded
      side: THREE.DoubleSide
    });
    
    loadFont((font) => {
      const createDecal = (text: string, mat: THREE.Material) => {
        const geo = new TextGeometry(text, {
          font, size: 1.2, depth: 0.02, curveSegments: 2,
          bevelEnabled: false
        });
        geo.computeBoundingBox();
        const mesh = new THREE.Mesh(geo, mat);
        return { mesh, width: (geo.boundingBox!.max.x - geo.boundingBox!.min.x) };
      };
      
      const text = "SIBLING  SHIPYARD"; // Double space between words
      const tracking = 0.3; // Extra space between letters
      const wordGroup = new THREE.Group();
      
      let cursorX = 0;
      for (let i = 0; i < text.length; i++) {
        const char = text[i];
        if (char === ' ') {
          cursorX += 0.6; // Width of a space
          continue;
        }
        
        const { mesh, width } = createDecal(char, whitePaintMat);
        
        // Keep scaleX relatively high so it remains BOLD, make scaleY high for height
        const scaleX = 0.7; 
        const scaleY = 1.3;
        mesh.scale.set(scaleX, scaleY, 1.0);
        mesh.position.set(cursorX, 0, 0);
        
        wordGroup.add(mesh);
        cursorX += (width * scaleX) + tracking;
      }
      
      // Center the built word group on its X axis
      wordGroup.position.x = -cursorX / 2;
      
      // Wrap it in a layout group to lay it flat and align it to the Z axis
      const layoutGroup = new THREE.Group();
      layoutGroup.add(wordGroup);
      layoutGroup.rotation.x = -Math.PI / 2;
      layoutGroup.rotation.z = Math.PI / 2;

      
      const textGroup = new THREE.Group();
      // Place it perfectly centered on the RIGHT roof. 
      // Right roof goes from X=0 to X=5. Center is X=2.5.
      // At X=2.5, curve Y is ~3.54. Using Y=3.7 to float safely above it.
      textGroup.position.set(2.5, 3.7, 0);
      textGroup.rotation.z = -0.41; // Accurate slope tangent at X=2.5
      
      textGroup.add(layoutGroup);
      monumentGroup.add(textGroup);
    });

    // Make the building bigger (Scale 0.9 instead of 0.6)
    monumentGroup.scale.set(0.9, 0.9, 0.9);

    // Position monument directly OVER the river (River is exactly at X=2).
    // The river stretches from Y=0 to 23 along the Z axis visually.
    const plazaCenterX = 2.5 * CELL_SIZE; // Adjust slightly if the river cell is centered at 2 or 2.5
    // Wait, river is at x=2. Its cell covers 2.0 to 3.0. Center of the river is 2.5.
    const plazaCenterZ = 6 * CELL_SIZE;
    monumentGroup.position.set(plazaCenterX, 0, plazaCenterZ);
    
    group.add(monumentGroup);

    const width = layout.width * CELL_SIZE;
    const depth = layout.height * CELL_SIZE;
    group.position.set(-width / 2 + CELL_SIZE / 2, 0, -depth / 2 + CELL_SIZE / 2);

    return group;
  }
}
