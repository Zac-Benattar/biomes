/*
	Methods from FunctionLibrary.ts from byswift502.
	https://github.com/swift502/Sketchbook/blob/a6fac1b4fe4f78ce530b2ed2efdc85fbb25cec8a/src/ts/core/FunctionLibrary.ts#L154
	Licensed under MIT License.
*/

import * as THREE from "three";
import * as CANNON from "cannon-es";
import { SimulationFrame } from "./physics/SpringSimulation/SimulationFrame";

/**
 * Finds an angle between two vectors
 * @param {THREE.Vector3} v1
 * @param {THREE.Vector3} v2
 */
export function getAngleBetweenVectors(
  v1: THREE.Vector3,
  v2: THREE.Vector3,
  dotTreshold: number = 0.0005
): number {
  let angle: number;
  let dot = v1.dot(v2);

  // If dot is close to 1, we'll round angle to zero
  if (dot > 1 - dotTreshold) {
    angle = 0;
  } else {
    // Dot too close to -1
    if (dot < -1 + dotTreshold) {
      angle = Math.PI;
    } else {
      // Get angle difference in radians
      angle = Math.acos(dot);
    }
  }

  return angle;
}

/**
 * Finds an angle between two vectors with a sign relative to normal vector
 */
export function getSignedAngleBetweenVectors(
  v1: THREE.Vector3,
  v2: THREE.Vector3,
  normal: THREE.Vector3 = new THREE.Vector3(0, 1, 0),
  dotTreshold: number = 0.0005
): number {
  let angle = this.getAngleBetweenVectors(v1, v2, dotTreshold);

  let cross = new THREE.Vector3().crossVectors(v1, v2);

  if (normal.dot(cross) < 0) {
    angle = -angle;
  }

  return angle;
}

export function spring(
  source: number,
  dest: number,
  velocity: number,
  mass: number,
  damping: number
): SimulationFrame {
  let acceleration = dest - source;
  acceleration /= mass;
  velocity += acceleration;
  velocity *= damping;

  let position = source + velocity;

  return new SimulationFrame(position, velocity);
}

export function springV(
  source: THREE.Vector3,
  dest: THREE.Vector3,
  velocity: THREE.Vector3,
  mass: number,
  damping: number
): void {
  let acceleration = new THREE.Vector3().subVectors(dest, source);
  acceleration.divideScalar(mass);
  velocity.add(acceleration);
  velocity.multiplyScalar(damping);
  source.add(velocity);
}

export function haveSameSigns(n1: number, n2: number): boolean {
  return n1 < 0 === n2 < 0;
}

export function haveDifferentSigns(n1: number, n2: number): boolean {
  return n1 < 0 !== n2 < 0;
}

export function threeVector(vec: CANNON.Vec3): THREE.Vector3 {
  return new THREE.Vector3(vec.x, vec.y, vec.z);
}

export function cannonVector(vec: THREE.Vector3): CANNON.Vec3 {
  return new CANNON.Vec3(vec.x, vec.y, vec.z);
}

export function applyVectorMatrixXZ(
  a: THREE.Vector3,
  b: THREE.Vector3
): THREE.Vector3 {
  return new THREE.Vector3(a.x * b.z + a.z * b.x, b.y, a.z * b.z + -a.x * b.x);
}
