const THREE = require('three');
const curve = new THREE.QuadraticBezierCurve(
  new THREE.Vector2(5, 2.5),
  new THREE.Vector2(1.5, 4.0),
  new THREE.Vector2(0, 4.5)
);
for (let t = 0; t <= 1; t += 0.1) {
  const p = curve.getPoint(t);
  console.log(`t=${t.toFixed(1)} -> x=${p.x.toFixed(2)}, y=${p.y.toFixed(2)}`);
}
