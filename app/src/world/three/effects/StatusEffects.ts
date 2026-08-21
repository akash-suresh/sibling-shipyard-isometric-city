import * as THREE from 'three';
import type { Updatable } from '../SceneManager';

export function applyStatusEffects(group: THREE.Group, status: string): Updatable[] {
  const updatables: Updatable[] = [];

  switch (status) {
    case 'incident': {
      // 1. Red flashing beacon on the ground
      const beaconGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.5, 8);
      const beaconMat = new THREE.MeshLambertMaterial({ flatShading: true, 
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

      // 2. Fire flickering meshes & lights
      const fireGroup = new THREE.Group();
      fireGroup.position.set(0, 0, 0);
      group.add(fireGroup);
      
      const fireGeo = new THREE.ConeGeometry(0.5, 1.5, 4);
      const fireMat = new THREE.MeshLambertMaterial({ flatShading: true,
        color: 0xff8800,
        emissive: 0xff4400,
        emissiveIntensity: 2,
        transparent: true
      });
      
      const fires: THREE.Mesh[] = [];
      for(let i=0; i<3; i++) {
        const fireMesh = new THREE.Mesh(fireGeo, fireMat);
        fireMesh.position.set((Math.random()-0.5)*2, 0.75, (Math.random()-0.5)*2);
        fireGroup.add(fireMesh);
        fires.push(fireMesh);
      }

      const fireLight = new THREE.PointLight(0xff8800, 5, 10);
      fireLight.position.set(0, 1, 0);
      fireGroup.add(fireLight);

      // 3. Smoke meshes
      const smokeGeo = new THREE.BoxGeometry(0.5, 0.5, 0.5);
      const smokeMat = new THREE.MeshLambertMaterial({ flatShading: true,
        color: 0x222222,
        transparent: true,
        opacity: 0.8
      });
      const smokeMesh = new THREE.Mesh(smokeGeo, smokeMat);
      smokeMesh.position.set(0, 2, 0);
      fireGroup.add(smokeMesh);

      updatables.push({
        update(delta: number, time: number) {
          const scale = 1 + Math.sin(time * 15) * 0.2;
          fires.forEach(f => f.scale.set(1, scale, 1));
          fireLight.intensity = 2 + Math.random() * 3;
          
          const t = time * 2;
          const smokeY = 2 + (t % 2);
          smokeMesh.position.y = smokeY;
          smokeMesh.scale.setScalar(1 + (t % 2) * 0.5);
          smokeMat.opacity = Math.max(0, 1 - (t % 2) / 2);
        }
      });

      // 4. Fire truck (scaled to 1 cell)
      const truckGeo = new THREE.BoxGeometry(0.8, 0.6, 1.8);
      const truckMat = new THREE.MeshLambertMaterial({ flatShading: true, color: 0xcc0000 });
      const truck = new THREE.Mesh(truckGeo, truckMat);
      truck.position.set(-1.5, 0.3, 1.5);
      truck.rotation.y = Math.PI / 4;
      group.add(truck);
      break;
    }
    case 'paused': {
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
      break;
    }
    case 'archived': {
      // Overgrown state, green vines
      const vineGeo = new THREE.BoxGeometry(0.2, 2, 0.2);
      const vineMat = new THREE.MeshLambertMaterial({ flatShading: true, color: 0x228B22 });
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
      const barrierMat = new THREE.MeshLambertMaterial({ flatShading: true, color: 0xffd700 });
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
