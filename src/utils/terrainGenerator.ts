import * as THREE from 'three';
import { createNoise2D } from 'simplex-noise';

// Create a simple low-poly sea using simplex noise
export const createTerrain = (
  width = 1000,
  height = 1000,
  segments = 100,
  amplitude = 2, // Reduced amplitude for gentler waves
  seed = Math.random()
): THREE.Mesh => {
  // Initialize simplex noise with seed
  const noise2D = createNoise2D(() => seed);
  
  // Create geometry
  const geometry = new THREE.PlaneGeometry(width, height, segments, segments);
  
  // Store original vertex positions BEFORE modifying them
  const vertices = geometry.attributes.position.array;
  const originalPositions = new Float32Array(vertices.length);
  for (let i = 0; i < vertices.length; i++) {
    originalPositions[i] = vertices[i];
  }
  
  // We'll skip applying initial wave heights here, as they'll be applied in the animation loop
  // This creates a flat surface initially, which will be animated
  
  // Update geometry
  geometry.computeVertexNormals();
  
  // Create vertex colors for the water
  const colors = new Float32Array(vertices.length);
  const colorAttribute = new THREE.BufferAttribute(colors, 3);
  
  // Base colors
  const deepColor = new THREE.Color(0x0040a0); // Deep blue
  const shallowColor = new THREE.Color(0x00a0c0); // Lighter blue
  const foamColor = new THREE.Color(0xffffff); // White foam
  
  // Set initial colors based on a flat surface
  for (let i = 0; i < vertices.length; i += 3) {
    // Use a default middle color initially
    const color = new THREE.Color().lerpColors(
      deepColor, 
      shallowColor, 
      0.5 // Middle value
    );
    
    // Set the color
    colors[i] = color.r;
    colors[i + 1] = color.g;
    colors[i + 2] = color.b;
  }
  
  // Add the color attribute to the geometry
  geometry.setAttribute('color', colorAttribute);
  
  // Create material for water with vertex colors
  const material = new THREE.MeshStandardMaterial({
    vertexColors: true,
    flatShading: true, // Enable flat shading for stylized water look
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.9,
    metalness: 0.1,
    roughness: 0.3,
  });
  
  // Create mesh
  const terrain = new THREE.Mesh(geometry, material);
  
  // Rotate to make it horizontal (plane is vertical by default)
  terrain.rotation.x = -Math.PI / 2;
  
  // Enable shadows
  terrain.receiveShadow = true;
  
  // Add custom property to store original positions
  (terrain as any).originalPositions = originalPositions;
  
  // Add wave direction and speed properties
  (terrain as any).waveDirection = new THREE.Vector2(1, 1).normalize();
  (terrain as any).waveSpeed = 0.5;
  (terrain as any).waveHeight = amplitude;
  
  // Store color information for dynamic updates
  (terrain as any).colorInfo = {
    deepColor: deepColor,
    shallowColor: shallowColor,
    foamColor: foamColor
  };
  
  return terrain;
}; 