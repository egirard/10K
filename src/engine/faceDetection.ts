import * as THREE from 'three';
import type { DieValue } from './types.js';

// Standard die: opposite faces sum to 7
// Face normals in die's local space
const FACE_NORMALS: { normal: THREE.Vector3; value: DieValue }[] = [
  { normal: new THREE.Vector3(0, 1, 0), value: 2 },   // +Y
  { normal: new THREE.Vector3(0, -1, 0), value: 5 },  // -Y
  { normal: new THREE.Vector3(0, 0, 1), value: 1 },   // +Z
  { normal: new THREE.Vector3(0, 0, -1), value: 6 },  // -Z
  { normal: new THREE.Vector3(1, 0, 0), value: 3 },   // +X
  { normal: new THREE.Vector3(-1, 0, 0), value: 4 },  // -X
];

const WORLD_UP = new THREE.Vector3(0, 1, 0);
const _transformed = new THREE.Vector3(); // reusable to avoid GC (Pitfall 10)

/**
 * Determine which die face is pointing up given the die's quaternion orientation.
 * Uses dot-product of transformed face normals against world-up vector.
 * Numerically robust — avoids gimbal lock issues with Euler angles.
 */
export function getUpFace(quaternion: THREE.Quaternion): DieValue {
  let maxDot = -Infinity;
  let result: DieValue = 1;

  for (const { normal, value } of FACE_NORMALS) {
    _transformed.copy(normal).applyQuaternion(quaternion);
    const dot = _transformed.dot(WORLD_UP);
    if (dot > maxDot) {
      maxDot = dot;
      result = value;
    }
  }

  return result;
}
