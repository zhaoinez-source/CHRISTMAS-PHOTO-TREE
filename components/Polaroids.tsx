import React, { useRef, useMemo } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore } from '../store';
import { getChaosPosition, getTreePosition } from '../utils/math';
import { Image } from '@react-three/drei';

const PolaroidFrame: React.FC<{ 
  url: string; 
  index: number; 
  total: number;
  isSelected: boolean;
}> = ({ url, index, total, isSelected }) => {
  const groupRef = useRef<THREE.Group>(null);
  const targetProgress = useStore((state) => state.targetProgress);
  const currentProgress = useRef(0); // Photos start chaotic usually if added dynamically

  const { tPos, cPos, rotation } = useMemo(() => {
    // Random spots inside the tree volume
    const r = Math.random();
    const angle = Math.random() * Math.PI * 2;
    // Lower half of tree mostly
    const tPos = getTreePosition(r * 0.7, angle);
    // Tuck them inside slightly
    tPos.multiplyScalar(0.8);
    
    const cPos = getChaosPosition();
    const rotation = new THREE.Euler(0, 0, (Math.random() - 0.5) * 0.5);
    return { tPos, cPos, rotation };
  }, []);

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    // Special state: Selected
    if (isSelected) {
       // Float in front of camera (Updated for Z=26 camera)
       const target = new THREE.Vector3(0, 0, 21);
       groupRef.current.position.lerp(target, 0.1);
       groupRef.current.lookAt(0, 0, 26); // Look at camera
       groupRef.current.scale.lerp(new THREE.Vector3(3, 3, 3), 0.1);
       return;
    }

    currentProgress.current = THREE.MathUtils.damp(
      currentProgress.current,
      targetProgress,
      2,
      delta
    );

    const p = currentProgress.current;
    
    groupRef.current.position.lerpVectors(cPos, tPos, p);
    
    // In chaos, tumble around
    if (p < 0.5) {
        groupRef.current.rotation.x += delta * 0.5;
        groupRef.current.rotation.y += delta * 0.3;
    } else {
        // In tree, face outwards roughly
        groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, 0, delta * 2);
        groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, rotation.y, delta * 2);
        groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, rotation.z, delta * 2);
    }
    
    groupRef.current.scale.lerp(new THREE.Vector3(1, 1, 1), 0.1);
  });

  return (
    <group ref={groupRef}>
      {/* Paper Frame */}
      <mesh position={[0, 0, -0.01]}>
        <boxGeometry args={[2.2, 2.6, 0.05]} />
        <meshStandardMaterial color="#fffff0" roughness={0.8} />
      </mesh>
      {/* Photo */}
      <Image url={url} position={[0, 0.2, 0.02]} scale={[2, 2, 1]} />
    </group>
  );
};

export const Polaroids: React.FC = () => {
  const photos = useStore((state) => state.photos);
  const selectedPhoto = useStore((state) => state.selectedPhoto);

  return (
    <>
      {photos.map((photo, i) => (
        <PolaroidFrame 
          key={photo.id} 
          url={photo.url} 
          index={i} 
          total={photos.length}
          isSelected={selectedPhoto?.id === photo.id}
        />
      ))}
    </>
  );
};