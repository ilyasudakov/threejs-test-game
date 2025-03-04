import * as THREE from 'three';

/**
 * Creates static waves for the terrain (no animation)
 * @param terrain The terrain mesh to update
 */
export const createStaticWaves = (terrain: THREE.Mesh): void => {
  console.log('Creating static waves');
  
  const vertices = terrain.geometry.attributes.position.array;
  const originalPositions = (terrain as any).originalPositions;
  
  if (!originalPositions) {
    console.error('Original positions not found on terrain');
    return;
  }
  
  // Set all vertices to their original positions (flat surface)
  for (let i = 0; i < vertices.length; i++) {
    vertices[i] = originalPositions[i];
  }
  
  // Update the geometry
  terrain.geometry.attributes.position.needsUpdate = true;
  terrain.geometry.computeVertexNormals();
  
  // Update colors based on depth
  updateWaveColors(terrain);
  
  console.log('Static waves created');
};

/**
 * Updates the wave colors based on depth
 * @param terrain The terrain mesh to update
 */
export const updateWaveColors = (terrain: THREE.Mesh): void => {
  const vertices = terrain.geometry.attributes.position.array;
  const colors = terrain.geometry.attributes.color?.array;
  
  if (!colors) {
    console.error('Color attribute not found on terrain');
    return;
  }
  
  const colorInfo = (terrain as any).colorInfo;
  if (!colorInfo) {
    console.error('Color info not found on terrain');
    return;
  }
  
  const deepColor = colorInfo.deepColor;
  const shallowColor = colorInfo.shallowColor;
  const foamColor = colorInfo.foamColor;
  
  // Update colors based on vertex height
  for (let i = 0; i < vertices.length; i += 3) {
    const y = vertices[i + 1];
    
    // Normalize height to 0-1 range for color interpolation
    // Assuming water height ranges from -2 to 2
    const normalizedHeight = (y + 2) / 4;
    
    let color;
    if (normalizedHeight < 0.3) {
      // Deep water
      color = deepColor.clone();
    } else if (normalizedHeight > 0.7) {
      // Foam/shallow
      color = new THREE.Color().lerpColors(shallowColor, foamColor, (normalizedHeight - 0.7) / 0.3);
    } else {
      // Mid-range - interpolate between deep and shallow
      color = new THREE.Color().lerpColors(deepColor, shallowColor, (normalizedHeight - 0.3) / 0.4);
    }
    
    // Set the color
    colors[i] = color.r;
    colors[i + 1] = color.g;
    colors[i + 2] = color.b;
  }
  
  // Update the color attribute
  terrain.geometry.attributes.color.needsUpdate = true;
};

/**
 * Updates the wave vertices - now just creates static waves
 * @param terrain The terrain mesh to update
 */
export const updateWaves = (terrain: THREE.Mesh): void => {
  // Only create static waves if they haven't been created yet
  if (!(terrain as any).staticWavesCreated) {
    createStaticWaves(terrain);
    (terrain as any).staticWavesCreated = true;
  }
}; 