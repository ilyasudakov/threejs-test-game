import { useRef, useEffect } from 'react';
import * as THREE from 'three';
// @ts-ignore
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { createScene } from '../utils/sceneSetup';
import { createTerrain } from '../utils/terrainGenerator';
import { FirstPersonControls } from '../utils/firstPersonControls';
import useWindowSize from '../hooks/useWindowSize';

const Game = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<FirstPersonControls | null>(null);
  const terrainRef = useRef<THREE.Mesh | null>(null);
  const clockRef = useRef<THREE.Clock>(new THREE.Clock());
  const { width, height } = useWindowSize();
  
  // Development mode for debugging
  const devMode = useRef<boolean>(false);
  const orbitControlsRef = useRef<OrbitControls | null>(null);

  // Initialize the scene
  useEffect(() => {
    if (!containerRef.current) return;

    // Create scene, camera, and renderer
    const { scene, camera, renderer } = createScene(containerRef.current);
    
    // Store references
    sceneRef.current = scene;
    cameraRef.current = camera;
    rendererRef.current = renderer;
    
    // Create terrain
    const terrain = createTerrain();
    terrainRef.current = terrain;
    scene.add(terrain);
    
    // Add a simple light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(1, 1, 1);
    directionalLight.castShadow = true;
    scene.add(directionalLight);
    
    // Set up controls based on mode
    if (devMode.current) {
      // Orbit controls for development
      const orbitControls = new OrbitControls(camera, renderer.domElement);
      orbitControls.enableDamping = true;
      orbitControls.dampingFactor = 0.05;
      orbitControlsRef.current = orbitControls;
    } else {
      // First person controls for gameplay
      const fpControls = new FirstPersonControls(camera, renderer.domElement);
      controlsRef.current = fpControls;
      
      // Set initial camera position for first-person view
      camera.position.set(0, 5, 0);
    }
    
    // Start the clock for delta time calculation
    clockRef.current.start();
    
    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      
      const delta = clockRef.current.getDelta();
      
      if (devMode.current && orbitControlsRef.current) {
        orbitControlsRef.current.update();
      } else if (controlsRef.current) {
        controlsRef.current.update(delta, terrainRef.current || undefined);
      }
      
      renderer.render(scene, camera);
    };
    
    animate();
    
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
          camera.position.set(0, 20, 30);
          camera.lookAt(0, 0, 0);
        } else {
          // Switch to first-person controls
          orbitControlsRef.current?.dispose();
          orbitControlsRef.current = null;
          
          const fpControls = new FirstPersonControls(camera, renderer.domElement);
          controlsRef.current = fpControls;
          
          // Reset camera position for first-person view
          camera.position.set(0, 5, 0);
        }
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    
    // Cleanup
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      renderer.dispose();
      scene.clear();
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, []);
  
  // Handle window resize
  useEffect(() => {
    if (!cameraRef.current || !rendererRef.current) return;
    
    const camera = cameraRef.current;
    const renderer = rendererRef.current;
    
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  }, [width, height]);
  
  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />;
};

export default Game; 