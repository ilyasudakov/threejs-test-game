import * as THREE from 'three';
import { FirstPersonControls } from './firstPersonControls';

export interface BoatControllerProps {
  boat: THREE.Group;
  terrain?: THREE.Mesh | null;
  controls?: FirstPersonControls | null;
}

export class BoatController {
  private boat: THREE.Group;
  private terrain: THREE.Mesh | null;
  private controls: FirstPersonControls | null;
  
  constructor({ boat, terrain = null, controls = null }: BoatControllerProps) {
    this.boat = boat;
    this.terrain = terrain;
    this.controls = controls;
  }
  
  public updateReferences(props: Partial<BoatControllerProps>): void {
    if (props.boat) this.boat = props.boat;
    if (props.terrain !== undefined) this.terrain = props.terrain;
    if (props.controls !== undefined) this.controls = props.controls;
  }
  
  public update(delta: number, time: number): void {
    if (!this.boat || !this.controls) return;
    
    // Get boat speed and direction from controls
    const boatSpeed = this.controls.getBoatSpeed();
    const boatDirection = this.controls.getBoatDirection();
    
    // Calculate movement vector based on boat direction and speed
    const moveX = Math.sin(boatDirection) * boatSpeed * delta;
    const moveZ = Math.cos(boatDirection) * boatSpeed * delta;
    
    // Apply movement to boat
    this.boat.position.x += moveX;
    this.boat.position.z += moveZ;
    
    // Rotate boat to match direction
    this.boat.rotation.y = -boatDirection;
    
    // Keep boat at a fixed height since we have static waves
    this.boat.position.y = 2; // Fixed height above water
  }
} 