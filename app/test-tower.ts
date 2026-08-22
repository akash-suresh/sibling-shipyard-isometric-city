import { buildTower } from './src/world/three/buildings/TowerBuilder.ts';
const res = buildTower({ name: 'test', accent: '#fff', status: 'live', stage: 'shipped', logo: '' });
res.updatable.update(0.1, 0);
res.group.traverse((child: any) => {
  if (child.userData && child.userData.isTempProp) {
    console.log('Temp prop scale:', child.scale);
  }
});
