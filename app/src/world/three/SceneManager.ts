import * as THREE from 'three';
import { WebGPURenderer, PostProcessing } from 'three/webgpu';
import { pass, mrt, output, emissive, normalView } from 'three/tsl';
import { bloom } from 'three/examples/jsm/tsl/display/BloomNode.js';
import { ao } from 'three/examples/jsm/tsl/display/GTAONode.js';
import { IsometricCamera } from './IsometricCamera';
import { visualTokens } from '../../design/visualTokens';

export interface Updatable {
  update(deltaTime: number, time?: number): void;
}

export class SceneManager {
  scene: THREE.Scene;
  camera: THREE.OrthographicCamera;
  renderer: WebGPURenderer;
  worldGroup: THREE.Group;
  clock: THREE.Timer;
  
  cameraControls: IsometricCamera;
  private updatables: Set<Updatable> = new Set();
  private animationFrameId: number | null = null;
  private boundAnimate: () => void;
  private boundResize: () => void;
  private container: HTMLElement;

  private ambientLight: THREE.AmbientLight;
  private dirLight: THREE.DirectionalLight;
  private isNightMode: boolean = false;
  private dayNightTransition: number = 0; // 0 = day, 1 = night

  constructor(container: HTMLElement) {
    this.container = container;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(visualTokens.palette.canvas);

    const aspect = container.clientWidth / container.clientHeight;
    const frustumSize = 25;
    this.camera = new THREE.OrthographicCamera(
      -frustumSize * aspect,
      frustumSize * aspect,
      frustumSize,
      -frustumSize,
      -50,
      150
    );

    this.camera.position.set(20, 20, 20);
    this.camera.lookAt(0, 0, 0);

    this.renderer = new WebGPURenderer({ antialias: true, alpha: true });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.shadowMap.enabled = true;
    // WebGPURenderer in r185 automatically uses the correct color space (SRGB is default for output)
    container.appendChild(this.renderer.domElement);

    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    this.scene.add(this.ambientLight);

    this.dirLight = new THREE.DirectionalLight(0xffffff, 1.5); // Stronger sun
    this.dirLight.position.set(-30, 25, 5); // Lower angle, more sideways for long shadows
    this.dirLight.castShadow = true;
    
    // Optimize shadow map
    this.dirLight.shadow.mapSize.width = 2048;
    this.dirLight.shadow.mapSize.height = 2048;
    this.dirLight.shadow.camera.left = -50;
    this.dirLight.shadow.camera.right = 50;
    this.dirLight.shadow.camera.top = 50;
    this.dirLight.shadow.camera.bottom = -50;
    this.dirLight.shadow.bias = -0.0005;
    this.scene.add(this.dirLight);

    // --- WebGPU PostProcessing ---
    const scenePass = pass(this.scene, this.camera);
    scenePass.setMRT(mrt({
      output,
      emissive,
      normal: normalView
    }));

    const outputPass = scenePass.getTextureNode('output');
    const emissivePass = scenePass.getTextureNode('emissive');
    const normalPass = scenePass.getTextureNode('normal');
    const depthPass = scenePass.getTextureNode('depth');

    // Bloom Node (strength: 0.35, radius: 0.5, threshold: 1.5)
    const bloomNode = bloom(emissivePass, 0.35, 0.5, 1.5);

    // Ambient Occlusion Node
    // Note: GTAONode generally expects PerspectiveCamera, but we'll feed it the Ortho
    const aoNode = ao(depthPass, normalPass, this.camera);

    // Combine Output + Bloom, and multiply by AO (AO is stored in the red channel)
    const finalNode = outputPass.add(bloomNode).mul(aoNode.getTextureNode().r);
    
    const postProcessing = new PostProcessing(this.renderer);
    postProcessing.outputNode = finalNode;
    // We attach the postProcessing instance to the class so we can call `.render()` on it later
    (this as any).postProcessing = postProcessing;

    this.worldGroup = new THREE.Group();
    this.scene.add(this.worldGroup);

    this.clock = new THREE.Timer();

    this.cameraControls = new IsometricCamera(this.camera, this.renderer.domElement);
    this.cameraControls.enableDrag();
    this.cameraControls.enableZoom(0.5, 3.0);

    this.boundAnimate = this.animate.bind(this);
    this.boundResize = this.resize.bind(this);

    window.addEventListener('resize', this.boundResize);
    this.renderer.init().then(() => {
      this.renderer.setAnimationLoop(this.boundAnimate);
    });
  }

  resize(): void {
    const aspect = this.container.clientWidth / this.container.clientHeight;
    const frustumSize = 17.5;
    this.camera.left = -frustumSize * aspect;
    this.camera.right = frustumSize * aspect;
    this.camera.top = frustumSize;
    this.camera.bottom = -frustumSize;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
  }

  registerUpdatable(updatable: Updatable): void {
    this.updatables.add(updatable);
  }

  unregisterUpdatable(updatable: Updatable): void {
    this.updatables.delete(updatable);
  }

  setNightMode(isNight: boolean): void {
    this.isNightMode = isNight;
  }

  update(): void {
    this.clock.update();
    const delta = this.clock.getDelta();
    const time = this.clock.getElapsed();
    this.cameraControls.update(delta);
    
    // Day/Night transition
    const targetTransition = this.isNightMode ? 1 : 0;
    this.dayNightTransition = THREE.MathUtils.lerp(this.dayNightTransition, targetTransition, delta * 2);
    
    // Light tweening
    const dayAmbientColor = new THREE.Color(0xffffff);
    const nightAmbientColor = new THREE.Color(0x3b82f6).multiplyScalar(0.6); // Increased base ambient for visibility
    this.ambientLight.color.lerpColors(dayAmbientColor, nightAmbientColor, this.dayNightTransition);
    
    const dayDirColor = new THREE.Color(0xffffff);
    const nightDirColor = new THREE.Color(0x5a82e6).multiplyScalar(0.5); // Brighter moonlight so shadows aren't pitch black
    this.dirLight.color.lerpColors(dayDirColor, nightDirColor, this.dayNightTransition);

    const dayBgColor = new THREE.Color(visualTokens.palette.canvas);
    const nightBgColor = new THREE.Color(0x0a1128); // Deep night sky
    if (this.scene.background instanceof THREE.Color) {
      this.scene.background.lerpColors(dayBgColor, nightBgColor, this.dayNightTransition);
    }

    // Tween streetlights, windows, and neon signs
    this.scene.traverse((child) => {
      if (child instanceof THREE.PointLight && child.userData.isStreetlight) {
        // Reduced from 12.0 so overlapping intersections don't blow out
        child.intensity = this.dayNightTransition * 6.0; 
      } else if (child instanceof THREE.Mesh) {
        const mat = child.material as THREE.MeshStandardMaterial;
        if (mat && mat.emissive) {
          if (child.userData.isWindow) {
            mat.emissiveIntensity = THREE.MathUtils.lerp(0.8, 1.8, this.dayNightTransition); // Glow harder at night, but not blown out
          } else if (child.userData.isSign) {
            // Keep at 0.8 max so the logo colors don't clip to pure white
            mat.emissiveIntensity = THREE.MathUtils.lerp(0.0, 0.8, this.dayNightTransition); 
          }
        }
      }
    });

    for (const u of this.updatables) {
      u.update(delta, time);
    }
  }

  async render(): Promise<void> {
    const pp = (this as any).postProcessing;
    if (pp) {
      await pp.renderAsync();
    } else {
      await this.renderer.renderAsync(this.scene, this.camera);
    }
  }

  animate(): void {
    this.update();
    this.render();
  }

  dispose(): void {
    this.renderer.setAnimationLoop(null);
    window.removeEventListener('resize', this.boundResize);
    this.cameraControls.dispose();
    if (this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
    this.renderer.dispose();
  }
}
