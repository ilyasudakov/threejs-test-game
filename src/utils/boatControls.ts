import * as THREE from 'three';

export class BoatControls {
  // Core properties
  private camera: THREE.PerspectiveCamera;
  private domElement: HTMLElement;
  
  // Boat properties
  private boatPosition: THREE.Vector3 = new THREE.Vector3(0, 2, 0);
  private boatDirection: number = 0;
  private boatSpeed: number = 0;
  private boatRotationSpeed: number = 0;
  
  // Camera properties
  private cameraOffset: THREE.Vector3 = new THREE.Vector3(0, 8, 25); // Increased height and distance for better view
  private cameraLookOffset: THREE.Vector3 = new THREE.Vector3(0, 0, -10); // Look ahead of boat
  private cameraMode: 'follow' | 'firstPerson' | 'overhead' = 'follow';
  
  // Movement state
  private moveForward: boolean = false;
  private moveBackward: boolean = false;
  private turnLeft: boolean = false;
  private turnRight: boolean = false;
  
  // Movement settings
  private maxSpeed: number = 900.0; // Increased from 300 to 900 (3x more)
  private acceleration: number = 180.0; // Increased from 60 to 180 (3x more)
  private deceleration: number = 90.0; // Increased from 30 to 90 (3x more)
  private rotationSpeed: number = 15.0; // Increased from 5 to 15 for better turning at high speeds
  
  // Mouse look (for first-person mode)
  private mouseSensitivity: number = 0.002;
  private isPointerLocked: boolean = false;
  private mouseYaw: number = 0;
  private mousePitch: number = 0;
  
  // Physics
  private drag: number = 0.95; // Air/water resistance
  
  constructor(camera: THREE.PerspectiveCamera, domElement: HTMLElement) {
    this.camera = camera;
    this.domElement = domElement;
    
    // Initialize controls
    this.initKeyboardControls();
    this.initPointerLock();
    
    // Set initial camera position
    this.updateCameraPosition();
  }
  
  private initKeyboardControls(): void {
    // Add keyboard event listeners with proper binding
    document.addEventListener('keydown', this.handleKeyDown.bind(this));
    document.addEventListener('keyup', this.handleKeyUp.bind(this));
  }
  
  private handleKeyDown(event: KeyboardEvent): void {
    switch (event.code) {
      case 'ArrowUp':
      case 'KeyW':
        // Inverted: W/Up now moves backward
        this.moveBackward = true;
        break;
      case 'ArrowDown':
      case 'KeyS':
        // Inverted: S/Down now moves forward
        this.moveForward = true;
        break;
      case 'ArrowLeft':
      case 'KeyA':
        this.turnLeft = true;
        break;
      case 'ArrowRight':
      case 'KeyD':
        this.turnRight = true;
        break;
      // Toggle camera mode with C key
      case 'KeyC':
        this.cycleCameraMode();
        break;
    }
  }
  
  private handleKeyUp(event: KeyboardEvent): void {
    switch (event.code) {
      case 'ArrowUp':
      case 'KeyW':
        // Inverted: W/Up now moves backward
        this.moveBackward = false;
        break;
      case 'ArrowDown':
      case 'KeyS':
        // Inverted: S/Down now moves forward
        this.moveForward = false;
        break;
      case 'ArrowLeft':
      case 'KeyA':
        this.turnLeft = false;
        break;
      case 'ArrowRight':
      case 'KeyD':
        this.turnRight = false;
        break;
    }
  }
  
  private initPointerLock(): void {
    // Request pointer lock on click (only used in first-person mode)
    this.domElement.addEventListener('click', () => {
      if (this.cameraMode === 'firstPerson') {
        this.domElement.requestPointerLock();
      }
    });
    
    // Handle pointer lock change
    document.addEventListener('pointerlockchange', () => {
      this.isPointerLocked = document.pointerLockElement === this.domElement;
    });
    
    // Handle mouse movement
    document.addEventListener('mousemove', this.handleMouseMove.bind(this));
  }
  
  private handleMouseMove(event: MouseEvent): void {
    // Only use mouse look in first-person mode and when pointer is locked
    if (this.cameraMode !== 'firstPerson' || !this.isPointerLocked) return;
    
    const movementX = event.movementX || 0;
    const movementY = event.movementY || 0;
    
    // Update yaw (left/right) and pitch (up/down)
    this.mouseYaw -= movementX * this.mouseSensitivity;
    this.mousePitch -= movementY * this.mouseSensitivity;
    
    // Limit vertical rotation to avoid flipping
    this.mousePitch = Math.max(-Math.PI / 2.5, Math.min(Math.PI / 2.5, this.mousePitch));
  }
  
  private cycleCameraMode(): void {
    // Cycle through camera modes
    switch (this.cameraMode) {
      case 'follow':
        this.cameraMode = 'firstPerson';
        this.cameraOffset.set(0, 2, 0); // Position camera at boat's helm
        break;
      case 'firstPerson':
        this.cameraMode = 'overhead';
        this.cameraOffset.set(0, 25, 0); // Increased height for better overhead view
        break;
      case 'overhead':
        this.cameraMode = 'follow';
        this.cameraOffset.set(0, 8, 25); // Restore to default follow camera position
        break;
    }
    
    // Update camera position immediately
    this.updateCameraPosition();
  }
  
  private updateCameraPosition(): void {
    // Calculate camera position based on boat position, direction, and camera mode
    if (this.cameraMode === 'firstPerson') {
      // First-person: camera at boat position with offset
      const boatQuat = new THREE.Quaternion().setFromAxisAngle(
        new THREE.Vector3(0, 1, 0), 
        this.boatDirection
      );
      
      // Apply first-person camera offset (at the helm)
      const offsetVector = new THREE.Vector3(0, 2, -1);
      offsetVector.applyQuaternion(boatQuat);
      
      // Position camera
      this.camera.position.copy(this.boatPosition).add(offsetVector);
      
      // Apply mouse look in first-person mode
      const lookQuat = new THREE.Quaternion()
        .setFromEuler(new THREE.Euler(this.mousePitch, this.mouseYaw + this.boatDirection, 0, 'YXZ'));
      
      this.camera.quaternion.copy(lookQuat);
    } else {
      // Third-person modes
      const boatQuat = new THREE.Quaternion().setFromAxisAngle(
        new THREE.Vector3(0, 1, 0), 
        this.boatDirection
      );
      
      // Apply camera offset based on boat direction
      const offsetVector = this.cameraOffset.clone();
      offsetVector.applyQuaternion(boatQuat);
      
      // Position camera
      this.camera.position.copy(this.boatPosition).add(offsetVector);
      
      // Look at boat or ahead of boat
      const lookAtPoint = this.boatPosition.clone();
      if (this.cameraMode === 'follow') {
        // In follow mode, look ahead of the boat
        const lookOffset = this.cameraLookOffset.clone();
        lookOffset.applyQuaternion(boatQuat);
        lookAtPoint.add(lookOffset);
      }
      
      this.camera.lookAt(lookAtPoint);
    }
  }
  
  public update(deltaTime: number): void {
    // Skip if no delta time
    if (!deltaTime) return;
    
    // Handle boat rotation
    if (this.turnLeft) {
      this.boatRotationSpeed += this.rotationSpeed * deltaTime;
    } else if (this.turnRight) {
      this.boatRotationSpeed -= this.rotationSpeed * deltaTime;
    } else {
      // Apply damping to rotation
      this.boatRotationSpeed *= 0.9;
    }
    
    // Apply rotation speed to boat direction
    this.boatDirection += this.boatRotationSpeed * deltaTime;
    
    // Apply damping to rotation speed
    this.boatRotationSpeed *= 0.95;
    
    // Handle boat acceleration
    if (this.moveForward) {
      this.boatSpeed += this.acceleration * deltaTime;
    } else if (this.moveBackward) {
      this.boatSpeed -= this.acceleration * deltaTime;
    } else {
      // Apply deceleration when no input
      if (this.boatSpeed > 0) {
        this.boatSpeed = Math.max(0, this.boatSpeed - this.deceleration * deltaTime);
      } else if (this.boatSpeed < 0) {
        this.boatSpeed = Math.min(0, this.boatSpeed + this.deceleration * deltaTime);
      }
    }
    
    // Clamp speed to max speed
    this.boatSpeed = THREE.MathUtils.clamp(this.boatSpeed, -this.maxSpeed / 2, this.maxSpeed);
    
    // Apply drag
    this.boatSpeed *= this.drag;
    
    // Calculate movement vector based on boat direction and speed
    const moveX = Math.sin(this.boatDirection) * this.boatSpeed * deltaTime;
    const moveZ = Math.cos(this.boatDirection) * this.boatSpeed * deltaTime;
    
    // Update boat position
    this.boatPosition.x += moveX;
    this.boatPosition.z += moveZ;
    
    // Update camera position based on boat
    this.updateCameraPosition();
  }
  
  // Public getters for boat properties
  public getBoatSpeed(): number {
    return this.boatSpeed;
  }
  
  public getBoatDirection(): number {
    return this.boatDirection;
  }
  
  public getBoatPosition(): THREE.Vector3 {
    return this.boatPosition.clone();
  }
  
  // Set the boat position (useful for initialization or teleporting)
  public setBoatPosition(position: THREE.Vector3): void {
    this.boatPosition.copy(position);
    this.updateCameraPosition();
  }
  
  // Clean up event listeners
  public dispose(): void {
    document.removeEventListener('keydown', this.handleKeyDown.bind(this));
    document.removeEventListener('keyup', this.handleKeyUp.bind(this));
    document.removeEventListener('mousemove', this.handleMouseMove.bind(this));
    document.removeEventListener('pointerlockchange', () => {});
    this.domElement.removeEventListener('click', () => {});
  }
} 