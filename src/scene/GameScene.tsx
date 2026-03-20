import { Canvas } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';
import { GameTable } from './GameTable';
import { Camera } from './Camera';
import { DiceGroup } from './DiceGroup';

export function GameScene() {
  return (
    <Canvas shadows>
      <Camera />
      <ambientLight intensity={0.4} color="#fff5e6" />
      <directionalLight
        position={[2, 10, 3]}
        intensity={1.2}
        color="#fff5e6"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <Physics gravity={[0, -30, 0]} timeStep={1 / 60}>
        <GameTable />
        <DiceGroup />
      </Physics>
    </Canvas>
  );
}
