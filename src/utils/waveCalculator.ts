import * as THREE from 'three';

/**
 * Calculates the wave height at a specific position
 * @param x X coordinate
 * @param z Z coordinate
 * @param waveParams Wave parameters object
 * @param time Current time
 * @param terrain Terrain mesh
 * @returns The calculated wave height
 */
export const calculateWaveHeightAt = (
  x: number, 
  z: number, 
  waveParams: any, 
  time: number, 
  terrain: THREE.Mesh
): number => {
  // Base height
  const baseY = 0;
  
  // Get wave height multiplier
  const waveHeight = (terrain as any).waveHeight || 1.0;
  
  // Get storm intensity
  const stormIntensity = waveParams.weather.stormIntensity || 0;
  const stormFactor = 1.0 + stormIntensity * 2.0; // Amplify waves during storms
  
  // Calculate total height from all wave components
  let totalHeight = 0;
  
  // Apply main directional waves
  for (const wave of waveParams.mainWaves) {
    const dirX = x * wave.direction.x;
    const dirZ = z * wave.direction.y;
    const wavePhase = dirX * wave.frequency + dirZ * wave.frequency + time * wave.speed + wave.phase;
    totalHeight += Math.sin(wavePhase) * wave.amplitude * waveHeight * stormFactor;
  }
  
  // Apply chop waves (smaller, higher frequency)
  for (const wave of waveParams.chopWaves) {
    const dirX = x * wave.direction.x;
    const dirZ = z * wave.direction.y;
    const wavePhase = dirX * wave.frequency + dirZ * wave.frequency * 0.8 + time * wave.speed + wave.phase;
    totalHeight += Math.sin(wavePhase) * wave.amplitude * waveHeight * stormFactor * 0.5;
  }
  
  // Add some noise based on position for variety
  const posNoise = Math.sin(x * 0.1) * Math.cos(z * 0.1) * 0.1;
  
  // Add some time-based variation
  const timeNoise = Math.sin(time * 0.2 + x * 0.05 + z * 0.05) * 0.1;
  
  // Combine all effects
  return baseY + totalHeight + posNoise + timeNoise;
}; 