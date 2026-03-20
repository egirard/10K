import { useRef } from 'react';
import * as THREE from 'three';
import { Die } from './Die';
import { DICE_COUNT } from '../engine/constants.js';

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

export function DiceGroup() {
  // Store refs to all 6 dice for future physics control
  const diceRefs = useRef<(THREE.Group | null)[]>(
    new Array(DICE_COUNT).fill(null),
  );

  return (
    <group>
      {INITIAL_POSITIONS.map((pos, i) => (
        <Die
          key={i}
          index={i}
          position={pos}
          ref={(el) => {
            diceRefs.current[i] = el;
          }}
        />
      ))}
    </group>
  );
}
