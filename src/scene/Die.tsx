import { forwardRef, useRef, useMemo, type ReactElement, type MutableRefObject } from 'react';
import * as THREE from 'three';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import type { RapierRigidBody } from '@react-three/rapier';
import { useDiceStore } from '../stores/diceStore.js';
import { getSelectedPosition } from './DiceGroup.js';

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

// Colors for dimming effect
const SELECTED_COLOR = new THREE.Color('#f5f5f0');
const DIMMED_COLOR = new THREE.Color('#888880');

// Slide animation lerp factor (~0.3s ease at 60fps)
const SLIDE_LERP = 0.12;

// Shake animation parameters
const SHAKE_DURATION = 0.3; // seconds
const SHAKE_FREQUENCY = 30;
const SHAKE_AMPLITUDE = 0.1;

// Arc height during slide
const SLIDE_ARC_HEIGHT = 0.3;

export interface DieProps {
  index: number;
  position: [number, number, number];
  restPositions: MutableRefObject<THREE.Vector3[]>;
}

export const Die = forwardRef<RapierRigidBody, DieProps>(function Die({ index, position, restPositions }, ref) {
  // Shared materials - created once via useMemo (Pitfall 9: avoid per-frame allocation)
  const { pipGeom, blackMat, redMat } = useMemo(() => {
    const geom = new THREE.CylinderGeometry(PIP_RADIUS, PIP_RADIUS, PIP_DEPTH, PIP_SEGMENTS);
    const black = new THREE.MeshStandardMaterial({ color: '#111111', roughness: 0.4 });
    const red = new THREE.MeshStandardMaterial({ color: '#cc0000', roughness: 0.4 });
    return { pipGeom: geom, blackMat: black, redMat: red };
  }, []);

  // Ref to the RoundedBox mesh for material color adjustments (dimming)
  const meshRef = useRef<THREE.Mesh>(null);

  // Internal ref to the RigidBody (also forwarded)
  const bodyRef = useRef<RapierRigidBody>(null);

  // Current animated position (for lerp-based sliding)
  const currentPos = useRef(new THREE.Vector3(...position));

  // Shake state
  const shakeStartTime = useRef<number | null>(null);

  // Track previous selected state to detect transitions
  const wasSelected = useRef(false);

  // Track slide progress for arc calculation
  const slideStartPos = useRef(new THREE.Vector3());
  const slideTargetPos = useRef(new THREE.Vector3());
  const slideProgress = useRef(1); // 1 = at destination

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

  // Tap handler
  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    // Stop propagation so table click-to-roll doesn't fire
    e.stopPropagation();

    const state = useDiceStore.getState();
    if (state.phase !== 'settled') return;

    const die = state.dice[index];
    if (!die) return;

    if (die.selected) {
      // Deselect: slide back to rest position
      useDiceStore.getState().deselectDie(index);
    } else if (die.canScore) {
      // Select: slide to selected area
      useDiceStore.getState().selectDie(index);
    } else {
      // Non-scoring die: shake animation
      shakeStartTime.current = performance.now() / 1000;
    }
  };

  // Animation in useFrame
  useFrame((_state, _delta) => {
    const body = bodyRef.current;
    if (!body) return;

    const store = useDiceStore.getState();
    const die = store.dice[index];
    if (!die) return;

    // Only animate after settle
    if (store.phase !== 'settled') {
      wasSelected.current = false;
      slideProgress.current = 1;
      return;
    }

    // Determine target position
    const isSelected = die.selected;
    let targetX: number, targetY: number, targetZ: number;

    if (isSelected) {
      // Find this die's slot index in the selection order
      const slotIndex = store.selectionOrder.indexOf(index);
      const slot = slotIndex >= 0 ? slotIndex : 0;
      const selectedPos = getSelectedPosition(slot);
      targetX = selectedPos[0];
      targetY = selectedPos[1];
      targetZ = selectedPos[2];
    } else {
      // Return to rest position
      const rest = restPositions.current[index];
      targetX = rest.x;
      targetY = rest.y;
      targetZ = rest.z;
    }

    // Detect selection state change for arc animation
    if (isSelected !== wasSelected.current) {
      wasSelected.current = isSelected;
      slideStartPos.current.copy(currentPos.current);
      slideTargetPos.current.set(targetX, targetY, targetZ);
      slideProgress.current = 0;
    }

    // Update target in case slot positions changed (e.g., another die was deselected)
    slideTargetPos.current.set(targetX, targetY, targetZ);

    // Lerp toward target
    const prevX = currentPos.current.x;
    const prevZ = currentPos.current.z;
    currentPos.current.x = THREE.MathUtils.lerp(currentPos.current.x, targetX, SLIDE_LERP);
    currentPos.current.z = THREE.MathUtils.lerp(currentPos.current.z, targetZ, SLIDE_LERP);

    // Track slide progress for arc height
    if (slideProgress.current < 1) {
      const totalDist = slideStartPos.current.distanceTo(slideTargetPos.current);
      if (totalDist > 0.01) {
        const currentDist = currentPos.current.distanceTo(slideTargetPos.current);
        slideProgress.current = 1 - (currentDist / totalDist);
        slideProgress.current = Math.max(0, Math.min(1, slideProgress.current));
      } else {
        slideProgress.current = 1;
      }

      // Parabolic arc: highest at midpoint
      const arcFactor = 4 * slideProgress.current * (1 - slideProgress.current);
      currentPos.current.y = THREE.MathUtils.lerp(targetY, targetY + SLIDE_ARC_HEIGHT, arcFactor);
    } else {
      currentPos.current.y = THREE.MathUtils.lerp(currentPos.current.y, targetY, SLIDE_LERP);
    }

    // Shake animation for non-scoring dice
    let shakeOffset = 0;
    if (shakeStartTime.current !== null) {
      const now = performance.now() / 1000;
      const elapsed = now - shakeStartTime.current;
      if (elapsed < SHAKE_DURATION) {
        // Decaying sinusoidal shake
        const decay = 1 - elapsed / SHAKE_DURATION;
        shakeOffset = Math.sin(elapsed * SHAKE_FREQUENCY) * SHAKE_AMPLITUDE * decay;
      } else {
        shakeStartTime.current = null;
      }
    }

    // Apply position to kinematic body
    body.setNextKinematicTranslation({
      x: currentPos.current.x + shakeOffset,
      y: currentPos.current.y,
      z: currentPos.current.z,
    });

    // Dimming: adjust material color based on selection state
    if (meshRef.current) {
      const material = meshRef.current.material as THREE.MeshStandardMaterial;
      const anySelected = store.selectionOrder.length > 0;

      if (isSelected || !anySelected) {
        // Full brightness: selected die, or no dice selected yet
        material.color.lerp(SELECTED_COLOR, 0.1);
      } else {
        // Dimmed: unselected die when others are selected
        material.color.lerp(DIMMED_COLOR, 0.1);
      }
    }
  });

  return (
    <RigidBody
      ref={(el) => {
        bodyRef.current = el;
        // Forward ref
        if (typeof ref === 'function') {
          ref(el);
        } else if (ref) {
          (ref as MutableRefObject<RapierRigidBody | null>).current = el;
        }
      }}
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
        ref={meshRef}
        args={[DIE_SIZE, DIE_SIZE, DIE_SIZE]}
        radius={0.08}
        smoothness={4}
        castShadow
        receiveShadow
        onPointerDown={handlePointerDown}
      >
        <meshStandardMaterial color="#f5f5f0" roughness={0.3} metalness={0.05} />
      </RoundedBox>
      {pips}
    </RigidBody>
  );
});
