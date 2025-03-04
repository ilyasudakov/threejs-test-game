import * as THREE from 'three';
import { CameraControlsManager } from './cameraControlsManager';
import { BoatController } from './boatController';

export interface EventManagerProps {
  cameraManager: CameraControlsManager;
  boatController: BoatController;
  camera: THREE.PerspectiveCamera;
  boat: THREE.Group;
}

export class EventManager {
  private cameraManager: CameraControlsManager;
  private boatController: BoatController;
  private camera: THREE.PerspectiveCamera;
  private boat: THREE.Group;
  private mouse: THREE.Vector2 = new THREE.Vector2();
  
  constructor({ cameraManager, boatController, camera, boat }: EventManagerProps) {
    this.cameraManager = cameraManager;
    this.boatController = boatController;
    this.camera = camera;
    this.boat = boat;
    
    this.initEventListeners();
  }
  
  private initEventListeners(): void {
    // Mouse move event
    window.addEventListener('mousemove', this.handleMouseMove);
    
    // Keyboard event
    window.addEventListener('keydown', this.handleKeyDown);
    
    // Resize event
    window.addEventListener('resize', this.handleResize);
  }
  
  private handleMouseMove = (event: MouseEvent): void => {
    // Calculate normalized device coordinates
    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  };
  
  private handleKeyDown = (event: KeyboardEvent): void => {
    // Toggle dev mode with 'T' key
    if (event.code === 'KeyT') {
      this.cameraManager.toggleDevMode();
    }
  };
  
  private handleResize = (): void => {
    if (!this.camera) return;
    
    // Update camera aspect ratio
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
  };
  
  public getMousePosition(): THREE.Vector2 {
    return this.mouse;
  }
  
  public dispose(): void {
    // Remove event listeners
    window.removeEventListener('mousemove', this.handleMouseMove);
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('resize', this.handleResize);
  }
} 