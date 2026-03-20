import { forwardRef, useMemo, type ReactElement } from 'react';
import * as THREE from 'three';
import { RoundedBox } from '@react-three/drei';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import type { RapierRigidBody } from '@react-three/rapier';

// --- Shared geometry & materials (created once, reused across all dice per Pitfall 9) ---

const PIP_RADIUS = 0.08;
const PIP_SEGMENTS = 12;
const PIP_DEPTH = 0.02;
const PIP_OFFSET = 0.25; // offset from face center for corner/edge pips

/** Pip position offsets from the center of a face (in face-local 2D) */
const PIP_LAYOUTS: Record<number, [number, number][]> = {
  1: [[0, 0]], // center only (RED)
  2: [[-PIP_OFFSET, -PIP_OFFSET], [PIP_OFFSET, PIP_OFFSET]], // diagonal
  3: [[-PIP_OFFSET, -PIP_OFFSET], [0, 0], [PIP_OFFSET, PIP_OFFSET]], // diagonal + center
  4: [[-PIP_OFFSET, -PIP_OFFSET], [PIP_OFFSET, -PIP_OFFSET], [-PIP_OFFSET, PIP_OFFSET], [PIP_OFFSET, PIP_OFFSET]], // corners
  5: [[-PIP_OFFSET, -PIP_OFFSET], [PIP_OFFSET, -PIP_OFFSET], [0, 0], [-PIP_OFFSET, PIP_OFFSET], [PIP_OFFSET, PIP_OFFSET]], // corners + center
  6: [[-PIP_OFFSET, -PIP_OFFSET], [PIP_OFFSET, -PIP_OFFSET], [-PIP_OFFSET, 0], [PIP_OFFSET, 0], [-PIP_OFFSET, PIP_OFFSET], [PIP_OFFSET, PIP_OFFSET]], // 2 columns of 3
};

/**
 * Face definitions: which value goes on which face, with face normal and rotation axes.
 * Standard Western die: opposite faces sum to 7.
 * - +Y = 2, -Y = 5
 * - +Z = 1, -Z = 6
 * - +X = 3, -X = 4
 */
interface FaceDef {
  value: number;
  normal: [number, number, number]; // face outward direction
  tangentU: [number, number, number]; // horizontal axis on the face
  tangentV: [number, number, number]; // vertical axis on the face
}

const FACES: FaceDef[] = [
  { value: 1, normal: [0, 0, 1], tangentU: [1, 0, 0], tangentV: [0, 1, 0] },   // +Z
  { value: 6, normal: [0, 0, -1], tangentU: [-1, 0, 0], tangentV: [0, 1, 0] },  // -Z
  { value: 2, normal: [0, 1, 0], tangentU: [1, 0, 0], tangentV: [0, 0, -1] },   // +Y
  { value: 5, normal: [0, -1, 0], tangentU: [1, 0, 0], tangentV: [0, 0, 1] },   // -Y
  { value: 3, normal: [1, 0, 0], tangentU: [0, 0, -1], tangentV: [0, 1, 0] },   // +X
  { value: 4, normal: [-1, 0, 0], tangentU: [0, 0, 1], tangentV: [0, 1, 0] },   // -X
];

const DIE_SIZE = 1;
const HALF = DIE_SIZE / 2;

export interface DieProps {
  index: number;
  position: [number, number, number];
}

export const Die = forwardRef<RapierRigidBody, DieProps>(function Die({ position }, ref) {
  // Shared materials - created once via useMemo (Pitfall 9: avoid per-frame allocation)
  const { pipGeom, blackMat, redMat } = useMemo(() => {
    const geom = new THREE.CylinderGeometry(PIP_RADIUS, PIP_RADIUS, PIP_DEPTH, PIP_SEGMENTS);
    const black = new THREE.MeshStandardMaterial({ color: '#111111', roughness: 0.4 });
    const red = new THREE.MeshStandardMaterial({ color: '#cc0000', roughness: 0.4 });
    return { pipGeom: geom, blackMat: black, redMat: red };
  }, []);

  // Build pip meshes for all 6 faces
  const pips = useMemo(() => {
    const result: ReactElement[] = [];
    let pipIndex = 0;

    for (const face of FACES) {
      const layout = PIP_LAYOUTS[face.value];
      const n = new THREE.Vector3(...face.normal);
      const u = new THREE.Vector3(...face.tangentU);
      const v = new THREE.Vector3(...face.tangentV);

      // Rotation to orient the cylinder along the face normal
      const quaternion = new THREE.Quaternion();
      // CylinderGeometry is along Y-axis by default, rotate it to face the normal
      const up = new THREE.Vector3(0, 1, 0);
      quaternion.setFromUnitVectors(up, n);

      for (const [pu, pv] of layout) {
        const pos = new THREE.Vector3()
          .addScaledVector(n, HALF + PIP_DEPTH * 0.01) // slightly above face to avoid z-fighting
          .addScaledVector(u, pu)
          .addScaledVector(v, pv);

        // Red pip only for center pip on face 1
        const isRedPip = face.value === 1 && pu === 0 && pv === 0;
        const material = isRedPip ? redMat : blackMat;

        result.push(
          <mesh
            key={pipIndex++}
            geometry={pipGeom}
            material={material}
            position={[pos.x, pos.y, pos.z]}
            quaternion={quaternion}
          />,
        );
      }
    }

    return result;
  }, [pipGeom, blackMat, redMat]);

  return (
    <RigidBody
      ref={ref}
      type="dynamic"
      colliders={false}
      position={position}
      restitution={0.35}
      friction={0.6}
      angularDamping={0.4}
      linearDamping={0.2}
    >
      <CuboidCollider args={[HALF, HALF, HALF]} />
      <RoundedBox
        args={[DIE_SIZE, DIE_SIZE, DIE_SIZE]}
        radius={0.08}
        smoothness={4}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial color="#f5f5f0" roughness={0.3} metalness={0.05} />
      </RoundedBox>
      {pips}
    </RigidBody>
  );
});
