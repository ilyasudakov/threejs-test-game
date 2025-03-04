import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { FirstPersonControls } from './firstPersonControls';

export interface CameraControlsManagerProps {
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  boat?: THREE.Group | null;
  playerOffsetX?: number;
  playerOffsetY?: number;
  playerOffsetZ?: number;
}

export class CameraControlsManager {
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private boat: THREE.Group | null;
  private devMode: boolean = false;
  private orbitControls: OrbitControls | null = null;
  private fpControls: FirstPersonControls | null = null;
  private playerOffsetX: number;
  private playerOffsetY: number;
  private playerOffsetZ: number;

  constructor({
    camera,
    renderer,
    boat = null,
    playerOffsetX = 0,
    playerOffsetY = 5,
    playerOffsetZ = 0
  }: CameraControlsManagerProps) {
    console.log('CameraControlsManager constructor called');
    this.camera = camera;
    this.renderer = renderer;
    this.boat = boat;
    this.playerOffsetX = playerOffsetX;
    this.playerOffsetY = playerOffsetY;
    this.playerOffsetZ = playerOffsetZ;

    // Initialize first-person controls by default
    this.initFirstPersonControls();
    console.log('CameraControlsManager initialized');
  }

  private initFirstPersonControls(): void {
    console.log('Initializing first person controls');
    
    // Dispose of orbit controls if they exist
    if (this.orbitControls) {
      this.orbitControls.dispose();
      this.orbitControls = null;
    }
    
    // Dispose of first person controls if they exist
    if (this.fpControls) {
      this.fpControls.dispose();
      this.fpControls = null;
    }
    
    // Create new first person controls
    this.fpControls = new FirstPersonControls(this.camera, this.renderer.domElement);
    
    // Reset camera position to boat if available
    if (this.boat) {
      this.camera.position.set(
        this.boat.position.x + this.playerOffsetX,
        this.boat.position.y + this.playerOffsetY,
        this.boat.position.z + this.playerOffsetZ
      );
    } else {
      this.camera.position.set(4, 5, -300);
    }
    
    console.log('First person controls initialized');
  }

  private initOrbitControls(): void {
    console.log('Initializing orbit controls');
    
    // Dispose of first person controls if they exist
    if (this.fpControls) {
      this.fpControls.dispose();
      this.fpControls = null;
    }
    
    // Dispose of orbit controls if they exist
    if (this.orbitControls) {
      this.orbitControls.dispose();
      this.orbitControls = null;
    }
    
    // Create new orbit controls
    this.orbitControls = new OrbitControls(this.camera, this.renderer.domElement);
    this.orbitControls.enableDamping = true;
    this.orbitControls.dampingFactor = 0.05;
    
    // Move camera back for better view
    this.camera.position.set(0, 200, 400);
    
    console.log('Orbit controls initialized');
  }

  public toggleDevMode(): void {
    this.devMode = !this.devMode;
    console.log('Dev mode toggled:', this.devMode ? 'enabled' : 'disabled');
    
    if (this.devMode) {
      this.initOrbitControls();
    } else {
      this.initFirstPersonControls();
    }
  }

  public isDevMode(): boolean {
    return this.devMode;
  }

  public getControls(): FirstPersonControls | OrbitControls | null {
    return this.devMode ? this.orbitControls : this.fpControls;
  }

  public getFirstPersonControls(): FirstPersonControls | null {
    return this.fpControls;
  }

  public getOrbitControls(): OrbitControls | null {
    return this.orbitControls;
  }

  public updateBoatReference(boat: THREE.Group): void {
    this.boat = boat;
  }

  public update(delta: number, terrain?: THREE.Mesh): void {
    if (this.devMode && this.orbitControls) {
      this.orbitControls.update();
    } else if (!this.devMode && this.fpControls) {
      this.fpControls.update(delta, terrain);
    }
  }

  public dispose(): void {
    console.log('Disposing CameraControlsManager');
    
    if (this.orbitControls) {
      this.orbitControls.dispose();
      this.orbitControls = null;
    }
    
    if (this.fpControls) {
      this.fpControls.dispose();
      this.fpControls = null;
    }
  }
} 