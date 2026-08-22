import * as THREE from 'three';
import { TransformControls } from 'three/addons/controls/TransformControls.js';
import type { Updatable } from '../SceneManager';
import type { IsometricCamera } from '../IsometricCamera';

export class SelectionManager implements Updatable {
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  private camera: THREE.Camera;
  private scene: THREE.Scene;
  private domElement: HTMLElement;
  private worldGroup: THREE.Group;
  private cameraControls: any;
  private transformControl: TransformControls;
  
  private selectedProjectId: string | null = null;
  private selectionRing: THREE.Mesh;
  private currentHoveredGroup: THREE.Group | null = null;
  
  private onSelectCallback?: (projectId: string | null, worldPos: THREE.Vector3 | null) => void;
  private onDragEndCallback?: (projectId: string, elementId: string, position: THREE.Vector3) => void;

  constructor(camera: THREE.Camera, scene: THREE.Scene, worldGroup: THREE.Group, domElement: HTMLElement, cameraControls: any) {
    this.camera = camera;
    this.scene = scene;
    this.worldGroup = worldGroup;
    this.domElement = domElement;
    this.cameraControls = cameraControls;
    
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    
    this.transformControl = new TransformControls(camera, domElement);
    this.transformControl.showY = false;
    this.transformControl.addEventListener('dragging-changed', (event: any) => {
      this.cameraControls.enabled = !event.value;
      if (!event.value && this.transformControl.object) {
        const obj = this.transformControl.object;
        if (this.onDragEndCallback && obj.userData.projectId && obj.userData.elementId) {
          this.onDragEndCallback(obj.userData.projectId, obj.userData.elementId, obj.position.clone());
        }
      }
    });
    this.scene.add(this.transformControl.getHelper());

    const ringGeo = new THREE.TorusGeometry(1.2, 0.1, 8, 32);
    ringGeo.rotateX(Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x3b82f6, transparent: true, opacity: 0.8 });
    this.selectionRing = new THREE.Mesh(ringGeo, ringMat);
    this.selectionRing.visible = false;
    this.scene.add(this.selectionRing);

    this.domElement.addEventListener('pointermove', this.onPointerMove);
    this.domElement.addEventListener('click', this.onClick);
  }

  public onSelect(cb: (projectId: string | null, worldPos: THREE.Vector3 | null) => void) {
    this.onSelectCallback = cb;
  }

  public onDragEnd(cb: (projectId: string, elementId: string, position: THREE.Vector3) => void) {
    this.onDragEndCallback = cb;
  }

  private onPointerMove = (event: PointerEvent) => {
    const rect = this.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  };

  private onClick = (event: MouseEvent) => {
    if (this.transformControl.dragging) return;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.worldGroup.children, true);
    
    if (intersects.length > 0) {
      // Check if we hit terrain
      const hit = intersects[0];
      if (hit.object.userData && hit.object.userData.isTerrain) {
        // Dispatch terrain click
        const gridX = Math.round(hit.point.x / 2);
        const gridY = Math.round(hit.point.z / 2);
        const cevent = new CustomEvent('shipyard-terrain-click', {
          detail: { x: gridX, y: gridY }
        });
        window.dispatchEvent(cevent);
      }

      let obj: THREE.Object3D | null = hit.object;
      let draggableElement: THREE.Object3D | null = null;
      let projectId: string | null = null;
      let buildingGroup: THREE.Object3D | null = null;
      
      while (obj && obj !== this.worldGroup) {
        if (obj.userData && obj.userData.draggable && !draggableElement) {
          draggableElement = obj;
        }
        if (obj.userData && obj.userData.projectId && !obj.userData.draggable) {
          projectId = obj.userData.projectId;
          buildingGroup = obj;
          break;
        }
        obj = obj.parent;
      }
      
      if (draggableElement) {
        this.transformControl.attach(draggableElement);
        return;
      } else {
        this.transformControl.detach();
      }
      
      if (projectId && buildingGroup) {
        this.selectedProjectId = projectId;
        
        // Position ring at building base
        const worldPos = new THREE.Vector3();
        buildingGroup.getWorldPosition(worldPos);
        this.selectionRing.position.copy(worldPos);
        this.selectionRing.visible = true;
        
        if (this.onSelectCallback) {
          this.onSelectCallback(projectId, worldPos);
        }
        return;
      }
    }
    
    // Clicked elsewhere, clear selection
    this.transformControl.detach();
    this.selectedProjectId = null;
    this.selectionRing.visible = false;
    if (this.onSelectCallback) {
      this.onSelectCallback(null, null);
    }
  };

  update(deltaTime: number): void {
    // Animate selection ring
    if (this.selectionRing.visible) {
      this.selectionRing.rotation.y += deltaTime;
      const scale = 1.0 + Math.sin(Date.now() * 0.003) * 0.1;
      this.selectionRing.scale.set(scale, scale, scale);
    }
    
    // Handle hover
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.worldGroup.children, true);
    
    let newHoveredGroup: THREE.Group | null = null;
    
    if (intersects.length > 0) {
      let obj: THREE.Object3D | null = intersects[0].object;
      while (obj && obj !== this.worldGroup) {
        if (obj.userData && obj.userData.projectId) {
          newHoveredGroup = obj as THREE.Group;
          break;
        }
        obj = obj.parent;
      }
    }
    
    if (newHoveredGroup !== this.currentHoveredGroup) {
      this.currentHoveredGroup = newHoveredGroup;
    }
    
    // Update cursor
    this.domElement.style.cursor = this.currentHoveredGroup ? 'pointer' : 'default';

    // Lerp all building scales back to normal (or just leave them)
    // Actually, I'll just remove the scaling behavior, but to reset it I should set scale to 1.
    this.worldGroup.children.forEach(child => {
      if (child.userData && child.userData.projectId) {
        child.scale.set(1, 1, 1);
      }
    });
  }

  dispose(): void {
    this.domElement.removeEventListener('pointermove', this.onPointerMove);
    this.domElement.removeEventListener('click', this.onClick);
    this.scene.remove(this.selectionRing);
    this.transformControl.detach();
    this.transformControl.dispose();
    this.scene.remove(this.transformControl.getHelper());
  }
}
