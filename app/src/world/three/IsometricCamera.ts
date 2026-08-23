import * as THREE from 'three';

export class IsometricCamera {
  camera: THREE.OrthographicCamera;
  domElement: HTMLElement;
  
  private isDragging = false;
  private previousMousePosition = { x: 0, y: 0 };
  
  private targetPosition: THREE.Vector3 | null = null;
  private startPosition: THREE.Vector3 | null = null;
  private focusElapsed = 0;
  private focusDuration = 0;

  public enabled = true;

  constructor(camera: THREE.OrthographicCamera, domElement: HTMLElement) {
    this.camera = camera;
    this.domElement = domElement;
  }
  
  enableDrag(): void {
    this.domElement.addEventListener('pointerdown', this.onPointerDown);
    this.domElement.addEventListener('pointermove', this.onPointerMove);
    window.addEventListener('pointerup', this.onPointerUp);
  }
  
  enableZoom(min: number, max: number): void {
    this.domElement.addEventListener('wheel', (e) => {
      if (!this.enabled) return;
      e.preventDefault();
      const zoomFactor = e.deltaY > 0 ? 1.1 : 0.9;
      this.camera.zoom = Math.max(min, Math.min(max, this.camera.zoom * zoomFactor));
      this.camera.updateProjectionMatrix();
    }, { passive: false });
  }
  
  focusOn(position: THREE.Vector3, duration: number = 1000): void {
    this.targetPosition = position.clone();
    const offset = new THREE.Vector3(20, 20, 20);
    this.targetPosition.add(offset);
    this.startPosition = this.camera.position.clone();
    this.focusElapsed = 0;
    this.focusDuration = duration;
  }
  
  update(deltaTime: number): void {
    if (this.targetPosition && this.startPosition) {
      this.focusElapsed += deltaTime * 1000;
      const progress = Math.min(1, this.focusElapsed / this.focusDuration);
      const ease = 1 - Math.pow(1 - progress, 3);
      this.camera.position.lerpVectors(this.startPosition, this.targetPosition, ease);
      if (progress >= 1) {
        this.targetPosition = null;
        this.startPosition = null;
      }
    }
  }
  
  dispose(): void {
    this.domElement.removeEventListener('pointerdown', this.onPointerDown);
    this.domElement.removeEventListener('pointermove', this.onPointerMove);
    window.removeEventListener('pointerup', this.onPointerUp);
  }

  private onPointerDown = (e: PointerEvent) => {
    if (!this.enabled) return;
    this.isDragging = true;
    this.previousMousePosition = { x: e.clientX, y: e.clientY };
  };

  private onPointerMove = (e: PointerEvent) => {
    if (!this.isDragging) return;
    const deltaX = e.clientX - this.previousMousePosition.x;
    const deltaY = e.clientY - this.previousMousePosition.y;
    const panSpeed = 0.05 / this.camera.zoom;
    const moveX = (-deltaX - deltaY) * panSpeed;
    const moveZ = (deltaX - deltaY) * panSpeed;
    this.camera.position.x += moveX;
    this.camera.position.z += moveZ;
    this.previousMousePosition = { x: e.clientX, y: e.clientY };
  };

  private onPointerUp = () => {
    this.isDragging = false;
  };
}
