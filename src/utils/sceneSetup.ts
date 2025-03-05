import * as THREE from 'three';

export interface SceneSetup {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
}

export const createScene = (container: HTMLElement): SceneSetup => {
  // Create scene
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87ceeb); // Sky blue background
  scene.fog = new THREE.FogExp2(0x87ceeb, 0.01); // Add fog for atmosphere and to limit draw distance
  
  // Create camera with wider field of view and greater far plane
  const camera = new THREE.PerspectiveCamera(
    75, // Field of view
    window.innerWidth / window.innerHeight, // Aspect ratio
    0.1, // Near clipping plane
    2000 // Far clipping plane - increased for larger scenes
  );
  camera.position.set(0, 5, 10); // Set initial camera position
  
  // Create renderer with better defaults
  const renderer = new THREE.WebGLRenderer({ 
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance'
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Limit pixel ratio for performance
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace; // Use correct color space
  
  // Clear any existing canvas
  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }
  
  // Add renderer to DOM
  container.appendChild(renderer.domElement);
  
  return { scene, camera, renderer };
}; 