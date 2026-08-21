import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { IsometricCamera } from './IsometricCamera';
import { visualTokens } from '../../design/visualTokens';

export interface Updatable {
  update(deltaTime: number, time?: number): void;
}

export class SceneManager {
  scene: THREE.Scene;
  camera: THREE.OrthographicCamera;
  renderer: THREE.WebGLRenderer;
  composer: EffectComposer;
  worldGroup: THREE.Group;
  clock: THREE.Timer;
  
  cameraControls: IsometricCamera;
  private updatables: Set<Updatable> = new Set();
  private animationFrameId: number | null = null;
  private boundAnimate: () => void;
  private boundResize: () => void;
  private container: HTMLElement;

  constructor(container: HTMLElement) {
    this.container = container;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(visualTokens.palette.canvas);

    const aspect = container.clientWidth / container.clientHeight;
    const frustumSize = 20;
    this.camera = new THREE.OrthographicCamera(
      -frustumSize * aspect,
      frustumSize * aspect,
      frustumSize,
      -frustumSize,
      1,
      1000
    );

    this.camera.position.set(20, 20, 20);
    this.camera.lookAt(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.BasicShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(this.renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    this.scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.5); // Stronger sun
    dirLight.position.set(-30, 25, 5); // Lower angle, more sideways for long shadows
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.left = -30;
    dirLight.shadow.camera.right = 30;
    dirLight.shadow.camera.top = 30;
    dirLight.shadow.camera.bottom = -30;
    dirLight.shadow.bias = -0.0005;
    this.scene.add(dirLight);

    this.composer = new EffectComposer(this.renderer);
    const renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(renderPass);

    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(container.clientWidth, container.clientHeight),
      0.35,  // strength
      0.5,  // radius
      1.5   // threshold (only affects highly emissive objects)
    );
    this.composer.addPass(bloomPass);

    const outputPass = new OutputPass();
    this.composer.addPass(outputPass);

    this.worldGroup = new THREE.Group();
    this.scene.add(this.worldGroup);

    this.clock = new THREE.Timer();

    this.cameraControls = new IsometricCamera(this.camera, this.renderer.domElement);
    this.cameraControls.enableDrag();
    this.cameraControls.enableZoom(0.5, 3.0);

    this.boundAnimate = this.animate.bind(this);
    this.boundResize = this.resize.bind(this);

    window.addEventListener('resize', this.boundResize);
    this.animate();
  }

  resize(): void {
    const aspect = this.container.clientWidth / this.container.clientHeight;
    const frustumSize = 15;
    this.camera.left = -frustumSize * aspect;
    this.camera.right = frustumSize * aspect;
    this.camera.top = frustumSize;
    this.camera.bottom = -frustumSize;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.composer.setSize(this.container.clientWidth, this.container.clientHeight);
  }

  registerUpdatable(updatable: Updatable): void {
    this.updatables.add(updatable);
  }

  unregisterUpdatable(updatable: Updatable): void {
    this.updatables.delete(updatable);
  }

  update(): void {
    this.clock.update();
    const delta = this.clock.getDelta();
    const time = this.clock.getElapsed();
    this.cameraControls.update(delta);
    for (const u of this.updatables) {
      u.update(delta, time);
    }
  }

  render(): void {
    this.composer.render();
  }

  private animate(): void {
    this.animationFrameId = requestAnimationFrame(this.boundAnimate);
    this.update();
    this.render();
  }

  dispose(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
    window.removeEventListener('resize', this.boundResize);
    this.cameraControls.dispose();
    if (this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
    this.renderer.dispose();
  }
}
