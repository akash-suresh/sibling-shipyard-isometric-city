import * as THREE from 'three';
import { FontLoader, Font } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import type { ProjectDefinition } from '../../../data/types';

let cachedFont: Font | null = null;
const fontLoader = new FontLoader();
const textureLoader = new THREE.TextureLoader();

function loadFont(callback: (font: Font) => void) {
  if (cachedFont) {
    callback(cachedFont);
    return;
  }
  fontLoader.load('/fonts/helvetiker_bold.typeface.json', (font) => {
    cachedFont = font;
    callback(font);
  });
}

export function createBuildingSign(project: ProjectDefinition, forceText: boolean = false): THREE.Group {
  const signGroup = new THREE.Group();
  
  if (project.logo && !forceText) {
    // If a logo is provided, create a sleek billboard panel
    const billboardGeo = new THREE.BoxGeometry(12, 12, 2); // Make it slightly larger
    const accentMat = new THREE.MeshStandardMaterial({ color: project.building.accent, flatShading: true });
    
    const billboard = new THREE.Mesh(billboardGeo, accentMat);
    billboard.castShadow = true;
    billboard.receiveShadow = true;
    signGroup.add(billboard);
    
    // Load the texture
    textureLoader.load(project.logo, (texture) => {
      // Calculate aspect ratio
      const aspect = texture.image.width / texture.image.height;
      
      // Determine logo plane size (leaving a 1-unit padding on the billboard)
      const maxDim = 10;
      const width = aspect >= 1 ? maxDim : maxDim * aspect;
      const height = aspect >= 1 ? maxDim / aspect : maxDim;
      
      // Resize billboard to neatly frame the logo
      billboard.scale.set((width + 2) / 12, (height + 2) / 12, 1);
      
      const logoPlane = new THREE.Mesh(
        new THREE.PlaneGeometry(width, height),
        new THREE.MeshStandardMaterial({ 
          map: texture, 
          transparent: true, // Respect PNG transparency
          roughness: 0.2,
          metalness: 0.5,
          emissive: 0xffffff,
          emissiveMap: texture,
          emissiveIntensity: 0.3 // Glow!
        })
      );
      
      // Position logo slightly in front of the billboard
      logoPlane.position.z = 1.05;
      
      signGroup.add(logoPlane);
    });
  } else {
    // Fallback to text sign
    const estimatedTextWidth = project.name.length * 8; 
    
    const panelGeo = new THREE.BoxGeometry(estimatedTextWidth + 6, 12, 3);
    const panelMat = new THREE.MeshStandardMaterial({ color: project.building.accent, flatShading: true });
    const panel = new THREE.Mesh(panelGeo, panelMat);
    panel.castShadow = true;
    panel.receiveShadow = true;
    signGroup.add(panel);

    loadFont((font) => {
      const textGeo = new TextGeometry(project.name.toUpperCase(), {
        font: font,
        size: 8,
        depth: 2,
        curveSegments: 2,
        bevelEnabled: true,
        bevelThickness: 0.5,
        bevelSize: 0.2,
        bevelSegments: 2
      });

      textGeo.computeBoundingBox();
      const xOffset = -0.5 * (textGeo.boundingBox!.max.x - textGeo.boundingBox!.min.x);
      const yOffset = -0.5 * (textGeo.boundingBox!.max.y - textGeo.boundingBox!.min.y);
      
      const actualWidth = textGeo.boundingBox!.max.x - textGeo.boundingBox!.min.x;
      panel.scale.x = (actualWidth + 8) / (estimatedTextWidth + 6);
      
      const textMat = new THREE.MeshStandardMaterial({ color: '#ffffff', flatShading: true });
      const textMesh = new THREE.Mesh(textGeo, textMat);
      textMesh.position.set(xOffset, yOffset, 1.0);
      textMesh.castShadow = true;
      textMesh.receiveShadow = true;
      
      signGroup.add(textMesh);
    });
  }

  return signGroup;
}
