import * as THREE from 'three';
import { FirstPersonControls } from './firstPersonControls';
import { calculateWaveHeightAt } from './waveCalculator';

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
    
    // Update boat height based on waves
    if (this.terrain) {
      const waveHeight = calculateWaveHeightAt(
        this.boat.position.x,
        this.boat.position.z,
        (this.terrain as any).waveParams,
        time,
        this.terrain
      );
      
      // Smoothly interpolate boat height
      this.boat.position.y += (waveHeight - this.boat.position.y) * 0.1;
      
      // Apply slight rotation based on wave gradient for more realistic movement
      const frontPos = calculateWaveHeightAt(
        this.boat.position.x + Math.sin(boatDirection) * 10,
        this.boat.position.z + Math.cos(boatDirection) * 10,
        (this.terrain as any).waveParams,
        time,
        this.terrain
      );
      
      const rightPos = calculateWaveHeightAt(
        this.boat.position.x + Math.sin(boatDirection + Math.PI/2) * 5,
        this.boat.position.z + Math.cos(boatDirection + Math.PI/2) * 5,
        (this.terrain as any).waveParams,
        time,
        this.terrain
      );
      
      // Calculate pitch and roll based on wave heights
      const pitchAngle = Math.atan2(frontPos - waveHeight, 10) * 0.5;
      const rollAngle = Math.atan2(rightPos - waveHeight, 5) * 0.5;
      
      // Apply rotation with smoothing
      this.boat.rotation.x += (pitchAngle - this.boat.rotation.x) * 0.1;
      this.boat.rotation.z += (rollAngle - this.boat.rotation.z) * 0.1;
    }
  }
} 