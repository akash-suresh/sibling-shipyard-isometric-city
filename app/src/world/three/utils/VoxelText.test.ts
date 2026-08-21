import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { createVoxelText, VOXEL_FONT } from './VoxelText';

describe('VoxelText', () => {
  const testMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });

  it('contains uppercase letters A-Z, numbers 0-9, and space in VOXEL_FONT', () => {
    // Letters A-Z
    for (let c = 65; c <= 90; c++) {
      const char = String.fromCharCode(c);
      expect(VOXEL_FONT[char], `Missing font character ${char}`).toBeDefined();
      expect(VOXEL_FONT[char].length).toBe(5);
    }

    // Numbers 0-9
    for (let n = 0; n <= 9; n++) {
      const char = n.toString();
      expect(VOXEL_FONT[char], `Missing font number ${char}`).toBeDefined();
      expect(VOXEL_FONT[char].length).toBe(5);
    }

    // Space
    expect(VOXEL_FONT[' ']).toBeDefined();
    expect(VOXEL_FONT[' '].length).toBe(5);
  });

  it('creates a THREE.Group with expected voxel meshes for a character', () => {
    const group = createVoxelText('A', testMaterial);
    expect(group).toBeInstanceOf(THREE.Group);

    // 'A' has 11 voxel bits set to 1 in 4x5 grid
    // Row 0: 0,1,1,0 (2)
    // Row 1: 1,0,0,1 (2)
    // Row 2: 1,1,1,1 (4)
    // Row 3: 1,0,0,1 (2)
    // Row 4: 1,0,0,1 (2) -> sum = 12 bits
    const onesInA = VOXEL_FONT['A'].flat().filter(v => v === 1).length;
    expect(group.children.length).toBe(onesInA);

    // Each child should be a THREE.Mesh with BoxGeometry
    group.children.forEach(child => {
      expect(child).toBeInstanceOf(THREE.Mesh);
      const mesh = child as THREE.Mesh;
      expect(mesh.geometry).toBeInstanceOf(THREE.BoxGeometry);
      expect(mesh.material).toBe(testMaterial);
    });
  });

  it('handles spaces without creating meshes for empty cells and advances position', () => {
    const groupEmpty = createVoxelText('   ', testMaterial);
    expect(groupEmpty.children.length).toBe(0);

    const groupWithSpace = createVoxelText('A A', testMaterial);
    const onesInA = VOXEL_FONT['A'].flat().filter(v => v === 1).length;
    expect(groupWithSpace.children.length).toBe(onesInA * 2);

    // Check that second 'A' meshes have X coordinates offset past the first 'A' + space
    // 'A' width = 4, spacing = 1 -> cursor after A = 5. Space width = 4, spacing = 1 -> cursor after space = 10.
    const xCoords = groupWithSpace.children.map(c => c.position.x);
    const secondA_XCoords = xCoords.filter(x => x >= 10);
    expect(secondA_XCoords.length).toBe(onesInA);
  });

  it('is case-insensitive for lowercase input', () => {
    const upperGroup = createVoxelText('HELLO 123', testMaterial);
    const lowerGroup = createVoxelText('hello 123', testMaterial);
    expect(lowerGroup.children.length).toBe(upperGroup.children.length);
  });

  it('supports custom letter spacing', () => {
    const defaultGroup = createVoxelText('AB', testMaterial);
    const spacedGroup = createVoxelText('AB', testMaterial, { letterSpacing: 5 });

    const onesInA = VOXEL_FONT['A'].flat().filter(v => v === 1).length;
    // The first voxel of B in default spacing starts at 4 + 1 = 5
    // In spacedGroup with letterSpacing: 5, it starts at 4 + 5 = 9
    const defaultB_minX = Math.min(...defaultGroup.children.slice(onesInA).map(c => c.position.x));
    const spacedB_minX = Math.min(...spacedGroup.children.slice(onesInA).map(c => c.position.x));

    expect(defaultB_minX).toBe(5);
    expect(spacedB_minX).toBe(9);
  });
});
