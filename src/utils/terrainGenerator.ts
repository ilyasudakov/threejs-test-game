import * as THREE from 'three';
import { createNoise2D } from 'simplex-noise';

// Create a simple low-poly terrain using simplex noise
export const createTerrain = (
  width = 100,
  height = 100,
  segments = 50,
  amplitude = 2,
  seed = Math.random()
): THREE.Mesh => {
  // Initialize simplex noise with seed
  const noise2D = createNoise2D(() => seed);
  
  // Create geometry
  const geometry = new THREE.PlaneGeometry(width, height, segments, segments);
  
  // Modify vertices to create terrain
  const vertices = geometry.attributes.position.array;
  for (let i = 0; i < vertices.length; i += 3) {
    // Skip modifying the y-coordinate (which is now the z-coordinate after rotation)
    const x = vertices[i];
    const z = vertices[i + 1];
    
    // Use simplex noise to generate height
    const frequency = 0.01;
    let elevation = 0;
    
    // Add multiple octaves of noise for more natural terrain, but with reduced impact
    elevation += noise2D(x * frequency, z * frequency) * amplitude;
    elevation += noise2D(x * frequency * 2, z * frequency * 2) * amplitude * 0.3;
    elevation += noise2D(x * frequency * 4, z * frequency * 4) * amplitude * 0.15;
    
    // Apply height to y-coordinate
    vertices[i + 2] = elevation;
  }
  
  // Update geometry
  geometry.computeVertexNormals();
  
  // Create material
  const material = new THREE.MeshStandardMaterial({
    color: 0x3a7e4d, // Green for grass/land
    flatShading: true, // Enable flat shading for low-poly look
    side: THREE.DoubleSide,
  });
  
  // Create mesh
  const terrain = new THREE.Mesh(geometry, material);
  
  // Rotate to make it horizontal (plane is vertical by default)
  terrain.rotation.x = -Math.PI / 2;
  
  // Enable shadows
  terrain.receiveShadow = true;
  
  return terrain;
}; 