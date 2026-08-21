const THREE = require('three');
const obj = new THREE.Object3D();
obj.rotation.x = -Math.PI / 2;
obj.rotation.z = -Math.PI / 2;
obj.rotation.y = -0.3;
const up = new THREE.Vector3(0, 0, 1).applyEuler(obj.rotation);
console.log("Normal vector:", up);
