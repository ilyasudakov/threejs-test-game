import * as THREE from 'three';

export const createSun = (
  size = 100,
  color = 0xffff00,
  intensity = 1.5,
  position = { x: 300, y: 200, z: 0 }
): { 
  sunMesh: THREE.Mesh;
  sunLight: THREE.DirectionalLight;
  target: THREE.Object3D;
} => {
  // Create sun mesh (a simple sphere)
  const sunGeometry = new THREE.SphereGeometry(size, 32, 32);
  const sunMaterial = new THREE.MeshBasicMaterial({ 
    color: color,
  });
  const sunMesh = new THREE.Mesh(sunGeometry, sunMaterial);
  
  // Position the sun
  sunMesh.position.set(position.x, position.y, position.z);
  
  // Create a directional light to simulate sunlight
  const sunLight = new THREE.DirectionalLight(0xffffff, intensity);
  sunLight.position.copy(sunMesh.position);
  
  // Set up shadows
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.width = 2048;
  sunLight.shadow.mapSize.height = 2048;
  sunLight.shadow.camera.near = 0.5;
  sunLight.shadow.camera.far = 2000;
  
  // For a large terrain, we need a large shadow camera
  const shadowSize = 1500; // Increased shadow size to cover more area
  sunLight.shadow.camera.left = -shadowSize / 2;
  sunLight.shadow.camera.right = shadowSize / 2;
  sunLight.shadow.camera.top = shadowSize / 2;
  sunLight.shadow.camera.bottom = -shadowSize / 2;
  
  // Improve shadow quality
  sunLight.shadow.bias = -0.0005;
  sunLight.shadow.normalBias = 0.02;
  
  // Add a target for the directional light to aim at the center of the scene
  const targetObject = new THREE.Object3D();
  targetObject.position.set(0, 0, 0);
  sunLight.target = targetObject;
  
  return { sunMesh, sunLight, target: targetObject };
}; 