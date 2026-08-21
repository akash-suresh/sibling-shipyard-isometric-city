import * as THREE from 'three';
import { createVoxelText } from '../utils/VoxelText';
import type { ProjectDefinition } from '../../../data/types';

export function createBuildingSign(project: ProjectDefinition): THREE.Group {
  const signGroup = new THREE.Group();
  const textMat = new THREE.MeshLambertMaterial({ color: '#ffffff', flatShading: true });
  
  // Voxel text
  const text = createVoxelText(project.name.toUpperCase(), textMat, { letterSpacing: 1 });
  
  // Create a background panel using project accent color
  const textWidth = project.name.length * 5; // approx 4 block width + 1 block space
  
  const panelGeo = new THREE.BoxGeometry(textWidth + 2, 7, 1);
  const panelMat = new THREE.MeshLambertMaterial({ color: project.building.accent, flatShading: true });
  const panel = new THREE.Mesh(panelGeo, panelMat);
  
  // Center text on panel
  text.position.set(-textWidth / 2 + 3, -2.5, 0.5);
  
  signGroup.add(panel);
  signGroup.add(text);
  
  // Ensure shadows
  signGroup.traverse(child => {
    if (child instanceof THREE.Mesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });
  
  return signGroup;
}
