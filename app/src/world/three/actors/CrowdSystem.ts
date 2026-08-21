import * as THREE from 'three';
import { MeshStandardNodeMaterial } from 'three/webgpu';
import { color, mx_noise_float, positionLocal, vec3, float, time, instanceIndex, hash, mix, smoothstep } from 'three/tsl';
import { visualTokens } from '../../../design/visualTokens';

export function createCrowdSystem(count: number, radius: number): THREE.InstancedMesh {
  const geo = new THREE.BoxGeometry(0.15, 0.15, 0.15); // Little cube people
  const mat = new MeshStandardNodeMaterial({ flatShading: true });
  
  // Base origin for each instance based on a hash
  const iNode = float(instanceIndex);
  
  // Generate a random origin within the radius
  const originX = hash(iNode.add(1.1)).mul(radius * 2).sub(radius);
  const originZ = hash(iNode.add(2.2)).mul(radius * 2).sub(radius);
  const origin = vec3(originX, 0.1, originZ);
  
  // Time-based wandering offset using noise
  const t = time.mul(0.2); // Walk speed
  
  const walkX = mx_noise_float(vec3(iNode, t, float(0.0))).sub(0.5).mul(4.0); // Walk radius
  const walkZ = mx_noise_float(vec3(iNode, float(0.0), t)).sub(0.5).mul(4.0);
  const offset = vec3(walkX, 0, walkZ);
  
  // Bobbing animation based on walking
  const bobbing = mx_noise_float(vec3(iNode, t.mul(10.0), float(0.0))).mul(0.1);
  
  mat.positionNode = positionLocal.add(origin).add(offset).add(vec3(0, bobbing, 0));
  
  // Randomize vibrant clothing colors! (P2 requirement, but we can do it now!)
  const randColor = hash(iNode.add(3.3));
  // Pick from a vibrant palette: pink, cyan, yellow, white
  // We can just use the hash to lerp between bright HSL colors, or mix specific colors.
  const c1 = color(0xff3366);
  const c2 = color(0x33ccff);
  const c3 = color(0xffcc00);
  const c4 = color(0xffffff);
  
  // TSL doesn't have a simple 4-way select natively without If/Else which might be complex, 
  // so we blend them based on thresholds
  const finalColor = mix(
    mix(c1, c2, smoothstep(0.0, 0.33, randColor)),
    mix(c3, c4, smoothstep(0.33, 0.66, randColor)),
    smoothstep(0.66, 1.0, randColor)
  );
  
  mat.colorNode = finalColor;
  mat.roughnessNode = float(0.8);
  
  const mesh = new THREE.InstancedMesh(geo, mat as any, count);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  
  // Bounding sphere so it doesn't get frustum culled easily
  mesh.frustumCulled = false; 
  
  return mesh;
}
