import * as THREE from 'three';

export class FirstPersonControls {
  private camera: THREE.PerspectiveCamera;
  private domElement: HTMLElement;
  
  // Movement state
  private moveForward: boolean = false;
  private moveBackward: boolean = false;
  private moveLeft: boolean = false;
  private moveRight: boolean = false;
  
  // Character movement speed
  private readonly movementSpeed: number = 5.0;
  
  // Boat physics - simplified but kept for compatibility
  private boatSpeed: number = 0;
  private boatDirection: number = 0;
  
  // Mouse look
  private euler: THREE.Euler = new THREE.Euler(0, 0, 0, 'YXZ');
  private mouseSensitivity: number = 0.002;
  private isLocked: boolean = false;
  
  // Player height
  private playerHeight: number = 1.7;
  
  constructor(camera: THREE.PerspectiveCamera, domElement: HTMLElement) {
    this.camera = camera;
    this.domElement = domElement;
    
    // Initialize pointer lock
    this.initPointerLock();
    
    // Initialize keyboard controls
    this.initKeyboardControls();
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
  
  public update(deltaTime: number, terrain?: THREE.Mesh): void {
    // Remove the pointer lock check to allow movement even without pointer lock
    // if (!this.isLocked) return;
    
    // Simple character movement
    const moveSpeed = this.movementSpeed * deltaTime;
    
    // Calculate movement direction based on camera orientation
    const direction = new THREE.Vector3();
    const rotation = this.camera.getWorldDirection(direction);
    
    // Forward/backward movement
    if (this.moveForward) {
      this.camera.position.addScaledVector(direction, moveSpeed);
      this.boatSpeed = this.movementSpeed; // For compatibility
    } else if (this.moveBackward) {
      this.camera.position.addScaledVector(direction, -moveSpeed);
      this.boatSpeed = -this.movementSpeed; // For compatibility
    } else {
      this.boatSpeed = 0; // For compatibility
    }
    
    // Left/right movement (strafe)
    if (this.moveLeft || this.moveRight) {
      const rightVector = new THREE.Vector3();
      rightVector.crossVectors(this.camera.up, direction).normalize();
      
      if (this.moveLeft) {
        this.camera.position.addScaledVector(rightVector, -moveSpeed);
        this.boatDirection += 0.01; // For compatibility
      } else if (this.moveRight) {
        this.camera.position.addScaledVector(rightVector, moveSpeed);
        this.boatDirection -= 0.01; // For compatibility
      }
    }
    
    // Keep player at a fixed height above the boat deck
    if (terrain) {
      // Fixed height for simplicity
      this.camera.position.y = 5 + this.playerHeight;
    }
  }
  
  // Public getters for boat properties (kept for compatibility)
  public getBoatSpeed(): number {
    return this.boatSpeed;
  }
  
  public getBoatDirection(): number {
    return this.boatDirection;
  }
} 