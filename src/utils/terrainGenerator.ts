import * as THREE from 'three';
import { createNoise2D } from 'simplex-noise';

// Create a simple low-poly sea using simplex noise
export const createTerrain = (
  width = 1000,
  height = 1000,
  segments = 100,
  amplitude = 5, // Increased from 2 to 5 for more dramatic waves
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
    const frequency = 0.01; // Increased from 0.005 to 0.01 for more pronounced waves
    let elevation = 0;
    
    // Add multiple octaves of noise for more natural waves
    elevation += noise2D(x * frequency, z * frequency) * amplitude;
    elevation += noise2D(x * frequency * 3, z * frequency * 3) * amplitude * 0.4; // Increased from 0.3 to 0.4
    elevation += noise2D(x * frequency * 6, z * frequency * 6) * amplitude * 0.2; // Increased from 0.15 to 0.2
    
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
  const troughColor = new THREE.Color(0x006666); // Dark teal for troughs
  
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
    
    // Add foam to the peaks
    if (normalizedHeight > 0.65) { // Lower threshold for more foam
      // More dramatic foam effect on higher waves
      const foamIntensity = (normalizedHeight - 0.65) / 0.35 * 0.7;
      color.lerp(foamColor, foamIntensity);
    }
    
    // Add a subtle blue-green tint to wave troughs
    if (normalizedHeight < 0.3) {
      const troughIntensity = (0.3 - normalizedHeight) / 0.3 * 0.3;
      color.lerp(troughColor, troughIntensity);
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
  (terrain as any).waveSpeed = 1.0; // Increased from 0.5 to 1.0 for faster wave movement
  (terrain as any).waveHeight = amplitude;
  
  // Store color information for dynamic updates
  (terrain as any).colorInfo = {
    deepColor: deepColor,
    shallowColor: shallowColor,
    foamColor: foamColor,
    troughColor: troughColor
  };
  
  // Add a method to get the height at a specific x,z position
  (terrain as any).getHeightAt = (x: number, z: number): number => {
    // Use the same noise function to calculate height at any position
    const frequency = 0.01; // Match the frequency used for geometry creation
    let elevation = 0;
    
    // Add multiple octaves of noise for more natural waves
    elevation += noise2D(x * frequency, z * frequency) * amplitude;
    elevation += noise2D(x * frequency * 3, z * frequency * 3) * amplitude * 0.4;
    elevation += noise2D(x * frequency * 6, z * frequency * 6) * amplitude * 0.2;
    
    // Add the same sine wave patterns used in updateWaves
    const timeOffset = (terrain as any).lastTimeOffset || 0;
    const sineWave1 = Math.sin(x * 0.05 + timeOffset * 2) * Math.cos(z * 0.05 + timeOffset) * amplitude * 0.3;
    const sineWave2 = Math.sin(x * 0.02 - timeOffset) * Math.cos(z * 0.03 + timeOffset * 0.5) * amplitude * 0.2;
    
    // Combine noise and sine waves
    elevation += sineWave1 + sineWave2;
    
    return elevation;
  };
  
  // Add a method to get the normal at a specific x,z position
  (terrain as any).getNormalAt = (x: number, z: number): THREE.Vector3 => {
    // Sample heights at nearby points to calculate the normal
    const delta = 0.2; // Increased from 0.1 to 0.2 for more pronounced slope detection
    const hL = (terrain as any).getHeightAt(x - delta, z);
    const hR = (terrain as any).getHeightAt(x + delta, z);
    const hD = (terrain as any).getHeightAt(x, z - delta);
    const hU = (terrain as any).getHeightAt(x, z + delta);
    
    // Calculate the normal using the cross product of tangent vectors
    const normal = new THREE.Vector3(
      (hL - hR) * 1.5, // Amplify x component by 1.5x for more pronounced tilting
      2 * delta, // y component (fixed vertical distance)
      (hD - hU) * 1.5 // Amplify z component by 1.5x for more pronounced tilting
    ).normalize();
    
    return normal;
  };
  
  // Add a method to animate the waves
  (terrain as any).updateWaves = (time: number): void => {
    const positions = geometry.attributes.position.array;
    const originalPositions = (terrain as any).originalPositions;
    const waveSpeed = (terrain as any).waveSpeed;
    const waveDirection = (terrain as any).waveDirection;
    const colorInfo = (terrain as any).colorInfo;
    
    // Calculate time-based offset for wave movement
    const timeOffset = time * waveSpeed;
    
    // Store the time offset for getHeightAt method
    (terrain as any).lastTimeOffset = timeOffset;
    
    // Get color attribute for updating
    const colors = geometry.attributes.color.array;
    
    // Update vertex positions for wave animation
    for (let i = 0; i < positions.length; i += 3) {
      const x = originalPositions[i];
      const z = originalPositions[i + 1];
      
      const xOffset = waveDirection.x * timeOffset;
      const zOffset = waveDirection.y * timeOffset;
      
      // Use simplex noise to generate wave height with time offset
      const frequency = 0.01; // Match the frequency used for geometry creation
      let elevation = 0;
      
      // Add multiple octaves of noise for more natural waves
      elevation += noise2D((x + xOffset) * frequency, (z + zOffset) * frequency) * amplitude;
      elevation += noise2D((x + xOffset) * frequency * 3, (z + zOffset) * frequency * 3) * amplitude * 0.4;
      elevation += noise2D((x + xOffset) * frequency * 6, (z + zOffset) * frequency * 6) * amplitude * 0.2;
      
      // Add some sine wave patterns for more dynamic ocean-like waves
      const sineWave1 = Math.sin(x * 0.05 + timeOffset * 2) * Math.cos(z * 0.05 + timeOffset) * amplitude * 0.3;
      const sineWave2 = Math.sin(x * 0.02 - timeOffset) * Math.cos(z * 0.03 + timeOffset * 0.5) * amplitude * 0.2;
      
      // Combine noise and sine waves
      elevation += sineWave1 + sineWave2;
      
      // Apply height to y-coordinate
      positions[i + 2] = elevation;
      
      // Update color based on height
      // Normalize height to 0-1 range for color interpolation
      const normalizedHeight = (elevation + amplitude) / (amplitude * 2);
      
      // Interpolate between deep and shallow color
      const color = new THREE.Color().lerpColors(
        colorInfo.deepColor, 
        colorInfo.shallowColor, 
        normalizedHeight
      );
      
      // Add foam to the peaks
      if (normalizedHeight > 0.65) { // Lower threshold for more foam
        // More dramatic foam effect on higher waves
        const foamIntensity = (normalizedHeight - 0.65) / 0.35 * 0.7;
        color.lerp(colorInfo.foamColor, foamIntensity);
      }
      
      // Add a subtle blue-green tint to wave troughs
      if (normalizedHeight < 0.3) {
        const troughIntensity = (0.3 - normalizedHeight) / 0.3 * 0.3;
        color.lerp(colorInfo.troughColor, troughIntensity);
      }
      
      // Set the color
      colors[i] = color.r;
      colors[i + 1] = color.g;
      colors[i + 2] = color.b;
    }
    
    // Update the geometry
    geometry.attributes.position.needsUpdate = true;
    geometry.attributes.color.needsUpdate = true;
    geometry.computeVertexNormals();
  };
  
  return terrain;
}; 