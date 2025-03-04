import * as THREE from 'three';

export class FirstPersonControls {
  private camera: THREE.PerspectiveCamera;
  private domElement: HTMLElement;
  
  // Movement state
  private moveForward: boolean = false;
  private moveBackward: boolean = false;
  private moveLeft: boolean = false;
  private moveRight: boolean = false;
  private canJump: boolean = false;
  
  // Physics
  private velocity: THREE.Vector3 = new THREE.Vector3();
  private direction: THREE.Vector3 = new THREE.Vector3();
  
  // Boat physics
  private boatSpeed: number = 0;
  private boatMaxSpeed: number = 15.0;
  private boatAcceleration: number = 2.0;
  private boatDeceleration: number = 1.0;
  private boatRotationSpeed: number = 0.5;
  private boatInertia: number = 0.95; // Higher values = more inertia
  private boatDirection: number = 0; // Angle in radians
  
  // Constants
  private readonly movementSpeed: number = 10.0;
  private readonly jumpHeight: number = 20.0;
  private readonly gravity: number = 30.0;
  
  // Mouse look
  private euler: THREE.Euler = new THREE.Euler(0, 0, 0, 'YXZ');
  private mouseSensitivity: number = 0.002;
  private isLocked: boolean = false;
  
  // Raycaster for terrain height sampling
  private raycaster: THREE.Raycaster = new THREE.Raycaster();
  private playerHeight: number = 1.7; // Height of player's eyes from ground
  
  constructor(camera: THREE.PerspectiveCamera, domElement: HTMLElement) {
    this.camera = camera;
    this.domElement = domElement;
    
    // Initialize pointer lock
    this.initPointerLock();
    
    // Initialize keyboard controls
    this.initKeyboardControls();
    
    // Set up raycaster for terrain height sampling
    this.raycaster.ray.direction.set(0, -1, 0); // Cast ray downward
  }
  
  private initPointerLock(): void {
    this.domElement.addEventListener('click', () => {
      this.domElement.requestPointerLock();
    });
    
    document.addEventListener('pointerlockchange', () => {
      this.isLocked = document.pointerLockElement === this.domElement;
    });
    
    document.addEventListener('mousemove', (event) => {
      if (!this.isLocked) return;
      
      const movementX = event.movementX || 0;
      const movementY = event.movementY || 0;
      
      this.euler.setFromQuaternion(this.camera.quaternion);
      
      this.euler.y -= movementX * this.mouseSensitivity;
      this.euler.x -= movementY * this.mouseSensitivity;
      
      // Limit vertical look angle
      this.euler.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.euler.x));
      
      this.camera.quaternion.setFromEuler(this.euler);
    });
  }
  
  private initKeyboardControls(): void {
    document.addEventListener('keydown', (event) => {
      switch (event.code) {
        case 'ArrowUp':
        case 'KeyW':
          this.moveForward = true;
          break;
        case 'ArrowLeft':
        case 'KeyA':
          this.moveLeft = true;
          break;
        case 'ArrowDown':
        case 'KeyS':
          this.moveBackward = true;
          break;
        case 'ArrowRight':
        case 'KeyD':
          this.moveRight = true;
          break;
        case 'Space':
          // No jumping in a boat
          break;
      }
    });
    
    document.addEventListener('keyup', (event) => {
      switch (event.code) {
        case 'ArrowUp':
        case 'KeyW':
          this.moveForward = false;
          break;
        case 'ArrowLeft':
        case 'KeyA':
          this.moveLeft = false;
          break;
        case 'ArrowDown':
        case 'KeyS':
          this.moveBackward = false;
          break;
        case 'ArrowRight':
        case 'KeyD':
          this.moveRight = false;
          break;
      }
    });
  }
  
  // Sample terrain height at a given position
  private getTerrainHeightAt(x: number, z: number, terrain: THREE.Mesh): number {
    // Set raycaster origin high above the terrain at the x,z position
    this.raycaster.ray.origin.set(x, 1000, z);
    
    // Cast ray downward to find terrain height
    const intersects = this.raycaster.intersectObject(terrain);
    
    if (intersects.length > 0) {
      // Return the y-coordinate of the intersection point
      return intersects[0].point.y;
    }
    
    // Default to 0 if no intersection found
    return 0;
  }
  
  public update(deltaTime: number, terrain?: THREE.Mesh): void {
    if (!this.isLocked) return;
    
    // Boat movement physics
    
    // Apply acceleration/deceleration
    if (this.moveForward) {
      // Accelerate forward
      this.boatSpeed += this.boatAcceleration * deltaTime;
      if (this.boatSpeed > this.boatMaxSpeed) {
        this.boatSpeed = this.boatMaxSpeed;
      }
    } else if (this.moveBackward) {
      // Decelerate/reverse
      this.boatSpeed -= this.boatAcceleration * deltaTime;
      if (this.boatSpeed < -this.boatMaxSpeed / 2) { // Boats are slower in reverse
        this.boatSpeed = -this.boatMaxSpeed / 2;
      }
    } else {
      // Natural deceleration when no input
      if (Math.abs(this.boatSpeed) > 0.1) {
        this.boatSpeed *= Math.pow(this.boatInertia, deltaTime * 60); // Scale with framerate
      } else {
        this.boatSpeed = 0;
      }
    }
    
    // Apply turning - only effective when moving
    const effectiveRotationSpeed = this.boatRotationSpeed * Math.min(1.0, Math.abs(this.boatSpeed) / 5.0);
    
    if (this.moveLeft) {
      // Turn left (counterclockwise)
      this.boatDirection += effectiveRotationSpeed * deltaTime;
    } else if (this.moveRight) {
      // Turn right (clockwise)
      this.boatDirection -= effectiveRotationSpeed * deltaTime;
    }
    
    // Calculate movement vector based on boat direction and speed
    const moveX = Math.sin(this.boatDirection) * this.boatSpeed * deltaTime;
    const moveZ = Math.cos(this.boatDirection) * this.boatSpeed * deltaTime;
    
    // Apply movement to camera (boat movement is now handled in Game.tsx)
    this.camera.position.x += moveX;
    this.camera.position.z += moveZ;
    
    // Align camera with boat direction when moving
    if (Math.abs(this.boatSpeed) > 0.5) {
      // Gradually align camera with boat direction
      const currentYaw = this.euler.y;
      const targetYaw = -this.boatDirection;
      
      // Calculate the difference, handling the circular nature of angles
      let yawDiff = targetYaw - currentYaw;
      if (yawDiff > Math.PI) yawDiff -= Math.PI * 2;
      if (yawDiff < -Math.PI) yawDiff += Math.PI * 2;
      
      // Gradually rotate towards the target direction
      const rotationFactor = 0.02; // Lower = slower rotation
      this.euler.y += yawDiff * rotationFactor;
      
      // Update camera quaternion
      this.camera.quaternion.setFromEuler(this.euler);
    }
    
    // Water height sampling for boat
    if (terrain) {
      // Get water height at boat's position
      const waterHeight = this.getTerrainHeightAt(
        this.camera.position.x, 
        this.camera.position.z, 
        terrain
      );
      
      // Set camera height to follow water surface
      this.camera.position.y = waterHeight + this.playerHeight;
    } else {
      // Default water height if no terrain
      this.camera.position.y = this.playerHeight;
    }
  }
  
  // Public getters for boat properties
  public getBoatSpeed(): number {
    return this.boatSpeed;
  }
  
  public getBoatDirection(): number {
    return this.boatDirection;
  }
} 