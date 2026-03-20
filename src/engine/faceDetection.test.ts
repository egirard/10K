import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { getUpFace } from './faceDetection.js';

describe('getUpFace', () => {
  it('returns face 2 for identity quaternion (+Y is up)', () => {
    const q = new THREE.Quaternion(); // identity
    expect(getUpFace(q)).toBe(2);
  });

  it('returns face 5 for 180-degree rotation around X axis (bottom becomes top)', () => {
    const q = new THREE.Quaternion().setFromAxisAngle(
      new THREE.Vector3(1, 0, 0),
      Math.PI,
    );
    expect(getUpFace(q)).toBe(5);
  });

  it('returns face 6 for 90-degree rotation around X axis (-Z normal aligns with +Y)', () => {
    const q = new THREE.Quaternion().setFromAxisAngle(
      new THREE.Vector3(1, 0, 0),
      Math.PI / 2,
    );
    expect(getUpFace(q)).toBe(6);
  });

  it('returns face 1 for -90-degree rotation around X axis (+Z normal aligns with +Y)', () => {
    const q = new THREE.Quaternion().setFromAxisAngle(
      new THREE.Vector3(1, 0, 0),
      -Math.PI / 2,
    );
    expect(getUpFace(q)).toBe(1);
  });

  it('returns face 3 for 90-degree rotation around Z axis (+X rotates to +Y)', () => {
    const q = new THREE.Quaternion().setFromAxisAngle(
      new THREE.Vector3(0, 0, 1),
      Math.PI / 2,
    );
    expect(getUpFace(q)).toBe(3);
  });

  it('returns face 4 for -90-degree rotation around Z axis (-X rotates to +Y)', () => {
    const q = new THREE.Quaternion().setFromAxisAngle(
      new THREE.Vector3(0, 0, 1),
      -Math.PI / 2,
    );
    expect(getUpFace(q)).toBe(4);
  });

  it('returns face 2 for a small 5-degree tilt (nearest face still +Y)', () => {
    const q = new THREE.Quaternion().setFromAxisAngle(
      new THREE.Vector3(1, 0, 0),
      (5 * Math.PI) / 180,
    );
    expect(getUpFace(q)).toBe(2);
  });
});
