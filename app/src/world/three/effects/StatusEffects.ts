import * as THREE from 'three';
import type { Updatable } from '../SceneManager';

export function applyStatusEffects(group: THREE.Group, status: string): Updatable[] {
  const updatables: Updatable[] = [];

  switch (status) {
    case 'incident': {
      // 1. Red flashing beacon on the ground
      const beaconGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.5, 8);
      const beaconMat = new THREE.MeshStandardMaterial({ flatShading: true, 
        color: 0xff0000, 
        emissive: 0xff0000, 
        emissiveIntensity: 5,
        transparent: true
      });
      const beaconMesh = new THREE.Mesh(beaconGeo, beaconMat);
      beaconMesh.position.set(-1, 0.25, 2);
      group.add(beaconMesh);

      const beaconLight = new THREE.PointLight(0xff0000, 2, 10);
      beaconMesh.add(beaconLight);

      updatables.push({
        update(delta: number, time: number) {
          const intensity = (Math.sin(time * 10) + 1) / 2;
          beaconMat.opacity = 0.5 + intensity * 0.5;
          beaconLight.intensity = intensity * 4;
        }
      });

      // 2. Dramatic Fire flickering meshes & lights
      const fireGroup = new THREE.Group();
      group.add(fireGroup);
      
      const fireGeo = new THREE.BoxGeometry(0.8, 0.8, 0.8);
      const fireMat = new THREE.MeshStandardMaterial({ flatShading: true,
        color: 0xffaa00,
        emissive: 0xff4400,
        emissiveIntensity: 3,
      });
      
      const fires: { mesh: THREE.Mesh, phase: number, speed: number }[] = [];
      for(let i = 0; i < 15; i++) {
        const fireMesh = new THREE.Mesh(fireGeo, fireMat);
        const radius = Math.random() * 1.5;
        const angle = Math.random() * Math.PI * 2;
        fireMesh.position.set(Math.cos(angle) * radius, 0.5 + Math.random(), Math.sin(angle) * radius);
        
        fireGroup.add(fireMesh);
        fires.push({ mesh: fireMesh, phase: Math.random() * Math.PI * 2, speed: 10 + Math.random() * 10 });
      }

      const fireLight = new THREE.PointLight(0xff6600, 8, 15);
      fireLight.position.set(0, 2, 0);
      fireGroup.add(fireLight);

      // 3. Billowing Smoke Stream
      const smokeGeo = new THREE.BoxGeometry(1, 1, 1);
      const smokeMat = new THREE.MeshStandardMaterial({ flatShading: true,
        color: 0x222222,
      });
      
      const smokeParticles: { mesh: THREE.Mesh, offset: number, speed: number, x: number, z: number }[] = [];
      for(let i = 0; i < 20; i++) {
        const smokeMesh = new THREE.Mesh(smokeGeo, smokeMat);
        smokeMesh.castShadow = true;
        fireGroup.add(smokeMesh);
        smokeParticles.push({
          mesh: smokeMesh,
          offset: Math.random(),
          speed: 0.5 + Math.random() * 0.5,
          x: (Math.random() - 0.5) * 1.5,
          z: (Math.random() - 0.5) * 1.5
        });
      }

      updatables.push({
        update(delta: number, time: number) {
          // Animate fire (voxel popping effect)
          fires.forEach(f => {
            const yOffset = (time * f.speed * 0.2 + f.phase) % 2;
            f.mesh.position.y = 0.5 + yOffset;
            const scale = Math.max(0, 1 - yOffset * 0.5);
            f.mesh.scale.set(scale, scale, scale);
          });
          
          // Flicker light
          fireLight.intensity = 5 + Math.random() * 5;
          
          // Animate smoke stream (chunky voxel rising)
          smokeParticles.forEach(p => {
            let progress = (time * p.speed + p.offset) % 1; // 0 to 1
            
            const y = 2 + progress * 10;
            const x = p.x + Math.sin(time * 2 + p.offset * 10) * progress * 2;
            const z = p.z + Math.cos(time * 1.5 + p.offset * 10) * progress * 2;
            
            p.mesh.position.set(x, y, z);
            
            const scale = 1 + progress * 2;
            p.mesh.scale.set(scale, scale, scale);
            
            // Snap rotation for voxel look
            p.mesh.rotation.y = Math.floor(time + p.offset * 10) * Math.PI / 4;
            p.mesh.rotation.x = Math.floor(time * 0.5 + p.offset * 10) * Math.PI / 4;
          });
        }
      });

      // 4. Fire truck (scaled to 1 cell)
      const truckGeo = new THREE.BoxGeometry(0.8, 0.6, 1.8);
      const truckMat = new THREE.MeshStandardMaterial({ flatShading: true, color: 0xcc0000 });
      const truck = new THREE.Mesh(truckGeo, truckMat);
      truck.position.set(-1.5, 0.3, 1.5);
      truck.rotation.y = Math.PI / 4;
      group.add(truck);
      break;
    }
    case 'archived': {
      // Dim the building
      group.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          if (child.material) {
            if (Array.isArray(child.material)) {
              child.material = child.material.map(m => m.clone());
              child.material.forEach((m: any) => {
                if (m.emissiveIntensity !== undefined) m.emissiveIntensity *= 0.2;
                if (m.color) m.color.multiplyScalar(0.5);
              });
            } else {
              child.material = child.material.clone();
              if (child.material.emissiveIntensity !== undefined) child.material.emissiveIntensity *= 0.2;
              if (child.material.color) child.material.color.multiplyScalar(0.5);
            }
          }
        }
      });

      // Overgrown state, green vines
      const vineGeo = new THREE.BoxGeometry(0.2, 2, 0.2);
      const vineMat = new THREE.MeshStandardMaterial({ flatShading: true, color: 0x228B22 });
      for(let i=0; i<6; i++) {
        const vine = new THREE.Mesh(vineGeo, vineMat);
        vine.position.set((Math.random()-0.5)*2, 1, (Math.random()-0.5)*2);
        vine.rotation.set((Math.random()-0.5)*0.5, 0, (Math.random()-0.5)*0.5);
        group.add(vine);
      }
      break;
    }
    case 'building': {
      // Yellow construction barriers
      const barrierGeo = new THREE.BoxGeometry(1.5, 0.4, 0.1);
      const barrierMat = new THREE.MeshStandardMaterial({ flatShading: true, color: 0xffd700 });
      const barrier = new THREE.Mesh(barrierGeo, barrierMat);
      barrier.position.set(0, 0.2, 2);
      group.add(barrier);

      // Dust particles
      const dustGeo = new THREE.BoxGeometry(0.05, 0.05, 0.05);
      const dustMat = new THREE.MeshBasicMaterial({ color: 0xdddddd, transparent: true, opacity: 0.6 });
      const dust = new THREE.Group();
      for(let i=0; i<10; i++) {
        const p = new THREE.Mesh(dustGeo, dustMat);
        p.position.set((Math.random()-0.5)*3, Math.random()*3, (Math.random()-0.5)*3);
        dust.add(p);
      }
      group.add(dust);

      updatables.push({
        update(delta: number, time: number) {
          dust.children.forEach((p, i) => {
            p.position.y += delta * 0.5;
            if (p.position.y > 3) p.position.y = 0;
            p.position.x += Math.sin(time + i) * 0.02;
          });
        }
      });
      break;
    }
    case 'live': {
      // The building's own factory handles the beacon and lighting. 
      // No need to spawn a massive 20-unit high cylinder here.
      break;
    }
  }

  return updatables;
}
