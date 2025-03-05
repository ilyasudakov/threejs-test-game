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
  
  // Terrain interaction
  private terrain: THREE.Mesh | null = null;
  private boatRotation: THREE.Euler = new THREE.Euler(0, 0, 0, 'YXZ');
  private boatTiltAmount: number = 0.6; // Increased from 0.2 to 0.6 for more dramatic tilting
  private boatTiltSpeed: number = 3.0; // Increased from 2.0 to 3.0 for faster response to waves
  private boatHeightOffset: number = 2.5; // Increased from 0.8 to 2.5 to better match wave amplitude of 5
  private lastWaveHeight: number = 0; // Store the last wave height for smooth interpolation
  private heightDamping: number = 0.85; // Damping factor for height changes (0-1, higher = smoother)
  private useAverageHeight: boolean = true; // Use average height instead of maximum height
  
  constructor(camera: THREE.PerspectiveCamera, domElement: HTMLElement) {
    this.camera = camera;
    this.domElement = domElement;
    
    // Initialize controls
    this.initKeyboardControls();
    this.initPointerLock();
    
    // Set initial camera position
    this.updateCameraPosition();
  }
  
  // Set terrain reference for wave height sampling
  public setTerrain(terrain: THREE.Mesh): void {
    this.terrain = terrain;
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
      const boatQuat = new THREE.Quaternion().setFromEuler(this.boatRotation);
      
      // Apply first-person camera offset (at the helm)
      const offsetVector = new THREE.Vector3(0, 2, -1);
      offsetVector.applyQuaternion(boatQuat);
      
      // Position camera
      this.camera.position.copy(this.boatPosition).add(offsetVector);
      
      // Apply mouse look in first-person mode
      const lookQuat = new THREE.Quaternion()
        .setFromEuler(new THREE.Euler(
          this.mousePitch + this.boatRotation.x, 
          this.mouseYaw + this.boatRotation.y, 
          this.boatRotation.z, 
          'YXZ'
        ));
      
      this.camera.quaternion.copy(lookQuat);
    } else {
      // Third-person modes
      const boatQuat = new THREE.Quaternion().setFromEuler(this.boatRotation);
      
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
  
  // Get the wave height at the boat's position
  private getWaveHeightAtBoat(): number {
    if (!this.terrain || !(this.terrain as any).getHeightAt) {
      return 0; // Default to 0 if no terrain or getHeightAt method
    }
    
    // Sample multiple points around the boat for better height determination
    // Use more sample points with weighted averaging for smoother movement
    const boatLength = 10; // Half the boat's length
    const boatWidth = 4;  // Half the boat's width
    
    // Calculate direction vectors
    const forwardVector = new THREE.Vector3(
      Math.sin(this.boatDirection),
      0,
      Math.cos(this.boatDirection)
    );
    const rightVector = new THREE.Vector3(
      Math.sin(this.boatDirection + Math.PI/2),
      0,
      Math.cos(this.boatDirection + Math.PI/2)
    );
    
    // Sample points with weights (center has highest weight)
    const samplePoints = [
      { pos: this.boatPosition.clone(), weight: 0.5 }, // Center (50% weight)
      { pos: this.boatPosition.clone().add(forwardVector.clone().multiplyScalar(boatLength)), weight: 0.15 }, // Bow
      { pos: this.boatPosition.clone().add(forwardVector.clone().multiplyScalar(-boatLength)), weight: 0.15 }, // Stern
      { pos: this.boatPosition.clone().add(rightVector.clone().multiplyScalar(boatWidth)), weight: 0.1 }, // Starboard
      { pos: this.boatPosition.clone().add(rightVector.clone().multiplyScalar(-boatWidth)), weight: 0.1 }, // Port
    ];
    
    // Calculate weighted average height
    let totalHeight = 0;
    let totalWeight = 0;
    let maxHeight = -Infinity;
    
    for (const point of samplePoints) {
      const height = (this.terrain as any).getHeightAt(point.pos.x, point.pos.z);
      totalHeight += height * point.weight;
      totalWeight += point.weight;
      maxHeight = Math.max(maxHeight, height);
    }
    
    // Calculate the weighted average height
    const averageHeight = totalHeight / totalWeight;
    
    // Choose between average and max height based on setting
    const targetHeight = this.useAverageHeight ? averageHeight : maxHeight;
    
    // Apply damping for smoother transitions
    if (this.lastWaveHeight === 0) {
      this.lastWaveHeight = targetHeight; // Initialize on first call
    } else {
      // Interpolate between last height and current height
      this.lastWaveHeight = this.lastWaveHeight * this.heightDamping + 
                           targetHeight * (1 - this.heightDamping);
    }
    
    return this.lastWaveHeight;
  }
  
  // Get the wave normal at the boat's position
  private getWaveNormalAtBoat(): THREE.Vector3 {
    if (!this.terrain || !(this.terrain as any).getNormalAt) {
      return new THREE.Vector3(0, 1, 0); // Default to up if no terrain or getNormalAt method
    }
    
    // Sample normals at multiple points and average them for smoother rotation
    const boatLength = 10; // Half the boat's length
    const boatWidth = 4;  // Half the boat's width
    
    // Calculate direction vectors
    const forwardVector = new THREE.Vector3(
      Math.sin(this.boatDirection),
      0,
      Math.cos(this.boatDirection)
    );
    const rightVector = new THREE.Vector3(
      Math.sin(this.boatDirection + Math.PI/2),
      0,
      Math.cos(this.boatDirection + Math.PI/2)
    );
    
    // Sample points with weights (center has highest weight)
    const samplePoints = [
      { pos: this.boatPosition.clone(), weight: 0.5 }, // Center (50% weight)
      { pos: this.boatPosition.clone().add(forwardVector.clone().multiplyScalar(boatLength * 0.7)), weight: 0.15 }, // Bow (slightly closer)
      { pos: this.boatPosition.clone().add(forwardVector.clone().multiplyScalar(-boatLength * 0.7)), weight: 0.15 }, // Stern (slightly closer)
      { pos: this.boatPosition.clone().add(rightVector.clone().multiplyScalar(boatWidth * 0.7)), weight: 0.1 }, // Starboard (slightly closer)
      { pos: this.boatPosition.clone().add(rightVector.clone().multiplyScalar(-boatWidth * 0.7)), weight: 0.1 }, // Port (slightly closer)
    ];
    
    // Calculate weighted average normal
    const averageNormal = new THREE.Vector3(0, 0, 0);
    let totalWeight = 0;
    
    for (const point of samplePoints) {
      const normal = (this.terrain as any).getNormalAt(point.pos.x, point.pos.z);
      averageNormal.x += normal.x * point.weight;
      averageNormal.y += normal.y * point.weight;
      averageNormal.z += normal.z * point.weight;
      totalWeight += point.weight;
    }
    
    // Normalize the weighted average
    averageNormal.divideScalar(totalWeight).normalize();
    
    return averageNormal;
  }
  
  public update(deltaTime: number): void {
    // Skip if no delta time
    if (!deltaTime) return;
    
    // Get wave information at boat position
    const waveHeight = this.getWaveHeightAtBoat();
    const waveNormal = this.getWaveNormalAtBoat();
    
    // Calculate wave steepness (how steep the wave is at the boat's position)
    const waveSteepness = 1.0 - Math.abs(waveNormal.y); // 0 = flat, 1 = vertical
    
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
      // Reduce acceleration when going uphill
      const accelerationMultiplier = 1.0 - (waveSteepness * 0.5);
      this.boatSpeed += this.acceleration * accelerationMultiplier * deltaTime;
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
    
    // Add gravity effect on slopes - boat speeds up going downhill, slows down going uphill
    const gravityEffect = waveSteepness * 120.0; // Strength of gravity effect
    
    // Calculate dot product between boat direction and wave normal projected on xz plane
    const boatDirectionVector = new THREE.Vector3(
      Math.sin(this.boatDirection),
      0,
      Math.cos(this.boatDirection)
    );
    const waveNormalXZ = new THREE.Vector3(waveNormal.x, 0, waveNormal.z).normalize();
    const dotProduct = boatDirectionVector.dot(waveNormalXZ);
    
    // Apply gravity effect based on whether we're going uphill or downhill
    this.boatSpeed += gravityEffect * -dotProduct * deltaTime;
    
    // Clamp speed to max speed
    this.boatSpeed = THREE.MathUtils.clamp(this.boatSpeed, -this.maxSpeed / 2, this.maxSpeed);
    
    // Apply drag - more drag in steep waves
    const effectiveDrag = this.drag * (1.0 - waveSteepness * 0.1);
    this.boatSpeed *= effectiveDrag;
    
    // Calculate movement vector based on boat direction and speed
    const moveX = Math.sin(this.boatDirection) * this.boatSpeed * deltaTime;
    const moveZ = Math.cos(this.boatDirection) * this.boatSpeed * deltaTime;
    
    // Update boat position (x and z only)
    this.boatPosition.x += moveX;
    this.boatPosition.z += moveZ;
    
    // Update boat height based on wave height
    this.boatPosition.y = waveHeight + this.boatHeightOffset;
    
    // Calculate target rotation from wave normal
    const targetRotation = new THREE.Euler(0, 0, 0, 'YXZ');
    
    // Calculate speed factor - less tilt at higher speeds for stability
    const speedFactor = Math.min(1.0, Math.abs(this.boatSpeed) / (this.maxSpeed * 0.5));
    
    // Reduce tilt at high speeds for more stability
    const stabilityFactor = 1.0 - (speedFactor * 0.5);
    const tiltFactor = this.boatTiltAmount * stabilityFactor;
    
    // Set pitch (x-rotation) based on z-component of normal
    targetRotation.x = Math.asin(waveNormal.z * tiltFactor);
    
    // Set roll (z-rotation) based on x-component of normal
    targetRotation.z = -Math.asin(waveNormal.x * tiltFactor);
    
    // Add additional roll when turning based on rotation speed and boat speed
    const turnTilt = this.boatRotationSpeed * 0.2 * speedFactor;
    targetRotation.z -= turnTilt;
    
    // Keep the boat's y-rotation (direction)
    targetRotation.y = this.boatDirection;
    
    // Smoothly interpolate current rotation to target rotation
    // Use variable interpolation speed based on boat speed (faster at low speeds, slower at high speeds)
    const rotationLerpFactor = Math.max(0.5, 1.0 - (speedFactor * 0.3)) * this.boatTiltSpeed * deltaTime;
    
    this.boatRotation.x += (targetRotation.x - this.boatRotation.x) * rotationLerpFactor;
    this.boatRotation.y = targetRotation.y; // Direction changes immediately
    this.boatRotation.z += (targetRotation.z - this.boatRotation.z) * rotationLerpFactor;
    
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
  
  public getBoatRotation(): THREE.Euler {
    return this.boatRotation.clone();
  }
  
  // Debug methods
  public getDebugWaveNormal(): THREE.Vector3 {
    return this.getWaveNormalAtBoat();
  }
  
  public getDebugWaveHeight(): number {
    return this.getWaveHeightAtBoat();
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