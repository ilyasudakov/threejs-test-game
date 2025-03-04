import * as THREE from 'three';
import { createScene } from './sceneSetup';
import { createTerrain } from './terrainGenerator';
import { createSun } from './sunCreator';
import { createBoat } from './boatCreator';
import { updateWaves } from './waveGenerator';
import { CameraControlsManager } from './cameraControlsManager';
import { BoatController } from './boatController';
import { EventManager } from './eventManager';

export interface SceneManagerProps {
  container: HTMLDivElement;
  playerOffsetX?: number;
  playerOffsetY?: number;
  playerOffsetZ?: number;
}

export class SceneManager {
  // Scene objects
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private terrain: THREE.Mesh;
  private boat: THREE.Group;
  private sun: {
    sunMesh: THREE.Mesh;
    sunLight: THREE.DirectionalLight;
    target: THREE.Object3D;
  };
  
  // Managers
  private cameraManager: CameraControlsManager;
  private boatController: BoatController;
  private eventManager: EventManager;
  
  // Animation
  private clock: THREE.Clock = new THREE.Clock();
  private animationFrameId: number | null = null;
  
  // Player settings
  private playerOffsetX: number;
  private playerOffsetY: number;
  private playerOffsetZ: number;
  
  constructor({ 
    container, 
    playerOffsetX = 0, 
    playerOffsetY = 5, 
    playerOffsetZ = 0 
  }: SceneManagerProps) {
    this.playerOffsetX = playerOffsetX;
    this.playerOffsetY = playerOffsetY;
    this.playerOffsetZ = playerOffsetZ;
    
    // Initialize scene
    const { scene, camera, renderer } = createScene(container);
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;
    
    // Set a sky color for sea environment
    this.scene.background = new THREE.Color(0x87ceeb); // Sky blue
    
    // Add fog for atmospheric effect
    this.scene.fog = new THREE.FogExp2(0xadd8e6, 0.0008); // Light blue fog, less dense
    
    // Enable shadows in renderer
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    // Create sea terrain
    this.terrain = createTerrain();
    this.scene.add(this.terrain);
    
    // Create a simple boat for the player
    this.boat = createBoat();
    this.boat.position.set(0, 2, -300); // Position the boat above the water
    this.scene.add(this.boat);
    
    // Create sun and lighting
    this.sun = createSun();
    this.scene.add(this.sun.sunMesh);
    this.scene.add(this.sun.sunLight);
    this.scene.add(this.sun.target);
    
    // Initialize managers
    this.cameraManager = new CameraControlsManager({
      camera: this.camera,
      renderer: this.renderer,
      boat: this.boat,
      playerOffsetX: this.playerOffsetX,
      playerOffsetY: this.playerOffsetY,
      playerOffsetZ: this.playerOffsetZ
    });
    
    this.boatController = new BoatController({
      boat: this.boat,
      terrain: this.terrain,
      controls: this.cameraManager.getFirstPersonControls()
    });
    
    this.eventManager = new EventManager({
      cameraManager: this.cameraManager,
      boatController: this.boatController,
      camera: this.camera,
      boat: this.boat
    });
    
    // Initialize static waves
    console.log('Initializing static waves in SceneManager constructor');
    updateWaves(this.terrain);
    
    // Start animation loop
    this.animate();
  }
  
  private animate = (): void => {
    this.animationFrameId = requestAnimationFrame(this.animate);
    
    const delta = this.clock.getDelta();
    const time = this.clock.getElapsedTime();
    
    // Debug log every 5 seconds
    if (Math.floor(time) % 5 === 0 && Math.floor(time) !== Math.floor(time - delta)) {
      console.log('Animation frame at time:', time.toFixed(2));
      
      // Log camera position
      console.log('Camera position:', 
        this.camera.position.x.toFixed(2), 
        this.camera.position.y.toFixed(2), 
        this.camera.position.z.toFixed(2)
      );
      
      // Log movement state from controls
      const fpControls = this.cameraManager.getFirstPersonControls();
      if (fpControls) {
        console.log('Boat speed:', fpControls.getBoatSpeed());
        console.log('Boat direction:', fpControls.getBoatDirection());
      }
    }
    
    // No longer updating waves every frame
    
    // Update boat if not in dev mode
    if (!this.cameraManager.isDevMode()) {
      this.boatController.update(delta, time);
    }
    
    // Update controls
    this.cameraManager.update(delta, this.terrain);
    
    // Render the scene
    this.renderer.render(this.scene, this.camera);
  };
  
  public resize(): void {
    if (!this.camera || !this.renderer) return;
    
    // Update camera aspect ratio
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    
    // Update renderer size
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }
  
  public dispose(): void {
    // Stop animation loop
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
    
    // Dispose event manager
    this.eventManager.dispose();
    
    // Dispose camera manager
    this.cameraManager.dispose();
    
    // Dispose THREE.js objects
    this.renderer.dispose();
    
    // Remove all children from the scene
    while (this.scene.children.length > 0) {
      const object = this.scene.children[0];
      this.scene.remove(object);
    }
  }
} 