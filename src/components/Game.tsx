import { useRef, useEffect, useState, useCallback } from "react";
import * as THREE from "three";
import { createScene } from "../utils/sceneSetup";
import { createTerrain } from "../utils/terrainGenerator";
import { BoatControls } from "../utils/boatControls";
import { createSun } from "../utils/sunCreator";
import { createBoat } from "../utils/boatCreator";

const Game = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<BoatControls | null>(null);
  const terrainRef = useRef<THREE.Mesh | null>(null);
  const boatRef = useRef<THREE.Group | null>(null);
  const sunRef = useRef<{
    sunMesh: THREE.Mesh;
    sunLight: THREE.DirectionalLight;
    target: THREE.Object3D;
  } | null>(null);
  const [isLoopRunning, setIsLoopRunning] = useState<boolean>(false);
  const animationFrameIdRef = useRef<number | null>(null);
  const isAnimatingRef = useRef<boolean>(true);
  const timeRef = useRef<number>(0);
  
  // Debug visualization refs
  const debugNormalRef = useRef<{
    line: THREE.Line;
    visible: boolean;
  } | null>(null);
  
  // Toggle debug visualization
  const toggleDebugNormal = useCallback(() => {
    if (debugNormalRef.current) {
      debugNormalRef.current.visible = !debugNormalRef.current.visible;
      if (debugNormalRef.current.line.parent) {
        debugNormalRef.current.line.visible = debugNormalRef.current.visible;
      }
    }
  }, []);
  
  // Function to create debug normal visualization
  const createDebugNormal = useCallback(() => {
    if (!sceneRef.current) return;
    
    // Create a line to represent the normal vector
    const material = new THREE.LineBasicMaterial({ 
      color: 0xff0000, // Red color for normal vector
      linewidth: 3 // Thicker line for visibility
    });
    
    // Create geometry with two points (origin and direction)
    const points = [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 5, 0) // Default up vector, will be updated
    ];
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    
    // Create the line
    const line = new THREE.Line(geometry, material);
    line.frustumCulled = false; // Always render the line
    
    // Add to scene
    sceneRef.current.add(line);
    
    // Store reference
    debugNormalRef.current = {
      line,
      visible: true
    };
  }, []);
  
  // Function to update debug normal visualization
  const updateDebugNormal = useCallback(() => {
    if (!debugNormalRef.current || !debugNormalRef.current.visible || !controlsRef.current || !boatRef.current) return;
    
    // Get the current boat position and wave normal
    const boatPosition = controlsRef.current.getBoatPosition();
    const waveNormal = controlsRef.current.getDebugWaveNormal();
    
    // Scale the normal vector for better visualization
    const normalLength = 10; // Length of the normal vector line
    const normalEnd = waveNormal.clone().multiplyScalar(normalLength);
    
    // Update the line geometry
    const points = [
      new THREE.Vector3(0, 0, 0), // Origin at boat position
      normalEnd // End point in normal direction
    ];
    
    // Update the line geometry
    const geometry = debugNormalRef.current.line.geometry;
    const positionAttribute = geometry.getAttribute('position');
    
    // Update position attribute
    positionAttribute.setXYZ(0, 0, 0, 0); // Origin
    positionAttribute.setXYZ(1, normalEnd.x, normalEnd.y, normalEnd.z); // End point
    positionAttribute.needsUpdate = true;
    
    // Position the line at the boat position
    debugNormalRef.current.line.position.copy(boatPosition);
  }, []);
  
  // Handle window resize
  const handleResize = () => {
    if (!cameraRef.current || !rendererRef.current) return;

    cameraRef.current.aspect = window.innerWidth / window.innerHeight;
    cameraRef.current.updateProjectionMatrix();
    rendererRef.current.setSize(window.innerWidth, window.innerHeight);
  };
  
  window.addEventListener('resize', handleResize);
  
  // Force initial resize
  handleResize();

  // Function to start/restart animation loop
  const startAnimationLoop = useCallback(() => {
    if (!rendererRef.current || !sceneRef.current || !cameraRef.current) {
      console.warn("Cannot start animation loop - missing required references");
      return;
    }
    
    isAnimatingRef.current = true;
    setIsLoopRunning(true);
    
    let lastTime = performance.now();

    const animate = () => {
      // Only continue if we should be animating
      if (!isAnimatingRef.current) return;
      
      try {
        // Calculate delta time for smooth movement
        const currentTime = performance.now();
        const deltaTime = Math.min(
          0.1,
          (currentTime - (lastTime || currentTime)) / 1000
        ); // Convert to seconds, cap at 0.1s
        lastTime = currentTime;
        
        // Update time reference for wave animation
        timeRef.current += deltaTime;

        // Animate waves
        if (terrainRef.current && (terrainRef.current as any).updateWaves) {
          (terrainRef.current as any).updateWaves(timeRef.current);
        }

        // Update controls
        if (controlsRef.current && boatRef.current) {
          // Update boat controls with delta time
          controlsRef.current.update(deltaTime);

          // Update boat mesh position to match the boat position in controls
          boatRef.current.position.copy(controlsRef.current.getBoatPosition());

          // Update boat rotation based on boat rotation in controls
          const boatRotation = controlsRef.current.getBoatRotation();
          boatRef.current.rotation.copy(boatRotation);
          
          // Update debug normal visualization
          updateDebugNormal();
          
          // Animate water splashes based on boat speed
          const boatSpeed = controlsRef.current.getBoatSpeed();
          const splashGroup = (boatRef.current as any).splashGroup;
          const wakeGroup = (boatRef.current as any).wakeGroup;
          
          // Function to update particle physics
          const updateParticles = (particles: THREE.Object3D[], deltaTime: number) => {
            particles.forEach((particle: THREE.Object3D) => {
              if ((particle as THREE.Mesh).visible) {
                // Update particle position based on velocity
                particle.position.x += (particle as any).velocity.x * deltaTime;
                particle.position.y += (particle as any).velocity.y * deltaTime;
                particle.position.z += (particle as any).velocity.z * deltaTime;
                
                // Apply gravity
                (particle as any).velocity.y -= 9.8 * deltaTime;
                
                // Update life
                (particle as any).life += deltaTime;
                
                // Scale down and fade out as life increases
                const lifeRatio = (particle as any).life / (particle as any).maxLife;
                particle.scale.setScalar(1 - lifeRatio * 0.7); // Don't scale all the way to zero
                ((particle as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity = 0.7 * (1 - lifeRatio);
                
                // Hide when life is over
                if ((particle as any).life >= (particle as any).maxLife) {
                  (particle as THREE.Mesh).visible = false;
                }
              }
            });
          };
          
          if (splashGroup) {
            // Get absolute speed (positive value)
            const absSpeed = Math.abs(boatSpeed);
            
            // Only create splashes if boat is moving fast enough
            const minSpeedForSplash = 200; // Minimum speed to create splashes
            const splashIntensity = Math.min(1, (absSpeed - minSpeedForSplash) / 300); // 0 to 1 based on speed
            
            // Update existing splash particles
            updateParticles(splashGroup.children, deltaTime);
            
            // Create new splashes based on speed
            if (absSpeed > minSpeedForSplash) {
              // Number of splashes to create this frame based on speed
              const splashesPerSecond = 10 * splashIntensity;
              const splashProbability = splashesPerSecond * deltaTime;
              
              // Random chance to create a splash this frame
              if (Math.random() < splashProbability) {
                // Find an available splash particle
                const availableSplashes = splashGroup.children.filter(
                  (splash: THREE.Mesh) => !splash.visible
                );
                
                if (availableSplashes.length > 0) {
                  // Get a random available splash
                  const splash = availableSplashes[
                    Math.floor(Math.random() * availableSplashes.length)
                  ];
                  
                  // Position at water level with slight randomization
                  splash.position.set(
                    (Math.random() - 0.5) * 4, // Random X offset
                    0, // At water level
                    (Math.random() - 0.5) * 4 // Random Z offset
                  );
                  
                  // Set velocity based on boat speed
                  const speedFactor = Math.min(1, absSpeed / 600);
                  (splash as any).velocity.set(
                    (Math.random() - 0.5) * 4 * speedFactor,
                    (Math.random() * 5 + 5) * speedFactor, // Higher jumps at higher speeds
                    (Math.random() - 0.5) * 4 * speedFactor
                  );
                  
                  // Reset life
                  (splash as any).life = 0;
                  (splash as any).maxLife = Math.random() * 1 + 0.5;
                  
                  // Reset scale and opacity
                  splash.scale.setScalar(1);
                  (splash.material as THREE.MeshBasicMaterial).opacity = 0.7;
                  
                  // Make visible
                  splash.visible = true;
                }
              }
            }
          }
          
          // Handle wake particles
          if (wakeGroup) {
            const absSpeed = Math.abs(boatSpeed);
            
            // Lower threshold for wake - wake appears at lower speeds
            const minSpeedForWake = 100;
            const wakeIntensity = Math.min(1, (absSpeed - minSpeedForWake) / 300);
            
            // Update existing wake particles
            updateParticles(wakeGroup.children, deltaTime);
            
            // Create new wake particles based on speed
            if (absSpeed > minSpeedForWake) {
              // Wake is more continuous than splashes
              const wakeParticlesPerSecond = 15 * wakeIntensity;
              const wakeProbability = wakeParticlesPerSecond * deltaTime;
              
              if (Math.random() < wakeProbability) {
                // Find available wake particles
                const availableWakeParticles = wakeGroup.children.filter(
                  (particle: THREE.Mesh) => !particle.visible
                );
                
                if (availableWakeParticles.length > 0) {
                  const wakeParticle = availableWakeParticles[
                    Math.floor(Math.random() * availableWakeParticles.length)
                  ];
                  
                  // Position at sides of the boat
                  const side = Math.random() > 0.5 ? 1 : -1; // Left or right side
                  wakeParticle.position.set(
                    side * (2 + Math.random()), // Position at side of boat
                    0, // At water level
                    (Math.random() - 0.5) * 6 // Along the boat length
                  );
                  
                  // Velocity spreads outward from boat
                  const speedFactor = Math.min(1, absSpeed / 500);
                  (wakeParticle as any).velocity.set(
                    side * (1 + Math.random()) * speedFactor, // Outward from boat
                    (Math.random() * 2 + 1) * speedFactor, // Lower height for wake
                    (Math.random() - 0.5) * 2 * speedFactor // Slight forward/backward
                  );
                  
                  // Reset life - wake lasts longer
                  (wakeParticle as any).life = 0;
                  (wakeParticle as any).maxLife = Math.random() * 1.2 + 0.8;
                  
                  // Reset scale and opacity
                  wakeParticle.scale.setScalar(0.8 + Math.random() * 0.4); // Varied sizes
                  (wakeParticle.material as THREE.MeshBasicMaterial).opacity = 0.5 + Math.random() * 0.2;
                  
                  // Make visible
                  wakeParticle.visible = true;
                }
              }
            }
          }
        }

        // Use rendererRef.current instead of renderer
        if (rendererRef.current && sceneRef.current && cameraRef.current) {
          rendererRef.current.render(sceneRef.current, cameraRef.current);
        } else {
          console.warn("Render skipped: Missing required references");
        }
        
        // Request next frame at the end to ensure proper recursion
        animationFrameIdRef.current = requestAnimationFrame(animate);
      } catch (error) {
        console.error("Error in animation loop:", error);
        // Try to recover by requesting next frame
        animationFrameIdRef.current = requestAnimationFrame(animate);
      }
    };

    // Start the animation loop
    animationFrameIdRef.current = requestAnimationFrame(animate);
  }, []);

  // Function to stop animation loop
  const stopAnimationLoop = useCallback(() => {
    isAnimatingRef.current = false;
    setIsLoopRunning(false);
    
    if (animationFrameIdRef.current) {
      cancelAnimationFrame(animationFrameIdRef.current);
      animationFrameIdRef.current = null;
    }
  }, []);

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

    // Create a boat for the player
    const boat = createBoat();
    boatRef.current = boat;
    boat.position.set(0, 2, 0); // Position the boat at the center for better visibility
    scene.add(boat);

    // Add a simple light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7); // Increased intensity for brighter scene
    scene.add(ambientLight);

    // Add sun with more dramatic lighting in a static position
    const sunPosition = { x: 500, y: 300, z: 200 }; // Fixed position in the sky
    const { sunMesh, sunLight, target } = createSun(
      100, // Size
      0xffcc66, // Warmer color
      1.5, // Increased intensity
      sunPosition // Static position
    );

    // Add sun and its light to the scene
    scene.add(sunMesh);
    scene.add(sunLight);
    scene.add(target);

    // Store sun reference
    sunRef.current = { sunMesh, sunLight, target };

    // Add boat controls
    const boatControls = new BoatControls(camera, renderer.domElement);
    controlsRef.current = boatControls;
    
    // Connect boat controls with terrain
    boatControls.setTerrain(terrain);

    // Set initial boat position for the controls
    if (boat) {
      boatControls.setBoatPosition(boat.position);
    }

    // Position camera to see the boat - closer and looking directly at the boat
    camera.position.set(0, 30, 50); // Higher up and closer
    camera.lookAt(0, 0, 0); // Look at the center where the boat is

    // Start animation loop
    startAnimationLoop();

    // Create debug normal visualization
    createDebugNormal();

    // Add keyboard shortcut for toggling debug normal
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'n') {
        toggleDebugNormal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    // Cleanup function
    return () => {
      stopAnimationLoop();
      
      window.removeEventListener("resize", handleResize);

      // Dispose of resources
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }

      // Dispose of controls
      if (controlsRef.current) {
        controlsRef.current.dispose();
      }

      // Dispose of debug normal
      if (debugNormalRef.current) {
        debugNormalRef.current.line.geometry.dispose();
        (debugNormalRef.current.line.material as THREE.Material).dispose();
        if (debugNormalRef.current.line.parent) {
          debugNormalRef.current.line.parent.remove(debugNormalRef.current.line);
        }
      }

      // Remove keyboard shortcut
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [startAnimationLoop, stopAnimationLoop, createDebugNormal, toggleDebugNormal, updateDebugNormal, handleResize]);

  return (
    <>
      <div
        ref={containerRef}
        style={{
          width: "100%",
          height: "100vh",
          overflow: "hidden",
          backgroundColor: "black",
        }}
      />
      <div style={{
        position: 'absolute',
        top: '10px',
        left: '10px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
      }}>
        <button 
          onClick={isLoopRunning ? stopAnimationLoop : startAnimationLoop}
          style={{
            padding: '8px 16px',
            backgroundColor: isLoopRunning ? '#ff4444' : '#44ff44',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          {isLoopRunning ? 'Stop Animation' : 'Start Animation'}
        </button>
      </div>
    </>
  );
};

export default Game;
