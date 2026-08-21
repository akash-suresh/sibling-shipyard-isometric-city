import * as THREE from 'three';
import type { Updatable } from '../SceneManager';

export class SelectionManager implements Updatable {
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  private camera: THREE.Camera;
  private scene: THREE.Scene;
  private domElement: HTMLElement;
  private buildingsGroup: THREE.Group;
  
  private hoveredMesh: THREE.Mesh | null = null;
  private selectedProjectId: string | null = null;
  private selectionRing: THREE.Mesh;
  
  private onSelectCallback?: (projectId: string | null) => void;

  constructor(camera: THREE.Camera, scene: THREE.Scene, buildingsGroup: THREE.Group, domElement: HTMLElement) {
    this.camera = camera;
    this.scene = scene;
    this.buildingsGroup = buildingsGroup;
    this.domElement = domElement;
    
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    
    // Create selection ring
    const ringGeo = new THREE.TorusGeometry(1.2, 0.1, 8, 32);
    ringGeo.rotateX(Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x3b82f6, transparent: true, opacity: 0.8 });
    this.selectionRing = new THREE.Mesh(ringGeo, ringMat);
    this.selectionRing.visible = false;
    this.scene.add(this.selectionRing);

    this.domElement.addEventListener('pointermove', this.onPointerMove);
    this.domElement.addEventListener('click', this.onClick);
  }

  public onSelect(cb: (projectId: string | null) => void) {
    this.onSelectCallback = cb;
  }

  private onPointerMove = (event: PointerEvent) => {
    const rect = this.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  };

  private onClick = (event: MouseEvent) => {
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.buildingsGroup.children, true);
    
    if (intersects.length > 0) {
      // Find the root building group that has userData.projectId
      let obj: THREE.Object3D | null = intersects[0].object;
      let projectId: string | null = null;
      let buildingGroup: THREE.Object3D | null = null;
      
      while (obj && obj !== this.buildingsGroup) {
        if (obj.userData && obj.userData.projectId) {
          projectId = obj.userData.projectId;
          buildingGroup = obj;
          break;
        }
        obj = obj.parent;
      }
      
      if (projectId && buildingGroup) {
        this.selectedProjectId = projectId;
        
        // Position ring at building base
        const worldPos = new THREE.Vector3();
        buildingGroup.getWorldPosition(worldPos);
        this.selectionRing.position.copy(worldPos);
        this.selectionRing.visible = true;
        
        if (this.onSelectCallback) {
          this.onSelectCallback(projectId);
        }
        return;
      }
    }
    
    // Clicked elsewhere, clear selection
    this.selectedProjectId = null;
    this.selectionRing.visible = false;
    if (this.onSelectCallback) {
      this.onSelectCallback(null);
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
    const intersects = this.raycaster.intersectObjects(this.buildingsGroup.children, true);
    
    // Clear previous hover
    if (this.hoveredMesh) {
      const mat = this.hoveredMesh.material as THREE.MeshStandardMaterial;
      if (mat.emissive) {
        mat.emissive.setHex(this.hoveredMesh.userData.originalEmissive || 0x000000);
      }
      this.hoveredMesh = null;
    }
    
    if (intersects.length > 0) {
      let obj: THREE.Object3D | null = intersects[0].object;
      let isBuilding = false;
      while (obj && obj !== this.buildingsGroup) {
        if (obj.userData && obj.userData.projectId) {
          isBuilding = true;
          break;
        }
        obj = obj.parent;
      }
      
      if (isBuilding && intersects[0].object instanceof THREE.Mesh) {
        this.hoveredMesh = intersects[0].object;
        const mat = this.hoveredMesh.material as THREE.MeshStandardMaterial;
        if (mat.emissive) {
          if (this.hoveredMesh.userData.originalEmissive === undefined) {
            this.hoveredMesh.userData.originalEmissive = mat.emissive.getHex();
          }
          mat.emissive.setHex(0x333333); // Subtle highlight
        }
      }
    }
  }

  dispose(): void {
    this.domElement.removeEventListener('pointermove', this.onPointerMove);
    this.domElement.removeEventListener('click', this.onClick);
    this.scene.remove(this.selectionRing);
  }
}
