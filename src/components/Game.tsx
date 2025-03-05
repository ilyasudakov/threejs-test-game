import { useRef, useEffect } from "react";
import * as THREE from "three";
import { createScene } from "../utils/sceneSetup";
import { createTerrain } from "../utils/terrainGenerator";
import { BoatControls } from "../utils/boatControls";
import { createSun } from "../utils/sunCreator";
import { createBoat } from "../utils/boatCreator";
// Removed cenotaph import

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

    // Add boat controls
    const boatControls = new BoatControls(camera, renderer.domElement);
    controlsRef.current = boatControls;

    // Set initial boat position for the controls
    if (boat) {
      boatControls.setBoatPosition(boat.position);
    }

    // Handle window resize
    const handleResize = () => {
      if (!camera || !renderer) return;

      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener("resize", handleResize);

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      
      // Calculate delta time for smooth movement
      const currentTime = performance.now();
      const deltaTime = Math.min(0.1, (currentTime - (lastTime || currentTime)) / 1000); // Convert to seconds, cap at 0.1s
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
      
      renderer.render(scene, camera);
    };
    
    let lastTime: number;
    animate();

    // Cleanup function
    return () => {
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
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        height: "100vh",
        overflow: "hidden",
        backgroundColor: "black",
      }}
    />
  );
};

export default Game;
