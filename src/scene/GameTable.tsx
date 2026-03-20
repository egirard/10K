import { RigidBody, CuboidCollider } from '@react-three/rapier';

const FELT_COLOR = '#2d6e2d';
const WOOD_COLOR = '#4a2a0a';

const FELT_WIDTH = 8;
const FELT_DEPTH = 10;
const FELT_THICKNESS = 0.2;

const RIM_HEIGHT = 0.5;
const RIM_THICKNESS = 0.4;

export function GameTable() {
  const halfW = FELT_WIDTH / 2;
  const halfD = FELT_DEPTH / 2;

  return (
    <group>
      {/* Felt surface */}
      <RigidBody type="fixed" position={[0, -FELT_THICKNESS / 2, 0]}>
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

      {/* Rim - Front (positive Z) */}
      <RigidBody
        type="fixed"
        position={[0, RIM_HEIGHT / 2, halfD + RIM_THICKNESS / 2]}
      >
        <CuboidCollider
          args={[
            halfW + RIM_THICKNESS,
            RIM_HEIGHT / 2,
            RIM_THICKNESS / 2,
          ]}
        />
        <mesh castShadow receiveShadow>
          <boxGeometry
            args={[
              FELT_WIDTH + RIM_THICKNESS * 2,
              RIM_HEIGHT,
              RIM_THICKNESS,
            ]}
          />
          <meshStandardMaterial
            color={WOOD_COLOR}
            roughness={0.6}
            metalness={0.05}
          />
        </mesh>
      </RigidBody>

      {/* Rim - Back (negative Z) */}
      <RigidBody
        type="fixed"
        position={[0, RIM_HEIGHT / 2, -(halfD + RIM_THICKNESS / 2)]}
      >
        <CuboidCollider
          args={[
            halfW + RIM_THICKNESS,
            RIM_HEIGHT / 2,
            RIM_THICKNESS / 2,
          ]}
        />
        <mesh castShadow receiveShadow>
          <boxGeometry
            args={[
              FELT_WIDTH + RIM_THICKNESS * 2,
              RIM_HEIGHT,
              RIM_THICKNESS,
            ]}
          />
          <meshStandardMaterial
            color={WOOD_COLOR}
            roughness={0.6}
            metalness={0.05}
          />
        </mesh>
      </RigidBody>

      {/* Rim - Left (negative X) */}
      <RigidBody
        type="fixed"
        position={[-(halfW + RIM_THICKNESS / 2), RIM_HEIGHT / 2, 0]}
      >
        <CuboidCollider
          args={[RIM_THICKNESS / 2, RIM_HEIGHT / 2, halfD]}
        />
        <mesh castShadow receiveShadow>
          <boxGeometry args={[RIM_THICKNESS, RIM_HEIGHT, FELT_DEPTH]} />
          <meshStandardMaterial
            color={WOOD_COLOR}
            roughness={0.6}
            metalness={0.05}
          />
        </mesh>
      </RigidBody>

      {/* Rim - Right (positive X) */}
      <RigidBody
        type="fixed"
        position={[halfW + RIM_THICKNESS / 2, RIM_HEIGHT / 2, 0]}
      >
        <CuboidCollider
          args={[RIM_THICKNESS / 2, RIM_HEIGHT / 2, halfD]}
        />
        <mesh castShadow receiveShadow>
          <boxGeometry args={[RIM_THICKNESS, RIM_HEIGHT, FELT_DEPTH]} />
          <meshStandardMaterial
            color={WOOD_COLOR}
            roughness={0.6}
            metalness={0.05}
          />
        </mesh>
      </RigidBody>
    </group>
  );
}
