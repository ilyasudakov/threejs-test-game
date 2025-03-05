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

        // Update controls
        if (controlsRef.current && boatRef.current) {
          // Update boat controls with delta time
          controlsRef.current.update(deltaTime);

          // Update boat mesh position to match the boat position in controls
          boatRef.current.position.copy(controlsRef.current.getBoatPosition());

          // Update boat rotation based on boat direction
          boatRef.current.rotation.y = controlsRef.current.getBoatDirection();
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

    // Set initial boat position for the controls
    if (boat) {
      boatControls.setBoatPosition(boat.position);
    }

    // Position camera to see the boat - closer and looking directly at the boat
    camera.position.set(0, 30, 50); // Higher up and closer
    camera.lookAt(0, 0, 0); // Look at the center where the boat is

    // Handle window resize
    const handleResize = () => {
      if (!cameraRef.current || !rendererRef.current) return;

      cameraRef.current.aspect = window.innerWidth / window.innerHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener("resize", handleResize);
    
    // Force initial resize
    handleResize();

    // Make sure the renderer is properly attached to the DOM
    if (containerRef.current && renderer.domElement && !containerRef.current.contains(renderer.domElement)) {
      containerRef.current.appendChild(renderer.domElement);
    }

    // Start animation loop
    startAnimationLoop();

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
    };
  }, []); // Empty dependency array to ensure this only runs once

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
