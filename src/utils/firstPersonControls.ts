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
  
  // Event handlers
  private onKeyDown: (event: KeyboardEvent) => void;
  private onKeyUp: (event: KeyboardEvent) => void;
  private onMouseMove: (event: MouseEvent) => void;
  private onPointerlockChange: () => void;
  private onClickRequest: () => void;
  
  constructor(camera: THREE.PerspectiveCamera, domElement: HTMLElement) {
    console.log('FirstPersonControls constructor called');
    this.camera = camera;
    this.domElement = domElement;
    
    // Initialize event handlers with proper binding
    this.onKeyDown = this.handleKeyDown.bind(this);
    this.onKeyUp = this.handleKeyUp.bind(this);
    this.onMouseMove = this.handleMouseMove.bind(this);
    this.onPointerlockChange = this.handlePointerlockChange.bind(this);
    this.onClickRequest = this.handleClickRequest.bind(this);
    
    // Initialize pointer lock
    this.initPointerLock();
    
    // Initialize keyboard controls
    this.initKeyboardControls();
    
    console.log('FirstPersonControls initialized');
  }
  
  private initPointerLock(): void {
    console.log('Initializing pointer lock');
    
    // Add click event to request pointer lock
    this.domElement.addEventListener('click', this.onClickRequest);
    
    // Add pointer lock change event
    document.addEventListener('pointerlockchange', this.onPointerlockChange);
    
    // Add mouse move event
    document.addEventListener('mousemove', this.onMouseMove);
  }
  
  private handleClickRequest(): void {
    console.log('Click detected, requesting pointer lock');
    this.domElement.requestPointerLock();
  }
  
  private handlePointerlockChange(): void {
    this.isLocked = document.pointerLockElement === this.domElement;
    console.log('Pointer lock changed:', this.isLocked ? 'locked' : 'unlocked');
  }
  
  private handleMouseMove(event: MouseEvent): void {
    if (!this.isLocked) return;
    
    const movementX = event.movementX || 0;
    const movementY = event.movementY || 0;
    
    this.euler.setFromQuaternion(this.camera.quaternion);
    
    this.euler.y -= movementX * this.mouseSensitivity;
    this.euler.x -= movementY * this.mouseSensitivity;
    
    // Limit vertical look angle
    this.euler.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.euler.x));
    
    this.camera.quaternion.setFromEuler(this.euler);
  }
  
  private initKeyboardControls(): void {
    console.log('Initializing keyboard controls');
    
    // Add keydown event
    document.addEventListener('keydown', this.onKeyDown);
    
    // Add keyup event
    document.addEventListener('keyup', this.onKeyUp);
  }
  
  private handleKeyDown(event: KeyboardEvent): void {
    console.log('Key down:', event.code);
    
    switch (event.code) {
      case 'ArrowUp':
      case 'KeyW':
        this.moveForward = true;
        console.log('Move forward set to true');
        break;
      case 'ArrowLeft':
      case 'KeyA':
        this.moveLeft = true;
        console.log('Move left set to true');
        break;
      case 'ArrowDown':
      case 'KeyS':
        this.moveBackward = true;
        console.log('Move backward set to true');
        break;
      case 'ArrowRight':
      case 'KeyD':
        this.moveRight = true;
        console.log('Move right set to true');
        break;
    }
  }
  
  private handleKeyUp(event: KeyboardEvent): void {
    console.log('Key up:', event.code);
    
    switch (event.code) {
      case 'ArrowUp':
      case 'KeyW':
        this.moveForward = false;
        console.log('Move forward set to false');
        break;
      case 'ArrowLeft':
      case 'KeyA':
        this.moveLeft = false;
        console.log('Move left set to false');
        break;
      case 'ArrowDown':
      case 'KeyS':
        this.moveBackward = false;
        console.log('Move backward set to false');
        break;
      case 'ArrowRight':
      case 'KeyD':
        this.moveRight = false;
        console.log('Move right set to false');
        break;
    }
  }
  
  public update(deltaTime: number, terrain?: THREE.Mesh): void {
    // Simple character movement
    const moveSpeed = this.movementSpeed * deltaTime;
    
    // Calculate movement direction based on camera orientation
    const direction = new THREE.Vector3();
    const rotation = this.camera.getWorldDirection(direction);
    
    // Forward/backward movement
    if (this.moveForward) {
      console.log('Moving forward');
      this.camera.position.addScaledVector(direction, moveSpeed);
      this.boatSpeed = this.movementSpeed; // For compatibility
    } else if (this.moveBackward) {
      console.log('Moving backward');
      this.camera.position.addScaledVector(direction, -moveSpeed);
      this.boatSpeed = -this.movementSpeed; // For compatibility
    } else {
      this.boatSpeed = 0; // For compatibility
    }
    
    // Left/right movement (strafe)
    if (this.moveLeft) {
      console.log('Moving left');
      const rightVector = new THREE.Vector3();
      rightVector.crossVectors(this.camera.up, direction).normalize();
      this.camera.position.addScaledVector(rightVector, -moveSpeed);
      this.boatDirection += 0.01; // For compatibility
    } else if (this.moveRight) {
      console.log('Moving right');
      const rightVector = new THREE.Vector3();
      rightVector.crossVectors(this.camera.up, direction).normalize();
      this.camera.position.addScaledVector(rightVector, moveSpeed);
      this.boatDirection -= 0.01; // For compatibility
    }
    
    // Keep player at a fixed height
    this.camera.position.y = 5 + this.playerHeight;
  }
  
  // Public getters for boat properties (kept for compatibility)
  public getBoatSpeed(): number {
    return this.boatSpeed;
  }
  
  public getBoatDirection(): number {
    return this.boatDirection;
  }
  
  // Clean up event listeners
  public dispose(): void {
    console.log('Disposing FirstPersonControls');
    
    this.domElement.removeEventListener('click', this.onClickRequest);
    document.removeEventListener('pointerlockchange', this.onPointerlockChange);
    document.removeEventListener('mousemove', this.onMouseMove);
    document.removeEventListener('keydown', this.onKeyDown);
    document.removeEventListener('keyup', this.onKeyUp);
  }
} 