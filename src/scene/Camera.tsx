import { useRef, useEffect } from 'react';
import { PerspectiveCamera } from '@react-three/drei';
import type { PerspectiveCamera as PerspectiveCameraType } from 'three';
import { Vector3 } from 'three';

export function Camera() {
  const cameraRef = useRef<PerspectiveCameraType>(null);

  useEffect(() => {
    if (cameraRef.current) {
      cameraRef.current.lookAt(new Vector3(0, 0, 0));
    }
  }, []);

  return (
    <PerspectiveCamera
      ref={cameraRef}
      makeDefault
      position={[0, 12, 5]}
      fov={45}
      near={0.1}
      far={100}
    />
  );
}
