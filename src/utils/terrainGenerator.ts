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
  
  // Modify vertices to create sea waves
  const vertices = geometry.attributes.position.array;
  for (let i = 0; i < vertices.length; i += 3) {
    // Skip modifying the y-coordinate (which is now the z-coordinate after rotation)
    const x = vertices[i];
    const z = vertices[i + 1];
    
    // Use simplex noise to generate wave height
    const frequency = 0.005; // Higher frequency for more waves
    let elevation = 0;
    
    // Add multiple octaves of noise for more natural waves
    elevation += noise2D(x * frequency, z * frequency) * amplitude;
    elevation += noise2D(x * frequency * 3, z * frequency * 3) * amplitude * 0.3;
    elevation += noise2D(x * frequency * 6, z * frequency * 6) * amplitude * 0.15;
    
    // Apply height to y-coordinate
    vertices[i + 2] = elevation;
  }
  
  // Update geometry
  geometry.computeVertexNormals();
  
  // Create vertex colors for the water
  const colors = new Float32Array(vertices.length);
  const colorAttribute = new THREE.BufferAttribute(colors, 3);
  
  // Base colors
  const deepColor = new THREE.Color(0x0040a0); // Deep blue
  const shallowColor = new THREE.Color(0x00a0c0); // Lighter blue
  const foamColor = new THREE.Color(0xffffff); // White foam
  
  // Set initial colors based on height
  for (let i = 0; i < vertices.length; i += 3) {
    const height = vertices[i + 2];
    const normalizedHeight = (height + amplitude) / (amplitude * 2); // Normalize to 0-1
    
    // Interpolate between deep and shallow color
    const color = new THREE.Color().lerpColors(
      deepColor, 
      shallowColor, 
      normalizedHeight
    );
    
    // Add some foam to the peaks
    if (normalizedHeight > 0.7) {
      color.lerp(foamColor, (normalizedHeight - 0.7) / 0.3 * 0.3);
    }
    
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
  
  // Store original vertex positions for wave animation
  const originalPositions = new Float32Array(vertices.length);
  for (let i = 0; i < vertices.length; i++) {
    originalPositions[i] = vertices[i];
  }
  
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