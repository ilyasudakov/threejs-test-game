import * as THREE from 'three';

/**
 * Initializes wave parameters for the terrain
 * @returns Wave parameters object
 */
export const initializeWaveParams = (): any => {
  return {
    // Main directional waves
    mainWaves: Array(3).fill(0).map(() => ({
      direction: new THREE.Vector2(Math.random() * 2 - 1, Math.random() * 2 - 1).normalize(),
      frequency: 0.01 + Math.random() * 0.02,
      speed: 0.3 + Math.random() * 0.5,
      amplitude: 0.3 + Math.random() * 0.4,
      phase: Math.random() * Math.PI * 2
    })),
    // Secondary chop waves
    chopWaves: Array(5).fill(0).map(() => ({
      direction: new THREE.Vector2(Math.random() * 2 - 1, Math.random() * 2 - 1).normalize(),
      frequency: 0.03 + Math.random() * 0.05,
      speed: 0.6 + Math.random() * 0.8,
      amplitude: 0.1 + Math.random() * 0.2,
      phase: Math.random() * Math.PI * 2
    })),
    // Weather and time parameters
    weather: {
      stormIntensity: 0,
      targetStormIntensity: 0,
      stormTransitionSpeed: 0.05,
      timeScale: 1.0,
      lastWeatherChange: 0
    }
  };
};

/**
 * Updates the wave vertices based on the current time and parameters
 * @param terrain The terrain mesh to update
 * @param time Current time
 */
export const updateWaves = (terrain: THREE.Mesh, time: number): void => {
  const vertices = terrain.geometry.attributes.position.array;
  const originalPositions = (terrain as any).originalPositions;
  
  // Get or initialize wave parameters
  if (!(terrain as any).waveParams) {
    (terrain as any).waveParams = initializeWaveParams();
    console.log('Wave parameters initialized');
  }
  
  const waveParams = (terrain as any).waveParams;
  const waveHeight = (terrain as any).waveHeight || 1.0;
  
  // Update weather parameters
  const weather = waveParams.weather;
  
  // Occasionally change weather conditions (every ~30 seconds)
  if (time - weather.lastWeatherChange > 30) {
    weather.targetStormIntensity = Math.random() * 0.8; // 0 to 0.8 storm intensity
    weather.lastWeatherChange = time;
    console.log('Weather changing to intensity:', weather.targetStormIntensity);
  }
  
  // Gradually transition to target storm intensity
  if (Math.abs(weather.stormIntensity - weather.targetStormIntensity) > 0.01) {
    if (weather.stormIntensity < weather.targetStormIntensity) {
      weather.stormIntensity += weather.stormTransitionSpeed * (time - weather.lastWeatherChange) * 0.01;
      if (weather.stormIntensity > weather.targetStormIntensity) {
        weather.stormIntensity = weather.targetStormIntensity;
      }
    } else {
      weather.stormIntensity -= weather.stormTransitionSpeed * (time - weather.lastWeatherChange) * 0.01;
      if (weather.stormIntensity < weather.targetStormIntensity) {
        weather.stormIntensity = weather.targetStormIntensity;
      }
    }
  }
  
  // Get storm intensity factor
  const stormFactor = 1.0 + weather.stormIntensity * 2.0; // Amplify waves during storms
  
  // Update each vertex
  for (let i = 0; i < vertices.length; i += 3) {
    if (originalPositions) {
      const x = originalPositions[i];
      const baseY = originalPositions[i + 1];
      const z = originalPositions[i + 2];
      
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
      
      // Combine all effects and apply to the vertex
      vertices[i + 1] = baseY + totalHeight + posNoise + timeNoise;
    }
  }
  
  // Update the geometry
  terrain.geometry.attributes.position.needsUpdate = true;
  terrain.geometry.computeVertexNormals();
  
  // Occasionally modify wave parameters for variety (every ~5 seconds)
  if (Math.random() < 0.005) {
    // Randomly select and modify one main wave
    const waveIndex = Math.floor(Math.random() * waveParams.mainWaves.length);
    const wave = waveParams.mainWaves[waveIndex];
    
    // Gradually change direction
    const angle = Math.atan2(wave.direction.y, wave.direction.x) + (Math.random() * 0.2 - 0.1);
    wave.direction.set(Math.cos(angle), Math.sin(angle)).normalize();
    
    // Slightly adjust speed and amplitude within reasonable ranges
    wave.speed = Math.max(0.2, Math.min(1.0, wave.speed + (Math.random() * 0.2 - 0.1)));
    wave.amplitude = Math.max(0.2, Math.min(0.8, wave.amplitude + (Math.random() * 0.1 - 0.05)));
    
    console.log('Wave parameters updated:', waveIndex, wave.speed, wave.amplitude);
  }
}; 