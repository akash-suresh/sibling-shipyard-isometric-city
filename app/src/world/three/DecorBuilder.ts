import * as THREE from 'three';
import type { TownLayout } from '../layout/townLayout';
import { CELL_SIZE } from './TerrainBuilder';
import { visualTokens } from '../../design/visualTokens';
import { FontLoader, Font } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';

let cachedFont: Font | null = null;
const loader = new FontLoader();
function loadFont(callback: (font: Font) => void) {
  if (cachedFont) {
    callback(cachedFont);
    return;
  }
  loader.load('/fonts/helvetiker_bold.typeface.json', (font) => {
    cachedFont = font;
    callback(font);
  });
}

export class DecorBuilder {
  scene: THREE.Scene;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  placeDecor(layout: TownLayout): THREE.Group {
    const group = new THREE.Group();
    const p = visualTokens.palette;

    const dirtMat = new THREE.MeshStandardMaterial({ color: p.soil, flatShading: true });
    const grassMat = new THREE.MeshStandardMaterial({ color: p.hedge, flatShading: true });
    const poleMat = new THREE.MeshStandardMaterial({ color: p.metal, flatShading: true });
    const lampMat = new THREE.MeshStandardMaterial({ color: p.activeLight, emissive: p.activeLight, emissiveIntensity: 1, flatShading: true });
    const woodMat = new THREE.MeshStandardMaterial({ color: p.soil, flatShading: true });
    const shrubMat = new THREE.MeshStandardMaterial({ color: p.hedgeShadow, flatShading: true });
    const flowerMat = new THREE.MeshStandardMaterial({ color: 0xE91E63, flatShading: true });
    const signMat = new THREE.MeshStandardMaterial({ color: p.water, flatShading: true });

    layout.decor.forEach(decor => {
      const worldX = decor.grid.x * CELL_SIZE + (decor.offset?.x || 0) * 0.02;
      const worldZ = decor.grid.y * CELL_SIZE + (decor.offset?.y || 0) * 0.02;

      const mesh = new THREE.Group();
      mesh.position.set(worldX, 0, worldZ);

      switch (decor.kind) {
        case "tree": {
          const trunk = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1, 0.2), dirtMat);
          trunk.position.y = 0.5;
          trunk.castShadow = true;
          mesh.add(trunk);

          const canopy1 = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.2, 1.2), grassMat);
          canopy1.position.y = 1.3;
          canopy1.castShadow = true;
          const canopy2 = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 0.8), grassMat);
          canopy2.position.set(0.3, 1.7, -0.3);
          canopy2.castShadow = true;
          mesh.add(canopy1, canopy2);
          break;
        }
        case "lamp": {
          const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.5), poleMat);
          pole.position.y = 0.75;
          pole.castShadow = true;
          mesh.add(pole);

          const light = new THREE.Mesh(new THREE.SphereGeometry(0.15), lampMat);
          light.position.y = 1.6;
          light.userData.isWindow = true; // Make it glow at night
          mesh.add(light);
          
          const pointLight = new THREE.PointLight(0xffeedd, 0.0, 12.0);
          pointLight.position.y = 1.6;
          pointLight.userData.isStreetlight = true;
          mesh.add(pointLight);
          break;
        }
        case "bench": {
          const seat = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.1, 0.4), woodMat);
          seat.position.y = 0.2;
          seat.castShadow = true;
          mesh.add(seat);

          const back = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.4, 0.1), woodMat);
          back.position.set(0, 0.45, -0.15);
          back.castShadow = true;
          mesh.add(back);
          break;
        }
        case "shrub": {
          const shrub = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.6, 0.6), shrubMat);
          shrub.position.y = 0.3;
          shrub.castShadow = true;
          mesh.add(shrub);
          break;
        }
        case "flowers": {
          for (let i = 0; i < 3; i++) {
            const flower = new THREE.Mesh(new THREE.SphereGeometry(0.05), flowerMat);
            flower.position.set((Math.random() - 0.5) * 0.4, 0.05, (Math.random() - 0.5) * 0.4);
            mesh.add(flower);
          }
          break;
        }
        case "sign": {
          const post = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.6), poleMat);
          post.position.y = 0.3;
          post.castShadow = true;
          mesh.add(post);

          const board = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.3, 0.05), signMat);
          board.position.set(0, 0.6, 0.03);
          board.castShadow = true;
          mesh.add(board);
          break;
        }
      }

      group.add(mesh);
    });

    const width = layout.width * CELL_SIZE;
    const depth = layout.height * CELL_SIZE;
    group.position.set(-width / 2 + CELL_SIZE / 2, 0, -depth / 2 + CELL_SIZE / 2);

    return group;
  }
}
