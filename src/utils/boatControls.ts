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
  private maxSpeed: number = 10.0;
  private acceleration: number = 2.0;
  private deceleration: number = 1.0;
  private rotationSpeed: number = 1.0;
  
  // Mouse look (for first-person mode)
  private mouseSensitivity: number = 0.002;
  private isPointerLocked: boolean = false;
  private mouseYaw: number = 0;
  private mousePitch: number = 0;
  
  // Physics
  private drag: number = 0.95; // Air/water resistance
  
  // Debug display
  private debugElement: HTMLElement | null = null;
  private debugUpdateInterval: number = 100; // ms
  private lastDebugUpdate: number = 0;
  private showDebug: boolean = true;
  
  constructor(camera: THREE.PerspectiveCamera, domElement: HTMLElement) {
    this.camera = camera;
    this.domElement = domElement;
    
    // Initialize controls
    this.initKeyboardControls();
    this.initPointerLock();
    
    // Create debug display
    this.createDebugDisplay();
    
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
        this.moveForward = true;
        break;
      case 'ArrowDown':
      case 'KeyS':
        this.moveBackward = true;
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
      // Toggle debug display with F1 key
      case 'F1':
        this.showDebug = !this.showDebug;
        if (this.debugElement) {
          this.debugElement.style.display = this.showDebug ? 'block' : 'none';
        }
        break;
      // Increase speed with + key
      case 'Equal': // + key
        if (event.shiftKey) {
          this.maxSpeed = Math.min(20, this.maxSpeed + 1);
          this.updateDebugDisplay(); // Force update to show new speed
        }
        break;
      // Decrease speed with - key
      case 'Minus': // - key
        this.maxSpeed = Math.max(1, this.maxSpeed - 1);
        this.updateDebugDisplay(); // Force update to show new speed
        break;
    }
  }
  
  private handleKeyUp(event: KeyboardEvent): void {
    switch (event.code) {
      case 'ArrowUp':
      case 'KeyW':
        this.moveForward = false;
        break;
      case 'ArrowDown':
      case 'KeyS':
        this.moveBackward = false;
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
    this.updateDebugDisplay();
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
  
  private createDebugDisplay(): void {
    // Create debug element if it doesn't exist
    if (!this.debugElement) {
      this.debugElement = document.createElement('div');
      this.debugElement.style.position = 'absolute';
      this.debugElement.style.top = '10px';
      this.debugElement.style.left = '10px';
      this.debugElement.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
      this.debugElement.style.color = 'white';
      this.debugElement.style.padding = '10px';
      this.debugElement.style.fontFamily = 'monospace';
      this.debugElement.style.fontSize = '14px';
      this.debugElement.style.borderRadius = '5px';
      this.debugElement.style.zIndex = '1000';
      document.body.appendChild(this.debugElement);
    }
  }
  
  private updateDebugDisplay(): void {
    if (!this.debugElement || !this.showDebug) return;
    
    const now = performance.now();
    if (now - this.lastDebugUpdate < this.debugUpdateInterval) return;
    
    this.lastDebugUpdate = now;
    
    // Get boat direction in degrees for display
    const directionDegrees = (this.boatDirection * 180 / Math.PI) % 360;
    const formattedDirection = directionDegrees < 0 
      ? (360 + directionDegrees).toFixed(0) 
      : directionDegrees.toFixed(0);
    
    // Update debug display
    this.debugElement.innerHTML = `
      <div style="font-weight: bold; margin-bottom: 5px;">Boat Debug Info</div>
      <div>Position:</div>
      <div>X: ${this.boatPosition.x.toFixed(2)}</div>
      <div>Y: ${this.boatPosition.y.toFixed(2)}</div>
      <div>Z: ${this.boatPosition.z.toFixed(2)}</div>
      <div style="margin-top: 5px;">Direction: ${formattedDirection}°</div>
      <div>Speed: ${this.boatSpeed.toFixed(1)} / ${this.maxSpeed.toFixed(1)}</div>
      <div>Camera Mode: ${this.cameraMode}</div>
      <div style="margin-top: 5px; font-size: 12px;">Controls:</div>
      <div style="font-size: 12px;">W/S: Accelerate/Decelerate</div>
      <div style="font-size: 12px;">A/D: Turn Left/Right</div>
      <div style="font-size: 12px;">C: Change Camera | F1: Toggle Debug</div>
    `;
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
      // Gradually reduce rotation speed when not turning
      this.boatRotationSpeed *= 0.9;
    }
    
    // Apply rotation speed limits
    this.boatRotationSpeed = Math.max(-1.5, Math.min(1.5, this.boatRotationSpeed));
    
    // Apply rotation to boat direction
    this.boatDirection += this.boatRotationSpeed * deltaTime;
    
    // Handle boat acceleration/deceleration
    if (this.moveForward) {
      this.boatSpeed += this.acceleration * deltaTime;
    } else if (this.moveBackward) {
      this.boatSpeed -= this.acceleration * deltaTime;
    } else {
      // Apply deceleration when no input
      if (this.boatSpeed > 0) {
        this.boatSpeed -= this.deceleration * deltaTime;
        if (this.boatSpeed < 0) this.boatSpeed = 0;
      } else if (this.boatSpeed < 0) {
        this.boatSpeed += this.deceleration * deltaTime;
        if (this.boatSpeed > 0) this.boatSpeed = 0;
      }
    }
    
    // Apply speed limits
    this.boatSpeed = Math.max(-this.maxSpeed / 2, Math.min(this.maxSpeed, this.boatSpeed));
    
    // Apply drag (water resistance)
    this.boatSpeed *= this.drag;
    
    // Calculate movement vector based on boat direction and speed
    if (Math.abs(this.boatSpeed) > 0.01) {
      const moveX = Math.sin(this.boatDirection) * this.boatSpeed * deltaTime;
      const moveZ = Math.cos(this.boatDirection) * this.boatSpeed * deltaTime;
      
      // Update boat position
      this.boatPosition.x += moveX;
      this.boatPosition.z += moveZ;
    }
    
    // Update camera position based on boat position and direction
    this.updateCameraPosition();
    
    // Update debug display
    this.updateDebugDisplay();
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
    
    // Remove debug display
    if (this.debugElement && this.debugElement.parentNode) {
      this.debugElement.parentNode.removeChild(this.debugElement);
    }
  }
} 