import { RigidBody, CuboidCollider } from '@react-three/rapier';

const FELT_COLOR = '#2d6e2d';
const WOOD_COLOR = '#4a2a0a';

const FELT_WIDTH = 8;
const FELT_DEPTH = 10;
const FELT_THICKNESS = 0.2;

const RIM_HEIGHT = 0.5;
const RIM_THICKNESS = 0.4;

// Invisible wall height above rim to contain bouncing dice
const WALL_HEIGHT = 8;

export function GameTable() {
  const halfW = FELT_WIDTH / 2;
  const halfD = FELT_DEPTH / 2;
  // Full outer extent including rim thickness (for corner-sealing walls)
  const outerHalfW = halfW + RIM_THICKNESS;
  const outerHalfD = halfD + RIM_THICKNESS;

  return (
    <group>
      {/* Felt surface */}
      <RigidBody type="fixed" position={[0, -FELT_THICKNESS / 2, 0]} restitution={0.15} friction={0.8}>
        <CuboidCollider args={[halfW, FELT_THICKNESS / 2, halfD]} />
        <mesh receiveShadow>
          <boxGeometry args={[FELT_WIDTH, FELT_THICKNESS, FELT_DEPTH]} />
          <meshStandardMaterial
            color={FELT_COLOR}
            roughness={0.9}
            metalness={0}
          />
        </mesh>
      </RigidBody>

      {/* Rim - Front (positive Z) — visible wood */}
      <RigidBody
        type="fixed"
        position={[0, RIM_HEIGHT / 2, halfD + RIM_THICKNESS / 2]}
        restitution={0.5}
        friction={0.4}
      >
        <CuboidCollider
          args={[outerHalfW, RIM_HEIGHT / 2, RIM_THICKNESS / 2]}
        />
        <mesh castShadow receiveShadow>
          <boxGeometry
            args={[FELT_WIDTH + RIM_THICKNESS * 2, RIM_HEIGHT, RIM_THICKNESS]}
          />
          <meshStandardMaterial color={WOOD_COLOR} roughness={0.6} metalness={0.05} />
        </mesh>
      </RigidBody>

      {/* Rim - Back (negative Z) — visible wood */}
      <RigidBody
        type="fixed"
        position={[0, RIM_HEIGHT / 2, -(halfD + RIM_THICKNESS / 2)]}
        restitution={0.5}
        friction={0.4}
      >
        <CuboidCollider
          args={[outerHalfW, RIM_HEIGHT / 2, RIM_THICKNESS / 2]}
        />
        <mesh castShadow receiveShadow>
          <boxGeometry
            args={[FELT_WIDTH + RIM_THICKNESS * 2, RIM_HEIGHT, RIM_THICKNESS]}
          />
          <meshStandardMaterial color={WOOD_COLOR} roughness={0.6} metalness={0.05} />
        </mesh>
      </RigidBody>

      {/* Rim - Left (negative X) — visible wood */}
      <RigidBody
        type="fixed"
        position={[-(halfW + RIM_THICKNESS / 2), RIM_HEIGHT / 2, 0]}
        restitution={0.5}
        friction={0.4}
      >
        <CuboidCollider
          args={[RIM_THICKNESS / 2, RIM_HEIGHT / 2, outerHalfD]}
        />
        <mesh castShadow receiveShadow>
          <boxGeometry args={[RIM_THICKNESS, RIM_HEIGHT, FELT_DEPTH + RIM_THICKNESS * 2]} />
          <meshStandardMaterial color={WOOD_COLOR} roughness={0.6} metalness={0.05} />
        </mesh>
      </RigidBody>

      {/* Rim - Right (positive X) — visible wood */}
      <RigidBody
        type="fixed"
        position={[halfW + RIM_THICKNESS / 2, RIM_HEIGHT / 2, 0]}
        restitution={0.5}
        friction={0.4}
      >
        <CuboidCollider
          args={[RIM_THICKNESS / 2, RIM_HEIGHT / 2, outerHalfD]}
        />
        <mesh castShadow receiveShadow>
          <boxGeometry args={[RIM_THICKNESS, RIM_HEIGHT, FELT_DEPTH + RIM_THICKNESS * 2]} />
          <meshStandardMaterial color={WOOD_COLOR} roughness={0.6} metalness={0.05} />
        </mesh>
      </RigidBody>

      {/* Invisible tall walls to contain bouncing dice */}
      {/* Front wall */}
      <RigidBody type="fixed" position={[0, WALL_HEIGHT / 2, outerHalfD]}>
        <CuboidCollider args={[outerHalfW, WALL_HEIGHT / 2, 0.1]} />
      </RigidBody>
      {/* Back wall */}
      <RigidBody type="fixed" position={[0, WALL_HEIGHT / 2, -outerHalfD]}>
        <CuboidCollider args={[outerHalfW, WALL_HEIGHT / 2, 0.1]} />
      </RigidBody>
      {/* Left wall */}
      <RigidBody type="fixed" position={[-outerHalfW, WALL_HEIGHT / 2, 0]}>
        <CuboidCollider args={[0.1, WALL_HEIGHT / 2, outerHalfD]} />
      </RigidBody>
      {/* Right wall */}
      <RigidBody type="fixed" position={[outerHalfW, WALL_HEIGHT / 2, 0]}>
        <CuboidCollider args={[0.1, WALL_HEIGHT / 2, outerHalfD]} />
      </RigidBody>
    </group>
  );
}
