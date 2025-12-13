import React, { useMemo, useRef, useState, useLayoutEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore } from '../store';
import { getChaosPosition, getSpiralPosition } from '../utils/math';

interface OrnamentProps {
  count: number;
  type: 'bauble' | 'light' | 'gift';
  color: string;
  scale: number;
  emissive?: boolean;
}

export const Ornaments: React.FC<OrnamentProps> = ({ count, type, color, scale, emissive }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const targetProgress = useStore((state) => state.targetProgress);
  const currentProgress = useRef(1);
  
  // Store dual positions
  const data = useMemo(() => {
    return new Array(count).fill(0).map((_, i) => {
      // Offset spiral index to not align perfectly with foliage
      const offsetIndex = i * (15000 / count) + (Math.random() * 100);
      const tPos = getSpiralPosition(offsetIndex, 15000);
      
      // Push ornaments out slightly to sit on surface
      tPos.x *= 1.1; 
      tPos.z *= 1.1;

      // Chaos
      const cPos = getChaosPosition();
      
      // Individual rotation
      const rotation = new THREE.Euler(Math.random() * Math.PI, Math.random() * Math.PI, 0);

      return { tPos, cPos, rotation, scale: scale * (0.8 + Math.random() * 0.4) };
    });
  }, [count, scale]);

  const dummy = new THREE.Object3D();

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    // Slower damping for heavy ornaments
    const damping = type === 'gift' ? 1.5 : (type === 'bauble' ? 2.0 : 3.0);
    
    currentProgress.current = THREE.MathUtils.damp(
      currentProgress.current,
      targetProgress,
      damping,
      delta
    );

    const p = 1.0 - Math.pow(1.0 - currentProgress.current, 3.0);

    data.forEach((obj, i) => {
      const { tPos, cPos, rotation, scale: s } = obj;
      
      // Interpolate position
      dummy.position.lerpVectors(cPos, tPos, p);
      
      // Rotate based on time in chaos mode
      if (currentProgress.current < 0.9) {
          dummy.rotation.x = rotation.x + state.clock.elapsedTime * 0.5;
          dummy.rotation.y = rotation.y + state.clock.elapsedTime * 0.5;
      } else {
          dummy.rotation.copy(rotation);
      }
      
      // Pulse lights
      let finalScale = s;
      if (type === 'light') {
        finalScale = s * (1 + Math.sin(state.clock.elapsedTime * 3 + i) * 0.3);
      }

      dummy.scale.set(finalScale, finalScale, finalScale);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      {type === 'bauble' && <sphereGeometry args={[1, 32, 32]} />}
      {type === 'light' && <dodecahedronGeometry args={[0.5]} />}
      {type === 'gift' && <boxGeometry args={[1, 1, 1]} />}
      
      <meshStandardMaterial
        color={color}
        roughness={type === 'bauble' ? 0.1 : 0.5}
        metalness={type === 'bauble' ? 0.9 : 0.1}
        emissive={emissive ? color : '#000000'}
        emissiveIntensity={emissive ? 2 : 0}
        toneMapped={false}
      />
    </instancedMesh>
  );
};