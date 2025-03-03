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
  
  // Constants
  private readonly movementSpeed: number = 10.0;
  private readonly jumpHeight: number = 20.0;
  private readonly gravity: number = 30.0;
  
  // Mouse look
  private euler: THREE.Euler = new THREE.Euler(0, 0, 0, 'YXZ');
  private mouseSensitivity: number = 0.002;
  private isLocked: boolean = false;
  
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
        case 'Space':
          if (this.canJump) {
            this.velocity.y += this.jumpHeight;
            this.canJump = false;
          }
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
    if (!this.isLocked) return;
    
    // Apply gravity
    this.velocity.y -= this.gravity * deltaTime;
    
    // Calculate movement direction - INVERTED controls
    this.direction.z = Number(this.moveBackward) - Number(this.moveForward);
    this.direction.x = Number(this.moveLeft) - Number(this.moveRight);
    this.direction.normalize();
    
    // Apply movement in camera direction
    if (this.moveForward || this.moveBackward) {
      this.velocity.z = -this.direction.z * this.movementSpeed;
    } else {
      this.velocity.z = 0;
    }
    
    if (this.moveLeft || this.moveRight) {
      this.velocity.x = -this.direction.x * this.movementSpeed;
    } else {
      this.velocity.x = 0;
    }
    
    // Convert velocity to camera direction
    const cameraDirection = new THREE.Vector3();
    this.camera.getWorldDirection(cameraDirection);
    
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(this.camera.quaternion);
    
    forward.y = 0;
    forward.normalize();
    right.y = 0;
    right.normalize();
    
    forward.multiplyScalar(this.velocity.z * deltaTime);
    right.multiplyScalar(this.velocity.x * deltaTime);
    
    this.camera.position.add(forward);
    this.camera.position.add(right);
    
    // Apply vertical movement (gravity/jumping)
    this.camera.position.y += this.velocity.y * deltaTime;
    
    // Simple ground collision
    if (terrain) {
      // Implement terrain height sampling here
      const groundHeight = 0; // Replace with actual terrain height at camera position
      
      if (this.camera.position.y < groundHeight + 1.7) {
        this.camera.position.y = groundHeight + 1.7;
        this.velocity.y = 0;
        this.canJump = true;
      }
    } else {
      // Simple ground plane collision
      if (this.camera.position.y < 1.7) {
        this.camera.position.y = 1.7;
        this.velocity.y = 0;
        this.canJump = true;
      }
    }
  }
} 