import { useRef, useCallback } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import type { RapierRigidBody } from '@react-three/rapier';
import { Die } from './Die';
import { DICE_COUNT } from '../engine/constants.js';
import { getUpFace } from '../engine/faceDetection.js';
import { findScoringDice } from '../engine/scoring.js';
import { useDiceStore } from '../stores/diceStore.js';
import type { DieValue, Roll } from '../engine/types.js';

// Initial positions: loose 2x3 grid on the felt surface
// Y at 0.5 so dice rest on the felt (felt is at y=0)
const INITIAL_POSITIONS: [number, number, number][] = [
  [-1.5, 0.5, -1],
  [0, 0.5, -1],
  [1.5, 0.5, -1],
  [-1.5, 0.5, 1],
  [0, 0.5, 1],
  [1.5, 0.5, 1],
];

// Pre-allocate quaternion for reading rotations in useFrame (Pitfall 10)
const _tempQuat = new THREE.Quaternion();

/** Random float in [min, max] */
function rand(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

/** Calculate the target position for a selected die in the left cluster */
export function getSelectedPosition(slotIndex: number): [number, number, number] {
  return [-2.5, 0.5, -2 + slotIndex * 1.2];
}

/** Launch a single die with randomized impulse and torque */
function launchDie(body: RapierRigidBody): void {
  // Reset position to a random point above the table
  body.setTranslation(
    { x: rand(-2, 2), y: rand(4, 6), z: rand(-2, 2) },
    true,
  );

  // Random initial rotation (normalized quaternion via Euler)
  const q = new THREE.Quaternion().setFromEuler(
    new THREE.Euler(rand(0, Math.PI * 2), rand(0, Math.PI * 2), rand(0, Math.PI * 2)),
  );
  body.setRotation({ x: q.x, y: q.y, z: q.z, w: q.w }, true);

  // Reset velocities
  body.setLinvel({ x: 0, y: 0, z: 0 }, true);
  body.setAngvel({ x: 0, y: 0, z: 0 }, true);

  // Varied impulse magnitude per die (base * 0.8-1.2) for natural spread
  const impulseScale = rand(0.8, 1.2);
  body.applyImpulse(
    {
      x: rand(-3, 3) * impulseScale,
      y: rand(-2, -1) * impulseScale,
      z: rand(-3, 3) * impulseScale,
    },
    true,
  );

  // Apply random torque for tumbling (also varied)
  const torqueScale = rand(0.8, 1.2);
  body.applyTorqueImpulse(
    {
      x: rand(-15, 15) * torqueScale,
      y: rand(-15, 15) * torqueScale,
      z: rand(-15, 15) * torqueScale,
    },
    true,
  );

  body.wakeUp();
}

export function DiceGroup() {
  // Store refs to all 6 RigidBody instances
  const bodyRefs = useRef<(RapierRigidBody | null)[]>(
    new Array(DICE_COUNT).fill(null),
  );

  // Store resting positions after physics settle (where dice landed)
  const restPositions = useRef<THREE.Vector3[]>(
    Array.from({ length: DICE_COUNT }, () => new THREE.Vector3()),
  );

  // Debounce counter for settle detection: require all bodies sleeping
  // for 10 consecutive frames (~167ms at 60fps) before reading face values
  const sleepFrameCount = useRef(0);

  const triggerRoll = useCallback(() => {
    const phase = useDiceStore.getState().phase;
    if (phase === 'rolling') return; // Prevent re-roll while rolling

    useDiceStore.getState().startRoll();

    // Stagger die releases: tiny random delay (0-100ms) per die
    // to simulate dice leaving the hand at slightly different times
    for (let i = 0; i < DICE_COUNT; i++) {
      const body = bodyRefs.current[i];
      if (!body) continue;

      // Switch back to dynamic for physics rolling
      body.setBodyType(0, true); // 0 = dynamic

      const delay = rand(0, 100);
      if (delay < 5) {
        // Near-zero delay: launch immediately
        launchDie(body);
      } else {
        setTimeout(() => launchDie(body), delay);
      }
    }

    // Reset debounce counter
    sleepFrameCount.current = 0;
  }, []);

  // Settle detection in useFrame
  useFrame(() => {
    const phase = useDiceStore.getState().phase;
    if (phase !== 'rolling') return;

    // Check if ALL 6 rigid bodies are sleeping
    let allSleeping = true;
    for (let i = 0; i < DICE_COUNT; i++) {
      const body = bodyRefs.current[i];
      if (!body || !body.isSleeping()) {
        allSleeping = false;
        break;
      }
    }

    if (allSleeping) {
      sleepFrameCount.current += 1;

      // Debounce: require 10 consecutive frames of all sleeping
      if (sleepFrameCount.current >= 10) {
        // Read face values from each die's quaternion and store rest positions
        const values: DieValue[] = [];
        for (let i = 0; i < DICE_COUNT; i++) {
          const body = bodyRefs.current[i];
          if (body) {
            const rot = body.rotation();
            _tempQuat.set(rot.x, rot.y, rot.z, rot.w);
            values.push(getUpFace(_tempQuat));

            // Store where this die came to rest
            const pos = body.translation();
            restPositions.current[i].set(pos.x, pos.y, pos.z);

            // Switch to kinematic so we can control position for slide animation
            body.setBodyType(2, true); // 2 = kinematicPosition
          }
        }

        console.log('Settled:', values);
        useDiceStore.getState().setSettled(values);

        // Determine which dice can score
        const scoringIndices = findScoringDice(values as Roll);
        useDiceStore.getState().setCanScore(scoringIndices);
        console.log('Scoring dice indices:', scoringIndices);
      }
    } else {
      // Reset debounce if any die is still moving
      sleepFrameCount.current = 0;
    }
  });

  return (
    <group>
      {INITIAL_POSITIONS.map((pos, i) => (
        <Die
          key={i}
          index={i}
          position={pos}
          ref={(el) => {
            bodyRefs.current[i] = el;
          }}
          restPositions={restPositions}
        />
      ))}
      {/* Temporary click target: invisible mesh on the felt surface to trigger rolls */}
      <mesh
        position={[0, 0.01, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        onClick={triggerRoll}
      >
        <planeGeometry args={[8, 10]} />
        <meshBasicMaterial visible={false} />
      </mesh>
    </group>
  );
}
