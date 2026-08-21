import * as THREE from 'three';
import type { TownLayout, AmbientRoute } from '../../layout/townLayout';
import type { Updatable } from '../SceneManager';
import { CELL_SIZE } from '../TerrainBuilder';

class AmbientActor {
  mesh: THREE.Group;
  route: AmbientRoute;
  progress: number = 0;
  private totalDistance: number = 0;
  private segmentDistances: number[] = [];

  constructor(route: AmbientRoute, layout: TownLayout) {
    this.route = route;
    this.mesh = new THREE.Group();
    
    // Create visuals based on actor type
    if (route.actor === 'person') {
      const bodyGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.5);
      const headGeo = new THREE.SphereGeometry(0.15);
      
      const colors = [0xe91e63, 0x9c27b0, 0x3f51b5, 0x00bcd4, 0x4caf50, 0xff9800, 0xff5722];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      
      const bodyMat = new THREE.MeshStandardMaterial({ color: randomColor });
      const headMat = new THREE.MeshStandardMaterial({ color: 0xffccaa }); // Simple skin tone
      
      const body = new THREE.Mesh(bodyGeo, bodyMat);
      body.position.y = 0.25;
      body.castShadow = true;
      const head = new THREE.Mesh(headGeo, headMat);
      head.position.y = 0.6;
      head.castShadow = true;
      this.mesh.add(body, head);
    } else if (route.actor === 'service-vehicle') {
      const boxGeo = new THREE.BoxGeometry(1.2, 0.7, 0.8);
      const cabGeo = new THREE.BoxGeometry(0.6, 0.6, 0.8);
      
      const mat = new THREE.MeshStandardMaterial({ color: route.accent === 'orion' ? 0x3b82f6 : 0xd1d5db });
      const windowMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
      
      const box = new THREE.Mesh(boxGeo, mat);
      box.position.set(-0.3, 0.35, 0);
      box.castShadow = true;
      
      const cab = new THREE.Mesh(cabGeo, mat);
      cab.position.set(0.6, 0.3, 0);
      cab.castShadow = true;

      const window = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.3, 0.82), windowMat);
      window.position.set(0.6, 0.4, 0);
      
      this.mesh.add(box, cab, window);
    }
    
    // Calculate route segments
    for (let i = 0; i < route.waypoints.length - 1; i++) {
      const p1 = route.waypoints[i];
      const p2 = route.waypoints[i + 1];
      const dist = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2)) * CELL_SIZE;
      this.segmentDistances.push(dist);
      this.totalDistance += dist;
    }
  }

  update(deltaTime: number) {
    // Add progress (progress is [0, 1])
    this.progress += (deltaTime * 1000) / this.route.durationMs;
    if (this.progress >= 1) {
      this.progress -= Math.floor(this.progress);
    }

    const currentDist = this.progress * this.totalDistance;
    let distAccum = 0;
        for (let i = 0; i < this.route.waypoints.length - 1; i++) {
        const segDist = this.segmentDistances[i];
        if (currentDist <= distAccum + segDist || i === this.route.waypoints.length - 2) {
          const segProgress = (currentDist - distAccum) / segDist;
          const p1 = this.route.waypoints[i];
          const p2 = this.route.waypoints[i + 1];
          
          const x = p1.x + (p2.x - p1.x) * segProgress;
          const y = p1.y + (p2.y - p1.y) * segProgress;
          
          const worldX = x * CELL_SIZE;
          const worldZ = y * CELL_SIZE;
          
          this.mesh.position.set(worldX, 0, worldZ);
          
          // Orient mesh
          if (segDist > 0.01) {
            const dx = (p2.x - p1.x);
            const dy = (p2.y - p1.y);
            this.mesh.rotation.y = Math.atan2(-dy, dx);
          }
          
          break;
        }
        distAccum += segDist;
      }
  }
}

export class AmbientLife implements Updatable {
  private group: THREE.Group;
  private actors: AmbientActor[] = [];
  private parentGroup: THREE.Object3D;

  constructor(layout: TownLayout, parentGroup: THREE.Object3D) {
    this.parentGroup = parentGroup;
    this.group = new THREE.Group();
    
    for (const route of layout.routes) {
      const actor = new AmbientActor(route, layout);
      this.actors.push(actor);
      this.group.add(actor.mesh);
    }

    // Add Delivery Drones
    const droneMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
    const rotorMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
    const packageMat = new THREE.MeshStandardMaterial({ color: 0xd2b48c });

    for (let i = 0; i < 3; i++) {
      const droneGroup = new THREE.Group();
      
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.2, 0.8), droneMat);
      body.castShadow = true;
      droneGroup.add(body);
      
      const pkg = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.4, 0.5), packageMat);
      pkg.position.y = -0.3;
      pkg.castShadow = true;
      droneGroup.add(pkg);

      const rotors: THREE.Mesh[] = [];
      const positions = [[0.4, 0.4], [0.4, -0.4], [-0.4, 0.4], [-0.4, -0.4]];
      for (const pos of positions) {
        const rotor = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.05, 0.1), rotorMat);
        rotor.position.set(pos[0], 0.15, pos[1]);
        rotors.push(rotor);
        droneGroup.add(rotor);
      }
      
      droneGroup.position.set(10 + Math.random() * 10, 8 + Math.random() * 4, 10 + Math.random() * 10);
      this.group.add(droneGroup);
      
      // We will attach an update method to the group itself
      const angleOffset = Math.random() * Math.PI * 2;
      const speed = 0.2 + Math.random() * 0.2;
      const radius = 10 + Math.random() * 10;
      let time = 0;
      
      (droneGroup as any).update = (dt: number) => {
        time += dt;
        droneGroup.position.x = 24 + Math.cos(time * speed + angleOffset) * radius;
        droneGroup.position.z = 24 + Math.sin(time * speed + angleOffset) * radius;
        droneGroup.position.y = 8 + Math.sin(time * 2) * 0.5;
        droneGroup.rotation.y = -(time * speed + angleOffset); // face forward
        
        for (const rotor of rotors) {
          rotor.rotation.y += dt * 20;
        }
      };
    }
    
    const width = layout.width * CELL_SIZE;
    const depth = layout.height * CELL_SIZE;
    this.group.position.set(-width / 2 + CELL_SIZE / 2, 0, -depth / 2 + CELL_SIZE / 2);
    
    this.parentGroup.add(this.group);
  }

  update(deltaTime: number): void {
    for (const actor of this.actors) {
      actor.update(deltaTime);
    }
    this.group.children.forEach(child => {
      if ((child as any).update) {
        (child as any).update(deltaTime);
      }
    });
  }

  dispose(): void {
    this.parentGroup.remove(this.group);
  }
}
