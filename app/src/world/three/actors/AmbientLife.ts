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
      const mat = new THREE.MeshStandardMaterial({ color: 0x888888 });
      const body = new THREE.Mesh(bodyGeo, mat);
      body.position.y = 0.25;
      const head = new THREE.Mesh(headGeo, mat);
      head.position.y = 0.6;
      this.mesh.add(body, head);
    } else if (route.actor === 'service-vehicle') {
      const boxGeo = new THREE.BoxGeometry(1.0, 0.6, 1.5);
      const cabGeo = new THREE.BoxGeometry(1.0, 0.5, 0.75);
      
      const mat = new THREE.MeshStandardMaterial({ color: route.accent === 'orion' ? 0x3b82f6 : 0xd1d5db });
      const box = new THREE.Mesh(boxGeo, mat);
      box.position.y = 0.3;
      const cab = new THREE.Mesh(cabGeo, mat);
      cab.position.set(0, 0.85, 0.375);
      this.mesh.add(box, cab);
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
            this.mesh.rotation.y = Math.atan2(-dy, dx) + Math.PI / 2;
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
    
    const width = layout.width * CELL_SIZE;
    const depth = layout.height * CELL_SIZE;
    this.group.position.set(-width / 2 + CELL_SIZE / 2, 0, -depth / 2 + CELL_SIZE / 2);
    
    this.parentGroup.add(this.group);
  }

  update(deltaTime: number): void {
    for (const actor of this.actors) {
      actor.update(deltaTime);
    }
  }

  dispose(): void {
    this.parentGroup.remove(this.group);
  }
}
