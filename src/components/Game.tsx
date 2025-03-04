import { useRef, useEffect } from 'react';
import * as THREE from 'three';
// @ts-ignore
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { createScene } from '../utils/sceneSetup';
import { createTerrain } from '../utils/terrainGenerator';
import { FirstPersonControls } from '../utils/firstPersonControls';
import { createSun } from '../utils/sunCreator';
// Removed cenotaph import

const Game = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<FirstPersonControls | null>(null);
  const terrainRef = useRef<THREE.Mesh | null>(null);
  const boatRef = useRef<THREE.Group | null>(null); // Changed from cenotaphRef to boatRef
  const clockRef = useRef<THREE.Clock>(new THREE.Clock());
  const sunRef = useRef<{
    sunMesh: THREE.Mesh;
    sunLight: THREE.DirectionalLight;
    target: THREE.Object3D;
  } | null>(null);
  
  // Development mode for debugging
  const devMode = useRef<boolean>(false);
  const orbitControlsRef = useRef<OrbitControls | null>(null);

  // Initialize the scene
  useEffect(() => {
    if (!containerRef.current) return;

    // Create scene, camera, and renderer
    const { scene, camera, renderer } = createScene(containerRef.current);
    
    // Set a sky color for sea environment
    scene.background = new THREE.Color(0x87ceeb); // Sky blue
    
    // Add fog for atmospheric effect
    scene.fog = new THREE.FogExp2(0xadd8e6, 0.0008); // Light blue fog, less dense
    
    // Store references
    sceneRef.current = scene;
    cameraRef.current = camera;
    rendererRef.current = renderer;
    
    // Enable shadows in renderer
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    // Create sea terrain
    const terrain = createTerrain();
    terrainRef.current = terrain;
    scene.add(terrain);
    
    // Create a simple boat for the player
    const boat = createBoat();
    boatRef.current = boat;
    boat.position.set(0, 2, -300); // Position the boat above the water
    scene.add(boat);
    
    // Add a simple light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5); // Increased intensity for brighter scene
    scene.add(ambientLight);
    
    // Add sun with more dramatic lighting in a static position
    const sunPosition = { x: 500, y: 300, z: 200 }; // Fixed position in the sky
    const { sunMesh, sunLight, target } = createSun(
      100, // Size
      0xffcc66, // Warmer color
      1.2, // Intensity
      sunPosition // Static position
    );
    
    // Add sun and its light to the scene
    scene.add(sunMesh);
    scene.add(sunLight);
    scene.add(target);
    
    // Store sun reference
    sunRef.current = { sunMesh, sunLight, target };
    
    // Add first-person controls
    const fpControls = new FirstPersonControls(camera, renderer.domElement);
    // Set boat speed through the available properties
    // Note: We don't directly set movementSpeed as it's private
    controlsRef.current = fpControls;
    
    // Set initial camera position
    camera.position.set(0, 5, -300);
    
    // Toggle between dev mode and first-person mode with 'T' key
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === 'KeyT') {
        devMode.current = !devMode.current;
        
        if (devMode.current) {
          // Switch to orbit controls
          const orbitControls = new OrbitControls(camera, renderer.domElement);
          orbitControls.enableDamping = true;
          orbitControls.dampingFactor = 0.05;
          orbitControlsRef.current = orbitControls;
          controlsRef.current = null;
          
          // Move camera back for better view
          camera.position.set(0, 200, 400);
        } else {
          // Switch back to first-person controls
          orbitControlsRef.current = null;
          const fpControls = new FirstPersonControls(camera, renderer.domElement);
          controlsRef.current = fpControls;
          
          // Reset camera position to boat
          if (boatRef.current) {
            camera.position.set(
              boatRef.current.position.x,
              boatRef.current.position.y + 3, // Slightly above the boat
              boatRef.current.position.z
            );
          } else {
            camera.position.set(0, 5, -300);
          }
        }
      } else if (event.code === 'KeyL') {
        // Look at the sun when 'L' is pressed
        if (sunRef.current && cameraRef.current) {
          const lookAtPos = new THREE.Vector3().copy(sunRef.current.sunMesh.position);
          cameraRef.current.lookAt(lookAtPos);
        }
      }
    };
    
    // Add event listener for keyboard controls
    window.addEventListener('keydown', handleKeyDown);
    
    // Handle window resize
    const handleResize = () => {
      if (!camera || !renderer) return;
      
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    
    window.addEventListener('resize', handleResize);
    
    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      
      const delta = clockRef.current.getDelta();
      const time = clockRef.current.getElapsedTime();
      
      // Animate the sea waves with more realistic patterns
      if (terrainRef.current) {
        const terrain = terrainRef.current;
        const vertices = terrain.geometry.attributes.position.array;
        const originalPositions = (terrain as any).originalPositions;
        
        // Get or initialize dynamic wave parameters
        if (!(terrain as any).waveParams) {
          (terrain as any).waveParams = {
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
        }
        
        const waveParams = (terrain as any).waveParams;
        const waveHeight = (terrain as any).waveHeight;
        
        // Update weather parameters
        const weather = waveParams.weather;
        
        // Occasionally change weather conditions (every ~30 seconds)
        if (time - weather.lastWeatherChange > 30) {
          weather.targetStormIntensity = Math.random() * 0.8; // 0 to 0.8 storm intensity
          weather.lastWeatherChange = time;
        }
        
        // Gradually transition to target storm intensity
        if (Math.abs(weather.stormIntensity - weather.targetStormIntensity) > 0.01) {
          if (weather.stormIntensity < weather.targetStormIntensity) {
            weather.stormIntensity += weather.stormTransitionSpeed * delta;
          } else {
            weather.stormIntensity -= weather.stormTransitionSpeed * delta;
          }
        }
        
        // Apply storm intensity to wave parameters
        const stormFactor = 1 + weather.stormIntensity * 2;
        
        // Get color information
        const colorInfo = (terrain as any).colorInfo;
        
        // Update colors based on wave height and storm intensity
        if (colorInfo && terrain.geometry.attributes.color) {
          const colors = terrain.geometry.attributes.color.array;
          
          // Adjust colors based on storm intensity
          const stormyDeepColor = new THREE.Color(0x002050); // Darker blue for stormy weather
          const stormyShallowColor = new THREE.Color(0x004570); // Darker teal for stormy weather
          
          // Interpolate base colors based on storm intensity
          const deepColor = new THREE.Color().lerpColors(
            colorInfo.deepColor,
            stormyDeepColor,
            weather.stormIntensity
          );
          
          const shallowColor = new THREE.Color().lerpColors(
            colorInfo.shallowColor,
            stormyShallowColor,
            weather.stormIntensity
          );
          
          // Create different wave patterns
          for (let i = 0; i < vertices.length; i += 3) {
            const x = originalPositions[i];
            const z = originalPositions[i + 1];
            
            let totalHeight = 0;
            
            // Apply main directional waves
            for (const wave of waveParams.mainWaves) {
              const dirX = x * wave.direction.x;
              const dirZ = z * wave.direction.y;
              const wavePhase = dirX * wave.frequency + dirZ * wave.frequency * 0.7 + time * wave.speed + wave.phase;
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
            vertices[i + 2] = originalPositions[i + 2] + totalHeight + posNoise + timeNoise;
            
            // Update color based on new height
            const height = vertices[i + 2];
            const normalizedHeight = (height + waveHeight) / (waveHeight * 2); // Normalize to 0-1
            
            // Interpolate between deep and shallow color
            const color = new THREE.Color().lerpColors(
              deepColor, 
              shallowColor, 
              normalizedHeight
            );
            
            // Add foam to the peaks (more foam during storms)
            const foamThreshold = 0.7 - weather.stormIntensity * 0.2; // Lower threshold during storms
            const foamIntensity = 0.3 + weather.stormIntensity * 0.4; // More intense foam during storms
            
            if (normalizedHeight > foamThreshold) {
              const foamAmount = (normalizedHeight - foamThreshold) / (1 - foamThreshold) * foamIntensity;
              color.lerp(colorInfo.foamColor, foamAmount);
            }
            
            // Set the color
            colors[i] = color.r;
            colors[i + 1] = color.g;
            colors[i + 2] = color.b;
          }
          
          // Update the geometry
          terrain.geometry.attributes.position.needsUpdate = true;
          terrain.geometry.attributes.color.needsUpdate = true;
          terrain.geometry.computeVertexNormals();
        } else {
          // Create different wave patterns (fallback if no color attribute)
          for (let i = 0; i < vertices.length; i += 3) {
            const x = originalPositions[i];
            const z = originalPositions[i + 1];
            
            let totalHeight = 0;
            
            // Apply main directional waves
            for (const wave of waveParams.mainWaves) {
              const dirX = x * wave.direction.x;
              const dirZ = z * wave.direction.y;
              const wavePhase = dirX * wave.frequency + dirZ * wave.frequency * 0.7 + time * wave.speed + wave.phase;
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
            vertices[i + 2] = originalPositions[i + 2] + totalHeight + posNoise + timeNoise;
          }
          
          // Update the geometry
          terrain.geometry.attributes.position.needsUpdate = true;
          terrain.geometry.computeVertexNormals();
        }
        
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
        }
      }
      
      // Make the boat bob on the waves more realistically
      if (boatRef.current && terrainRef.current) {
        const boat = boatRef.current;
        
        // Get boat position
        const boatPos = boat.position.clone();
        
        // Sample wave height at boat position
        const terrain = terrainRef.current;
        const terrainSize = 1000; // Width/height of terrain
        const waveParams = (terrain as any).waveParams;
        
        // Convert boat world position to terrain UV coordinates (0-1)
        const uvX = (boatPos.x + terrainSize/2) / terrainSize;
        const uvZ = (boatPos.z + terrainSize/2) / terrainSize;
        
        // Calculate wave height at boat position using the same wave algorithm
        let waveHeight = 2; // Base height
        
        if (waveParams) {
          const x = boatPos.x;
          const z = boatPos.z;
          const stormFactor = 1 + waveParams.weather.stormIntensity * 2;
          
          // Apply main directional waves
          for (const wave of waveParams.mainWaves) {
            const dirX = x * wave.direction.x;
            const dirZ = z * wave.direction.y;
            const wavePhase = dirX * wave.frequency + dirZ * wave.frequency * 0.7 + time * wave.speed + wave.phase;
            waveHeight += Math.sin(wavePhase) * wave.amplitude * (terrain as any).waveHeight * stormFactor;
          }
          
          // Apply some chop waves (just a couple for performance)
          for (let i = 0; i < 2 && i < waveParams.chopWaves.length; i++) {
            const wave = waveParams.chopWaves[i];
            const dirX = x * wave.direction.x;
            const dirZ = z * wave.direction.y;
            const wavePhase = dirX * wave.frequency + dirZ * wave.frequency * 0.8 + time * wave.speed + wave.phase;
            waveHeight += Math.sin(wavePhase) * wave.amplitude * (terrain as any).waveHeight * stormFactor * 0.5;
          }
          
          // Calculate wave gradients (derivatives) for boat tilting
          const sampleDistance = 5; // Distance to sample for gradient calculation
          
          // Sample points around the boat
          const heightPosX = calculateWaveHeightAt(x + sampleDistance, z, waveParams, time, terrain);
          const heightNegX = calculateWaveHeightAt(x - sampleDistance, z, waveParams, time, terrain);
          const heightPosZ = calculateWaveHeightAt(x, z + sampleDistance, waveParams, time, terrain);
          const heightNegZ = calculateWaveHeightAt(x, z - sampleDistance, waveParams, time, terrain);
          
          // Calculate gradients
          const gradientX = (heightPosX - heightNegX) / (2 * sampleDistance);
          const gradientZ = (heightPosZ - heightNegZ) / (2 * sampleDistance);
          
          // Apply height to boat
          boat.position.y = waveHeight;
          
          // Apply tilt based on wave gradient
          boat.rotation.x = -gradientZ * (1 + waveParams.weather.stormIntensity);
          boat.rotation.z = gradientX * (1 + waveParams.weather.stormIntensity);
          
          // Add some gentle rocking that increases with storm intensity
          const rockIntensity = 0.02 * (1 + waveParams.weather.stormIntensity * 2);
          boat.rotation.x += Math.sin(time * 0.5) * rockIntensity;
          boat.rotation.z += Math.sin(time * 0.7) * rockIntensity;
        } else {
          // Fallback if wave params aren't initialized yet
          waveHeight += Math.sin(uvX * 20 + time) * 0.5 + Math.sin(uvZ * 20 + time * 0.7) * 0.5;
          boat.position.y = waveHeight;
          
          // Apply tilt
          const gradientX = Math.cos(uvX * 20 + time) * 0.5 * 20;
          const gradientZ = Math.cos(uvZ * 20 + time * 0.7) * 0.5 * 20;
          
          boat.rotation.x = -gradientZ * 0.01;
          boat.rotation.z = gradientX * 0.01;
          
          // Add some gentle rocking
          boat.rotation.x += Math.sin(time * 0.5) * 0.02;
          boat.rotation.z += Math.sin(time * 0.7) * 0.01;
        }
        
        // If in first-person mode, update camera position to follow boat
        if (!devMode.current && controlsRef.current && cameraRef.current) {
          // Get current camera position relative to boat
          const camera = cameraRef.current;
          
          // Update boat position based on controls
          if (controlsRef.current) {
            const boatSpeed = controlsRef.current.getBoatSpeed();
            const boatDirection = controlsRef.current.getBoatDirection();
            
            // Calculate movement vector based on boat direction and speed
            const moveX = Math.sin(boatDirection) * boatSpeed * delta;
            const moveZ = Math.cos(boatDirection) * boatSpeed * delta;
            
            // Apply movement to boat position
            boat.position.x += moveX;
            boat.position.z += moveZ;
            
            // Rotate boat to match direction
            boat.rotation.y = -boatDirection;
            
            // Update camera position to follow boat
            camera.position.x = boat.position.x;
            camera.position.z = boat.position.z;
            camera.position.y = boat.position.y + 3 + Math.sin(time * 0.8) * 0.2;
          }
        }
        
        // Animate the flag based on boat speed
        if ((boat as any).flag) {
          const flag = (boat as any).flag;
          const boatSpeed = controlsRef.current?.getBoatSpeed() || 0;
          
          // Wave the flag based on speed
          flag.rotation.z = Math.sin(time * 3) * 0.2 * Math.min(1, Math.abs(boatSpeed) / 5);
          // Bend the flag in the direction of movement
          flag.position.x = 1 + Math.min(1, Math.abs(boatSpeed) / 10);
        }
        
        // Animate the rudder based on turning
        if ((boat as any).rudder && controlsRef.current) {
          const rudder = (boat as any).rudder;
          const isLeft = controlsRef.current.getBoatDirection() > 0;
          const isRight = controlsRef.current.getBoatDirection() < 0;
          
          // Rotate rudder based on turning direction
          if (isLeft) {
            rudder.rotation.y = Math.PI * 0.1;
          } else if (isRight) {
            rudder.rotation.y = -Math.PI * 0.1;
          } else {
            rudder.rotation.y = 0;
          }
        }
        
        // Create water splash effect when moving fast
        if ((boat as any).splashGroup && controlsRef.current) {
          const splashGroup = (boat as any).splashGroup;
          const boatSpeed = controlsRef.current.getBoatSpeed() || 0;
          
          // Only create splashes when moving forward at sufficient speed
          if (boatSpeed > 5 && Math.random() < 0.1) {
            // Find an available splash particle
            for (let i = 0; i < splashGroup.children.length; i++) {
              const splash = splashGroup.children[i];
              if (!splash.visible) {
                // Reset splash
                splash.position.set(
                  (Math.random() - 0.5) * 4, // Random x position
                  0, // Start at water level
                  (Math.random() - 0.5) * 2 // Random z position
                );
                splash.visible = true;
                (splash as any).life = 0;
                (splash as any).velocity.set(
                  (Math.random() - 0.5) * 2,
                  Math.random() * 5 + 2,
                  (Math.random() - 0.5) * 2
                );
                break;
              }
            }
          }
          
          // Animate existing splashes
          for (let i = 0; i < splashGroup.children.length; i++) {
            const splash = splashGroup.children[i];
            if (splash.visible) {
              // Update position
              splash.position.x += (splash as any).velocity.x * delta;
              splash.position.y += (splash as any).velocity.y * delta;
              splash.position.z += (splash as any).velocity.z * delta;
              
              // Apply gravity
              (splash as any).velocity.y -= 9.8 * delta;
              
              // Update life
              (splash as any).life += delta;
              
              // Fade out based on life
              const fadeRatio = 1 - ((splash as any).life / (splash as any).maxLife);
              (splash.material as THREE.MeshBasicMaterial).opacity = 0.7 * fadeRatio;
              
              // Hide when life is over or below water
              if ((splash as any).life >= (splash as any).maxLife || splash.position.y < 0) {
                splash.visible = false;
              }
            }
          }
        }
      }
      
      if (devMode.current && orbitControlsRef.current) {
        orbitControlsRef.current.update();
      } else if (controlsRef.current) {
        controlsRef.current.update(delta, terrainRef.current || undefined);
      }
      
      renderer.render(scene, camera);
    };
    
    animate();
    
    // Cleanup function
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleResize);
      
      // Dispose of resources
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
    };
  }, []);
  
  return (
    <div 
      ref={containerRef} 
      style={{ 
        width: '100%', 
        height: '100vh', 
        overflow: 'hidden',
        backgroundColor: 'black'
      }}
    />
  );
};

// Create a simple boat model
const createBoat = (): THREE.Group => {
  const boatGroup = new THREE.Group();
  
  // Boat hull
  const hullGeometry = new THREE.BoxGeometry(10, 3, 20);
  const hullMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x8b4513, // Brown
    roughness: 0.7,
    metalness: 0.1
  });
  const hull = new THREE.Mesh(hullGeometry, hullMaterial);
  hull.position.y = 0;
  hull.castShadow = true;
  hull.receiveShadow = true;
  boatGroup.add(hull);
  
  // Boat deck
  const deckGeometry = new THREE.BoxGeometry(8, 0.5, 18);
  const deckMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xd2b48c, // Tan
    roughness: 0.8,
    metalness: 0.1
  });
  const deck = new THREE.Mesh(deckGeometry, deckMaterial);
  deck.position.y = 1.5;
  deck.castShadow = true;
  deck.receiveShadow = true;
  boatGroup.add(deck);
  
  // Boat mast
  const mastGeometry = new THREE.CylinderGeometry(0.3, 0.3, 15, 8);
  const mastMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x8b4513, // Brown
    roughness: 0.7,
    metalness: 0.1
  });
  const mast = new THREE.Mesh(mastGeometry, mastMaterial);
  mast.position.y = 9;
  mast.position.z = -2;
  mast.castShadow = true;
  mast.receiveShadow = true;
  boatGroup.add(mast);
  
  // Boat sail
  const sailGeometry = new THREE.PlaneGeometry(10, 12);
  const sailMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xf5f5f5, // White
    roughness: 0.5,
    metalness: 0.1,
    side: THREE.DoubleSide
  });
  const sail = new THREE.Mesh(sailGeometry, sailMaterial);
  sail.position.y = 8;
  sail.position.z = 1;
  sail.rotation.y = Math.PI / 2;
  sail.castShadow = true;
  sail.receiveShadow = true;
  boatGroup.add(sail);
  
  // Add a flag at the top of the mast
  const flagPoleGeometry = new THREE.CylinderGeometry(0.1, 0.1, 2, 8);
  const flagPoleMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x8b4513, // Brown
    roughness: 0.7,
    metalness: 0.1
  });
  const flagPole = new THREE.Mesh(flagPoleGeometry, flagPoleMaterial);
  flagPole.position.y = 16.5;
  flagPole.position.z = -2;
  boatGroup.add(flagPole);
  
  // Create flag
  const flagGeometry = new THREE.PlaneGeometry(2, 1);
  const flagMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xff0000, // Red
    roughness: 0.7,
    metalness: 0.1,
    side: THREE.DoubleSide
  });
  const flag = new THREE.Mesh(flagGeometry, flagMaterial);
  flag.position.y = 16.5;
  flag.position.z = -1;
  flag.position.x = 1;
  flag.rotation.y = Math.PI / 2;
  flag.castShadow = true;
  flag.receiveShadow = true;
  // Store flag for animation
  (boatGroup as any).flag = flag;
  boatGroup.add(flag);
  
  // Add rudder
  const rudderGeometry = new THREE.BoxGeometry(0.5, 2, 3);
  const rudderMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x8b4513, // Brown
    roughness: 0.7,
    metalness: 0.1
  });
  const rudder = new THREE.Mesh(rudderGeometry, rudderMaterial);
  rudder.position.y = 0;
  rudder.position.z = 10;
  rudder.castShadow = true;
  rudder.receiveShadow = true;
  // Store rudder for animation
  (boatGroup as any).rudder = rudder;
  boatGroup.add(rudder);
  
  // Create water splash particles
  const splashCount = 20;
  const splashGroup = new THREE.Group();
  const splashGeometry = new THREE.SphereGeometry(0.2, 4, 4);
  const splashMaterial = new THREE.MeshBasicMaterial({ 
    color: 0xffffff,
    transparent: true,
    opacity: 0.7
  });
  
  for (let i = 0; i < splashCount; i++) {
    const splash = new THREE.Mesh(splashGeometry, splashMaterial);
    splash.visible = false;
    // Store initial position and velocity for animation
    (splash as any).velocity = new THREE.Vector3(
      (Math.random() - 0.5) * 2,
      Math.random() * 5 + 2,
      (Math.random() - 0.5) * 2
    );
    (splash as any).life = 0;
    (splash as any).maxLife = Math.random() * 1 + 0.5;
    splashGroup.add(splash);
  }
  
  // Position splash at the front of the boat
  splashGroup.position.z = -10;
  splashGroup.position.y = 0;
  // Store splash group for animation
  (boatGroup as any).splashGroup = splashGroup;
  boatGroup.add(splashGroup);
  
  return boatGroup;
};

// Helper function to calculate wave height at a specific position
const calculateWaveHeightAt = (
  x: number, 
  z: number, 
  waveParams: any, 
  time: number, 
  terrain: THREE.Mesh
): number => {
  let height = 2; // Base height
  const stormFactor = 1 + waveParams.weather.stormIntensity * 2;
  
  // Apply main directional waves
  for (const wave of waveParams.mainWaves) {
    const dirX = x * wave.direction.x;
    const dirZ = z * wave.direction.y;
    const wavePhase = dirX * wave.frequency + dirZ * wave.frequency * 0.7 + time * wave.speed + wave.phase;
    height += Math.sin(wavePhase) * wave.amplitude * (terrain as any).waveHeight * stormFactor;
  }
  
  // Apply some chop waves (just a couple for performance)
  for (let i = 0; i < 2 && i < waveParams.chopWaves.length; i++) {
    const wave = waveParams.chopWaves[i];
    const dirX = x * wave.direction.x;
    const dirZ = z * wave.direction.y;
    const wavePhase = dirX * wave.frequency + dirZ * wave.frequency * 0.8 + time * wave.speed + wave.phase;
    height += Math.sin(wavePhase) * wave.amplitude * (terrain as any).waveHeight * stormFactor * 0.5;
  }
  
  return height;
};

export default Game; 